/**
 * DB queries for AI engine registry and key pool management.
 * Key decryption happens here — never in pages or API routes directly.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptValue, decryptValue, type EncryptedValue } from '@/lib/utils/encryption'
import { logger } from '@/lib/utils/logger'

// New tables added in migration 00054 — not yet in generated Supabase types.
// Cast to any until types are regenerated after migration runs on the DB.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export interface AiEngine {
  id:             string
  name:           string
  slug:           string
  description:    string
  logo_url:       string | null
  type:           'llms_txt' | 'citation' | 'both'
  is_free:        boolean
  is_active:      boolean
  signal_quality: 'high' | 'medium' | 'indicative'
  signal_note:    string
  sort_order:     number
  admin_notes:    string | null
  created_at:     string
  updated_at:     string
}

export interface AiEngineKey {
  id:            string
  engine_id:     string
  label:         string
  monthly_limit: number
  current_usage: number
  reset_date:    string
  is_active:     boolean
  last_used_at:  string | null
  created_at:    string
  masked_key?:   string // populated on admin read, never the real key
}

// ---------------------------------------------------------------------------
// Public — active engines (no keys, name/description only)
// ---------------------------------------------------------------------------
export async function getActiveEngines(): Promise<AiEngine[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_engines')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('getActiveEngines failed', { error: error.message })
    return []
  }
  return (data ?? []) as AiEngine[]
}

export async function getEnginesByType(type: 'llms_txt' | 'citation' | 'both'): Promise<AiEngine[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_engines')
    .select('*')
    .eq('is_active', true)
    .in('type', type === 'both' ? ['llms_txt', 'citation', 'both'] : [type, 'both'])
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('getEnginesByType failed', { error: error.message, type })
    return []
  }
  return (data ?? []) as AiEngine[]
}

// ---------------------------------------------------------------------------
// Admin — full engine management
// ---------------------------------------------------------------------------
export async function getAllEnginesAdmin(): Promise<AiEngine[]> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_engines')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('getAllEnginesAdmin failed', { error: error.message })
    return []
  }
  return (data ?? []) as AiEngine[]
}

export async function createEngine(input: Omit<AiEngine, 'id' | 'created_at' | 'updated_at'>): Promise<AiEngine | null> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_engines')
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) {
    logger.error('createEngine failed', { error: error.message })
    return null
  }
  return data as AiEngine
}

export async function updateEngine(id: string, input: Partial<AiEngine>): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { error } = await supabase
    .from('ai_engines')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('updateEngine failed', { error: error.message, id })
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Admin — key pool management
// ---------------------------------------------------------------------------
export async function getEngineKeys(engineId: string): Promise<AiEngineKey[]> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_engine_keys')
    .select('id, engine_id, label, monthly_limit, current_usage, reset_date, is_active, last_used_at, created_at')
    .eq('engine_id', engineId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('getEngineKeys failed', { error: error.message, engineId })
    return []
  }
  return (data ?? []) as AiEngineKey[]
}

export async function addEngineKey(engineId: string, label: string, plainKey: string, monthlyLimit: number): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { encrypted, iv, tag } = encryptValue(plainKey)

  const { error } = await supabase
    .from('ai_engine_keys')
    .insert({
      engine_id:     engineId,
      label,
      encrypted_key: encrypted,
      key_iv:        iv,
      key_tag:       tag,
      monthly_limit: monthlyLimit,
      current_usage: 0,
      reset_date:    getNextMonthReset(),
    })

  if (error) {
    logger.error('addEngineKey failed', { error: error.message, engineId })
    return false
  }
  return true
}

export async function deleteEngineKey(keyId: string): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { error } = await supabase
    .from('ai_engine_keys')
    .delete()
    .eq('id', keyId)

  if (error) {
    logger.error('deleteEngineKey failed', { error: error.message, keyId })
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Key rotation — pick the best available key for an engine
// Returns the decrypted key string, increments usage counter
// ---------------------------------------------------------------------------
export async function acquireEngineKey(engineId: string): Promise<string | null> {
  const supabase = createAdminClient() as AnySupabase

  // Reset expired monthly counters first
  await supabase
    .from('ai_engine_keys')
    .update({ current_usage: 0, reset_date: getNextMonthReset() })
    .eq('engine_id', engineId)
    .lt('reset_date', new Date().toISOString())

  // Pick the active key with lowest usage that's under its limit
  const { data, error } = await supabase
    .from('ai_engine_keys')
    .select('id, encrypted_key, key_iv, key_tag, current_usage, monthly_limit')
    .eq('engine_id', engineId)
    .eq('is_active', true)
    .filter('current_usage', 'lt', supabase.from('ai_engine_keys').select('monthly_limit'))
    .order('current_usage', { ascending: true })
    .limit(1)

  // Fallback: manual filter if the above doesn't work
  if (error || !data?.length) {
    const { data: allKeys } = await supabase
      .from('ai_engine_keys')
      .select('id, encrypted_key, key_iv, key_tag, current_usage, monthly_limit')
      .eq('engine_id', engineId)
      .eq('is_active', true)
      .order('current_usage', { ascending: true })

    type RawKey = { id: string; encrypted_key: string; key_iv: string; key_tag: string; current_usage: number; monthly_limit: number }
    const available = (allKeys ?? [] as RawKey[]).find((k: RawKey) => k.current_usage < k.monthly_limit) as RawKey | undefined
    if (!available) {
      logger.error('acquireEngineKey: no keys available', { engineId })
      return null
    }

    // Increment usage
    await supabase
      .from('ai_engine_keys')
      .update({ current_usage: available.current_usage + 1, last_used_at: new Date().toISOString() })
      .eq('id', available.id)

    return decryptValue({
      encrypted: available.encrypted_key,
      iv:        available.key_iv,
      tag:       available.key_tag,
    } as EncryptedValue)
  }

  const key = data[0]
  await supabase
    .from('ai_engine_keys')
    .update({ current_usage: key.current_usage + 1, last_used_at: new Date().toISOString() })
    .eq('id', key.id)

  return decryptValue({
    encrypted: key.encrypted_key,
    iv:        key.key_iv,
    tag:       key.key_tag,
  } as EncryptedValue)
}

function getNextMonthReset(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
}
