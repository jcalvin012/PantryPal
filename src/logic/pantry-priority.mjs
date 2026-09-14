import { getExpiryStatus } from './expiry.mjs'

const HIGH_QUANTITY_THRESHOLDS = {
  kg: 3,
  l: 3,
  g: 1000,
  ml: 1000,
  pcs: 6,
  pc: 6,
  bottle: 6,
  can: 6,
  pack: 6,
  box: 6,
  dozen: 2,
}

function quantityIsHigh(item) {
  const quantity = Number(item?.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return false
  const unit = String(item?.unit || 'pcs').trim().toLowerCase()
  return quantity >= (HIGH_QUANTITY_THRESHOLDS[unit] ?? 5)
}

function expiryScore(status) {
  if (status.tone === 'expired') return 1000
  if (status.tone === 'urgent') return 800 - Math.max(0, status.daysLeft) * 40
  if (status.tone === 'warning') return 500 - Math.max(0, status.daysLeft) * 20
  if (status.tone === 'safe') return 150
  return 0
}

export function pantryPriorityScore(item, today = new Date().toISOString().slice(0, 10)) {
  const status = getExpiryStatus(item?.expiry_date, today)
  const largeQuantity = quantityIsHigh(item)
  return expiryScore(status) + (largeQuantity ? 120 : 0)
}

export function prioritizePantryItems(items = [], today = new Date().toISOString().slice(0, 10)) {
  return [...items]
    .map((item) => ({ ...item, priorityScore: pantryPriorityScore(item, today), largeQuantity: quantityIsHigh(item) }))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.name.localeCompare(b.name))
}
