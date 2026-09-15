import { getAuthSession, restRequest } from './supabase.mjs'
import { findMatchingPantryItem } from './logic/pantry.mjs'
import { getPantrySummaryFilter } from './logic/pantry-view.mjs'
import { getExpiryStatus } from './logic/expiry.mjs'

function pantryIdentityFromForm(form) {
  return {
    name: form.querySelector('[name="name"]')?.value?.trim() || '',
    quantity: Number(form.querySelector('[name="quantity"]')?.value || 0),
    unit: form.querySelector('[name="unit"]')?.value || 'pcs',
    category: form.querySelector('[name="category"]')?.value || 'Other',
    location: form.querySelector('[name="location"]')?.value || 'Pantry',
    condition: form.querySelector('[name="condition"]')?.value || 'Fresh',
    expiry_date: form.querySelector('[name="expiry_date"]')?.value || null,
  }
}

async function tryStackNewPantryItem(form) {
  const heading = document.querySelector('#modal-backdrop h2')?.textContent?.trim()
  if (heading !== 'Add food') return false
  const candidate = pantryIdentityFromForm(form)
  if (!candidate.name || !Number.isFinite(candidate.quantity) || candidate.quantity <= 0) return false
  const session = getAuthSession()
  if (!session?.access_token) return false
  const items = await restRequest('pantry_items', { accessToken: session.access_token, query: '?select=*&is_consumed=eq.false' })
  const match = findMatchingPantryItem(items || [], candidate)
  if (!match) return false
  const quantity = Math.round((Number(match.quantity || 0) + candidate.quantity) * 100) / 100
  await restRequest('pantry_items', { method: 'PATCH', accessToken: session.access_token, query: `?id=eq.${encodeURIComponent(match.id)}`, body: { quantity }, headers: { Prefer: 'return=minimal' } })
  document.querySelector('#modal-backdrop')?.remove()
  window.location.reload()
  return true
}

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('#pantry-form')
  if (!form) return
  const heading = document.querySelector('#modal-backdrop h2')?.textContent?.trim()
  if (heading !== 'Add food' || form.dataset.pantrypalStackChecked === 'true') return
  event.preventDefault()
  event.stopImmediatePropagation()
  try {
    const stacked = await tryStackNewPantryItem(form)
    if (stacked) return
    form.dataset.pantrypalStackChecked = 'true'
    form.requestSubmit()
  } catch (error) {
    const toast = document.querySelector('#toast')
    if (toast) { toast.textContent = error.message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400) }
  }
}, true)

function getPantryCards() { return [...document.querySelectorAll('.pantry-grid .pantry-card')] }

function applyPantrySummaryFilter(tone = null) {
  const controls = document.querySelector('[data-pantry-controls]')
  const search = controls?.querySelector('[data-pantry-search]')
  const category = controls?.querySelector('[data-pantry-category]')
  if (search) search.value = ''
  if (category) category.value = 'All'
  for (const card of getPantryCards()) {
    const badge = card.querySelector('.badge')
    const matches = !tone || badge?.classList.contains(tone)
    card.hidden = !matches
  }
  document.querySelectorAll('[data-pantry-summary]').forEach((node) => node.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button.dataset.pantrySummary === (tone || 'all'))))
}

async function emptyPantry() {
  const session = getAuthSession()
  if (!session?.access_token) return
  const count = getPantryCards().length
  if (!count) return
  if (!window.confirm(`Empty your entire pantry? This will remove ${count} item${count === 1 ? '' : 's'}.`)) return
  try {
    await restRequest('pantry_items', { method: 'DELETE', accessToken: session.access_token, query: '?is_consumed=eq.false' })
    window.location.reload()
  } catch (error) {
    const toast = document.querySelector('#toast')
    if (toast) { toast.textContent = error.message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400) }
  }
}

function decoratePantry() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Pantry')
  const grid = document.querySelector('.pantry-grid')
  if (!hero || !grid) return
  if (!document.querySelector('[data-pantry-summary]')) {
    const cards = getPantryCards()
    const counts = { total: cards.length, urgent: 0, expired: 0 }
    cards.forEach((card) => {
      const tone = card.querySelector('.badge')?.className || ''
      if (tone.includes('urgent')) counts.urgent += 1
      if (tone.includes('expired')) counts.expired += 1
    })
    hero.insertAdjacentHTML('afterend', `<div class="pantry-summary" data-pantry-summary><button type="button" data-pantry-summary="all"><strong>${counts.total}</strong><span>Items</span></button><button type="button" class="summary-attention" data-pantry-summary="urgent"><strong>${counts.urgent}</strong><span>Expiring soon</span></button><button type="button" class="summary-expired" data-pantry-summary="expired"><strong>${counts.expired}</strong><span>Expired</span></button></div>`)
    document.querySelector('[data-pantry-summary]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-pantry-summary]')
      if (!button) return
      const filter = getPantrySummaryFilter(button.dataset.pantrySummary === 'urgent' ? 'Expiring soon' : button.dataset.pantrySummary === 'expired' ? 'Expired' : 'Items')
      applyPantrySummaryFilter(filter.tone)
    })
  }
  const emptyButton = hero.querySelector('[data-pantry-empty]')
  if (!emptyButton) {
    const addButton = hero.querySelector('[data-action="add"]')
    addButton?.insertAdjacentHTML('afterend', ' <button class="btn danger" type="button" data-pantry-empty>Empty pantry</button>')
    hero.querySelector('[data-pantry-empty]')?.addEventListener('click', emptyPantry)
  }
  grid.querySelectorAll('.pantry-card').forEach((card) => card.classList.add('pantry-card-clean'))
}

let lastPantryRoot = null
const observer = new MutationObserver(() => {
  const root = document.querySelector('.pantry-grid')
  if (root !== lastPantryRoot) {
    lastPantryRoot = root
    decoratePantry()
  }
})
observer.observe(document.body, { childList: true, subtree: true })
