import assert from 'node:assert/strict'
import { CONDITION_OPTIONS, buildSmartStorageDefaults, estimateExpiry, getStorageRecommendation, inferFoodCondition } from '../src/logic/storage-intelligence.mjs'

const today = '2026-09-15'

assert.deepEqual(CONDITION_OPTIONS, [
  'Fresh',
  'Frozen',
  'Cooked',
  'Canned',
  'Packaged',
  'Dry / Shelf-Stable',
  'Opened',
  'Other',
])

for (const condition of CONDITION_OPTIONS) assert.equal(inferFoodCondition(condition), condition)

const freshChicken = getStorageRecommendation({ name: 'Chicken breast', condition: 'Fresh' })
assert.equal(freshChicken.location, 'Fridge')
assert.equal(freshChicken.matched, true)

const frozenChicken = getStorageRecommendation({ name: 'Chicken breast', condition: 'Frozen' })
assert.equal(frozenChicken.location, 'Freezer')

const seafood = getStorageRecommendation({ name: 'Salmon', condition: 'Fresh' })
assert.equal(seafood.location, 'Fridge')

const chickenFridgeExpiry = estimateExpiry({ name: 'Chicken breast', condition: 'Fresh', location: 'Fridge', purchaseDate: today, today })
assert.equal(chickenFridgeExpiry.expiryDate, '2026-09-17')
assert.equal(chickenFridgeExpiry.estimated, true)

const chickenFrozenExpiry = estimateExpiry({ name: 'Chicken breast', condition: 'Fresh', location: 'Freezer', purchaseDate: today, today })
assert.equal(chickenFrozenExpiry.expiryDate, '2027-06-15')
assert.equal(chickenFrozenExpiry.estimated, true)

const frozenGroundBeef = estimateExpiry({ name: 'Ground beef', condition: 'Frozen', location: 'Freezer', purchaseDate: today, today })
assert.equal(frozenGroundBeef.expiryDate, '2027-01-15')

const cookedChicken = estimateExpiry({ name: 'Cooked chicken', condition: 'Cooked', location: 'Fridge', purchaseDate: today, today })
assert.equal(cookedChicken.expiryDate, '2026-09-19')

const cannedTuna = buildSmartStorageDefaults({ name: 'Canned Tuna', condition: 'Canned', purchaseDate: today, today })
assert.equal(cannedTuna.location, 'Pantry')
assert.equal(cannedTuna.expiryDate, null)
assert.equal(cannedTuna.expiryEstimated, false)

const dryNoodles = buildSmartStorageDefaults({ name: 'Instant Noodles', condition: 'Dry / Shelf-Stable', purchaseDate: today, today })
assert.equal(dryNoodles.location, 'Pantry')
assert.equal(dryNoodles.expiryDate, null)

const openedMilk = buildSmartStorageDefaults({ name: 'Milk', condition: 'Opened', purchaseDate: today, today })
assert.equal(openedMilk.location, 'Fridge')
assert.equal(openedMilk.expiryDate, null)

console.log('storage intelligence tests: expanded condition coverage passed')
