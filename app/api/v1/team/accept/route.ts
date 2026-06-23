import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { acceptTeamInvite, getInviteByToken } from '@/lib/db/team'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/v1/team/accept — Accept a team invite
 * Requires authenticated user. Token passed in body.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as { token: string }
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invite token is required.' },
        { status: 400 }
      )
    }

    // Re-check limit against the TARGET org at accept time (TOCTOU fix).
    // The invite was created when the org had capacity, but the plan may have
    // changed or other invites may have been accepted since.
    const invite = await getInviteByToken(token)
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found, expired, or already used.' },
        { status: 400 }
      )
    }
    const limitCheck = await checkTeamMemberLimit(invite.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'This organisation has reached its team member limit. Ask the owner to upgrade their plan.' },
        { status: 403 }
      )
    }

    const result = await acceptTeamInvite(token, user.id, user.email ?? '')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'team.invite_accepted',
      resourceType: 'team_invite',
      metadata: { email: user.email },
    })

    logger.info('Team invite accepted', {
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team accept API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
