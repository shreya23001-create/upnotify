import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorStats } from '@/lib/db/monitors'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/v1/monitors/count
 * Returns the number of distinct websites monitored for the current user's
 * org. Used by the sidebar badge to show website count.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const stats = await getMonitorStats(user.org_id)

    return NextResponse.json({ success: true, count: stats.websites })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Monitors count API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
