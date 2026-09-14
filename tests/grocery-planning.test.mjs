import assert from 'node:assert/strict'
import { getGroceryFrequency, inferShoppingSection, sortGroceriesForShopping, groupGroceriesForShopping } from '../src/logic/grocery-planning.mjs'

assert.equal(getGroceryFrequency('weekly').days, 7)
assert.equal(getGroceryFrequency('unknown').value, 'weekly')
assert.equal(inferShoppingSection({ item_name: 'Chicken breast' }), 'meat')
assert.equal(inferShoppingSection({ item_name: 'Dishwashing liquid' }), 'household')

const sorted = sortGroceriesForShopping([
  { item_name: 'Rice' },
  { item_name: 'Chicken' },
  { item_name: 'Milk' },
  { item_name: 'Tomato' },
])
assert.deepEqual(sorted.map((item) => item.item_name), ['Tomato', 'Chicken', 'Milk', 'Rice'])

const groups = groupGroceriesForShopping(sorted)
assert.deepEqual(groups.map((group) => group.label), ['Produce', 'Meat & Poultry', 'Dairy & Eggs', 'Rice, Grains & Pasta'])

console.log('grocery-planning tests: 7/7 passed')
