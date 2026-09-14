import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateRemainingQuantity, buildConsumptionLog } from '../src/logic/consumption.mjs'

test('calculates partial and full consumption', () => {
  assert.equal(calculateRemainingQuantity(5, 2), 3)
  assert.equal(calculateRemainingQuantity(5, 5), 0)
})

test('rejects consumption above available quantity', () => {
  assert.throws(() => calculateRemainingQuantity(2, 3), /exceeds available/)
})

test('builds a consumption log with the remaining quantity', () => {
  const log = buildConsumptionLog({ id: '1', name: 'Milk', quantity: 2, unit: 'bottles' }, 1)
  assert.deepEqual(log, { item_name: 'Milk', quantity: 1, unit: 'bottles', pantry_item_id: '1', source: 'manual', remaining: 1 })
})
