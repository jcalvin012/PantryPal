import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardData, getPantryInsight } from '../src/logic/dashboard.mjs'

test('builds dashboard summary from the current pantry and grocery list', () => {
  const data = buildDashboardData([
    { name: 'Chicken', quantity: 500, unit: 'g', expiry_date: '2026-09-16' },
    { name: 'Rice', quantity: 2, unit: 'kg', expiry_date: '2026-10-01' },
    { name: 'Milk', quantity: 1, unit: 'L', expiry_date: '2026-09-15' },
  ], [{ id: 'g1' }, { id: 'g2' }], '2026-09-15')

  assert.equal(data.totalItems, 3)
  assert.equal(data.expiringSoon, 2)
  assert.equal(data.expired, 0)
  assert.equal(data.groceryCount, 2)
  assert.deepEqual(data.priorityItems.map((item) => item.name), ['Milk', 'Chicken'])
})

test('includes a large-quantity item in dashboard priorities', () => {
  const data = buildDashboardData([
    { name: 'Rice', quantity: 10, unit: 'kg', expiry_date: '2026-09-30' },
    { name: 'Pasta', quantity: 1, unit: 'kg', expiry_date: '2026-10-15' },
  ], [], '2026-09-15')

  assert.equal(data.priorityItems[0].name, 'Rice')
  assert.equal(data.priorityItems[0].largeQuantity, true)
})

test('creates a pantry-based Did You Know insight using the most urgent item', () => {
  const insight = getPantryInsight([
    { name: 'Chicken', quantity: 500, unit: 'g', expiry_date: '2026-09-16' },
    { name: 'Rice', quantity: 2, unit: 'kg', expiry_date: '2026-10-01' },
  ], '2026-09-15')

  assert.match(insight, /Chicken/)
  assert.match(insight, /2 days|tomorrow|1 day/)
})

test('creates a quantity insight when there is no urgent expiry', () => {
  const insight = getPantryInsight([
    { name: 'Rice', quantity: 10, unit: 'kg', expiry_date: '2026-09-30' },
  ], '2026-09-15')

  assert.match(insight, /large quantity/)
  assert.match(insight, /Rice/)
})

test('falls back to a useful tip when the pantry is empty', () => {
  assert.match(getPantryInsight([], '2026-09-15'), /Did you know\?/)
})
