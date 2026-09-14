import assert from 'node:assert/strict'
import test from 'node:test'
import { buildQuickSnackSuggestions } from '../src/logic/pantry-view.mjs'
import { buildGrocerySuggestions } from '../src/logic/recommendations.mjs'

const today = '2026-09-15'

test('quick snack suggestions keep expired snacks but mark them for review', () => {
  const result = buildQuickSnackSuggestions([
    { name: 'Expired Chips', category: 'Snacks', quantity: 1, unit: 'pcs', expiry_date: '2026-09-10' },
    { name: 'Fresh Crackers', category: 'Snacks', quantity: 1, unit: 'pcs', expiry_date: '2026-09-17' },
  ], today)
  assert.equal(result.length, 2)
  assert.equal(result[0].expired, false)
  assert.equal(result[1].expired, true)
})

test('grocery recommendations use the actual meal shortage quantity', () => {
  const recipes = [{
    name: 'Chicken Rice Bowl',
    servings: 2,
    ingredients: [
      { ingredient_name: 'Chicken Breast', quantity: 500, unit: 'g' },
      { ingredient_name: 'Rice', quantity: 200, unit: 'g' },
    ],
  }]
  const pantry = [{ name: 'Chicken Breast', quantity: 300, unit: 'g' }, { name: 'Rice', quantity: 200, unit: 'g' }]
  const result = buildGrocerySuggestions(pantry, recipes, { householdSize: 2 })
  assert.deepEqual(result.map((item) => [item.item_name, item.quantity, item.unit]), [['Chicken Breast', 200, 'g']])
})
