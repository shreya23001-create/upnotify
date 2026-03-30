import { createClient } from '@supabase/supabase-js'
import { getServerConfig } from '@/lib/utils/config'
import type { Database } from '@/lib/types/database.types'

export function createAdminClient() {
  const config = getServerConfig()
  return createClient<Database>(
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
