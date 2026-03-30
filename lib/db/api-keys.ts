import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { ApiKey } from '@/lib/types'

export async function getApiKeysByOrg(orgId: string): Promise<ApiKey[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_revoked', false)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get API keys', { error: error.message })
    return []
  }
  return data ?? []
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .update({ is_revoked: true })
    .eq('id', keyId)

  if (error) {
    logger.error('Failed to revoke API key', { error: error.message })
    return false
  }
  return true
}
