import test from 'node:test'
import assert from 'node:assert/strict'
import { rankMeals, buildGrocerySuggestions } from '../src/logic/recommendations.mjs'

test('prioritizes a meal that uses an urgent pantry item', () => {
  const pantry = [
    { name: 'Chicken', quantity: 1, expiry_date: '2026-09-15', is_consumed: false },
    { name: 'Rice', quantity: 2, expiry_date: '2026-10-01', is_consumed: false },
  ]
  const recipes = [
    { name: 'Chicken Rice', ingredients: [{ ingredient_name: 'Chicken' }, { ingredient_name: 'Rice' }] },
    { name: 'Rice Bowl', ingredients: [{ ingredient_name: 'Rice' }, { ingredient_name: 'Egg' }] },
  ]
  assert.equal(rankMeals(pantry, recipes, '2026-09-14')[0].name, 'Chicken Rice')
})

test('creates grocery suggestions from missing recipe ingredients', () => {
  const pantry = [{ name: 'Rice', quantity: 1, is_consumed: false }]
  const recipes = [
    { name: 'Fried Rice', ingredients: [{ ingredient_name: 'Rice' }, { ingredient_name: 'Egg' }] },
    { name: 'Omelette Rice', ingredients: [{ ingredient_name: 'Rice' }, { ingredient_name: 'Egg' }] },
  ]
  assert.deepEqual(buildGrocerySuggestions(pantry, recipes)[0], { item_name: 'egg', quantity: 1, unit: 'pcs', reason: 'Needed for 2 meals', priority: 70, source: 'recipe' })
})
