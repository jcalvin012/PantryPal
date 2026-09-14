import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePantryItem } from '../src/logic/pantry.mjs'

test('requires a pantry item name and positive quantity', () => {
  assert.throws(() => validatePantryItem({ name: '', quantity: 1 }), /name/)
  assert.throws(() => validatePantryItem({ name: 'Rice', quantity: 0 }), /quantity/)
})

test('rejects invalid expiry dates', () => {
  assert.throws(() => validatePantryItem({ name: 'Milk', quantity: 1, expiry_date: 'not-a-date' }), /expiry date/)
})

test('normalizes a valid pantry item', () => {
  assert.deepEqual(validatePantryItem({ name: '  Rice  ', quantity: '2', unit: 'kg' }), { name: 'Rice', quantity: 2, unit: 'kg' })
})
