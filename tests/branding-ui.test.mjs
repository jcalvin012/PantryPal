import test from 'node:test'
import assert from 'node:assert/strict'
import { getBrandingAttributes } from '../src/logic/branding.mjs'

test('Nouri exposes polished product metadata for the UI', () => {
  assert.deepEqual(getBrandingAttributes(), {
    name: 'Nouri',
    tagline: 'Eat smarter. Waste less.',
    themeColor: '#24513b',
  })
})
