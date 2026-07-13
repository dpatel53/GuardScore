import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-only client that bypasses Row Level Security using the service
// role key. Never import this from a Client Component or expose the key
// to the browser. Used by the cron endpoint and the Stripe webhook, which
// run with no logged-in user session to scope queries to.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set SUPABASE_SERVICE_ROLE_KEY in your environment (Supabase dashboard > Settings > API).',
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
