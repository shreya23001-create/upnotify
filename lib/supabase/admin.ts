import { createClient } from '@supabase/supabase-js'
import { getServerConfig } from '@/lib/utils/config'

export function createAdminClient() {
  const config = getServerConfig()
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
