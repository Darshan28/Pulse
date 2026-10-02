import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ''
  )
}

export function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim() || ''
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

/** Server-side client for verifying presenter JWTs. Never use the service role in the browser. */
export function getSupabaseAuthClient() {
  if (client) return client

  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  if (!url || !anonKey) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_ equivalents). Configure Supabase Auth before verifying real presenter JWTs.',
    )
  }

  client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
  return client
}
