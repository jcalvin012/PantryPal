import { getAuthSession, restRequest } from './supabase.mjs'
import { findMatchingPantryItem } from './logic/pantry.mjs'

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
  await restRequest('pantry_items', {
    method: 'PATCH',
    accessToken: session.access_token,
    query: `?id=eq.${encodeURIComponent(match.id)}`,
    body: { quantity },
    headers: { Prefer: 'return=minimal' },
  })
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
    if (toast) {
      toast.textContent = error.message
      toast.classList.add('show')
      setTimeout(() => toast.classList.remove('show'), 2400)
    }
  }
}, true)

function decoratePantry() {
  const hero = [...document.querySelectorAll('.hero')].find((node) => node.querySelector('h1')?.textContent.trim() === 'Pantry')
  const grid = document.querySelector('.pantry-grid')
  if (!hero || !grid) return
  if (!document.querySelector('[data-pantry-summary]')) {
    const cards = [...grid.querySelectorAll('.pantry-card')]
    const counts = { total: cards.length, urgent: 0, expired: 0 }
    cards.forEach((card) => {
      const tone = card.querySelector('.badge')?.className || ''
      if (tone.includes('urgent')) counts.urgent += 1
      if (tone.includes('expired')) counts.expired += 1
    })
    hero.insertAdjacentHTML('afterend', `<div class="pantry-summary" data-pantry-summary><div><strong>${counts.total}</strong><span>Items</span></div><div class="summary-attention"><strong>${counts.urgent}</strong><span>Expiring soon</span></div><div class="summary-expired"><strong>${counts.expired}</strong><span>Expired</span></div></div>`)
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
