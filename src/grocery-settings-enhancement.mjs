import { getAuthSession } from './supabase.mjs'
import { GROCERY_FREQUENCIES, getGroceryFrequency } from './logic/grocery-planning.mjs'

const settingsKey = () => `pantrypal-settings:${getAuthSession()?.user?.id || getAuthSession()?.user?.email || 'guest'}`
function load() { try { return JSON.parse(localStorage.getItem(settingsKey()) || '{}') } catch { return {} } }
function save(patch) { const current = load(); localStorage.setItem(settingsKey(), JSON.stringify({ ...current, ...patch })); document.dispatchEvent(new CustomEvent('pantrypal:settings-changed')) }

function enhance() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Settings')
  if (!hero || document.querySelector('[data-grocery-settings]')) return
  const current = load()
  const selected = getGroceryFrequency(current.groceryFrequency).value
  hero.insertAdjacentHTML('afterend', `<section class="section card grocery-settings" data-grocery-settings><div class="section-head"><div><h2>Grocery Planning</h2><p class="muted">Choose how far ahead PantryPal should think when building your grocery list.</p></div>🛒</div><div class="field"><label for="grocery-frequency">Grocery frequency</label><select id="grocery-frequency" data-grocery-frequency>${GROCERY_FREQUENCIES.map((item) => `<option value="${item.value}" ${item.value === selected ? 'selected' : ''}>${item.label}</option>`).join('')}</select><div class="item-meta">${getGroceryFrequency(selected).days === 7 ? 'Weekly is the recommended default for most households.' : 'This is a planning preference; it does not place orders automatically.'}</div></div></section>`)
  document.querySelector('[data-grocery-frequency]').addEventListener('change', (event) => save({ groceryFrequency: event.target.value }))
}

const observer = new MutationObserver(enhance)
observer.observe(document.body, { childList: true, subtree: true })
