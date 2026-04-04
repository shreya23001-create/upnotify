import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const now = Date.now()

  // Database health check
  const dbStart = Date.now()
  const { error: dbError } = await supabase.from('plans').select('id').limit(1)
  const dbLatency = Date.now() - dbStart

  // Monitor stats
  const [totalMonitors, activeMonitors, pausedMonitors] = await Promise.all([
    supabase.from('monitors').select('id', { count: 'exact', head: true }),
    supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('is_paused', false),
    supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('is_paused', true),
  ])

  // Incidents
  const [openIncidents, resolvedToday] = await Promise.all([
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('incidents').select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', new Date(now - 86400000).toISOString()),
  ])

  // Check results last 24h
  const twentyFourHoursAgo = new Date(now - 86400000).toISOString()
  const [totalChecks, failedChecks] = await Promise.all([
    supabase.from('check_results').select('id', { count: 'exact', head: true })
      .gte('checked_at', twentyFourHoursAgo),
    supabase.from('check_results').select('id', { count: 'exact', head: true })
      .gte('checked_at', twentyFourHoursAgo)
      .eq('status', 'down'),
  ])

  const totalCheckCount = totalChecks.count ?? 0
  const failedCheckCount = failedChecks.count ?? 0
  const failRate = totalCheckCount > 0 ? (failedCheckCount / totalCheckCount) * 100 : 0

  // Cron status — check last check_result timestamps for different sources
  const { data: lastUserCheck } = await supabase
    .from('check_results')
    .select('checked_at')
    .not('org_id', 'is', null)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  const { data: lastPublicCheck } = await supabase
    .from('check_results')
    .select('checked_at')
    .is('org_id', null)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  function cronStatus(lastRun: string | null, maxGapMinutes: number): string {
    if (!lastRun) return 'never'
    const ageMinutes = (now - new Date(lastRun).getTime()) / 60000
    if (ageMinutes < maxGapMinutes) return 'healthy'
    if (ageMinutes < maxGapMinutes * 2) return 'stale'
    return 'error'
  }

  const health = {
    database: { status: dbError ? 'error' : 'ok', latencyMs: dbLatency },
    crons: {
      checkRunner: {
        lastRun: lastUserCheck?.checked_at ?? null,
        status: cronStatus(lastUserCheck?.checked_at ?? null, 10),
      },
      publicChecks: {
        lastRun: lastPublicCheck?.checked_at ?? null,
        status: cronStatus(lastPublicCheck?.checked_at ?? null, 10),
      },
      nurtureEmails: {
        lastRun: null, // Would need email_sends table check
        status: 'unknown',
      },
    },
    monitors: {
      total: totalMonitors.count ?? 0,
      active: activeMonitors.count ?? 0,
      paused: pausedMonitors.count ?? 0,
      inMaintenance: 0,
    },
    incidents: {
      open: openIncidents.count ?? 0,
      resolvedToday: resolvedToday.count ?? 0,
    },
    checks: {
      last24h: totalCheckCount,
      failRate,
    },
  }

  return NextResponse.json({ success: true, health })
}
