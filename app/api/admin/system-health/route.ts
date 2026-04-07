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

function cronStatus(lastRun: string | null, maxGapMinutes: number, now: number): string {
  if (!lastRun) return 'never'
  const ageMinutes = (now - new Date(lastRun).getTime()) / 60000
  if (ageMinutes < maxGapMinutes) return 'healthy'
  if (ageMinutes < maxGapMinutes * 2) return 'stale'
  return 'error'
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const now = Date.now()

  // ── Database health ───────────────────────────────────────────────────────
  const dbStart = Date.now()
  const { error: dbError } = await supabase.from('plans').select('id').limit(1)
  const dbLatency = Date.now() - dbStart

  // ── Monitor & incident stats ──────────────────────────────────────────────
  const [totalMonitors, activeMonitors, pausedMonitors, openIncidents, resolvedToday] =
    await Promise.all([
      supabase.from('monitors').select('id', { count: 'exact', head: true }),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('is_paused', false),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('is_paused', true),
      supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', new Date(now - 86400000).toISOString()),
    ])

  // ── Check results (24h) ───────────────────────────────────────────────────
  const twentyFourHoursAgo = new Date(now - 86400000).toISOString()
  const [totalChecks, failedChecks] = await Promise.all([
    supabase.from('check_results').select('id', { count: 'exact', head: true }).gte('checked_at', twentyFourHoursAgo),
    supabase.from('check_results').select('id', { count: 'exact', head: true }).gte('checked_at', twentyFourHoursAgo).eq('status', 'down'),
  ])

  const totalCheckCount = totalChecks.count ?? 0
  const failedCheckCount = failedChecks.count ?? 0
  const failRate = totalCheckCount > 0 ? (failedCheckCount / totalCheckCount) * 100 : 0

  // ── Cron last-run timestamps (all 12 crons) ───────────────────────────────
  const [
    lastUserCheck,
    lastPublicCheck,
    lastNurtureEmail,
    lastOrgHealthScore,
    lastCompeteCheck,
    lastCompeteBrief,
    lastAoeQuota,
    lastAoeDiscovery,
    lastAoeOutreachChecker,
    lastAoeEmailer,
    lastAoeLastDay,
    lastAoeSnapshot,
    lastCompetitorCheck,
  ] = await Promise.all([
    // check-runner
    supabase.from('check_results').select('checked_at').not('org_id', 'is', null)
      .order('checked_at', { ascending: false }).limit(1).maybeSingle(),
    // public-checks
    supabase.from('public_check_results').select('checked_at')
      .order('checked_at', { ascending: false }).limit(1).maybeSingle(),
    // nurture-emails
    supabase.from('email_sends').select('sent_at')
      .order('sent_at', { ascending: false }).limit(1).maybeSingle(),
    // health-scores
    supabase.from('organisations').select('health_score_at')
      .not('health_score_at', 'is', null)
      .order('health_score_at', { ascending: false }).limit(1).maybeSingle(),
    // compete-checks
    supabase.from('ecom_price_history').select('checked_at')
      .order('checked_at', { ascending: false }).limit(1).maybeSingle(),
    // compete-brief
    supabase.from('user_messages').select('created_at')
      .ilike('title', '%compete%brief%')
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/quota-manager
    supabase.from('aoe_email_quota').select('calculated_at')
      .not('calculated_at', 'is', null)
      .order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/site-discovery
    supabase.from('aoe_site_discovery').select('discovered_at')
      .order('discovered_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/outreach-checker — eslint-disable-next-line needed: column not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as unknown as any).from('aoe_outreach_log').select('checked_at')
      .not('checked_at', 'is', null)
      .order('checked_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/outreach-emailer
    supabase.from('aoe_outreach_log').select('sent_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/last-day-burst (recent sent within last 24h)
    supabase.from('aoe_outreach_log').select('sent_at')
      .not('sent_at', 'is', null)
      .gte('sent_at', new Date(now - 86400000).toISOString())
      .order('sent_at', { ascending: false }).limit(1).maybeSingle(),
    // aoe/daily-snapshot — table not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as unknown as any).from('aoe_daily_snapshots').select('snapshot_date')
      .order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    // competitor-checks — table not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as unknown as any).from('competitor_check_results').select('checked_at')
      .order('checked_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  // ── Compete stats ─────────────────────────────────────────────────────────
  const [competeProducts, competeSubs] = await Promise.all([
    supabase.from('ecom_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('compete_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const healthScoreAt = (lastOrgHealthScore?.data as Record<string, unknown> | null)?.health_score_at as string | null ?? null
  const snapshotDate = (lastAoeSnapshot?.data as Record<string, unknown> | null)?.snapshot_date as string | null ?? null

  const health = {
    database: { status: dbError ? 'error' : 'ok', latencyMs: dbLatency },

    crons: {
      checkRunner: {
        label: 'Check Runner',
        schedule: 'Every hour',
        path: '/api/cron/check-runner',
        lastRun: lastUserCheck?.data?.checked_at ?? null,
        status: cronStatus(lastUserCheck?.data?.checked_at ?? null, 70, now),
      },
      publicChecks: {
        label: 'Public Checks',
        schedule: 'Every 10 min',
        path: '/api/cron/public-checks',
        lastRun: lastPublicCheck?.data?.checked_at ?? null,
        status: cronStatus(lastPublicCheck?.data?.checked_at ?? null, 15, now),
      },
      nurtureEmails: {
        label: 'Nurture Emails',
        schedule: 'Daily 8am',
        path: '/api/cron/nurture-emails',
        lastRun: lastNurtureEmail?.data?.sent_at ?? null,
        status: cronStatus(lastNurtureEmail?.data?.sent_at ?? null, 1500, now),
      },
      healthScores: {
        label: 'Health Scores',
        schedule: 'Monday 3am',
        path: '/api/cron/health-scores',
        lastRun: healthScoreAt,
        status: cronStatus(healthScoreAt, 10080, now),
      },
      competeChecks: {
        label: 'Compete Price Checks',
        schedule: 'Every hour',
        path: '/api/cron/compete-checks',
        lastRun: lastCompeteCheck?.data?.checked_at ?? null,
        status: cronStatus(lastCompeteCheck?.data?.checked_at ?? null, 70, now),
      },
      competeBrief: {
        label: 'Compete Weekly Brief',
        schedule: 'Monday 8am',
        path: '/api/cron/compete-brief',
        lastRun: lastCompeteBrief?.data?.created_at ?? null,
        status: cronStatus(lastCompeteBrief?.data?.created_at ?? null, 10080, now),
      },
      aoeQuotaManager: {
        label: 'AOE Quota Manager',
        schedule: 'Daily midnight',
        path: '/api/cron/aoe/quota-manager',
        lastRun: lastAoeQuota?.data?.calculated_at ?? null,
        status: cronStatus(lastAoeQuota?.data?.calculated_at ?? null, 1500, now),
      },
      aoeSiteDiscovery: {
        label: 'AOE Site Discovery',
        schedule: 'Sunday 2am',
        path: '/api/cron/aoe/site-discovery',
        lastRun: lastAoeDiscovery?.data?.discovered_at ?? null,
        status: cronStatus(lastAoeDiscovery?.data?.discovered_at ?? null, 10080, now),
      },
      aoeOutreachChecker: {
        label: 'AOE Outreach Checker',
        schedule: 'Daily 3am',
        path: '/api/cron/aoe/outreach-checker',
        lastRun: lastAoeOutreachChecker?.data?.checked_at ?? null,
        status: cronStatus(lastAoeOutreachChecker?.data?.checked_at ?? null, 1500, now),
      },
      aoeOutreachEmailer: {
        label: 'AOE Outreach Emailer',
        schedule: 'Daily 8am',
        path: '/api/cron/aoe/outreach-emailer',
        lastRun: lastAoeEmailer?.data?.sent_at ?? null,
        status: cronStatus(lastAoeEmailer?.data?.sent_at ?? null, 1500, now),
      },
      aoeLastDayBurst: {
        label: 'AOE Last Day Burst',
        schedule: 'Daily 11pm',
        path: '/api/cron/aoe/last-day-burst',
        lastRun: lastAoeLastDay?.data?.sent_at ?? null,
        status: cronStatus(lastAoeLastDay?.data?.sent_at ?? null, 1500, now),
      },
      aoeDailySnapshot: {
        label: 'AOE Daily Snapshot',
        schedule: 'Daily 9am',
        path: '/api/cron/aoe/daily-snapshot',
        lastRun: snapshotDate,
        status: cronStatus(snapshotDate, 1500, now),
      },
      competitorChecks: {
        label: 'Competitor Checks',
        schedule: 'Every hour',
        path: '/api/cron/competitor-checks',
        lastRun: lastCompetitorCheck?.data?.checked_at ?? null,
        status: cronStatus(lastCompetitorCheck?.data?.checked_at ?? null, 70, now),
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
    compete: {
      activeProducts: competeProducts.count ?? 0,
      activeSubscriptions: competeSubs.count ?? 0,
    },
  }

  return NextResponse.json({ success: true, health })
}
