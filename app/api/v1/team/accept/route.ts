import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { acceptTeamInvite } from '@/lib/db/team'
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
