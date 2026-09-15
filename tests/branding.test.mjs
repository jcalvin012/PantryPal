import test from 'node:test'
import assert from 'node:assert/strict'
import { brandText, PRODUCT_NAME, PRODUCT_TAGLINE } from '../src/logic/branding.mjs'

test('Nouri branding replaces the old product name without changing unrelated text', () => {
  assert.equal(PRODUCT_NAME, 'Nouri')
  assert.equal(PRODUCT_TAGLINE, 'Eat smarter. Waste less.')
  assert.equal(brandText('PantryPal'), 'Nouri')
  assert.equal(brandText('Welcome to PantryPal'), 'Welcome to Nouri')
  assert.equal(brandText('PantryPal meal suggestion.'), 'Nouri meal suggestion.')
  assert.equal(brandText('Pantry'), 'Pantry')
})
