import { getAuthSession, restRequest } from './supabase.mjs'
import { calculateRecipeRequirements, buildMealPlan, formatQuantity } from './logic/meal-planning.mjs'
import { filterPantryItems, buildQuickSnackSuggestions } from './logic/pantry-view.mjs'
import { CATEGORY_OPTIONS, inferCategory } from './logic/category.mjs'

const CATEGORIES = ['All', ...CATEGORY_OPTIONS]
const BUILT_IN = [
  { name: 'Chicken Rice Bowl', servings: 2, ingredients: [{ ingredient_name: 'Chicken', quantity: 250, unit: 'g' }, { ingredient_name: 'Rice', quantity: 200, unit: 'g' }, { ingredient_name: 'Egg', quantity: 2, unit: 'pcs' }] },
  { name: 'Egg Fried Rice', servings: 2, ingredients: [{ ingredient_name: 'Rice', quantity: 400, unit: 'g' }, { ingredient_name: 'Egg', quantity: 2, unit: 'pcs' }, { ingredient_name: 'Garlic', quantity: 15, unit: 'g' }] },
  { name: 'Tuna Pasta', servings: 2, ingredients: [{ ingredient_name: 'Pasta', quantity: 200, unit: 'g' }, { ingredient_name: 'Tuna', quantity: 1, unit: 'can' }, { ingredient_name: 'Tomato Sauce', quantity: 200, unit: 'g' }] },
  { name: 'Vegetable Omelette', servings: 1, ingredients: [{ ingredient_name: 'Egg', quantity: 2, unit: 'pcs' }, { ingredient_name: 'Tomato', quantity: 1, unit: 'pc' }, { ingredient_name: 'Onion', quantity: 30, unit: 'g' }] },
]

const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]))
const today = () => new Date().toISOString().slice(0, 10)
const settingsKey = () => `pantrypal-settings:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
const defaultSettings = () => ({ householdSize: 1, schedule: { today: { breakfast: true, lunch: true, dinner: true }, tomorrow: { breakfast: true, lunch: true, dinner: true } } })

function loadSettings() { try { return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(settingsKey()) || '{}')) } } catch { return defaultSettings() } }
function saveSettings(settings) { localStorage.setItem(settingsKey(), JSON.stringify(settings)); document.dispatchEvent(new CustomEvent('pantrypal:settings-changed')) }
function readSettingsForm() {
  const current = loadSettings()
  const householdSize = Math.max(1, Math.min(12, Number(document.querySelector('[data-household-size]')?.value) || current.householdSize || 1))
  const schedule = { today: {}, tomorrow: {} }
  for (const day of ['today', 'tomorrow']) for (const meal of ['breakfast', 'lunch', 'dinner']) schedule[day][meal] = Boolean(document.querySelector(`[data-meal-slot="${day}-${meal}"]`)?.checked)
  return { householdSize, schedule }
}

function enhanceCategorySelects() {
  for (const select of document.querySelectorAll('select[name="category"]')) {
    const current = select.value || 'Other'
    const values = [...new Set(['Other', ...CATEGORY_OPTIONS])]
    select.innerHTML = values.map((category) => `<option value="${esc(category)}" ${category === current ? 'selected' : ''}>${esc(category)}</option>`).join('')
    if (!select.dataset.categoryEnhanced) {
      select.dataset.categoryEnhanced = 'true'
      const form = select.closest('form')
      const name = form?.querySelector('[name="name"]')
      name?.addEventListener('input', () => {
        if (select.value === 'Other') select.value = inferCategory(name.value, 'Other')
      })
    }
  }
}

function settingsPanel() {
  const s = loadSettings()
  const checkbox = (day, meal) => `<label class="setting-check"><input type="checkbox" data-meal-slot="${day}-${meal}" ${s.schedule?.[day]?.[meal] ? 'checked' : ''}> ${meal[0].toUpperCase() + meal.slice(1)}</label>`
  return `<section class="section card pantry-settings" data-personalization-settings><div class="section-head"><div><h2>Meal Planning</h2><p class="muted">Tell PantryPal who you are cooking for and which meals you want planned.</p></div>🍽️</div><div class="household-control"><div><strong>Household size</strong><div class="item-meta">Meal quantities will be scaled automatically.</div></div><div class="quantity-control"><button class="btn ghost small" data-household="minus">−</button><input data-household-size type="number" min="1" max="12" value="${esc(s.householdSize)}" aria-label="Household size"><button class="btn ghost small" data-household="plus">+</button></div></div><div class="schedule-grid"><div><strong>Today</strong><div class="schedule-row">${checkbox('today','breakfast')}${checkbox('today','lunch')}${checkbox('today','dinner')}</div></div><div><strong>Tomorrow</strong><div class="schedule-row">${checkbox('tomorrow','breakfast')}${checkbox('tomorrow','lunch')}${checkbox('tomorrow','dinner')}</div></div></div></section>`
}

function enhanceSettings() {
  const root = document.querySelector('[data-personalization-settings]')
  if (root) return
  const signOut = document.querySelector('[data-action="logout"]')
  if (!signOut) return
  signOut.closest('.card')?.insertAdjacentHTML('beforebegin', settingsPanel())
  const panel = document.querySelector('[data-personalization-settings]')
  panel?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-household]')
    if (!button) return
    const input = panel.querySelector('[data-household-size]')
    const next = Math.max(1, Math.min(12, Number(input.value || 1) + (button.dataset.household === 'plus' ? 1 : -1)))
    input.value = next
    saveSettings(readSettingsForm())
  })
  panel?.addEventListener('input', (event) => { if (event.target.matches('[data-household-size]')) saveSettings(readSettingsForm()) })
  panel?.addEventListener('change', (event) => { if (event.target.matches('[data-meal-slot]')) saveSettings(readSettingsForm()) })
}

function enhancePantry() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Pantry')
  const grid = document.querySelector('.pantry-grid')
  if (!hero || !grid || document.querySelector('[data-pantry-controls]')) return
  hero.insertAdjacentHTML('afterend', `<div class="pantry-controls" data-pantry-controls><input type="search" data-pantry-search placeholder="🔍 Search pantry items..." aria-label="Search pantry items"><select data-pantry-category aria-label="Filter pantry by category">${CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(c === 'All' ? 'All Categories' : c)}</option>`).join('')}</select><button class="btn ghost small" data-quick-snack>🥨 Quick Snack</button></div>`)
  const controls = document.querySelector('[data-pantry-controls]')
  const cards = [...grid.querySelectorAll('.pantry-card')]
  cards.forEach((card) => { const meta = card.querySelector('.item-meta')?.textContent || ''; card.dataset.pantryCategory = meta.split(' · ')[0].trim() })
  const apply = () => {
    const search = controls.querySelector('[data-pantry-search]').value
    const category = controls.querySelector('[data-pantry-category]').value
    cards.forEach((card) => { const item = { name: card.querySelector('.item-name')?.textContent || '', category: card.dataset.pantryCategory || '', location: '', quantity: card.querySelector('.qty')?.textContent || '' }; card.hidden = filterPantryItems([item], { search, category }).length === 0 })
  }
  controls.querySelector('[data-pantry-search]').addEventListener('input', apply)
  controls.querySelector('[data-pantry-category]').addEventListener('change', apply)
  controls.querySelector('[data-quick-snack]').addEventListener('click', () => {
    const items = cards.filter((card) => !card.hidden).map((card) => ({ name: card.querySelector('.item-name')?.textContent || '', category: card.dataset.pantryCategory || '', quantity: card.querySelector('.qty')?.textContent || 0, unit: card.querySelector('.qty')?.nextElementSibling?.textContent || '', expiry_date: card.querySelector('.item-meta:last-of-type')?.textContent?.replace(/^Expiry:\s*/, '') || null }))
    const snacks = buildQuickSnackSuggestions(items, today())
    showSnackModal(snacks)
  })
}

function showSnackModal(snacks) {
  document.querySelector('[data-snack-modal]')?.remove()
  const body = snacks.length ? snacks.map((item) => item.expired
    ? `<div class="item snack-expired"><div><div class="item-name">${esc(item.name)}</div><div class="item-meta">${esc(item.quantity)} ${esc(item.unit)} available</div><div class="snack-warning">⚠️ This item is expired. Consider replacing it instead of using it.</div></div><span class="badge expired">Expired</span></div>`
    : `<div class="item"><div><div class="item-name">${esc(item.name)}</div><div class="item-meta">${esc(item.quantity)} ${esc(item.unit)} available</div></div><span class="badge safe">Quick snack</span></div>`).join('') : '<div class="empty">Add food to the Snacks category to get quick snack ideas.</div>'
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-snack-modal><div class="modal"><div class="modal-head"><div><h2>Quick Snack</h2><p class="muted">Use a snack item you already have.</p></div><button class="btn ghost small" data-snack-close>Close</button></div><div class="item-list">${body}</div></div></div>`)
  document.querySelector('[data-snack-close]').onclick = () => document.querySelector('[data-snack-modal]')?.remove()
  document.querySelector('[data-snack-modal]').addEventListener('click', (e) => { if (e.target.matches('[data-snack-modal]')) e.currentTarget.remove() })
}

function defaultQuantity(name, unit) {
  const key = String(name).toLowerCase()
  if (unit) return { quantity: Number(unit) || 1, unit: typeof unit === 'string' ? unit : 'pcs' }
  if (key.includes('chicken') || key.includes('beef') || key.includes('pork') || key.includes('fish')) return { quantity: 250, unit: 'g' }
  if (key.includes('rice') || key.includes('pasta')) return { quantity: 200, unit: 'g' }
  if (key.includes('sauce')) return { quantity: 100, unit: 'g' }
  if (key.includes('egg')) return { quantity: 2, unit: 'pcs' }
  return { quantity: 1, unit: 'pcs' }
}

async function loadMealData() {
  const session = getAuthSession()
  if (!session?.access_token) return { items: [], recipes: BUILT_IN }
  try {
    const [items, recipes] = await Promise.all([
      restRequest('pantry_items', { accessToken: session.access_token, query: '?select=*&is_consumed=eq.false' }),
      restRequest('recipes', { accessToken: session.access_token, query: '?select=*,recipe_ingredients(ingredient_name,quantity,unit,optional)&order=name.asc' }),
    ])
    const normalized = (recipes || []).map((recipe) => ({ ...recipe, ingredients: (recipe.recipe_ingredients || []).map((i) => ({ ...i, ...(Number(i.quantity) > 0 ? {} : defaultQuantity(i.ingredient_name)) })) }))
    return { items: items || [], recipes: normalized.length ? normalized : BUILT_IN }
  } catch { return { items: [], recipes: BUILT_IN } }
}

async function enhanceMeals() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Meals')
  const cards = [...document.querySelectorAll('.recipe')]
  if (!hero || !cards.length) return
  if (!document.querySelector('[data-meal-plan]')) hero.insertAdjacentHTML('afterend', '<section class="section" data-meal-plan><div class="card"><h2>Meal Plan</h2><p class="muted">Scaled for your household and selected meal times.</p><div class="item-list" data-meal-plan-list></div><div data-thaw-reminders></div></div></section>')
  const { items, recipes } = await loadMealData()
  const settings = loadSettings()
  const plan = buildMealPlan(recipes, items, settings)
  const planList = document.querySelector('[data-meal-plan-list]')
  if (planList) planList.innerHTML = plan.length ? plan.map((slot) => `<div class="item"><div class="item-main"><div class="item-name">${esc(slot.day === 'today' ? 'Today' : 'Tomorrow')} · ${esc(slot.meal[0].toUpperCase() + slot.meal.slice(1))}</div><div class="item-meta">${esc(slot.recipe.name)} · ${slot.recipe.householdSize} serving${slot.recipe.householdSize === 1 ? '' : 's'}</div></div></div>`).join('') : '<div class="empty">Select at least one meal in Settings to build your plan.</div>'
  const thaw = plan.filter((slot) => slot.day === 'tomorrow').flatMap((slot) => slot.recipe.ingredients.filter((i) => i.shortage < 0 || items.some((item) => item.name?.toLowerCase() === i.ingredient_name?.toLowerCase() && String(item.location).toLowerCase() === 'freezer')).map((i) => ({ ...i, meal: slot.meal, recipe: slot.recipe.name })))
  const uniqueThaw = [...new Map(thaw.map((i) => [`${i.ingredient_name}-${i.meal}`, i])).values()]
  const thawBox = document.querySelector('[data-thaw-reminders]')
  if (thawBox) thawBox.innerHTML = uniqueThaw.length ? `<div class="thaw-box"><strong>❄️ Thaw needed</strong>${uniqueThaw.map((i) => `<div>Move ${esc(formatQuantity(i.needed || i.onHand || 1))} ${esc(i.unit || 'unit')} ${esc(i.ingredient_name)} from the freezer to the refrigerator today for tomorrow's ${esc(i.meal)}.</div>`).join('')}</div>` : ''
  for (const card of cards) {
    const title = card.querySelector('h3')?.textContent.trim()
    const recipe = recipes.find((r) => r.name === title)
    if (!recipe) continue
    const result = calculateRecipeRequirements(recipe, items, settings.householdSize)
    const chips = result.ingredients.map((i) => {
      const needed = i.needed == null ? '' : `${formatQuantity(i.needed)} ${i.unit || 'unit'}`
      const status = i.needed == null ? (i.onHand > 0 ? 'On hand' : 'Missing') : i.enough ? `Have ${formatQuantity(i.onHand)} ${i.unit || 'unit'}` : `Need ${formatQuantity(i.shortage)} ${i.unit || 'unit'} more`
      return `<span class="ingredient ${i.enough ? 'ingredient-ok' : 'ingredient-missing'}">${esc(i.ingredient_name)}${needed ? ` — ${esc(needed)}` : ''} · ${esc(status)}</span>`
    }).join('')
    const ingredientBox = card.querySelector('.recipe-ingredients')
    if (ingredientBox) ingredientBox.innerHTML = chips
    const footer = card.querySelector('.item-meta')
    if (footer) footer.textContent = `${result.ingredients.filter((i) => i.enough).length}/${result.ingredients.length} ingredients covered · ${result.householdSize} serving${result.householdSize === 1 ? '' : 's'}`
  }
}

let lastScreen = ''
let refreshTimer
function enhance() {
  enhanceCategorySelects()
  const heading = document.querySelector('.hero h1')?.textContent.trim() || ''
  const screen = heading || document.querySelector('.header')?.textContent || ''
  if (screen === 'Settings') enhanceSettings()
  if (screen === 'Pantry') enhancePantry()
  if (screen === 'Meals' && lastScreen !== screen) { enhanceMeals(); lastScreen = screen }
  if (screen !== 'Meals') lastScreen = screen
}

document.addEventListener('pantrypal:settings-changed', () => { if (document.querySelector('.hero h1')?.textContent.trim() === 'Meals') enhanceMeals() })
const observer = new MutationObserver(() => { clearTimeout(refreshTimer); refreshTimer = setTimeout(enhance, 30) })
observer.observe(document.body, { childList: true, subtree: true })