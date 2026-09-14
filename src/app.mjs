import { authRequest, clearAuthSession, getAuthSession, restRequest, saveAuthSession } from './supabase.mjs'
import { getExpiryStatus, sortByExpiryUrgency } from './logic/expiry.mjs'
import { validatePantryItem } from './logic/pantry.mjs'
import { buildConsumptionLog } from './logic/consumption.mjs'
import { buildGrocerySuggestions, rankMeals } from './logic/recommendations.mjs'

const app = document.querySelector('#app')
const toast = document.querySelector('#toast')
let state = { session: getAuthSession(), user: null, items: [], recipes: [], groceries: [], screen: 'home', loading: false }

const builtInRecipes = [
  { id: 'local-chicken-rice', name: 'Chicken Rice Bowl', description: 'A simple bowl that helps use fresh chicken and rice first.', prep_minutes: 10, cook_minutes: 20, servings: 2, ingredients: [{ ingredient_name: 'Chicken' }, { ingredient_name: 'Rice' }, { ingredient_name: 'Egg' }] },
  { id: 'local-fried-rice', name: 'Egg Fried Rice', description: 'Fast comfort food for leftover rice and eggs.', prep_minutes: 5, cook_minutes: 10, servings: 2, ingredients: [{ ingredient_name: 'Rice' }, { ingredient_name: 'Egg' }, { ingredient_name: 'Garlic' }] },
  { id: 'local-tuna-pasta', name: 'Tuna Pasta', description: 'A pantry-friendly meal for pasta and canned tuna.', prep_minutes: 10, cook_minutes: 15, servings: 2, ingredients: [{ ingredient_name: 'Pasta' }, { ingredient_name: 'Tuna' }, { ingredient_name: 'Tomato Sauce' }] },
  { id: 'local-omelette', name: 'Vegetable Omelette', description: 'Use eggs and vegetables before they lose freshness.', prep_minutes: 8, cook_minutes: 8, servings: 1, ingredients: [{ ingredient_name: 'Egg' }, { ingredient_name: 'Tomato' }, { ingredient_name: 'Onion' }] },
]

function today() { return new Date().toISOString().slice(0, 10) }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])) }
function fmtDate(value) { if (!value) return 'No expiry'; return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400) }
function setLoading(value) { state.loading = value; document.body.classList.toggle('loading', value) }

function authView() {
  app.innerHTML = `<div class="auth"><div class="auth-card stack">
    <div class="brand"><div class="brand-mark">🥬</div><span>PantryPal</span></div>
    <div><h1>Your pantry, on purpose.</h1><p class="muted">Track what you have, use what expires first, and shop smarter.</p></div>
    <form id="auth-form" class="stack">
      <div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
      <div class="field"><label for="password">Password</label><input id="password" type="password" minlength="6" autocomplete="current-password" required placeholder="At least 6 characters"></div>
      <button class="btn primary" id="auth-submit" type="submit">Sign in</button>
      <button class="link-btn" type="button" id="auth-toggle">New to PantryPal? Create an account</button>
    </form>
    <p id="auth-message" class="muted" aria-live="polite"></p>
  </div></div>`
  let signup = false
  document.querySelector('#auth-toggle').onclick = () => { signup = !signup; document.querySelector('#auth-submit').textContent = signup ? 'Create account' : 'Sign in'; document.querySelector('#auth-toggle').textContent = signup ? 'Already have an account? Sign in' : 'New to PantryPal? Create an account' }
  document.querySelector('#auth-form').onsubmit = async (event) => {
    event.preventDefault();
    const email = document.querySelector('#email').value.trim(); const password = document.querySelector('#password').value
    const message = document.querySelector('#auth-message'); setLoading(true); message.textContent = ''
    try {
      if (signup) {
        await authRequest('signup', { email, password })
        message.textContent = 'Account created. Check your email if confirmation is enabled, then sign in.'
      } else {
        const session = await authRequest('token?grant_type=password', { email, password })
        saveAuthSession(session); state.session = session; await boot();
      }
    } catch (error) { message.textContent = error.message }
    finally { setLoading(false) }
  }
}

async function loadData() {
  const token = state.session?.access_token
  if (!token) return
  const [items, recipes, groceries] = await Promise.all([
    restRequest('pantry_items', { accessToken: token, query: '?select=*&is_consumed=eq.false&order=expiry_date.asc.nullslast,name.asc' }),
    restRequest('recipes', { accessToken: token, query: '?select=*,recipe_ingredients(ingredient_name,quantity,unit,optional)&order=name.asc' }),
    restRequest('grocery_items', { accessToken: token, query: '?select=*&is_completed=eq.false&order=priority.desc,created_at.desc' }),
  ])
  state.items = items || []
  state.recipes = (recipes || []).map((r) => ({ ...r, ingredients: r.recipe_ingredients || [] }))
  state.groceries = groceries || []
}

async function boot() {
  if (!state.session?.access_token) { authView(); return }
  setLoading(true)
  try { await loadData(); render() } catch (error) { clearAuthSession(); state.session = null; authView(); showToast(error.message) }
  finally { setLoading(false) }
}

function stats() {
  const statuses = state.items.map((i) => getExpiryStatus(i.expiry_date, today()))
  return { total: state.items.length, urgent: statuses.filter((s) => s.tone === 'urgent').length, expired: statuses.filter((s) => s.tone === 'expired').length }
}

function itemCard(item) {
  const status = getExpiryStatus(item.expiry_date, today())
  return `<div class="pantry-card">
    <div class="pantry-top"><div><div class="item-name">${esc(item.name)}</div><div class="item-meta">${esc(item.category)} · ${esc(item.location)}</div></div><span class="badge ${status.tone}">${esc(status.label)}</span></div>
    <div><span class="qty">${esc(item.quantity)}</span> <span class="muted">${esc(item.unit)}</span></div>
    <div class="item-meta">Expiry: ${esc(fmtDate(item.expiry_date))}</div>
    <div class="toolbar"><button class="btn primary small" data-action="consume" data-id="${item.id}">Use some</button><button class="btn ghost small" data-action="edit" data-id="${item.id}">Edit</button><button class="btn danger small" data-action="delete" data-id="${item.id}">Delete</button></div>
  </div>`
}

function homeView() {
  const s = stats(); const urgent = sortByExpiryUrgency(state.items.filter((i) => ['urgent','expired'].includes(getExpiryStatus(i.expiry_date, today()).tone)), today()).slice(0, 4)
  const recipes = state.recipes.length ? state.recipes : builtInRecipes
  const meals = rankMeals(state.items, recipes, today()).slice(0, 3)
  app.innerHTML = layout('home', `<div class="hero"><div><p class="muted">Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p><h1>Let's save good food.</h1><p class="muted">Your pantry at a glance, with the most urgent items first.</p></div><button class="btn primary" data-action="add">+ Add food</button></div>
  <div class="grid stats"><div class="card"><div class="stat-number">${s.total}</div><div class="stat-label">Pantry items</div></div><div class="card"><div class="stat-number">${s.urgent}</div><div class="stat-label">Expiring in 3 days</div></div><div class="card"><div class="stat-number">${s.expired}</div><div class="stat-label">Expired</div></div></div>
  <section class="section"><div class="section-head"><h2>Needs attention</h2><button class="link-btn" data-screen="pantry">See pantry</button></div>${urgent.length ? `<div class="item-list">${urgent.map((i) => `<div class="item"><div class="item-main"><div class="item-name">${esc(i.name)}</div><div class="item-meta">${esc(i.quantity)} ${esc(i.unit)} · ${esc(fmtDate(i.expiry_date))}</div></div><span class="badge ${getExpiryStatus(i.expiry_date, today()).tone}">${esc(getExpiryStatus(i.expiry_date, today()).label)}</span></div>`).join('')}</div>` : `<div class="empty">Nothing urgent right now. Nice work! 🌿</div>`}</section>
  <section class="section"><div class="section-head"><h2>Cook this first</h2><button class="link-btn" data-screen="meals">See meals</button></div><div class="grid cards">${meals.map((m) => recipeCard(m)).join('')}</div></section>`)
}

function recipeCard(recipe) {
  return `<div class="card recipe"><div><h3>${esc(recipe.name)}</h3><p class="muted">${esc(recipe.description || 'A PantryPal meal suggestion.')}</p></div><div class="recipe-ingredients">${(recipe.ingredients || []).map((i) => `<span class="ingredient">${esc(i.ingredient_name)}</span>`).join('')}</div><div class="item-meta">${recipe.matchedCount ?? 0}/${recipe.ingredients?.length || 0} ingredients on hand · ${recipe.urgentMatches ?? 0} urgent</div></div>`
}

function pantryView() {
  const items = sortByExpiryUrgency(state.items, today())
  app.innerHTML = layout('pantry', `<div class="hero"><div><p class="muted">Your food inventory</p><h1>Pantry</h1><p class="muted">Use older food first and keep quantities current.</p></div><button class="btn primary" data-action="add">+ Add food</button></div>
  ${items.length ? `<div class="pantry-grid">${items.map(itemCard).join('')}</div>` : `<div class="empty">Your pantry is empty. Add your first item to get started.</div>`}`)
}

function mealsView() {
  const recipes = state.recipes.length ? state.recipes : builtInRecipes
  const meals = rankMeals(state.items, recipes, today())
  app.innerHTML = layout('meals', `<div class="hero"><div><p class="muted">Smart suggestions</p><h1>Meals</h1><p class="muted">PantryPal prioritizes meals that use what you already have, especially food nearing expiry.</p></div></div><div class="grid cards">${meals.map(recipeCard).join('')}</div>`)
}

function groceryView() {
  const recipes = state.recipes.length ? state.recipes : builtInRecipes
  const suggestions = buildGrocerySuggestions(state.items, recipes)
  const merged = [...state.groceries, ...suggestions.filter((s) => !state.groceries.some((g) => g.item_name === s.item_name))]
  app.innerHTML = layout('grocery', `<div class="hero"><div><p class="muted">Only buy what helps</p><h1>Grocery</h1><p class="muted">Recommendations come from meals that fit your pantry today.</p></div></div>${merged.length ? `<div class="item-list">${merged.map((g) => `<div class="item"><div class="item-main"><div class="item-name">${esc(g.item_name)}</div><div class="item-meta">${esc(g.reason || 'Smart pantry suggestion')} · priority ${g.priority}</div></div><button class="btn primary small" data-grocery="${g.id || ''}" data-name="${esc(g.item_name)}">Add</button></div>`).join('')}</div>` : `<div class="empty">Your pantry covers the current meal suggestions. 🎉</div>`}`)
}

function settingsView() {
  app.innerHTML = layout('settings', `<div class="hero"><div><p class="muted">Your household</p><h1>Settings</h1><p class="muted">PantryPal is currently using Asia/Manila for date-friendly defaults.</p></div></div><div class="card stack"><div><h3>Account</h3><p class="muted">${esc(state.session?.user?.email || 'Signed in')}</p></div><button class="btn danger" data-action="logout">Sign out</button></div>`)
}

function layout(active, content) {
  return `<header class="header"><div class="container header-inner"><div class="brand"><div class="brand-mark">🥬</div><span>PantryPal</span></div><div class="header-actions"><span class="muted">${esc(state.session?.user?.email || '')}</span></div></div></header><div class="container page">${content}</div><nav class="nav"><div class="nav-inner">${[['home','⌂','Home'],['pantry','▣','Pantry'],['meals','◉','Meals'],['grocery','🛒','Grocery'],['settings','⚙','Settings']].map(([id,icon,label]) => `<button class="${active === id ? 'active' : ''}" data-screen="${id}"><span class="nav-icon">${icon}</span>${label}</button>`).join('')}</div></nav>`
}

function render() { ({ home: homeView, pantry: pantryView, meals: mealsView, grocery: groceryView, settings: settingsView }[state.screen] || homeView)(); }

function openModal(item = null) {
  const edit = Boolean(item)
  const html = `<div class="modal-backdrop" id="modal-backdrop"><div class="modal"><div class="modal-head"><div><h2>${edit ? 'Edit food' : 'Add food'}</h2><p class="muted">Keep the expiry date accurate so PantryPal can prioritize it.</p></div><button class="btn ghost small" data-close-modal>Close</button></div><form id="pantry-form" class="stack"><div class="form-grid">
    <div class="field"><label>Name</label><input name="name" required value="${esc(item?.name || '')}" placeholder="e.g. Chicken breast"></div>
    <div class="field"><label>Category</label><select name="category"><option>Meat</option><option>Produce</option><option>Dairy</option><option>Grains</option><option>Canned</option><option>Frozen</option><option>Other</option></select></div>
    <div class="field"><label>Quantity</label><input name="quantity" type="number" min="0.01" step="0.01" required value="${esc(item?.quantity ?? 1)}"></div>
    <div class="field"><label>Unit</label><input name="unit" value="${esc(item?.unit || 'pcs')}"></div>
    <div class="field"><label>Purchase date</label><input name="purchase_date" type="date" value="${esc(item?.purchase_date || today())}"></div>
    <div class="field"><label>Expiry date</label><input name="expiry_date" type="date" value="${esc(item?.expiry_date || '')}"></div>
    <div class="field"><label>Location</label><select name="location"><option>Pantry</option><option>Fridge</option><option>Freezer</option><option>Counter</option></select></div>
    <div class="field full"><label>Notes</label><textarea name="notes" rows="3" placeholder="Optional">${esc(item?.notes || '')}</textarea></div>
  </div><button class="btn primary" type="submit">${edit ? 'Save changes' : 'Add to pantry'}</button></form></div></div>`
  document.body.insertAdjacentHTML('beforeend', html)
  const backdrop = document.querySelector('#modal-backdrop')
  const form = document.querySelector('#pantry-form')
  form.querySelector('[name=category]').value = item?.category || 'Other'
  form.querySelector('[name=location]').value = item?.location || 'Pantry'
  document.querySelector('[data-close-modal]').onclick = () => backdrop.remove()
  form.onsubmit = async (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(form).entries())
    try {
      const normalized = validatePantryItem(data)
      const payload = { ...data, ...normalized, quantity: normalized.quantity, expiry_date: data.expiry_date || null, purchase_date: data.purchase_date || null }
      const token = state.session.access_token
      if (edit) await restRequest('pantry_items', { method: 'PATCH', accessToken: token, query: `?id=eq.${encodeURIComponent(item.id)}`, body: payload, headers: { Prefer: 'return=minimal' } })
      else await restRequest('pantry_items', { method: 'POST', accessToken: token, body: payload, headers: { Prefer: 'return=minimal' } })
      backdrop.remove(); await loadData(); render(); showToast(edit ? 'Pantry item updated' : 'Added to pantry')
    } catch (error) { showToast(error.message) }
  }
}

async function consume(item) {
  const raw = prompt(`How much ${item.name} did you use?`, String(Math.min(1, Number(item.quantity))))
  if (raw === null) return
  try {
    const log = buildConsumptionLog(item, Number(raw))
    const token = state.session.access_token
    await restRequest('consumption_logs', { method: 'POST', accessToken: token, body: { item_name: log.item_name, quantity: log.quantity, unit: log.unit, pantry_item_id: log.pantry_item_id, source: log.source } })
    if (log.remaining === 0) await restRequest('pantry_items', { method: 'PATCH', accessToken: token, query: `?id=eq.${encodeURIComponent(item.id)}`, body: { quantity: 0, is_consumed: true }, headers: { Prefer: 'return=minimal' } })
    else await restRequest('pantry_items', { method: 'PATCH', accessToken: token, query: `?id=eq.${encodeURIComponent(item.id)}`, body: { quantity: log.remaining }, headers: { Prefer: 'return=minimal' } })
    await loadData(); render(); showToast('Consumption logged')
  } catch (error) { showToast(error.message) }
}

async function deleteItem(item) {
  if (!confirm(`Delete ${item.name} from your pantry?`)) return
  try { await restRequest('pantry_items', { method: 'DELETE', accessToken: state.session.access_token, query: `?id=eq.${encodeURIComponent(item.id)}` }); await loadData(); render(); showToast('Removed from pantry') } catch (error) { showToast(error.message) }
}

async function addGrocery(name) {
  try {
    await restRequest('grocery_items', { method: 'POST', accessToken: state.session.access_token, body: { item_name: name, category: 'Other', quantity: 1, unit: 'pcs', reason: 'Meal recommendation', priority: 50, source: 'recipe' } })
    await loadData(); render(); showToast(`${name} added to grocery list`)
  } catch (error) { showToast(error.message) }
}

document.addEventListener('click', async (event) => {
  const screen = event.target.closest('[data-screen]')?.dataset.screen
  if (screen) { state.screen = screen; render(); return }
  const action = event.target.closest('[data-action]')?.dataset.action
  if (!action) return
  const id = event.target.closest('[data-action]')?.dataset.id
  const item = state.items.find((i) => i.id === id)
  if (action === 'add') openModal()
  if (action === 'edit' && item) openModal(item)
  if (action === 'consume' && item) await consume(item)
  if (action === 'delete' && item) await deleteItem(item)
  if (action === 'logout') { clearAuthSession(); state.session = null; authView() }
  if (event.target.closest('[data-grocery]')) await addGrocery(event.target.closest('[data-grocery]').dataset.name)
})

boot()
