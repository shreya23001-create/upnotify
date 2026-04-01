import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { ApiKey } from '@/lib/types'

/**
 * Hash a raw API key using SHA-256 for comparison against stored key_hash.
 * API keys are high-entropy random strings so SHA-256 is appropriate
 * (unlike passwords which need bcrypt).
 */
function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

/**
 * Validate a raw API key against the api_keys table.
 * Uses the key_prefix for fast lookup, then compares the full SHA-256 hash.
 * Returns the matching ApiKey row if valid, or null if invalid/revoked/expired.
 *
 * Uses admin client because this runs in unauthenticated webhook context.
 */
export async function validateApiKey(rawKey: string): Promise<ApiKey | null> {
  if (!rawKey || rawKey.length < 8) {
    return null
  }

  const prefix = rawKey.substring(0, 8)
  const keyHash = hashApiKey(rawKey)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('key_hash', keyHash)
    .eq('is_revoked', false)
    .single()

  if (error || !data) {
    logger.warn('API key validation failed', { prefix })
    return null
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    logger.warn('API key expired', { prefix, keyId: data.id })
    return null
  }

  // Update last_used_at timestamp (fire-and-forget, non-blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then()

  return data
}

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
