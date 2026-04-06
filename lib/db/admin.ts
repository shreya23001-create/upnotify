import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Organisation, User, FeatureFlag, Plan } from '@/lib/types'

export interface OrgWithUsers extends Organisation {
  users: { id: string; email: string; full_name: string | null; is_active: boolean }[]
}

export async function getAllOrganisations(search?: string): Promise<OrgWithUsers[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('organisations')
    .select('*, users(id, email, full_name, is_active)')
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) {
    logger.error('Admin: Failed to get organisations', { error: error.message })
    return []
  }
  return (data ?? []) as OrgWithUsers[]
}

export async function getAllUsers(search?: string): Promise<User[]> {
  const supabase = createAdminClient()
  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (search) query = query.ilike('email', `%${search}%`)

  const { data, error } = await query
  if (error) {
    logger.error('Admin: Failed to get users', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    logger.error('Admin: Failed to get feature flags', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updateFeatureFlag(
  id: string,
  updates: { is_enabled?: boolean; rollout_percentage?: number }
): Promise<FeatureFlag | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Admin: Failed to update feature flag', { error: error.message })
    return null
  }
  return data
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    logger.error('Admin: Failed to get plans', { error: error.message })
    return []
  }
  return data ?? []
}
