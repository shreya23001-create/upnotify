// =============================================================================
// AOE — Automated Outreach Engine
// Cron: outreach-checker — runs nightly at 3am UTC
// Performs silent HTTP + SSL checks on sites in the discovery queue
// After 18 checks (3 nights × 6 runs) → categorise and mark ready/skip
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { AOE_CONFIG } from '@/lib/aoe/config'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import {
  getSitesPendingCheck,
  incrementCheckCount,
  markSiteReady,
  markSiteSkip,
} from '@/lib/aoe/db/aoe-site-discovery'
import { logSiteCheck, categorizeSite, deleteOldSiteChecks } from '@/lib/aoe/db/aoe-site-checks'
import { checkSite } from '@/lib/aoe/services/site-checker'
import type { AoeSiteDiscovery } from '@/lib/aoe/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE    = 200   // sites to check per run
const CONCURRENCY   = 10    // parallel checks
const TIMEOUT_MS    = 10000 // per-site timeout
const CHECKS_TO_COMPLETE = 18 // 3 nights × 6 runs per night

// ---------------------------------------------------------------------------
// Process a single site
// ---------------------------------------------------------------------------

async function processSite(
  site: AoeSiteDiscovery,
  checkNumber: number
): Promise<void> {
  const result = await checkSite(site.domain, TIMEOUT_MS)

  await logSiteCheck({
    domain: site.domain,
    responseTimeMs: result.responseTimeMs,
    statusCode: result.statusCode,
    isDown: result.isDown,
    sslExpiryDays: result.sslExpiryDays,
    errorMessage: result.errorMessage,
    checkNumber,
  })

  await incrementCheckCount(site.domain)

  // After completing all 18 checks — categorise and move to ready/skip
  if (checkNumber >= CHECKS_TO_COMPLETE) {
    const summary = await categorizeSite(site.domain, site.platform)

    if (summary.category === 'skip') {
      await markSiteSkip(site.domain, 'no_issues')
    } else {
      // Has issues worth emailing about → move to ready queue
      await markSiteReady(site.domain)
      logger.info('AOE: site ready to email', {
        domain: site.domain,
        category: summary.category,
        downCount: summary.downCount,
        slowCount: summary.slowCount,
        sslExpiryDays: summary.sslExpiryDays,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Check master kill switch
    const settings = await getAoeSettings()
    if (!settings.master_enabled) {
      logger.info('AOE outreach-checker: skipped — master disabled')
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    // Clean up old check records (keep last 30 days)
    await deleteOldSiteChecks()

    // Get batch of sites to check
    const sites = await getSitesPendingCheck(BATCH_SIZE)

    if (sites.length === 0) {
      logger.info('AOE outreach-checker: no sites pending')
      return NextResponse.json({ ok: true, checked: 0, ready: 0 })
    }

    let checked = 0
    let errors = 0

    // Process in concurrent chunks
    for (let i = 0; i < sites.length; i += CONCURRENCY) {
      const chunk = sites.slice(i, i + CONCURRENCY)

      const results = await Promise.allSettled(
        chunk.map(site =>
          processSite(site, (site.check_count ?? 0) + 1)
        )
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          checked++
        } else {
          errors++
          logger.error('AOE checker: site check failed', { error: String(result.reason) })
        }
      }
    }

    // How many are now ready to email
    const completedThisRun = sites.filter(
      s => ((s.check_count ?? 0) + 1) >= CHECKS_TO_COMPLETE
    ).length

    logger.info('AOE outreach-checker completed', {
      checked,
      errors,
      completedThisRun,
      slowThresholdMs: AOE_CONFIG.campaigns.site_slow.slowThresholdMs,
    })

    return NextResponse.json({
      ok: true,
      checked,
      errors,
      completedThisRun,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE outreach-checker error', { error: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
