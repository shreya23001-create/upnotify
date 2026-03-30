import { createBrowserClient } from '@supabase/ssr'
import { getConfig } from '@/lib/utils/config'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  const config = getConfig()
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.anonKey
  )
}
