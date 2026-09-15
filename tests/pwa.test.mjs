import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const root = new URL('../', import.meta.url)

const read = (path) => fs.readFileSync(new URL(path, root), 'utf8')

test('PWA manifest declares an installable PantryPal app', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'))
  assert.equal(manifest.name, 'PantryPal')
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'))
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'))
})

test('index registers the service worker and exposes the manifest', () => {
  const html = read('index.html')
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/)
  assert.match(html, /serviceWorker\.register\('service-worker\.js'\)/)
})
