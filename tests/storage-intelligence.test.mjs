import assert from 'node:assert/strict'
import { buildSmartStorageDefaults, estimateExpiry, getStorageRecommendation, inferFoodCondition } from '../src/logic/storage-intelligence.mjs'

const today = '2026-09-15'

assert.equal(inferFoodCondition('frozen'), 'Frozen')
assert.equal(inferFoodCondition('cooked'), 'Cooked')
assert.equal(inferFoodCondition('unknown'), 'Fresh')

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

const dryRice = buildSmartStorageDefaults({ name: 'Rice', condition: 'Fresh', purchaseDate: today, today })
assert.equal(dryRice.location, 'Pantry')
assert.equal(dryRice.expiryDate, null)

console.log('storage intelligence tests: 11 passed')
