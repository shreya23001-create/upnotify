import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/utils/config'
import type { Database } from '@/lib/types/database.types'

export async function createClient() {
  const config = getConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component render, where cookies cannot
            // be set — safe to ignore. proxy.ts already refreshes the
            // session cookie on every request; this is only a best-effort
            // mirror for the (Server Action / Route Handler) contexts
            // where a write is actually possible.
          }
        },
      },
    }
  )
}
