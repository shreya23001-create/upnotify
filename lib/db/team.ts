import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { User } from '@/lib/types'

/**
 * Add a user to an organisation by email.
 * For MVP: if the user already exists in the users table, update their org_id.
 * If not, create a placeholder row so they see the org when they sign up / log in.
 */
export async function addTeamMember(
  orgId: string,
  email: string,
  role: 'member' | 'admin'
): Promise<{ success: boolean; error?: string; user?: User }> {
  const supabase = createAdminClient()

  // Check if already a member of this org
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, org_id')
    .eq('email', email)
    .eq('org_id', orgId)
    .single()

  if (existing) {
    return { success: false, error: 'This user is already a member of your organisation.' }
  }

  // Check if user exists but in a different org
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, org_id')
    .eq('email', email)
    .single()

  if (existingUser) {
    // User exists but in another org — for MVP we cannot move them
    return { success: false, error: 'This user already belongs to another organisation.' }
  }

  // User does not exist yet — create a placeholder record with a generated UUID
  // When they sign up via Supabase Auth, the auth trigger should update this record
  const placeholderId = crypto.randomUUID()
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: placeholderId,
      email,
      org_id: orgId,
      role,
      full_name: null,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to add team member', { error: error.message, orgId, email })
    return { success: false, error: 'Failed to add team member. Please try again.' }
  }

  return { success: true, user: newUser as User }
}

/**
 * Remove a user from an organisation.
 * Deletes the user row — they lose access immediately.
 */
export async function removeTeamMember(
  orgId: string,
  userId: string,
  requestingUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (userId === requestingUserId) {
    return { success: false, error: 'You cannot remove yourself from the organisation.' }
  }

  const supabase = createAdminClient()

  // Verify user belongs to this org
  const { data: member } = await supabase
    .from('users')
    .select('id, org_id, role')
    .eq('id', userId)
    .eq('org_id', orgId)
    .single()

  if (!member) {
    return { success: false, error: 'User not found in this organisation.' }
  }

  if (member.role === 'owner') {
    return { success: false, error: 'Cannot remove the organisation owner.' }
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to remove team member', { error: error.message, orgId, userId })
    return { success: false, error: 'Failed to remove team member. Please try again.' }
  }

  return { success: true }
}
