import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamInvite {
  id: string
  org_id: string
  email: string
  role: string
  invited_by: string
  token: string
  status: string
  created_at: string
  expires_at: string
  accepted_at: string | null
}

interface InviteResult {
  success: boolean
  error?: string
  invite?: TeamInvite
}

interface MutationResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Create invite
// ---------------------------------------------------------------------------

/**
 * Creates a pending invite in team_invites.
 * Does NOT insert into the users table — that happens when the invite
 * is accepted and the user has a real Supabase Auth account.
 */
export async function createTeamInvite(
  orgId: string,
  email: string,
  role: 'member' | 'admin',
  invitedBy: string
): Promise<InviteResult> {
  const supabase = createAdminClient()

  // Check if this email already has a pending invite for this org
  const { data: existing } = await supabase
    .from('team_invites')
    .select('id, status')
    .eq('org_id', orgId)
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return { success: false, error: 'An invite has already been sent to this email.' }
    }
    // If previously cancelled or expired, delete old and create fresh
    await supabase.from('team_invites').delete().eq('id', existing.id)
  }

  // Check if user is already a member of this org
  const { data: existingMember } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('org_id', orgId)
    .single()

  if (existingMember) {
    return { success: false, error: 'This user is already a member of your organisation.' }
  }

  const { data: invite, error } = await supabase
    .from('team_invites')
    .insert({
      org_id: orgId,
      email,
      role,
      invited_by: invitedBy,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create team invite', {
      error: error.message,
      orgId,
      email,
    })
    return { success: false, error: 'Failed to create invite. Please try again.' }
  }

  return { success: true, invite: invite as TeamInvite }
}

// ---------------------------------------------------------------------------
// Cancel invite
// ---------------------------------------------------------------------------

/**
 * Cancels a pending invite by setting its status to 'cancelled'.
 */
export async function cancelTeamInvite(
  orgId: string,
  inviteId: string
): Promise<MutationResult> {
  const supabase = createAdminClient()

  const { data: invite } = await supabase
    .from('team_invites')
    .select('id, status')
    .eq('id', inviteId)
    .eq('org_id', orgId)
    .single()

  if (!invite) {
    return { success: false, error: 'Invite not found.' }
  }

  if (invite.status !== 'pending') {
    return { success: false, error: 'Only pending invites can be cancelled.' }
  }

  const { error } = await supabase
    .from('team_invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to cancel team invite', {
      error: error.message,
      orgId,
      inviteId,
    })
    return { success: false, error: 'Failed to cancel invite. Please try again.' }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Get pending invites
// ---------------------------------------------------------------------------

/**
 * Returns all pending (non-expired) invites for an organisation.
 */
export async function getOrgInvites(orgId: string): Promise<TeamInvite[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get org invites', {
      error: error.message,
      orgId,
    })
    return []
  }

  return (data ?? []) as TeamInvite[]
}

// ---------------------------------------------------------------------------
// Get invite by token (for accept page)
// ---------------------------------------------------------------------------

/**
 * Looks up an invite by its unique token.
 * Returns null if not found, expired, or not pending.
 */
export async function getInviteByToken(token: string): Promise<(TeamInvite & { org_name?: string }) | null> {
  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !invite) {
    return null
  }

  // Fetch org name for display
  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', invite.org_id)
    .single()

  return {
    ...(invite as TeamInvite),
    org_name: org?.name ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Accept invite
// ---------------------------------------------------------------------------

/**
 * Accepts a pending invite.
 * The accepting user must already exist in Supabase Auth (have a real UUID).
 * Updates the user's org_id and role, then marks the invite as accepted.
 */
export async function acceptTeamInvite(
  token: string,
  userId: string,
  userEmail: string
): Promise<MutationResult> {
  const supabase = createAdminClient()

  // Find the invite
  const { data: invite, error: findError } = await supabase
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString())
    .single()

  if (findError || !invite) {
    return { success: false, error: 'Invite not found, expired, or already used.' }
  }

  // Verify the accepting user's email matches the invite
  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      success: false,
      error: 'This invite was sent to a different email address. Please sign in with the correct account.',
    }
  }

  // Block if user already belongs to any organisation (one user = one org)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, org_id')
    .eq('id', userId)
    .single()

  if (existingUser?.org_id && existingUser.org_id !== invite.org_id) {
    return {
      success: false,
      error: 'You already belong to another organisation. Please leave that organisation first before accepting this invite.',
    }
  }

  // Update the user's org_id and role
  const { error: updateError } = await supabase
    .from('users')
    .update({
      org_id: invite.org_id,
      role: invite.role,
    })
    .eq('id', userId)

  if (updateError) {
    logger.error('Failed to update user org during invite accept', {
      error: updateError.message,
      userId,
      orgId: invite.org_id,
    })
    return { success: false, error: 'Failed to join organisation. Please try again.' }
  }

  // Mark invite as accepted
  const { error: acceptError } = await supabase
    .from('team_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  if (acceptError) {
    logger.error('Failed to mark invite as accepted', {
      error: acceptError.message,
      inviteId: invite.id,
    })
    // User was already added — don't fail the whole flow
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Remove team member
// ---------------------------------------------------------------------------

/**
 * Removes a user from an organisation.
 * Sets their org_id to null so they lose access immediately.
 * Does NOT delete the Supabase Auth account.
 */
export async function removeTeamMember(
  orgId: string,
  userId: string,
  requestingUserId: string
): Promise<MutationResult> {
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
    logger.error('Failed to remove team member', {
      error: error.message,
      orgId,
      userId,
    })
    return { success: false, error: 'Failed to remove team member. Please try again.' }
  }

  return { success: true }
}
