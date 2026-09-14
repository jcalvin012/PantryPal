const MS_PER_DAY = 86_400_000

function toUtcDay(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day)
}

export function getExpiryStatus(expiryDate, today = new Date().toISOString().slice(0, 10)) {
  if (!expiryDate) return { label: 'No expiry', tone: 'neutral', daysLeft: null }
  const expiry = toUtcDay(expiryDate)
  const current = toUtcDay(today)
  if (expiry === null || current === null) throw new Error('Invalid date')
  const daysLeft = Math.round((expiry - current) / MS_PER_DAY)
  if (daysLeft < 0) return { label: 'Expired', tone: 'expired', daysLeft }
  if (daysLeft <= 3) return { label: daysLeft === 0 ? 'Expires today' : 'Expiring soon', tone: 'urgent', daysLeft }
  if (daysLeft <= 7) return { label: 'Upcoming', tone: 'warning', daysLeft }
  return { label: 'Fresh', tone: 'safe', daysLeft }
}

export function sortByExpiryUrgency(items, today = new Date().toISOString().slice(0, 10)) {
  return [...items].sort((a, b) => {
    if (!a.expiry_date && !b.expiry_date) return 0
    if (!a.expiry_date) return 1
    if (!b.expiry_date) return -1
    const aStatus = getExpiryStatus(a.expiry_date, today)
    const bStatus = getExpiryStatus(b.expiry_date, today)
    if (aStatus.daysLeft !== bStatus.daysLeft) return aStatus.daysLeft - bStatus.daysLeft
    return a.name.localeCompare(b.name)
  })
}
