import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getInviteByToken } from '@/lib/db/team'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/v1/team/invite-details?token=xxx
 * Returns invite details for the accept page.
 * Returns 401 if user is not authenticated (so the page can redirect to signup).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 })
    }

    const invite = await getInviteByToken(token)

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found, expired, or already used.' },
        { status: 404 }
      )
    }

    // Only return safe fields — never expose the token in the response
    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        org_name: invite.org_name,
        expires_at: invite.expires_at,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Invite details API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
