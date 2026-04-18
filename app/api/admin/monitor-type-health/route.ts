import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export interface MonitorTypeHealth {
  type: string
  totalMonitors: number
  totalChecks: number
  upChecks: number
  downChecks: number
  degradedChecks: number
  failingMonitors: number
  avgResponseMs: number
  uptimePercent: number
  status: 'healthy' | 'warning' | 'critical' | 'no-data'
  topErrors: string[]
}

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function computeMonitorTypeHealth(windowHours: number): Promise<MonitorTypeHealth[]> {
  const supabase = createAdminClient()

  // Fetch all active monitors
  const { data: monitors } = await supabase
    .from('monitors')
    .select('id, type')
    .eq('is_paused', false)

  if (!monitors || monitors.length === 0) return []

  const monitorIdToType = new Map<string, string>()
  const typeMonitorCount = new Map<string, number>()
  for (const m of monitors as { id: string; type: string }[]) {
    monitorIdToType.set(m.id, m.type)
    typeMonitorCount.set(m.type, (typeMonitorCount.get(m.type) ?? 0) + 1)
  }

  // Fetch check results in window
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()
  const { data: checks } = await supabase
    .from('check_results')
    .select('monitor_id, status, response_time_ms, error_message')
    .gte('checked_at', cutoff)
    .limit(50000)

  // Aggregate by type
  interface TypeAgg {
    up: number; down: number; degraded: number
    responseTimes: number[]
    errors: string[]
    failingMonitorIds: Set<string>
  }

  const typeAgg = new Map<string, TypeAgg>()

  for (const c of (checks ?? []) as { monitor_id: string; status: string; response_time_ms: number | null; error_message: string | null }[]) {
    const type = monitorIdToType.get(c.monitor_id)
    if (!type) continue

    if (!typeAgg.has(type)) {
      typeAgg.set(type, { up: 0, down: 0, degraded: 0, responseTimes: [], errors: [], failingMonitorIds: new Set() })
    }
    const agg = typeAgg.get(type)!

    if (c.status === 'up') {
      agg.up++
    } else if (c.status === 'down') {
      agg.down++
      agg.failingMonitorIds.add(c.monitor_id)
    } else if (c.status === 'degraded') {
      agg.degraded++
      agg.failingMonitorIds.add(c.monitor_id)
    }

    if (c.response_time_ms != null) agg.responseTimes.push(c.response_time_ms)
    if (c.error_message && c.status !== 'up') agg.errors.push(c.error_message)
  }

  const results: MonitorTypeHealth[] = []

  for (const [type, monitorCount] of typeMonitorCount.entries()) {
    const agg = typeAgg.get(type)

    if (!agg || (agg.up + agg.down + agg.degraded) === 0) {
      results.push({
        type, totalMonitors: monitorCount,
        totalChecks: 0, upChecks: 0, downChecks: 0, degradedChecks: 0,
        failingMonitors: 0, avgResponseMs: 0, uptimePercent: 0,
        status: 'no-data', topErrors: [],
      })
      continue
    }

    const totalChecks = agg.up + agg.down + agg.degraded
    const uptimePercent = Math.round((agg.up / totalChecks) * 10000) / 100
    const avgResponseMs = agg.responseTimes.length > 0
      ? Math.round(agg.responseTimes.reduce((a, b) => a + b, 0) / agg.responseTimes.length)
      : 0

    // Top 3 error messages by frequency
    const errorFreq = new Map<string, number>()
    for (const e of agg.errors) {
      const key = e.slice(0, 120)
      errorFreq.set(key, (errorFreq.get(key) ?? 0) + 1)
    }
    const topErrors = Array.from(errorFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([msg, count]) => `${msg} (×${count})`)

    const status: MonitorTypeHealth['status'] =
      uptimePercent >= 95 ? 'healthy' :
      uptimePercent >= 80 ? 'warning' : 'critical'

    results.push({
      type, totalMonitors: monitorCount, totalChecks,
      upChecks: agg.up, downChecks: agg.down, degradedChecks: agg.degraded,
      failingMonitors: agg.failingMonitorIds.size,
      avgResponseMs, uptimePercent, status, topErrors,
    })
  }

  // Sort: critical → warning → healthy → no-data
  const order = { critical: 0, warning: 1, healthy: 2, 'no-data': 3 }
  results.sort((a, b) => order[a.status] - order[b.status])

  return results
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const windowHours = parseInt(searchParams.get('hours') ?? '1', 10)

  const data = await computeMonitorTypeHealth(windowHours)
  return NextResponse.json({ data, windowHours, generatedAt: new Date().toISOString() })
}
