import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/utils/config'

export async function createClient() {
  const config = getConfig()
  const cookieStore = await cookies()

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
