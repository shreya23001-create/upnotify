/**
 * Admin DB queries for the ai_profile_prompts library.
 * Public reads use getActiveProfilePrompts in lib/db/ai-profile.ts —
 * this file is for the admin UI only (super-admin gated).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { ProfilePrompt } from '@/lib/db/ai-profile'

// Tables added in migration 00105 — types not yet regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export async function getAllProfilePromptsAdmin(): Promise<ProfilePrompt[]> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_prompts')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('getAllProfilePromptsAdmin failed', { error: error.message })
    return []
  }
  return (data ?? []) as ProfilePrompt[]
}

export async function getProfilePromptById(id: string): Promise<ProfilePrompt | null> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_prompts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('getProfilePromptById failed', { error: error.message, id })
    return null
  }
  return data as ProfilePrompt
}

export async function createProfilePrompt(input: {
  prompt_text: string
  sort_order:  number
  is_active:   boolean
  admin_notes: string | null
}): Promise<ProfilePrompt | null> {
  const supabase = createAdminClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_prompts')
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) {
    logger.error('createProfilePrompt failed', { error: error.message })
    return null
  }
  return data as ProfilePrompt
}

export async function updateProfilePrompt(
  id: string,
  patch: Partial<{ prompt_text: string; sort_order: number; is_active: boolean; admin_notes: string | null }>,
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { error } = await supabase
    .from('ai_profile_prompts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('updateProfilePrompt failed', { error: error.message, id })
    return false
  }
  return true
}

export async function deleteProfilePrompt(id: string): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { error } = await supabase
    .from('ai_profile_prompts')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('deleteProfilePrompt failed', { error: error.message, id })
    return false
  }
  return true
}
