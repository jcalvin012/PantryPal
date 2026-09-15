import test from 'node:test'
import assert from 'node:assert/strict'
import { findMatchingPantryItem, mergeSamePantryItems } from '../src/logic/pantry.mjs'

test('merges same pantry food when identity matches', () => {
  const result = mergeSamePantryItems([
    { name: 'Chicken Breast', quantity: 500, unit: 'g', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-17', category: 'Meat' },
    { name: 'chicken breast', quantity: 300, unit: 'g', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-17', category: 'Meat' },
  ])
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 800)
})

test('keeps different expiry batches separate', () => {
  const result = mergeSamePantryItems([
    { name: 'Chicken Breast', quantity: 500, unit: 'g', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-17', category: 'Meat' },
    { name: 'Chicken Breast', quantity: 300, unit: 'g', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-18', category: 'Meat' },
  ])
  assert.equal(result.length, 2)
})

test('keeps different units separate because no conversion is performed', () => {
  const result = mergeSamePantryItems([
    { name: 'Rice', quantity: 1, unit: 'kg', location: 'Pantry', condition: 'Dry / Shelf-Stable', expiry_date: null, category: 'Grains' },
    { name: 'Rice', quantity: 500, unit: 'g', location: 'Pantry', condition: 'Dry / Shelf-Stable', expiry_date: null, category: 'Grains' },
  ])
  assert.equal(result.length, 2)
})

test('finds a case-insensitive match using the full pantry identity', () => {
  const result = findMatchingPantryItem([
    { id: '1', name: 'Milk', quantity: 1, unit: 'L', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-17', category: 'Dairy' },
  ], { name: ' milk ', unit: 'L', location: 'Fridge', condition: 'Fresh', expiry_date: '2026-09-17', category: 'Dairy' })
  assert.equal(result?.id, '1')
})
