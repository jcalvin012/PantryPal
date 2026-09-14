import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSupabaseUrl } from '../src/supabase.mjs'

test('builds Supabase API URLs without duplicate slashes', () => {
  assert.equal(buildSupabaseUrl('https://example.supabase.co/', '/rest/v1/pantry_items'), 'https://example.supabase.co/rest/v1/pantry_items')
  assert.equal(buildSupabaseUrl('https://example.supabase.co', '/auth/v1/token'), 'https://example.supabase.co/auth/v1/token')
})
