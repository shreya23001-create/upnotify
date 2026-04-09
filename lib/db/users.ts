import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getImpersonatedUserId } from '@/lib/utils/impersonation'
import type { User, Organisation } from '@/lib/types'

/** User with optional impersonation metadata */
export interface ImpersonatedUser extends User {
  _impersonatedBy?: string
  _impersonatedByEmail?: string
}

export async function getCurrentUser(): Promise<ImpersonatedUser | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  // Check for active impersonation session
  const impersonateId = await getImpersonatedUserId()

  if (impersonateId) {
    // Verify the real user is a super admin before allowing impersonation
    const { data: realUser, error: realError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (realError) {
      logger.error('Failed to get real user during impersonation check', { error: realError.message })
      return null
    }

    if (realUser?.is_super_admin) {
      // Use admin client to bypass RLS and load the impersonated user
      const adminClient = createAdminClient()
      const { data: impersonatedUser, error: impError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', impersonateId)
        .single()

      if (impError) {
        logger.error('Failed to load impersonated user', { error: impError.message, impersonateId })
        return null
      }

      if (impersonatedUser) {
        return {
          ...impersonatedUser,
          _impersonatedBy: authUser.id,
          _impersonatedByEmail: realUser.email,
        } as ImpersonatedUser
      }
    }
  }

  // Normal flow — no impersonation
  // Try RLS-scoped client first, fall back to admin client if RLS blocks
  // (happens after accepting a team invite — org_id changed via admin client
  //  but Supabase session RLS functions still return old org_id)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (data) return data

  // RLS blocked — use admin client
  if (error) {
    logger.warn('RLS blocked user fetch, using admin client fallback', { userId: authUser.id, error: error.message })
    const adminClient = createAdminClient()
    const { data: adminData, error: adminError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (adminError) {
      logger.error('Failed to get current user (admin fallback)', { error: adminError.message })
      return null
    }
    return adminData
  }

  return null
}

export async function getUserProfile(): Promise<{ user: ImpersonatedUser; organisation: Organisation; isImpersonating: boolean } | null> {
  // getCurrentUser already handles impersonation
  const user = await getCurrentUser()
  if (!user) return null

  const isImpersonation = '_impersonatedBy' in user && Boolean(user._impersonatedBy)

  // When impersonating, use admin client to load the org (bypasses RLS)
  if (isImpersonation) {
    const adminClient = createAdminClient()
    const { data: organisation, error: orgError } = await adminClient
      .from('organisations')
      .select('*')
      .eq('id', user.org_id)
      .single()

    if (orgError || !organisation) {
      logger.error('Failed to get impersonated user organisation', { error: orgError?.message })
      return null
    }

    return { user, organisation, isImpersonating: true }
  }

  // Normal flow — try user client first, fall back to admin client if RLS blocks
  // (can happen right after accepting a team invite — session may not reflect new org yet)
  const supabase = await createClient()
  let organisation: Organisation | null = null

  const { data: orgData, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', user.org_id)
    .single()

  if (orgData) {
    organisation = orgData
  } else {
    // RLS may block — use admin client as fallback
    logger.warn('RLS blocked org fetch, using admin client', { orgId: user.org_id, error: orgError?.message })
    const adminClient = createAdminClient()
    const { data: adminOrgData } = await adminClient
      .from('organisations')
      .select('*')
      .eq('id', user.org_id)
      .single()
    organisation = adminOrgData
  }

  if (!organisation) {
    logger.error('Failed to get user organisation', { orgId: user.org_id })
    return null
  }

  return { user, organisation, isImpersonating: false }
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    logger.error('getUserById failed', { error: error.message, userId })
    return null
  }
  return data ?? null
}

export async function getUsersByOrg(orgId: string): Promise<User[]> {
  // Include users whose current org_id matches AND users who accepted an invite
  // into this org but have since switched back (original_org_id = orgId while org_id = invited org).
  // Using admin client to avoid RLS blocking cross-org queries.
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`org_id.eq.${orgId},and(original_org_id.eq.${orgId},org_id.neq.${orgId})`)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get users by org', { error: error.message })
    return []
  }
  // Deduplicate by id (safety net)
  const seen = new Set<string>()
  return (data ?? []).filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true })
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
