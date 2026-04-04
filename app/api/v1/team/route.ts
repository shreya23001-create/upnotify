import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import {
  createTeamInvite,
  cancelTeamInvite,
  getOrgInvites,
  removeTeamMember,
} from '@/lib/db/team'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { sendTeamInviteEmail } from '@/lib/services/email'
import { writeAuditLog } from '@/lib/db/audit'
import { getServerConfig } from '@/lib/utils/config'
import { sendUserMessage } from '@/lib/db/user-messages'
import { logger } from '@/lib/utils/logger'

interface InviteRequestBody {
  email: string
  role: 'member' | 'admin'
}

interface CancelInviteRequestBody {
  inviteId: string
}

interface RemoveMemberRequestBody {
  userId: string
}

type DeleteRequestBody = CancelInviteRequestBody | RemoveMemberRequestBody

// ---------------------------------------------------------------------------
// GET /api/v1/team — List team members + pending invites
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const invites = await getOrgInvites(user.org_id)

    return NextResponse.json({ success: true, invites })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team GET API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/team — Create an invite and send email
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canManageTeam =
      user.role === 'owner' || user.role === 'admin' || user.is_super_admin
    if (!canManageTeam) {
      return NextResponse.json(
        { error: 'You do not have permission to invite team members.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as InviteRequestBody
    const { email, role } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Role must be "member" or "admin".' },
        { status: 400 }
      )
    }

    // Enforce plan limit
    const limitCheck = await checkTeamMemberLimit(user.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Team member limit reached (${limitCheck.currentCount - 1}/${limitCheck.limit}). Upgrade your plan to add more members.`,
        },
        { status: 403 }
      )
    }

    const trimmedEmail = email.toLowerCase().trim()
    const result = await createTeamInvite(
      user.org_id,
      trimmedEmail,
      role,
      user.id
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send invite email
    const config = getServerConfig()
    const acceptUrl = `${config.app.url}/invite/accept?token=${result.invite?.token ?? ''}`
    const inviterName = user.full_name ?? user.email ?? 'A team member'

    // Fetch org name for the email
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', user.org_id)
      .single()

    const orgName = org?.name ?? 'your organisation'

    await sendTeamInviteEmail({
      to: trimmedEmail,
      orgName,
      inviterName,
      role,
      acceptUrl,
    })

    // Send in-app notification if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', trimmedEmail)
      .single()

    if (existingUser) {
      await sendUserMessage({
        userId: existingUser.id,
        title: `Team Invite from ${orgName}`,
        body: `${inviterName} has invited you to join ${orgName} as a ${role}. Click below to accept.`,
        type: 'info',
        category: 'general',
        actionUrl: acceptUrl,
        actionLabel: 'Accept Invite',
      })
    }

    // Audit log
    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'team.invite_created',
      resourceType: 'team_invite',
      resourceId: result.invite?.id,
      metadata: { email: trimmedEmail, role },
    })

    logger.info('Team invite created and email sent', {
      orgId: user.org_id,
      email: trimmedEmail,
      role,
    })

    return NextResponse.json({ success: true, invite: result.invite })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team invite API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/team — Cancel a pending invite OR remove a member
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canManageTeam =
      user.role === 'owner' || user.role === 'admin' || user.is_super_admin
    if (!canManageTeam) {
      return NextResponse.json(
        { error: 'You do not have permission to manage team members.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as DeleteRequestBody

    // Cancel a pending invite
    if ('inviteId' in body && body.inviteId) {
      const result = await cancelTeamInvite(user.org_id, body.inviteId)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      await writeAuditLog({
        orgId: user.org_id,
        userId: user.id,
        action: 'team.invite_cancelled',
        resourceType: 'team_invite',
        resourceId: body.inviteId,
      })

      logger.info('Team invite cancelled', {
        orgId: user.org_id,
        inviteId: body.inviteId,
      })

      return NextResponse.json({ success: true })
    }

    // Remove an existing member
    if ('userId' in body && body.userId) {
      const result = await removeTeamMember(
        user.org_id,
        body.userId,
        user.id
      )
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      await writeAuditLog({
        orgId: user.org_id,
        userId: user.id,
        action: 'team.member_removed',
        resourceType: 'user',
        resourceId: body.userId,
      })

      logger.info('Team member removed', {
        orgId: user.org_id,
        removedUserId: body.userId,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Either inviteId or userId is required.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team delete API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
