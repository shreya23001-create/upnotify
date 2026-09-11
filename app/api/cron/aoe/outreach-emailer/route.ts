// =============================================================================
// AOE — Automated Outreach Engine
// Cron: outreach-emailer — runs daily at 8am UTC
// Sends outreach emails to sites that have completed 3 nights of checks
// Checks quota, cooldown, opt-out, and existing user status before every send
// =============================================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { AOE_CONFIG } from '@/lib/aoe/config'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { getQuotaState, incrementMarketingSent } from '@/lib/aoe/db/aoe-email-quota'
import { getSitesReadyToEmail, markSiteEmailed } from '@/lib/aoe/db/aoe-site-discovery'
import { logAoeEmailSent, wasRecentlyEmailed, wasEmailRecentlyContacted, hasOptedOut } from '@/lib/aoe/db/aoe-outreach-log'
import { categorizeSite } from '@/lib/aoe/db/aoe-site-checks'
import { sendAoeEmail } from '@/lib/aoe/services/email-sender'
import { buildAoeEmail } from '@/lib/aoe/email-templates'
import type { AoeSiteDiscovery } from '@/lib/aoe/types'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE  = 100  // max emails per run (quota further limits this)
const CONCURRENCY = 5    // parallel sends

// Campaign → setting key mapping (keys match AoeSettings interface directly)
const CAMPAIGN_SETTING_KEYS: Record<string, string> = {
  ssl_expiry:   'campaign_ssl_expiry',
  site_down:    'campaign_site_down',
  site_slow:    'campaign_site_slow',
  ecom_issue:   'campaign_ecom_down',   // ecom_issue uses the ecom_down toggle
  compete:      'campaign_compete_cold',
  no_llms_txt:  'campaign_ai_seo',
}

// Category → campaign type mapping (for outreach log)
const CATEGORY_TO_CAMPAIGN = {
  ssl_expiry:   'ssl_expiry',
  down:         'site_down',
  ecom_issue:   'ecom_down',
  slow:         'site_slow',
  compete:      'compete_cold',
  no_llms_txt:  'ai_seo',
} as const

// ---------------------------------------------------------------------------
// Process one site — check gates, build template, send, log
// ---------------------------------------------------------------------------

async function processSite(
  site: AoeSiteDiscovery,
  settingMap: Map<string, boolean>,
): Promise<'sent' | 'skipped' | 'error'> {
  if (!site.email) return 'skipped'

  // Gate 1: domain-level cooldown — same domain not emailed twice within cooldown period
  const recentlySent = await wasRecentlyEmailed(site.domain, AOE_CONFIG.sending.cooldownDays)
  if (recentlySent) return 'skipped'

  // Gate 2: domain-level opt-out
  const optedOut = await hasOptedOut(site.domain)
  if (optedOut) return 'skipped'

  // Gate 2b: email-level cooldown — same email address not contacted across any domain
  // Prevents john@acme.com getting emailed for 5 domains he owns
  const emailContacted = await wasEmailRecentlyContacted(site.email, AOE_CONFIG.sending.cooldownDays)
  if (emailContacted) return 'skipped'

  // Gate 3: existing Uptrue user? Skip — they already have alerts
  const supabase = createAdminClient()
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .ilike('email', `%@${site.domain}`)
  if ((userCount ?? 0) > 0) return 'skipped'

  // Gate 4: categorise the site (pass has_llms_txt so no_llms_txt is detected)
  const summary = await categorizeSite(site.domain, site.platform, site.has_llms_txt)
  if (summary.category === 'skip') return 'skipped'

  // Gate 5: campaign enabled? (checks against AoeSettings keys directly)
  const settingKey = CAMPAIGN_SETTING_KEYS[summary.category]
  if (settingKey && settingMap.get(settingKey) === false) return 'skipped'

  // Build email
  const placeholderId = `placeholder-${Date.now()}`
  const template = buildAoeEmail(site.domain, summary, placeholderId)
  if (!template) return 'skipped'

  // Send
  const result = await sendAoeEmail({
    to: site.email,
    subject: template.subject,
    html: template.html,
  })

  if (!result.success) return 'error'

  const campaign = CATEGORY_TO_CAMPAIGN[summary.category as keyof typeof CATEGORY_TO_CAMPAIGN] ?? 'site_down'
  const isCompeteProduct = summary.category === 'compete'

  // Log to outreach log
  await logAoeEmailSent({
    domain: site.domain,
    emailSentTo: site.email,
    emailSource: site.email_source ?? 'website_scrape',
    campaign,
    platform: site.platform,
    product: isCompeteProduct ? 'compete' : 'Upnotify',
    resendMessageId: result.messageId,
  })

  // Mark site as emailed in discovery table
  await markSiteEmailed(site.domain)

  logger.info('AOE: outreach email sent', {
    domain: site.domain,
    campaign,
    category: summary.category,
    messageId: result.messageId,
  })

  return 'sent'
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  // Hard guard — AOE must never send real emails outside production
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  if (!isProduction) {
    logger.warn('AOE outreach-emailer blocked — not production environment', { VERCEL_ENV: process.env.VERCEL_ENV, NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV })
    return NextResponse.json({ skipped: true, reason: 'Not production environment — AOE email sending is blocked' })
  }
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/aoe/outreach-emailer', getTriggeredBy(request))

  try {
    // Check master kill switch
    const settings = await getAoeSettings()
    if (!settings.master_enabled) {
      logger.info('AOE outreach-emailer: skipped — master disabled')
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: master_disabled' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    // Check quota state
    const quota = await getQuotaState()
    if (!quota?.isMarketingAllowed) {
      logger.info('AOE outreach-emailer: skipped — quota paused or exhausted', {
        status: quota?.status,
        remainingMarketing: quota?.remainingMarketing,
      })
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: quota_paused' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'quota_paused' })
    }

    // How many can we send this run?
    const sendLimit = Math.min(BATCH_SIZE, quota.remainingMarketing)
    if (sendLimit <= 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no_quota' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_quota' })
    }

    // Build setting map for fast lookup
    const settingMap = new Map<string, boolean>()
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'boolean') settingMap.set(key, value)
    }

    // Get sites ready to email
    const sites = await getSitesReadyToEmail(sendLimit)
    if (sites.length === 0) {
      logger.info('AOE outreach-emailer: no sites ready')
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no sites ready' })
      return NextResponse.json({ ok: true, sent: 0, skipped: 0 })
    }

    let sent = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < sites.length; i += CONCURRENCY) {
      if (sent >= sendLimit) break

      const chunk = sites.slice(i, i + CONCURRENCY) as AoeSiteDiscovery[]
      const results = await Promise.allSettled(
        chunk.map(site => processSite(site, settingMap))
      )

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

    // Update quota counter
    if (sent > 0) {
      await incrementMarketingSent(sent)
    }

    logger.info('AOE outreach-emailer completed', { sent, skipped, errors })

    await endCronRun(runId, cronStart, 'ok', { summary: `sent: ${sent}, skipped: ${skipped}, errors: ${errors}` })
    return NextResponse.json({ ok: true, sent, skipped, errors })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE outreach-emailer error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
