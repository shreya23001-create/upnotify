// =============================================================================
// AOE — Automated Outreach Engine
// Cron: last-day-burst — runs daily at 11pm UTC
// On the last day of the month: sends all remaining quota minus 2% hard reserve
// Skips silently on all other days
// =============================================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { AOE_CONFIG } from '@/lib/aoe/config'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { getBurstQuota, incrementBurstSent, getOrCreateQuota } from '@/lib/aoe/db/aoe-email-quota'
import { getSitesReadyToEmail, markSiteEmailed } from '@/lib/aoe/db/aoe-site-discovery'
import { logAoeEmailSent, wasRecentlyEmailed, hasOptedOut } from '@/lib/aoe/db/aoe-outreach-log'
import { categorizeSite } from '@/lib/aoe/db/aoe-site-checks'
import { sendAoeEmail } from '@/lib/aoe/services/email-sender'
import { buildAoeEmail } from '@/lib/aoe/email-templates'
import type { AoeSiteDiscovery } from '@/lib/aoe/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CONCURRENCY = 5

// Category → campaign mapping (same as emailer)
const CATEGORY_TO_CAMPAIGN = {
  ssl_expiry:  'ssl_expiry',
  down:        'site_down',
  ecom_issue:  'ecom_down',
  slow:        'site_slow',
  compete:     'compete_cold',
} as const

// ---------------------------------------------------------------------------
// Check if today is the last day of the month
// ---------------------------------------------------------------------------

function isLastDayOfMonth(): boolean {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.getDate() === 1
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  // Hard guard — AOE must never send real emails outside production
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  if (!isProduction) {
    logger.warn('AOE last-day-burst blocked — not production environment')
    return NextResponse.json({ skipped: true, reason: 'Not production environment — AOE email sending is blocked' })
  }

  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/aoe/last-day-burst', getTriggeredBy(request))

  // Only fire on last day of month
  if (!isLastDayOfMonth()) {
    await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: not_last_day' })
    return NextResponse.json({ ok: true, skipped: true, reason: 'not_last_day' })
  }

  try {
    // Check master kill switch
    const settings = await getAoeSettings()
    if (!settings.master_enabled) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: master_disabled' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    // Get available burst quota (total remaining minus hard reserve)
    const burstAvailable = await getBurstQuota()
    if (burstAvailable <= 0) {
      logger.info('AOE last-day-burst: no burst quota available')
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no_burst_quota' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_burst_quota', burstAvailable })
    }

    const quota = await getOrCreateQuota()
    logger.info('AOE last-day-burst: firing', {
      burstAvailable,
      totalQuota: quota?.total_quota,
      totalSent: (quota?.marketing_sent ?? 0) + (quota?.alert_sent ?? 0) + (quota?.burst_sent ?? 0),
    })

    // Get sites ready to email up to burst quota
    const sites = await getSitesReadyToEmail(burstAvailable)
    if (sites.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no_sites_ready' })
      return NextResponse.json({ ok: true, sent: 0, skipped: 0, reason: 'no_sites_ready' })
    }

    let sent = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < sites.length; i += CONCURRENCY) {
      if (sent >= burstAvailable) break

      const chunk = sites.slice(i, i + CONCURRENCY) as AoeSiteDiscovery[]
      const results = await Promise.allSettled(chunk.map(async site => {
        if (!site.email) return 'skipped' as const

        const recentlySent = await wasRecentlyEmailed(site.domain, AOE_CONFIG.sending.cooldownDays)
        if (recentlySent) return 'skipped' as const

        const optedOut = await hasOptedOut(site.domain)
        if (optedOut) return 'skipped' as const

        // Check not already an Uptrue user
        const supabase = createAdminClient()
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .ilike('email', `%@${site.domain}`)
        if ((count ?? 0) > 0) return 'skipped' as const

        const summary = await categorizeSite(site.domain, site.platform)
        if (summary.category === 'skip') return 'skipped' as const

        const template = buildAoeEmail(site.domain, summary, `burst-${Date.now()}`)
        if (!template) return 'skipped' as const

        const result = await sendAoeEmail({ to: site.email, subject: template.subject, html: template.html })
        if (!result.success) return 'error' as const

        const campaign = CATEGORY_TO_CAMPAIGN[summary.category as keyof typeof CATEGORY_TO_CAMPAIGN] ?? 'site_down'

        await logAoeEmailSent({
          domain: site.domain,
          emailSentTo: site.email,
          emailSource: site.email_source ?? 'website_scrape',
          campaign,
          platform: site.platform,
          product: summary.category === 'compete' ? 'compete' : 'uptrue',
          resendMessageId: result.messageId,
        })

        await markSiteEmailed(site.domain)
        return 'sent' as const
      }))

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'sent') sent++
          else if (r.value === 'skipped') skipped++
          else errors++
        } else {
          errors++
        }
      }
    }

    if (sent > 0) {
      await incrementBurstSent(sent)
    }

    logger.info('AOE last-day-burst completed', { sent, skipped, errors, burstAvailable })

    await endCronRun(runId, cronStart, 'ok', { summary: `sent: ${sent}, skipped: ${skipped}, errors: ${errors}, burstAvailable: ${burstAvailable}` })
    return NextResponse.json({ ok: true, sent, skipped, errors, burstAvailable })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE last-day-burst error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
