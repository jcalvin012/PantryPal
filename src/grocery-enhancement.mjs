import { getAuthSession, restRequest } from './supabase.mjs'
import { groupGroceriesForShopping, getGroceryFrequency, inferShoppingSection } from './logic/grocery-planning.mjs'
import { groceryUnit, groceryUnitOptions, parseGroceryQuantity } from './logic/grocery.mjs'

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
const checkedKey = () => `pantrypal-grocery-checked:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
const settingsKey = () => `pantrypal-settings:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
const loadChecked = () => { try { return new Set(JSON.parse(localStorage.getItem(checkedKey()) || '[]').map(String)) } catch { return new Set() } }
const saveChecked = (set) => localStorage.setItem(checkedKey(), JSON.stringify([...set]))
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(settingsKey()) || '{}') } catch { return {} } }

function frequencyLabel() {
  const frequency = getGroceryFrequency(loadSettings().groceryFrequency)
  return `${frequency.label} planning · ${frequency.days === 1 ? '1 day' : `${frequency.days} days`}`
}

function addViewControls(root) {
  if (root.querySelector('[data-grocery-view-controls]')) return
  const header = [...root.querySelectorAll('.section-head')].find((node) => node.querySelector('h2')?.textContent.trim() === 'My Grocery List')
  if (!header) return
  header.querySelector('.toolbar')?.insertAdjacentHTML('afterbegin', '<button class="btn ghost small" data-grocery-action-enhanced="add">+ Add grocery item</button>')
  header.insertAdjacentHTML('beforeend', `<div class="grocery-view-controls" data-grocery-view-controls><button class="btn ghost small" data-grocery-view="checklist">☑ Checklist</button><button class="btn ghost small" data-grocery-view="paper">🧾 Paper List</button></div>`)
  const list = root.querySelector('.item-list')
  if (list) list.dataset.groceryShoppingList = 'true'
  header.insertAdjacentHTML('afterend', `<div class="grocery-planning-note" data-grocery-planning-note>🗓️ ${esc(frequencyLabel())}</div>`)
  root.querySelector('[data-grocery-view="checklist"]').onclick = () => setView(root, 'checklist')
  root.querySelector('[data-grocery-view="paper"]').onclick = () => setView(root, 'paper')
}

function decorateChecklist(root) {
  const list = root.querySelector('[data-grocery-shopping-list]')
  if (!list) return
  const checked = loadChecked()
  for (const row of [...list.querySelectorAll(':scope > .item')]) {
    const id = row.querySelector('[data-grocery-select]')?.dataset.id || row.querySelector('[data-grocery-action="increment"]')?.dataset.id
    if (!id || row.querySelector('[data-shopping-check]')) continue
    const label = document.createElement('label')
    label.className = 'shopping-check'
    label.innerHTML = `<input type="checkbox" data-shopping-check data-id="${esc(id)}" ${checked.has(String(id)) ? 'checked' : ''} aria-label="Mark ${esc(row.querySelector('.item-name')?.textContent || 'item')} as bought"><span></span>`
    row.prepend(label)
    row.classList.toggle('shopping-complete', checked.has(String(id)))
  }
  list.addEventListener('change', onCheck, { once: true })
}

function onCheck(event) {
  const input = event.target.closest('[data-shopping-check]')
  if (!input) return
  const checked = loadChecked()
  const id = String(input.dataset.id)
  if (input.checked) checked.add(id); else checked.delete(id)
  saveChecked(checked)
  input.closest('.item')?.classList.toggle('shopping-complete', input.checked)
  refreshClearButton(input.closest('.item-list')?.parentElement)
}

function refreshClearButton(root) {
  if (!root || root.querySelector('[data-clear-bought]')) return
  const header = [...root.querySelectorAll('.section-head')].find((node) => node.querySelector('h2')?.textContent.trim() === 'My Grocery List')
  if (!header) return
  header.querySelector('.toolbar')?.insertAdjacentHTML('beforeend', '<button class="btn ghost small" data-clear-bought>Clear bought</button>')
  header.querySelector('[data-clear-bought]').onclick = () => clearBought(root)
}

async function clearBought(root) {
  const checked = loadChecked()
  if (!checked.size) return
  if (!confirm(`Remove ${checked.size} bought grocery item${checked.size === 1 ? '' : 's'} from your list?`)) return
  const session = getAuthSession()
  if (!session?.access_token) return
  try {
    await restRequest('grocery_items', { method: 'DELETE', accessToken: session.access_token, query: `?id=in.(${[...checked].map(encodeURIComponent).join(',')})` })
    localStorage.removeItem(checkedKey())
    document.dispatchEvent(new CustomEvent('pantrypal:grocery-refresh'))
  } catch (error) { alert(error.message) }
}

function setView(root, mode) {
  root.dataset.groceryView = mode
  root.querySelector('[data-grocery-view="checklist"]')?.classList.toggle('primary', mode === 'checklist')
  root.querySelector('[data-grocery-view="paper"]')?.classList.toggle('primary', mode === 'paper')
  root.querySelector('[data-grocery-shopping-list]')?.classList.toggle('paper-list', mode === 'paper')
}

function groupList(root) {
  const list = root.querySelector('[data-grocery-shopping-list]')
  if (!list || list.dataset.grouped === 'true') return
  const rows = [...list.querySelectorAll(':scope > .item')]
  if (!rows.length) return
  const items = rows.map((row) => ({
    row,
    item_name: row.querySelector('.item-name')?.textContent.trim() || '',
    category: row.querySelector('.item-meta')?.textContent || '',
  }))
  const groups = groupGroceriesForShopping(items)
  list.innerHTML = ''
  for (const group of groups) {
    const section = document.createElement('section')
    section.className = 'grocery-shopping-section'
    section.innerHTML = `<div class="grocery-section-title"><span>${group.icon}</span><strong>${esc(group.label)}</strong><span class="grocery-section-count">${group.items.length}</span></div>`
    const groupList = document.createElement('div')
    groupList.className = 'item-list grocery-section-items'
    for (const item of group.items) groupList.appendChild(item.row)
    section.appendChild(groupList)
    list.appendChild(section)
  }
  list.dataset.grouped = 'true'
  // Nested lists are easier to style and keep the original app event delegation intact.
  decorateNestedChecks(root)
}

function decorateNestedChecks(root) {
  const checked = loadChecked()
  for (const row of [...root.querySelectorAll('.grocery-section-items > .item')]) {
    const id = row.querySelector('[data-grocery-select]')?.dataset.id || row.querySelector('[data-grocery-action="increment"]')?.dataset.id
    if (!id || row.querySelector('[data-shopping-check]')) continue
    const label = document.createElement('label')
    label.className = 'shopping-check'
    label.innerHTML = `<input type="checkbox" data-shopping-check data-id="${esc(id)}" ${checked.has(String(id)) ? 'checked' : ''} aria-label="Mark ${esc(row.querySelector('.item-name')?.textContent || 'item')} as bought"><span></span>`
    row.prepend(label)
    row.classList.toggle('shopping-complete', checked.has(String(id)))
  }
  root.querySelectorAll('[data-shopping-check]').forEach((input) => input.addEventListener('change', onCheck))
}

function openManualModal(root) {
  document.querySelector('[data-manual-grocery-modal]')?.remove()
  const units = groceryUnitOptions('pcs').map((unit) => `<option value="${esc(unit)}">${esc(unit)}</option>`).join('')
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-manual-grocery-modal><div class="modal"><div class="modal-head"><div><h2>Add grocery item</h2><p class="muted">Add something you want to buy manually.</p></div><button class="btn ghost small" data-manual-close>Close</button></div><form class="stack" data-manual-grocery-form><div class="field"><label>Item name</label><input name="item_name" required placeholder="e.g. Coffee"></div><div class="form-grid"><div class="field"><label>Quantity</label><input name="quantity" type="number" min="0.01" step="0.01" value="1" required></div><div class="field"><label>Unit</label><select name="unit">${units}</select></div></div><div class="field"><label>Note (optional)</label><textarea name="note" rows="3" placeholder="e.g. Buy the large pack"></textarea></div><button class="btn primary" type="submit">Add to grocery list</button></form></div></div>`)
  const modal = document.querySelector('[data-manual-grocery-modal]')
  modal.querySelector('[data-manual-close]').onclick = () => modal.remove()
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove() })
  modal.querySelector('[data-manual-grocery-form]').onsubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    const quantity = parseGroceryQuantity(data.quantity)
    if (quantity === null || quantity <= 0) return
    const session = getAuthSession()
    try {
      await restRequest('grocery_items', { method: 'POST', accessToken: session.access_token, body: { item_name: data.item_name.trim(), category: 'Other', quantity, unit: groceryUnit({ unit: data.unit }), reason: data.note.trim() || 'Manually added', priority: 50, source: 'manual' } })
      modal.remove()
      document.dispatchEvent(new CustomEvent('pantrypal:grocery-refresh'))
    } catch (error) { alert(error.message) }
  }
}

function enhance(root) {
  if (root.dataset.groceryEnhanced === 'true') return
  root.dataset.groceryEnhanced = 'true'
  addViewControls(root)
  const list = root.querySelector('.item-list')
  if (list) {
    list.dataset.groceryShoppingList = 'true'
    groupList(root)
  }
  decorateNestedChecks(root)
  refreshClearButton(root)
  setView(root, root.dataset.groceryView || 'checklist')
  root.querySelector('[data-grocery-action-enhanced="add"]')?.addEventListener('click', () => openManualModal(root))
}

function findGroceryRoot() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Grocery')
  return hero?.closest('.page') || null
}

const observer = new MutationObserver(() => { const root = findGroceryRoot(); if (root) enhance(root) })
observer.observe(document.body, { childList: true, subtree: true })
document.addEventListener('pantrypal:grocery-refresh', () => { const root = findGroceryRoot(); if (root) { root.dataset.groceryEnhanced = ''; location.reload() } })
