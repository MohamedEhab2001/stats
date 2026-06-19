import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY — falling back to local-only mode.')
}

export const supabase = url && key ? createClient(url, key, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } }
}) : null

export const isConfigured = !!supabase
