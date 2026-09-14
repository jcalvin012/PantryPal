import test from 'node:test'
import assert from 'node:assert/strict'
import { nextGroceryQuantity, parseGroceryQuantity, groceryUnit, groceryUnitOptions } from '../src/logic/grocery.mjs'

test('increases grocery quantity by one using the existing unit', () => {
  assert.equal(nextGroceryQuantity({ quantity: 1, unit: 'pcs' }, 1), 2)
  assert.equal(nextGroceryQuantity({ quantity: 2.5, unit: 'kg' }, 1), 3.5)
})

test('decreases grocery quantity without going below zero', () => {
  assert.equal(nextGroceryQuantity({ quantity: 3, unit: 'pcs' }, -1), 2)
  assert.equal(nextGroceryQuantity({ quantity: 1, unit: 'kg' }, -1), 0)
})

test('parses editable grocery quantities and rejects invalid values', () => {
  assert.equal(parseGroceryQuantity('600'), 600)
  assert.equal(parseGroceryQuantity('0.5'), 0.5)
  assert.equal(parseGroceryQuantity(2.5), 2.5)
  assert.equal(parseGroceryQuantity(''), null)
  assert.equal(parseGroceryQuantity('-1'), null)
  assert.equal(parseGroceryQuantity('abc'), null)
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
