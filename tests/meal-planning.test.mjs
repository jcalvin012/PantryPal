import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMealPlan, calculateRecipeRequirements } from '../src/logic/meal-planning.mjs'

test('scales recipe quantities to household size and reports pantry gaps', () => {
  const recipe = {
    name: 'Chicken Rice Bowl',
    servings: 2,
    ingredients: [
      { ingredient_name: 'Chicken', quantity: 250, unit: 'g' },
      { ingredient_name: 'Rice', quantity: 200, unit: 'g' },
    ],
  }
  const pantry = [
    { name: 'Chicken', quantity: 300, unit: 'g' },
    { name: 'Rice', quantity: 100, unit: 'g' },
  ]
  const result = calculateRecipeRequirements(recipe, pantry, 4)
  assert.deepEqual(result.ingredients.map((i) => [i.needed, i.onHand, i.shortage]), [[500, 300, 200], [400, 100, 300]])
})

test('buildMealPlan only plans selected meal slots', () => {
  const recipes = [{ name: 'Chicken Rice Bowl', servings: 2, ingredients: [{ ingredient_name: 'Chicken', quantity: 250, unit: 'g' }] }]
  const pantry = [{ name: 'Chicken', quantity: 500, unit: 'g' }]
  const settings = { householdSize: 2, schedule: { today: { breakfast: false, lunch: true, dinner: false }, tomorrow: { breakfast: true, lunch: false, dinner: false } } }
  const plan = buildMealPlan(recipes, pantry, settings)
  assert.equal(plan.length, 2)
  assert.deepEqual(plan.map((slot) => slot.slot), ['today-lunch', 'tomorrow-breakfast'])
})
