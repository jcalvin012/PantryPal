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

export function buildQuickSnackSuggestions(items, today = new Date().toISOString().slice(0, 10)) {
  const snacks = items.filter((item) => normalize(item.category) === 'snacks' && Number(item.quantity) > 0)
  return snacks.sort((a, b) => {
    const aStatus = getExpiryStatus(a.expiry_date, today)
    const bStatus = getExpiryStatus(b.expiry_date, today)
    return (aStatus.daysLeft ?? 99999) - (bStatus.daysLeft ?? 99999)
  }).slice(0, 5).map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit, expiryDate: item.expiry_date }))
}
