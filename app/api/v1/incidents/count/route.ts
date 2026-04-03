import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getOpenIncidentCount } from '@/lib/db/incidents'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/v1/incidents/count
 * Returns the number of open (unresolved) incidents for the current user's org.
 * Used by the sidebar badge to show active incident count.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const count = await getOpenIncidentCount(user.org_id)

    return NextResponse.json({ success: true, count })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Incidents count API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
