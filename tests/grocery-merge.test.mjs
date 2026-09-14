import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeSameGroceryItems } from '../src/logic/grocery.mjs'

test('merges matching grocery items with the same unit', () => {
  const result = mergeSameGroceryItems([
    { id: '1', item_name: 'Chicken Breast', quantity: 1, unit: 'kg' },
    { id: '2', item_name: ' chicken breast ', quantity: 0.5, unit: 'kg' },
    { id: '3', item_name: 'Rice', quantity: 2, unit: 'kg' },
  ])
  assert.deepEqual(result, [
    { id: '1', item_name: 'Chicken Breast', quantity: 1.5, unit: 'kg' },
    { id: '3', item_name: 'Rice', quantity: 2, unit: 'kg' },
  ])
})

test('does not combine different units because PantryPal does not auto-convert', () => {
  const result = mergeSameGroceryItems([
    { id: '1', item_name: 'Milk', quantity: 1, unit: 'L' },
    { id: '2', item_name: 'Milk', quantity: 500, unit: 'mL' },
  ])
  assert.equal(result.length, 2)
})
