import test from 'node:test'
import assert from 'node:assert/strict'
import { inferCategory } from '../src/logic/category.mjs'

test('common snack foods are identified as Snacks', () => {
  for (const name of ['chips', 'crackers', 'biscuits', 'cookies', 'chocolate', 'popcorn', 'peanuts']) {
    assert.equal(inferCategory(name, 'Other'), 'Snacks', name)
  }
})
