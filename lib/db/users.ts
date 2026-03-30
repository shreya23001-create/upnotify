import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { User, Organisation } from '@/lib/types'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) {
    logger.error('Failed to get current user', { error: error.message })
    return null
  }
  return data
}

export async function getUserProfile(): Promise<{ user: User; organisation: Organisation } | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    logger.error('Failed to get user profile', { error: userError?.message })
    return null
  }

  const { data: organisation, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', user.org_id)
    .single()

  if (orgError || !organisation) {
    logger.error('Failed to get user organisation', { error: orgError?.message })
    return null
  }

  return { user, organisation }
}

export async function getUsersByOrg(orgId: string): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get users by org', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string }
): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update user profile', { error: error.message })
    return null
  }
  return data
}
