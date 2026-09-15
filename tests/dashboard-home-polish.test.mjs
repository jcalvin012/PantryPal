import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const dashboard = await readFile(new URL('../src/dashboard-polish.mjs', import.meta.url), 'utf8')

test('Nouri dashboard has an app-like quick actions area', () => {
  assert.match(dashboard, /dashboard-quick-actions/)
  assert.match(dashboard, /data-action="add"/)
  assert.match(dashboard, /data-screen="meals"/)
  assert.match(dashboard, /data-screen="grocery"/)
})

test('Nouri dashboard gives pantry status dedicated visual classes', () => {
  assert.match(dashboard, /dashboard-stat-card/)
  assert.match(dashboard, /dashboard-priority/)
})

test('Nouri dashboard enhances meals and priority sections without replacing app logic', () => {
  assert.match(dashboard, /heading === 'Use These First'/)
  assert.match(dashboard, /heading === 'What Can I Make\?'/)
  assert.match(dashboard, /MutationObserver/)
})
