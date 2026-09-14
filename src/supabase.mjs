import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.mjs'

export function buildSupabaseUrl(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function jsonHeaders(accessToken) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function authRequest(path, body, method = 'POST') {
  const response = await fetch(buildSupabaseUrl(SUPABASE_URL, `/auth/v1/${path}`), {
    method,
    headers: jsonHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.msg || payload.error_description || payload.message || 'Authentication request failed')
  return payload
}

export async function restRequest(table, { method = 'GET', query = '', body, accessToken, headers = {} } = {}) {
  const url = buildSupabaseUrl(SUPABASE_URL, `/rest/v1/${table}`) + query
  const response = await fetch(url, {
    method,
    headers: { ...jsonHeaders(accessToken), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(payload?.message || payload?.error || 'Database request failed')
  return payload
}

export function saveAuthSession(payload) {
  if (payload?.access_token) sessionStorage.setItem('pantrypal.session', JSON.stringify(payload))
}

export function getAuthSession() {
  try { return JSON.parse(sessionStorage.getItem('pantrypal.session') || 'null') } catch { return null }
}

export function clearAuthSession() {
  sessionStorage.removeItem('pantrypal.session')
}
