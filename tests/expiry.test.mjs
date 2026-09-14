import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpiryStatus, sortByExpiryUrgency } from '../src/logic/expiry.mjs'

test('marks an item expiring within three days as urgent', () => {
  assert.deepEqual(getExpiryStatus('2026-09-16', '2026-09-14'), {
    label: 'Expiring soon',
    tone: 'urgent',
    daysLeft: 2,
  })
})

test('marks an already expired item as expired', () => {
  assert.deepEqual(getExpiryStatus('2026-09-12', '2026-09-14'), {
    label: 'Expired',
    tone: 'expired',
    daysLeft: -2,
  })
})

test('sorts expired and soon-to-expire items before later items', () => {
  const items = [
    { name: 'Rice', expiry_date: '2026-10-01' },
    { name: 'Milk', expiry_date: '2026-09-16' },
    { name: 'Eggs', expiry_date: '2026-09-12' },
  ]
  assert.deepEqual(sortByExpiryUrgency(items, '2026-09-14').map((item) => item.name), ['Eggs', 'Milk', 'Rice'])
})
