import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorStats, getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getRecentIncidents } from '@/lib/db/incidents'
import { getRecentCheckResultsByOrg, getRecentCheckResultsByMonitorIds } from '@/lib/db/check-results'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/v1/dashboard/stats?workspaceId=<id>
 * Returns dashboard stat cards, recent incidents, and check results.
 * If workspaceId is provided, data is scoped to that workspace.
 * If workspaceId is omitted, returns org-wide aggregate data.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') ?? undefined

    const [stats, incidents] = await Promise.all([
      getMonitorStats(user.org_id, workspaceId),
      getRecentIncidents(user.org_id, 5, workspaceId),
    ])

    let checkResults
    if (workspaceId) {
      const monitors = await getMonitorsByWorkspace(workspaceId)
      const monitorIds = monitors.map(m => m.id)
      checkResults = await getRecentCheckResultsByMonitorIds(monitorIds, 30)
    } else {
      checkResults = await getRecentCheckResultsByOrg(user.org_id, 30)
    }

    return NextResponse.json({ success: true, stats, incidents, checkResults })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Dashboard stats API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
