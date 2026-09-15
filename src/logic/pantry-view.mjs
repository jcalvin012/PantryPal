import { getExpiryStatus } from './expiry.mjs'

const normalize = (value) => String(value || '').trim().toLowerCase()

export function filterPantryItems(items, { search = '', category = 'All' } = {}) {
  const query = normalize(search)
  return items.filter((item) => {
    const matchesCategory = !category || category === 'All' || normalize(item.category) === normalize(category)
    const matchesSearch = !query || normalize(item.name).includes(query) || normalize(item.category).includes(query) || normalize(item.location).includes(query)
    return matchesCategory && matchesSearch
  })
}

export function getPantrySummaryFilter(label) {
  const value = normalize(label)
  if (value === 'expiring soon') return { search: '', category: 'All', tone: 'urgent' }
  if (value === 'expired') return { search: '', category: 'All', tone: 'expired' }
  return { search: '', category: 'All', tone: null }
}

export function buildQuickSnackSuggestions(items, today = new Date().toISOString().slice(0, 10)) {
  const snacks = items.filter((item) => normalize(item.category) === 'snacks' && Number(item.quantity) > 0)
    .map((item) => {
      const status = getExpiryStatus(item.expiry_date, today)
      return { name: item.name, quantity: item.quantity, unit: item.unit, expiryDate: item.expiry_date, expired: status.tone === 'expired', expiryLabel: status.label }
    })
    .sort((a, b) => {
      if (a.expired !== b.expired) return a.expired ? 1 : -1
      return getExpiryStatus(a.expiryDate, today).daysLeft - getExpiryStatus(b.expiryDate, today).daysLeft
    })
  const usable = snacks.filter((item) => !item.expired)
  const expired = snacks.filter((item) => item.expired)
  return [...usable.slice(0, 5), ...expired.slice(0, Math.max(0, 5 - Math.min(usable.length, 5)))]
}
