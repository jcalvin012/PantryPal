import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.mjs'

const REALTIME_TABLES = ['pantry_items', 'grocery_items', 'consumption_logs', 'purchase_logs']
const POLL_MS = 500
const LOCAL_WRITE_GRACE_MS = 3000
const RELOAD_DEBOUNCE_MS = 500

let realtimeClient = null
let realtimeChannel = null
let activeAccessToken = null
let reloadTimer = null
let lastLocalWriteAt = 0

const originalFetch = window.fetch.bind(window)
window.fetch = async (...args) => {
  const request = args[0]
  const options = args[1] || {}
  const url = typeof request === 'string' ? request : request?.url || ''
  const method = String(options.method || (request instanceof Request ? request.method : 'GET')).toUpperCase()
  if (url.includes('/rest/v1/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) lastLocalWriteAt = Date.now()
  return originalFetch(...args)
}

function scheduleRefresh() {
  if (Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS) return
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => window.location.reload(), RELOAD_DEBOUNCE_MS)
}

async function subscribe(accessToken, userId) {
  if (realtimeChannel) {
    await realtimeClient.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  realtimeClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  realtimeClient.realtime.setAuth(accessToken)

  realtimeChannel = realtimeClient.channel(`pantrypal:${userId}`)
  for (const table of REALTIME_TABLES) {
    realtimeChannel = realtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      scheduleRefresh,
    )
  }

  realtimeChannel.subscribe()
  activeAccessToken = accessToken
}

async function watchSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('pantrypal.session') || 'null')
    const accessToken = session?.access_token || null
    const userId = session?.user?.id || null
    if (!accessToken || !userId) {
      activeAccessToken = null
      if (realtimeChannel && realtimeClient) {
        await realtimeClient.removeChannel(realtimeChannel)
        realtimeChannel = null
      }
      return
    }
    if (accessToken !== activeAccessToken) await subscribe(accessToken, userId)
  } catch {
    // The main app owns authentication errors; realtime should fail quietly.
  }
}

watchSession()
setInterval(watchSession, POLL_MS)
