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

/**
 * The team-invite vocabulary ('member' | 'admin') differs from the users.role
 * CHECK constraint, which only permits 'admin' | 'manager' | 'viewer' | 'client'
 * (migration 00002_core_tenancy.sql). Writing role='member' straight from an
 * invite violates that constraint and fails the accept with a 400
 * ("Failed to join organisation"). Map to a valid users.role:
 *   - 'admin'  → 'admin'  (full access)
 *   - 'member' → 'viewer' (matches the auth-trigger default for invited users
 *                          in 00079; least-privilege read access)
 */
export function inviteRoleToUserRole(inviteRole: string): 'admin' | 'viewer' {
  return inviteRole === 'admin' ? 'admin' : 'viewer'
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
/** All invites ever sent for this org, most recent first — includes
 *  pending, accepted, and cancelled, so the Team settings page can show a
 *  full "who did we invite and what happened" history rather than only
 *  ever-currently-pending invites. */
export async function getOrgInvites(orgId: string): Promise<TeamInvite[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('org_id', orgId)
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

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, org_id')
    .eq('id', userId)
    .single()

  // Save original org before switching (so user can switch back later)
  if (existingUser?.org_id && existingUser.org_id !== invite.org_id) {
    // Only set original_org_id if not already set (first switch)
    const { data: userData } = await supabase
      .from('users')
      .select('original_org_id')
      .eq('id', userId)
      .single()

    if (!userData?.original_org_id) {
      await supabase
        .from('users')
        .update({ original_org_id: existingUser.org_id })
        .eq('id', userId)
    }
  }

  // Update the user's org_id and role. Map the invite role to a valid
  // users.role value — 'member' is not permitted by the users.role CHECK
  // constraint and would fail the whole accept with a 400.
  const { error: updateError } = await supabase
    .from('users')
    .update({
      org_id: invite.org_id,
      role: inviteRoleToUserRole(invite.role),
    })
    .eq('id', userId)

  // Update workspace to the default workspace of the new org
  const { data: defaultWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', invite.org_id)
    .limit(1)
    .single()

  if (defaultWorkspace) {
    await supabase
      .from('users')
      .update({ workspace_id: defaultWorkspace.id })
      .eq('id', userId)
  }

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

// ---------------------------------------------------------------------------
// Admin-created member (direct account creation, not invite-link based)
// ---------------------------------------------------------------------------

interface CreateMemberResult {
  success: boolean
  error?: string
  userId?: string
}

/**
 * Creates a real Supabase Auth user directly (admin sets the password) and
 * places them straight into the inviting org, then applies the requested
 * per-tab access restriction. Unlike the invite-link flow, this passes
 * org_id/workspace_id/role in the new auth user's metadata BEFORE the
 * `on_auth_user_created` trigger fires (00009_auth_trigger.sql), so the
 * trigger's own "invited user: join existing org" branch runs immediately —
 * no create-then-patch step, no risk of the account landing in a separate
 * solo org (the failure mode documented for the invite-link flow).
 */
export async function createTeamMemberDirectly(params: {
  orgId: string
  name: string
  email: string
  password: string
  role: 'admin' | 'member'
  tabAccess: string[] | null
}): Promise<CreateMemberResult> {
  const supabase = createAdminClient()
  const email = params.email.toLowerCase().trim()

  const { data: existingMember } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('org_id', params.orgId)
    .single()

  if (existingMember) {
    return { success: false, error: 'This user is already a member of your organisation.' }
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', params.orgId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!workspace) {
    return { success: false, error: 'No workspace found for this organisation.' }
  }

  const userRole = inviteRoleToUserRole(params.role)

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.name,
      org_id: params.orgId,
      workspace_id: workspace.id,
      role: userRole,
    },
  })

  if (createError || !created.user) {
    logger.error('Failed to create team member auth account', {
      error: createError?.message,
      orgId: params.orgId,
      email,
    })
    if (createError?.message?.toLowerCase().includes('already') || createError?.message?.toLowerCase().includes('registered')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: 'Failed to create the account. Please try again.' }
  }

  // The trigger has already inserted the users row with the right org/role.
  // Apply the requested tab restriction as a follow-up update — the trigger
  // itself doesn't know about tab_access.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({ tab_access: params.tabAccess })
    .eq('id', created.user.id)

  if (updateError) {
    logger.error('Failed to set tab_access for new team member', {
      error: updateError.message,
      userId: created.user.id,
    })
    // Non-fatal — the account exists and works, just unrestricted for now.
  }

  return { success: true, userId: created.user.id }
}

/**
 * Updates an existing member's role and/or tab access. Does not touch
 * password or email — this is for the "Edit" action on an already-created
 * member, not account recovery.
 */
export async function updateTeamMemberAccess(
  orgId: string,
  userId: string,
  updates: { role: 'admin' | 'member'; tabAccess: string[] | null }
): Promise<MutationResult> {
  const supabase = createAdminClient()

  const { data: member } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .eq('org_id', orgId)
    .single()

  if (!member) {
    return { success: false, error: 'User not found in this organisation.' }
  }

  const userRole = inviteRoleToUserRole(updates.role)
  const tabAccess = updates.role === 'admin' ? null : updates.tabAccess

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ role: userRole, tab_access: tabAccess })
    .eq('id', userId)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to update team member access', {
      error: error.message,
      orgId,
      userId,
    })
    return { success: false, error: 'Failed to update member. Please try again.' }
  }

  return { success: true }
}
