import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): any { return client }

interface CronRun {
  id: string
  status: 'running' | 'ok' | 'error'
  triggered_by: 'schedule' | 'manual'
  duration_ms: number | null
  result_summary: string | null
  error_message: string | null
  ran_at: string
}

async function getCronHistory(supabase: ReturnType<typeof createAdminClient>): Promise<Record<string, CronRun[]>> {
  // Get last 5 runs per cron path in one query, ordered by ran_at desc.
  // 5 × 27 crons = 135 rows minimum; 400 gives ample headroom for hot periods.
  const { data } = await untyped(supabase)
    .from('cron_run_log')
    .select('id, cron_path, status, triggered_by, duration_ms, result_summary, error_message, ran_at')
    .order('ran_at', { ascending: false })
    .limit(400)

  if (!data) return {}

  const byPath: Record<string, CronRun[]> = {}
  for (const row of data as (CronRun & { cron_path: string })[]) {
    if (!byPath[row.cron_path]) byPath[row.cron_path] = []
    if (byPath[row.cron_path].length < 5) {
      byPath[row.cron_path].push({
        id: row.id,
        status: row.status,
        triggered_by: row.triggered_by,
        duration_ms: row.duration_ms,
        result_summary: row.result_summary,
        error_message: row.error_message,
        ran_at: row.ran_at,
      })
    }
  }
  return byPath
}

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

// Helper for crons that record their runs via startCronRun/endCronRun
// (most non-data-driven crons). Returns the most recent ran_at as ISO
// string, or null if the cron has never run / table is empty.
async function lastRunFromCronLog(
  supabase: ReturnType<typeof createAdminClient>,
  path: string
): Promise<string | null> {
  const { data } = await untyped(supabase)
    .from('cron_run_log')
    .select('ran_at')
    .eq('cron_path', path)
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const row = data as Record<string, unknown>
  return (row.ran_at as string) ?? null
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const now = Date.now()

  // ── Cron run history (last 5 per cron) ───────────────────────────────────────
  const cronHistory = await getCronHistory(supabase)

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

  // ── Cron last-run timestamps (all 27 crons; matches vercel.json) ──────────
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
    lastRazorpayRecovery,
    lastIncidentCleanup,
    lastAutoblogFeedFetcher,
    lastAutoblogLlmDetector,
    lastAutoblogTopicRunner,
    lastAutoblogPostGenerator,
    // New: Autoblog v2, Alerts, PMB, Maintenance/Billing
    lastCalendarDraftRunner,
    lastBossDigest,
    lastAlertDigestFlusher,
    lastDataRetention,
    lastMonitorHealthReport,
    lastPmbDailyPublisher,
    lastPmbMonthlyGenerator,
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
    // razorpay-recovery — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/razorpay-recovery')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // public-incident-cleanup — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/public-incident-cleanup')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // autoblog/feed-fetcher — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/autoblog/feed-fetcher')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // autoblog/llm-detector — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/autoblog/llm-detector')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // autoblog/topic-runner — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/autoblog/topic-runner')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // autoblog/post-generator — via cron_run_log
    untyped(supabase).from('cron_run_log').select('ran_at')
      .eq('cron_path', '/api/cron/autoblog/post-generator')
      .order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    // calendar/draft-runner — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/calendar/draft-runner'),
    // boss-digest — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/boss-digest'),
    // alert-digest-flusher — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/alert-digest-flusher'),
    // data-retention — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/data-retention'),
    // monitor-health-report — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/monitor-health-report'),
    // pmb/daily-publisher — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/pmb/daily-publisher'),
    // pmb/monthly-generator — via cron_run_log
    lastRunFromCronLog(supabase, '/api/cron/pmb/monthly-generator'),
  ])

  // ── Compete stats ─────────────────────────────────────────────────────────
  const [competeProducts, competeSubs] = await Promise.all([
    supabase.from('ecom_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('compete_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const healthScoreAt = (lastOrgHealthScore?.data as Record<string, unknown> | null)?.health_score_at as string | null ?? null
  const snapshotDate = (lastAoeSnapshot?.data as Record<string, unknown> | null)?.snapshot_date as string | null ?? null
  const razorpayRecoveryAt = (lastRazorpayRecovery?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null
  const incidentCleanupAt = (lastIncidentCleanup?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null
  const autoblogFeedFetcherAt = (lastAutoblogFeedFetcher?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null
  const autoblogLlmDetectorAt = (lastAutoblogLlmDetector?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null
  const autoblogTopicRunnerAt = (lastAutoblogTopicRunner?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null
  const autoblogPostGeneratorAt = (lastAutoblogPostGenerator?.data as Record<string, unknown> | null)?.ran_at as string | null ?? null

  const health = {
    database: { status: dbError ? 'error' : 'ok', latencyMs: dbLatency },

    crons: {
      checkRunner: {
        label: 'Check Runner',
        schedule: 'Every hour',
        path: '/api/cron/check-runner',
        lastRun: lastUserCheck?.data?.checked_at ?? null,
        status: cronStatus(lastUserCheck?.data?.checked_at ?? null, 70, now),
        history: cronHistory['/api/cron/check-runner'] ?? [],
      },
      publicChecks: {
        label: 'Public Checks',
        schedule: 'Every 10 min',
        path: '/api/cron/public-checks',
        lastRun: lastPublicCheck?.data?.checked_at ?? null,
        status: cronStatus(lastPublicCheck?.data?.checked_at ?? null, 15, now),
        history: cronHistory['/api/cron/public-checks'] ?? [],
      },
      nurtureEmails: {
        label: 'Nurture Emails',
        schedule: 'Daily 8am',
        path: '/api/cron/nurture-emails',
        lastRun: lastNurtureEmail?.data?.sent_at ?? null,
        status: cronStatus(lastNurtureEmail?.data?.sent_at ?? null, 1500, now),
        history: cronHistory['/api/cron/nurture-emails'] ?? [],
      },
      healthScores: {
        label: 'Health Scores',
        schedule: 'Monday 3am',
        path: '/api/cron/health-scores',
        lastRun: healthScoreAt,
        status: cronStatus(healthScoreAt, 10080, now),
        history: cronHistory['/api/cron/health-scores'] ?? [],
      },
      competeChecks: {
        label: 'Compete Price Checks',
        schedule: 'Every hour',
        path: '/api/cron/compete-checks',
        lastRun: lastCompeteCheck?.data?.checked_at ?? null,
        status: cronStatus(lastCompeteCheck?.data?.checked_at ?? null, 70, now),
        history: cronHistory['/api/cron/compete-checks'] ?? [],
      },
      competeBrief: {
        label: 'Compete Weekly Brief',
        schedule: 'Monday 8am',
        path: '/api/cron/compete-brief',
        lastRun: lastCompeteBrief?.data?.created_at ?? null,
        status: cronStatus(lastCompeteBrief?.data?.created_at ?? null, 10080, now),
        history: cronHistory['/api/cron/compete-brief'] ?? [],
      },
      aoeQuotaManager: {
        label: 'AOE Quota Manager',
        schedule: 'Daily midnight',
        path: '/api/cron/aoe/quota-manager',
        lastRun: lastAoeQuota?.data?.calculated_at ?? null,
        status: cronStatus(lastAoeQuota?.data?.calculated_at ?? null, 1500, now),
        history: cronHistory['/api/cron/aoe/quota-manager'] ?? [],
      },
      aoeSiteDiscovery: {
        label: 'AOE Site Discovery',
        schedule: 'Sunday 2am',
        path: '/api/cron/aoe/site-discovery',
        lastRun: lastAoeDiscovery?.data?.discovered_at ?? null,
        status: cronStatus(lastAoeDiscovery?.data?.discovered_at ?? null, 10080, now),
        history: cronHistory['/api/cron/aoe/site-discovery'] ?? [],
      },
      aoeOutreachChecker: {
        label: 'AOE Outreach Checker',
        schedule: 'Daily 3am',
        path: '/api/cron/aoe/outreach-checker',
        lastRun: lastAoeOutreachChecker?.data?.checked_at ?? null,
        status: cronStatus(lastAoeOutreachChecker?.data?.checked_at ?? null, 1500, now),
        history: cronHistory['/api/cron/aoe/outreach-checker'] ?? [],
      },
      aoeOutreachEmailer: {
        label: 'AOE Outreach Emailer',
        schedule: 'Daily 8am',
        path: '/api/cron/aoe/outreach-emailer',
        lastRun: lastAoeEmailer?.data?.sent_at ?? null,
        status: cronStatus(lastAoeEmailer?.data?.sent_at ?? null, 1500, now),
        history: cronHistory['/api/cron/aoe/outreach-emailer'] ?? [],
      },
      aoeLastDayBurst: {
        label: 'AOE Last Day Burst',
        schedule: 'Daily 11pm',
        path: '/api/cron/aoe/last-day-burst',
        lastRun: lastAoeLastDay?.data?.sent_at ?? null,
        status: cronStatus(lastAoeLastDay?.data?.sent_at ?? null, 1500, now),
        history: cronHistory['/api/cron/aoe/last-day-burst'] ?? [],
      },
      aoeDailySnapshot: {
        label: 'AOE Daily Snapshot',
        schedule: 'Daily 9am',
        path: '/api/cron/aoe/daily-snapshot',
        lastRun: snapshotDate,
        status: cronStatus(snapshotDate, 1500, now),
        history: cronHistory['/api/cron/aoe/daily-snapshot'] ?? [],
      },
      competitorChecks: {
        label: 'Competitor Checks',
        schedule: 'Every hour',
        path: '/api/cron/competitor-checks',
        lastRun: lastCompetitorCheck?.data?.checked_at ?? null,
        status: cronStatus(lastCompetitorCheck?.data?.checked_at ?? null, 70, now),
        history: cronHistory['/api/cron/competitor-checks'] ?? [],
      },
      razorpayRecovery: {
        label: 'Razorpay Recovery',
        schedule: 'Daily 2am',
        path: '/api/cron/razorpay-recovery',
        lastRun: razorpayRecoveryAt,
        status: cronStatus(razorpayRecoveryAt, 1500, now),
        history: cronHistory['/api/cron/razorpay-recovery'] ?? [],
      },
      publicIncidentCleanup: {
        label: 'Public Incident Cleanup',
        schedule: 'Every 30 min',
        path: '/api/cron/public-incident-cleanup',
        lastRun: incidentCleanupAt,
        status: cronStatus(incidentCleanupAt, 35, now),
        history: cronHistory['/api/cron/public-incident-cleanup'] ?? [],
      },
      autoblogFeedFetcher: {
        label: 'Autoblog Feed Fetcher',
        schedule: 'Every 6 hours',
        path: '/api/cron/autoblog/feed-fetcher',
        lastRun: autoblogFeedFetcherAt,
        status: cronStatus(autoblogFeedFetcherAt, 370, now),
        history: cronHistory['/api/cron/autoblog/feed-fetcher'] ?? [],
      },
      autoblogLlmDetector: {
        label: 'Autoblog LLM Detector',
        schedule: 'Daily 7am',
        path: '/api/cron/autoblog/llm-detector',
        lastRun: autoblogLlmDetectorAt,
        status: cronStatus(autoblogLlmDetectorAt, 1500, now),
        history: cronHistory['/api/cron/autoblog/llm-detector'] ?? [],
      },
      autoblogTopicRunner: {
        label: 'Autoblog Topic Runner',
        schedule: 'Every 2 hours',
        path: '/api/cron/autoblog/topic-runner',
        lastRun: autoblogTopicRunnerAt,
        status: cronStatus(autoblogTopicRunnerAt, 130, now),
        history: cronHistory['/api/cron/autoblog/topic-runner'] ?? [],
      },
      autoblogPostGenerator: {
        label: 'Autoblog Post Generator',
        schedule: 'Every 10 minutes',
        path: '/api/cron/autoblog/post-generator',
        lastRun: autoblogPostGeneratorAt,
        status: cronStatus(autoblogPostGeneratorAt, 15, now),
        history: cronHistory['/api/cron/autoblog/post-generator'] ?? [],
      },
      // ── Autoblog v2 (calendar-driven posts + Boss daily digest) ─────────
      calendarDraftRunner: {
        label: 'Autoblog v2 — Calendar Draft Runner',
        schedule: 'Every hour',
        path: '/api/cron/calendar/draft-runner',
        lastRun: lastCalendarDraftRunner,
        status: cronStatus(lastCalendarDraftRunner, 70, now),
        history: cronHistory['/api/cron/calendar/draft-runner'] ?? [],
      },
      bossDigest: {
        label: 'Autoblog v2 — Boss Daily Digest',
        schedule: 'Daily 7am',
        path: '/api/cron/boss-digest',
        lastRun: lastBossDigest,
        status: cronStatus(lastBossDigest, 1500, now),
        history: cronHistory['/api/cron/boss-digest'] ?? [],
      },
      // ── Alerts (Smart Digest flusher) ───────────────────────────────────
      alertDigestFlusher: {
        label: 'Alert Digest Flusher',
        schedule: 'Every 5 minutes',
        path: '/api/cron/alert-digest-flusher',
        lastRun: lastAlertDigestFlusher,
        status: cronStatus(lastAlertDigestFlusher, 10, now),
        history: cronHistory['/api/cron/alert-digest-flusher'] ?? [],
      },
      // ── PMB — Public Monitor Blog ──────────────────────────────────────
      // pmbWeekPlanner removed 2026-05-05 — Boss decided weekly comparison
      // posts weren't adding value. Cron deleted from vercel.json. Monthly
      // generator + daily publisher remain.
      pmbDailyPublisher: {
        label: 'PMB Daily Publisher',
        schedule: 'Every 5 minutes',
        path: '/api/cron/pmb/daily-publisher',
        lastRun: lastPmbDailyPublisher,
        status: cronStatus(lastPmbDailyPublisher, 10, now),
        history: cronHistory['/api/cron/pmb/daily-publisher'] ?? [],
      },
      pmbMonthlyGenerator: {
        label: 'PMB Monthly Generator',
        schedule: '1st of month, 7am',
        path: '/api/cron/pmb/monthly-generator',
        lastRun: lastPmbMonthlyGenerator,
        status: cronStatus(lastPmbMonthlyGenerator, 44640, now),
        history: cronHistory['/api/cron/pmb/monthly-generator'] ?? [],
      },
      // ── Maintenance & Billing ───────────────────────────────────────────
      dataRetention: {
        label: 'Data Retention',
        schedule: 'Daily 2:30am',
        path: '/api/cron/data-retention',
        lastRun: lastDataRetention,
        status: cronStatus(lastDataRetention, 1500, now),
        history: cronHistory['/api/cron/data-retention'] ?? [],
      },
      monitorHealthReport: {
        label: 'Monitor Health Report',
        schedule: 'Daily 8am',
        path: '/api/cron/monitor-health-report',
        lastRun: lastMonitorHealthReport,
        status: cronStatus(lastMonitorHealthReport, 1500, now),
        history: cronHistory['/api/cron/monitor-health-report'] ?? [],
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
