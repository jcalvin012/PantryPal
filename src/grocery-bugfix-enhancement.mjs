import { getAuthSession, restRequest } from './supabase.mjs'
import { buildGrocerySuggestions } from './logic/recommendations.mjs'
import { inferCategory } from './logic/category.mjs'

const settingsKey = () => `pantrypal-settings:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(settingsKey()) || '{}') } catch { return {} } }

function navigateBackToGrocery() {
  if (sessionStorage.getItem('pantrypal-return-to-grocery') !== 'true') return
  const button = document.querySelector('[data-screen="grocery"]')
  if (!button) return
  sessionStorage.removeItem('pantrypal-return-to-grocery')
  button.click()
}

async function mergeManualGroceryItem({ name, quantity, unit, category, reason, priority, source, accessToken }) {
  const query = `?select=*&is_completed=eq.false&item_name=eq.${encodeURIComponent(name)}&unit=eq.${encodeURIComponent(unit)}&order=created_at.asc`
  const existing = await restRequest('grocery_items', { accessToken, query })
  const matching = (existing || []).filter((item) => String(item.item_name || '').trim().toLowerCase().replace(/\s+/g, ' ') === name.toLowerCase().replace(/\s+/g, ' '))
  if (!matching.length) {
    await restRequest('grocery_items', { method: 'POST', accessToken, body: { item_name: name, category, quantity, unit, reason, priority, source } })
    return
  }

  const primary = matching[0]
  const combinedQuantity = Math.round((Number(primary.quantity) + quantity + matching.slice(1).reduce((sum, item) => sum + Number(item.quantity || 0), 0)) * 100) / 100
  await restRequest('grocery_items', { method: 'PATCH', accessToken, query: `?id=eq.${encodeURIComponent(primary.id)}`, body: { quantity: combinedQuantity, category, reason: reason || primary.reason, priority: Math.max(Number(primary.priority) || 0, priority), source: primary.source || source } })

  for (const duplicate of matching.slice(1)) {
    await restRequest('grocery_items', { method: 'DELETE', accessToken, query: `?id=eq.${encodeURIComponent(duplicate.id)}` })
  }
}

async function submitManualGrocery(event) {
  const form = event.target.closest('[data-manual-grocery-form]')
  if (!form) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const data = Object.fromEntries(new FormData(form).entries())
  const quantity = Number(data.quantity)
  const name = data.item_name?.trim()
  if (!name || !Number.isFinite(quantity) || quantity <= 0) return
  const session = getAuthSession()
  if (!session?.access_token) return
  const button = form.querySelector('button[type="submit"]')
  if (button) { button.disabled = true; button.textContent = 'Adding…' }
  try {
    const unit = data.unit || 'pcs'
    const category = data.category || inferCategory(name, 'Other')
    await mergeManualGroceryItem({ name, quantity, unit, category, reason: data.note?.trim() || 'Manually added', priority: 50, source: 'manual', accessToken: session.access_token })
    sessionStorage.removeItem('pantrypal-return-to-grocery')
    window.dispatchEvent(new CustomEvent('pantrypal:remote-change'))
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Add to grocery list' }
    alert(error.message)
  }
}

async function addRecommendedGrocery(event) {
  const button = event.target.closest('[data-grocery-add][data-quantity]')
  if (!button) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const session = getAuthSession()
  if (!session?.access_token) return
  const name = button.dataset.name
  const quantity = Number(button.dataset.quantity)
  const unit = button.dataset.unit || 'pcs'
  try {
    await restRequest('grocery_items', { method: 'POST', accessToken: session.access_token, body: {
      item_name: name, category: 'Other', quantity, unit,
      reason: button.dataset.reason || 'Meal recommendation', priority: Number(button.dataset.priority) || 50,
      source: button.dataset.source || 'recipe'
    } })
    button.disabled = true
    button.textContent = 'Added ✓'
    document.dispatchEvent(new CustomEvent('pantrypal:grocery-refresh'))
  } catch (error) { alert(error.message) }
}

async function alignRecommendationQuantities(root) {
  if (root.dataset.groceryRecommendationAligned === 'true') return
  const list = [...root.querySelectorAll('.section')].find((section) => section.querySelector('h2')?.textContent.trim() === 'Recommended for You')
  if (!list) return
  const rows = [...list.querySelectorAll('.item')]
  if (!rows.length) return
  const session = getAuthSession()
  if (!session?.access_token) return
  try {
    const [items, recipes] = await Promise.all([
      restRequest('pantry_items', { accessToken: session.access_token, query: '?select=*&is_consumed=eq.false' }),
      restRequest('recipes', { accessToken: session.access_token, query: '?select=*,recipe_ingredients(ingredient_name,quantity,unit,optional)&order=name.asc' }),
    ])
    const normalizedRecipes = (recipes || []).map((recipe) => ({ ...recipe, ingredients: recipe.recipe_ingredients || [] }))
    const suggestions = buildGrocerySuggestions(items || [], normalizedRecipes, loadSettings())
    const byName = new Map(suggestions.map((item) => [String(item.item_name).trim().toLowerCase(), item]))
    for (const row of rows) {
      const name = row.querySelector('.item-name')?.textContent.trim()
      const suggestion = byName.get(String(name || '').toLowerCase())
      if (!suggestion) continue
      const meta = row.querySelector('.item-meta')
      const button = row.querySelector('[data-grocery-add]')
      const added = row.querySelector('button[disabled]')
      const quantityText = `${suggestion.quantity} ${suggestion.unit}`
      if (meta) {
        const parts = meta.textContent.split(' · ')
        const reason = parts.find((part) => part.startsWith('Needed for')) || suggestion.reason
        const priority = parts.find((part) => part.startsWith('priority')) || `priority ${suggestion.priority}`
        meta.textContent = `${quantityText} · ${reason} · ${priority}`
      }
      if (button) {
        button.dataset.unit = suggestion.unit
        button.dataset.quantity = String(suggestion.quantity)
      }
      if (added) added.dataset.groceryQuantity = `${suggestion.quantity} ${suggestion.unit}`
    }
    root.dataset.groceryRecommendationAligned = 'true'
  } catch { /* keep the existing recommendation if the enhancement cannot refresh */ }
}

document.addEventListener('submit', submitManualGrocery, true)
document.addEventListener('click', addRecommendedGrocery, true)
const observer = new MutationObserver(() => {
  navigateBackToGrocery()
  const root = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Grocery')?.closest('.page')
  if (root) alignRecommendationQuantities(root)
})
observer.observe(document.body, { childList: true, subtree: true })
navigateBackToGrocery()
