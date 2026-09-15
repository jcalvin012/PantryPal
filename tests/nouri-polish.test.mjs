import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../styles/nouri-polish.css', import.meta.url), 'utf8')

test('Nouri visual system defines the premium mobile product treatment', () => {
  assert.match(css, /--nouri-forest:/)
  assert.match(css, /\.dashboard-hero/)
  assert.match(css, /\.nav button\.active/)
  assert.match(css, /\.auth-card/)
  assert.match(css, /@media \(max-width: 760px\)/)
})

test('Nouri touch targets are accessible on mobile', () => {
  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /min-width:\s*44px/)
})
