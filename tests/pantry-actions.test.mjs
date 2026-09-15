import test from 'node:test'
import assert from 'node:assert/strict'
import { getPantrySummaryFilter } from '../src/logic/pantry-view.mjs'

test('summary filters map to pantry expiry states', () => {
  assert.deepEqual(getPantrySummaryFilter('Items'), { search: '', category: 'All', tone: null })
  assert.deepEqual(getPantrySummaryFilter('Expiring soon'), { search: '', category: 'All', tone: 'urgent' })
  assert.deepEqual(getPantrySummaryFilter('Expired'), { search: '', category: 'All', tone: 'expired' })
})

test('unknown summary filter resets to all pantry items', () => {
  assert.deepEqual(getPantrySummaryFilter('anything else'), { search: '', category: 'All', tone: null })
})
