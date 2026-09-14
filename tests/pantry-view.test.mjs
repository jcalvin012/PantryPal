import assert from 'node:assert/strict'
import test from 'node:test'
import { filterPantryItems, buildQuickSnackSuggestions } from '../src/logic/pantry-view.mjs'

test('filters pantry by search and category together', () => {
  const items = [
    { name: 'Chicken Breast', category: 'Meat' },
    { name: 'Banana', category: 'Fruits' },
    { name: 'Chicken Nuggets', category: 'Snacks' },
  ]
  assert.deepEqual(filterPantryItems(items, { search: 'chicken', category: 'Meat' }).map((i) => i.name), ['Chicken Breast'])
})

test('quick snack suggestions use snack items and prioritize expiring ones', () => {
  const items = [
    { name: 'Bread', category: 'Snacks', expiry_date: '2026-09-16' },
    { name: 'Peanut Butter', category: 'Condiments', expiry_date: '2027-01-01' },
    { name: 'Apple', category: 'Fruits', expiry_date: '2026-09-30' },
  ]
  const suggestions = buildQuickSnackSuggestions(items, '2026-09-15')
  assert.equal(suggestions[0].name, 'Bread')
})
