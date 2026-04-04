import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

/**
 * GET /api/admin/monitors
 * Returns paginated monitors across all orgs with org names.
 * Query params: page (default 0), pageSize (default 25), status (all/up/down/degraded)
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25', 10)))
    const statusFilter = url.searchParams.get('status') || 'all'

    const supabase = createAdminClient()

    // Get summary counts
    const [totalResult, upResult, downResult, degradedResult] = await Promise.all([
      supabase.from('monitors').select('id', { count: 'exact', head: true }),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('status', 'up'),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('status', 'down'),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('status', 'degraded'),
    ])

    const summary = {
      total: totalResult.count ?? 0,
      up: upResult.count ?? 0,
      down: downResult.count ?? 0,
      degraded: degradedResult.count ?? 0,
    }

    // Fetch monitors with pagination
    let query = supabase
      .from('monitors')
      .select('id, name, type, status, severity, last_checked_at, org_id, target, config, is_paused')
      .order('last_checked_at', { ascending: false, nullsFirst: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: monitors, error: monitorsError } = await query

    if (monitorsError) {
      logger.error('Admin monitors fetch error', { error: monitorsError.message })
      return NextResponse.json({ error: 'Failed to fetch monitors' }, { status: 500 })
    }

    // Get unique org IDs to look up org names
    const orgIds = [...new Set((monitors ?? []).map(m => m.org_id))]
    let orgMap: Record<string, string> = {}

    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organisations')
        .select('id, name')
        .in('id', orgIds)

      orgMap = (orgs ?? []).reduce((acc, org) => {
        acc[org.id] = org.name
        return acc
      }, {} as Record<string, string>)
    }

    // Get latest check results for response times
    const monitorIds = (monitors ?? []).map(m => m.id)
    let responseTimeMap: Record<string, number | null> = {}

    if (monitorIds.length > 0) {
      const { data: checkResults } = await supabase
        .from('check_results')
        .select('monitor_id, response_time_ms')
        .in('monitor_id', monitorIds)
        .order('checked_at', { ascending: false })
        .limit(monitorIds.length)

      // Keep only the first (most recent) result per monitor
      const seen = new Set<string>()
      for (const cr of checkResults ?? []) {
        if (!seen.has(cr.monitor_id)) {
          seen.add(cr.monitor_id)
          responseTimeMap[cr.monitor_id] = cr.response_time_ms
        }
      }
    }

    const enrichedMonitors = (monitors ?? []).map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      status: m.status,
      severity: m.severity,
      lastCheckedAt: m.last_checked_at,
      orgId: m.org_id,
      orgName: orgMap[m.org_id] || 'Unknown',
      responseTimeMs: responseTimeMap[m.id] ?? null,
      isPaused: m.is_paused,
    }))

    // Get total count for the filtered set
    let totalFiltered = summary.total
    if (statusFilter !== 'all') {
      const key = statusFilter as keyof typeof summary
      totalFiltered = summary[key] ?? summary.total
    }

    return NextResponse.json({
      success: true,
      monitors: enrichedMonitors,
      summary,
      pagination: {
        page,
        pageSize,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / pageSize),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Admin monitors API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
