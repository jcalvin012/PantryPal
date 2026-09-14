import test from 'node:test'
import assert from 'node:assert/strict'
import { inferCategory } from '../src/logic/category.mjs'
import { prioritizePantryItems } from '../src/logic/pantry-priority.mjs'

test('keeps Other as the default but infers a category for recognizable items', () => {
  assert.equal(inferCategory('Chicken Breast', 'Other'), 'Meat')
  assert.equal(inferCategory('Fresh Milk', 'Other'), 'Dairy')
  assert.equal(inferCategory('Apple', 'Other'), 'Fruits')
})

test('does not override a category selected by the user', () => {
  assert.equal(inferCategory('Chicken Breast', 'Vegetables'), 'Vegetables')
})

test('keeps Other when the item cannot be confidently identified', () => {
  assert.equal(inferCategory('Mystery Food', 'Other'), 'Other')
})

test('prioritizes an expiring item above a large quantity item', () => {
  const items = [
    { name: 'Rice', quantity: 10, unit: 'kg', expiry_date: '2026-09-30' },
    { name: 'Chicken', quantity: 1, unit: 'kg', expiry_date: '2026-09-17' },
  ]
  assert.equal(prioritizePantryItems(items, '2026-09-15')[0].name, 'Chicken')
})

test('uses large quantity as a secondary priority signal', () => {
  const items = [
    { name: 'Rice', quantity: 10, unit: 'kg', expiry_date: '2026-09-30' },
    { name: 'Pasta', quantity: 1, unit: 'kg', expiry_date: '2026-09-30' },
  ]
  assert.equal(prioritizePantryItems(items, '2026-09-15')[0].name, 'Rice')
})
