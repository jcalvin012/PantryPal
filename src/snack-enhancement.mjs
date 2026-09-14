import { getExpiryStatus } from './logic/expiry.mjs'

const today = () => new Date().toISOString().slice(0, 10)
const toDateValue = (value) => {
  if (!value || value === 'No expiry') return null
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function enhanceSnackModal() {
  const modal = document.querySelector('[data-snack-modal]')
  if (!modal || modal.dataset.expiryEnhanced === 'true') return
  const expiryByName = new Map()
  for (const card of document.querySelectorAll('.pantry-card')) {
    const name = card.querySelector('.item-name')?.textContent.trim()
    const text = [...card.querySelectorAll('.item-meta')].map((node) => node.textContent.trim()).find((value) => value.startsWith('Expiry:'))
    const expiry = toDateValue(text?.replace(/^Expiry:\s*/, ''))
    if (name) expiryByName.set(name.toLowerCase(), expiry)
  }
  const list = modal.querySelector('.item-list')
  if (!list) return
  const rows = [...list.querySelectorAll('.item')]
  const normal = []
  const expired = []
  for (const row of rows) {
    const name = row.querySelector('.item-name')?.textContent.trim() || ''
    const expiry = expiryByName.get(name.toLowerCase())
    const status = expiry ? getExpiryStatus(expiry, today()) : null
    if (status?.tone === 'expired') {
      row.classList.add('snack-expired')
      const badge = row.querySelector('.badge')
      if (badge) { badge.className = 'badge expired'; badge.textContent = 'Expired' }
      row.insertAdjacentHTML('beforeend', '<div class="snack-warning">⚠️ This item is expired. Consider replacing it instead of using it.</div>')
      expired.push(row)
    } else normal.push(row)
  }
  if (expired.length) {
    const heading = document.createElement('div')
    heading.className = 'snack-expired-heading'
    heading.textContent = 'Expired — Review'
    list.appendChild(heading)
    expired.forEach((row) => list.appendChild(row))
    if (normal.length) {
      const freshHeading = document.createElement('div')
      freshHeading.className = 'snack-fresh-heading'
      freshHeading.textContent = 'Available snacks'
      list.insertBefore(freshHeading, normal[0])
    }
  }
  modal.dataset.expiryEnhanced = 'true'
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-quick-snack]')) return
  setTimeout(enhanceSnackModal, 0)
})
const observer = new MutationObserver(enhanceSnackModal)
observer.observe(document.body, { childList: true, subtree: true })
