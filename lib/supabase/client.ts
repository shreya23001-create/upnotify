import { createBrowserClient } from '@supabase/ssr'
import { getConfig } from '@/lib/utils/config'

export function createClient() {
  const config = getConfig()
  return createBrowserClient(
    config.supabase.url,
    config.supabase.anonKey
  )
}
