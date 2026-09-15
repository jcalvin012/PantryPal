import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8')
const start = app.indexOf('function homeView()')
const end = app.indexOf('function recipeCard', start)
const home = app.slice(start, end)

test('Nouri dashboard has an app-like quick actions area', () => {
  assert.match(home, /dashboard-quick-actions/)
  assert.match(home, /data-action="add"/)
  assert.match(home, /data-screen="meals"/)
  assert.match(home, /data-screen="grocery"/)
})

test('Nouri dashboard gives pantry status a dedicated visual section', () => {
  assert.match(home, /dashboard-pantry-status/)
  assert.match(home, /dashboard-stat-card/)
})

test('Nouri dashboard makes the priority food area visually actionable', () => {
  assert.match(home, /dashboard-priority/)
  assert.match(home, /Use These First/)
})
