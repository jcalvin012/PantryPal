import { getExpiryStatus, sortByExpiryUrgency } from './expiry.mjs'

export function buildDashboardData(pantryItems = [], groceries = [], today = new Date().toISOString().slice(0, 10)) {
  const statuses = pantryItems.map((item) => getExpiryStatus(item.expiry_date, today))
  return {
    totalItems: pantryItems.length,
    expiringSoon: statuses.filter((status) => status.tone === 'urgent').length,
    expired: statuses.filter((status) => status.tone === 'expired').length,
    groceryCount: groceries.length,
    priorityItems: sortByExpiryUrgency(pantryItems.filter((item) => ['urgent', 'expired'].includes(getExpiryStatus(item.expiry_date, today).tone)), today).slice(0, 4),
  }
}

function expiryPhrase(status) {
  if (status.tone === 'expired') return 'it has already expired and should be checked before use.'
  if (status.daysLeft === 0) return 'it expires today.'
  if (status.daysLeft === 1) return 'it expires tomorrow.'
  return `it expires in ${status.daysLeft} days.`
}

export function getPantryInsight(pantryItems = [], today = new Date().toISOString().slice(0, 10)) {
  if (!pantryItems.length) return 'Did you know? Adding your pantry items helps PantryPal personalize meal ideas, expiry priorities, and grocery recommendations.'

  const priority = sortByExpiryUrgency(pantryItems.filter((item) => item.expiry_date), today)[0]
  if (priority) {
    const status = getExpiryStatus(priority.expiry_date, today)
    if (['urgent', 'expired'].includes(status.tone)) return `Did you know? Your ${priority.name} is the item that needs attention first because ${expiryPhrase(status)}`
  }

  const upcoming = pantryItems.filter((item) => getExpiryStatus(item.expiry_date, today).tone === 'warning').length
  if (upcoming) return `Did you know? You have ${upcoming} pantry item${upcoming === 1 ? '' : 's'} coming up for expiry within 7 days.`

  return `Did you know? You currently have ${pantryItems.length} item${pantryItems.length === 1 ? '' : 's'} in your pantry. PantryPal can use them to personalize your meal and grocery suggestions.`
}
