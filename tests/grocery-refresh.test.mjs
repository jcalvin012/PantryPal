import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/grocery-bugfix-enhancement.mjs', import.meta.url), 'utf8')

test('manual grocery add refreshes the app in place instead of reloading the page', () => {
  const handlerStart = source.indexOf('async function submitManualGrocery')
  const handlerEnd = source.indexOf('\n}\n\nasync function addRecommendedGrocery', handlerStart)
  assert.notEqual(handlerStart, -1)
  assert.notEqual(handlerEnd, -1)

  const handler = source.slice(handlerStart, handlerEnd)
  assert.match(handler, /pantrypal:remote-change/)
  assert.doesNotMatch(handler, /location\.reload\(\)/)
})
