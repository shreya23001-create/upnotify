import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { addTeamMember, removeTeamMember } from '@/lib/db/team'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { logger } from '@/lib/utils/logger'

interface InviteRequestBody {
  email: string
  role: 'member' | 'admin'
}

interface RemoveRequestBody {
  userId: string
}

/**
 * POST /api/v1/team — Invite a new team member
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only owners and admins can invite
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to invite team members.' }, { status: 403 })
    }

    const body = (await request.json()) as InviteRequestBody
    const { email, role } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be "member" or "admin".' }, { status: 400 })
    }

    // Enforce plan limit
    const limitCheck = await checkTeamMemberLimit(user.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: `Team member limit reached (${limitCheck.currentCount - 1}/${limitCheck.limit}). Upgrade your plan to add more members.`,
      }, { status: 403 })
    }

    const result = await addTeamMember(user.org_id, email.toLowerCase().trim(), role)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    logger.info('Team member invited', { orgId: user.org_id, email, role })

    return NextResponse.json({ success: true, user: result.user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team invite API error', { error: message })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/team — Remove a team member
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only owners and admins can remove
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to remove team members.' }, { status: 403 })
    }

    const body = (await request.json()) as RemoveRequestBody
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    const result = await removeTeamMember(user.org_id, userId, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    logger.info('Team member removed', { orgId: user.org_id, removedUserId: userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Team remove API error', { error: message })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
