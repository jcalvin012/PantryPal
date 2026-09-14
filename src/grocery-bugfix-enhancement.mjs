import { getAuthSession, restRequest } from './supabase.mjs'
import { buildGrocerySuggestions } from './logic/recommendations.mjs'

const settingsKey = () => `pantrypal-settings:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(settingsKey()) || '{}') } catch { return {} } }

function navigateBackToGrocery() {
  if (sessionStorage.getItem('pantrypal-return-to-grocery') !== 'true') return
  const button = document.querySelector('[data-screen="grocery"]')
  if (!button) return
  sessionStorage.removeItem('pantrypal-return-to-grocery')
  button.click()
}

async function submitManualGrocery(event) {
  const form = event.target.closest('[data-manual-grocery-form]')
  if (!form) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const data = Object.fromEntries(new FormData(form).entries())
  const quantity = Number(data.quantity)
  if (!data.item_name?.trim() || !Number.isFinite(quantity) || quantity <= 0) return
  const session = getAuthSession()
  if (!session?.access_token) return
  const button = form.querySelector('button[type="submit"]')
  if (button) { button.disabled = true; button.textContent = 'Adding…' }
  try {
    await restRequest('grocery_items', { method: 'POST', accessToken: session.access_token, body: {
      item_name: data.item_name.trim(), category: 'Other', quantity,
      unit: data.unit || 'pcs', reason: data.note?.trim() || 'Manually added', priority: 50, source: 'manual'
    } })
    sessionStorage.setItem('pantrypal-return-to-grocery', 'true')
    location.reload()
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Add to grocery list' }
    alert(error.message)
  }
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
const observer = new MutationObserver(() => {
  navigateBackToGrocery()
  const root = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Grocery')?.closest('.page')
  if (root) alignRecommendationQuantities(root)
})
observer.observe(document.body, { childList: true, subtree: true })
navigateBackToGrocery()
