import test from 'node:test'
import assert from 'node:assert/strict'
import { nextGroceryQuantity, groceryUnit, groceryUnitOptions } from '../src/logic/grocery.mjs'

test('increases grocery quantity by one using the existing unit', () => {
  assert.equal(nextGroceryQuantity({ quantity: 1, unit: 'pcs' }, 1), 2)
  assert.equal(nextGroceryQuantity({ quantity: 2.5, unit: 'kg' }, 1), 3.5)
})

test('decreases grocery quantity without going below zero', () => {
  assert.equal(nextGroceryQuantity({ quantity: 3, unit: 'pcs' }, -1), 2)
  assert.equal(nextGroceryQuantity({ quantity: 1, unit: 'kg' }, -1), 0)
})

test('uses the stored unit and falls back to pcs', () => {
  assert.equal(groceryUnit({ unit: 'kg' }), 'kg')
  assert.equal(groceryUnit({ unit: '' }), 'pcs')
  assert.equal(groceryUnit({}), 'pcs')
})

test('offers common editable grocery units', () => {
  assert.deepEqual(groceryUnitOptions('kg'), ['pc', 'pcs', 'kg', 'g', 'L', 'mL', 'bottle', 'pack', 'box', 'can', 'dozen'])
  assert.equal(groceryUnitOptions('custom')[0], 'custom')
})
