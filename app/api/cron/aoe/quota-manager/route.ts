// =============================================================================
// AOE — Automated Outreach Engine
// Cron: quota-manager — runs daily at midnight
// Recalculates email quota reservation based on live monitor + subscriber counts
// Fires admin alerts at 70%, 85%, 95% thresholds
// =============================================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { AOE_CONFIG } from '@/lib/aoe/config'
import { upsertQuota, getCurrentMonth, getOrCreateQuota } from '@/lib/aoe/db/aoe-email-quota'
import { sendEmail } from '@/lib/services/email'
import type { AoeQuotaManagerResult, AoeQuotaStatus } from '@/lib/aoe/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request): Promise<NextResponse> {
  // Auth check — same pattern as all crons
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/aoe/quota-manager', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()
    const { quota: quotaConfig } = AOE_CONFIG
    const month = getCurrentMonth()

    // -------------------------------------------------------------------------
    // 1. Count monitors with email alerting enabled
    // -------------------------------------------------------------------------
    const { count: monitorsWithEmail } = await supabase
      .from('monitors')
      .select('id', { count: 'exact', head: true })
      .eq('is_paused', false)

    // -------------------------------------------------------------------------
    // 2. Count status page subscribers
    // -------------------------------------------------------------------------
    const { count: statusPageSubs } = await supabase
      .from('status_page_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('confirmed', true)

    const monitorCount = monitorsWithEmail ?? 0
    const subscriberCount = statusPageSubs ?? 0

    // -------------------------------------------------------------------------
    // 3. Calculate reservation
    // avg 2 alert emails per monitor per month (down + recovery)
    // avg 3 notification emails per subscriber per month
    // -------------------------------------------------------------------------
    const rawAlertEstimate = (monitorCount * 2) + (subscriberCount * 3)
    const safetyBuffer     = Math.ceil(rawAlertEstimate * quotaConfig.alertBufferPercent)
    const reservedAlerts   = rawAlertEstimate + safetyBuffer
    const hardReserve      = Math.ceil(quotaConfig.monthlyLimit * quotaConfig.hardReservePercent)
    const availableMarketing = Math.max(0,
      quotaConfig.monthlyLimit - reservedAlerts - hardReserve
    )

    // -------------------------------------------------------------------------
    // 4. Check current usage to determine status
    // -------------------------------------------------------------------------
    const existing = await getOrCreateQuota()
    const totalSent = (existing?.marketing_sent ?? 0) + (existing?.alert_sent ?? 0) + (existing?.burst_sent ?? 0)
    const usagePercent = totalSent / quotaConfig.monthlyLimit

    let status: AoeQuotaStatus = 'active'
    if (usagePercent >= quotaConfig.upgradeThreshold) {
      status = 'upgrade_required_95'
    } else if (usagePercent >= quotaConfig.pauseThreshold) {
      status = 'paused_85'
    }

    // -------------------------------------------------------------------------
    // 5. Write to DB
    // -------------------------------------------------------------------------
    await upsertQuota({
      month,
      reservedAlerts,
      safetyBuffer,
      hardReserve,
      availableMarketing,
      monitorsWithEmail: monitorCount,
      statusPageSubs: subscriberCount,
      status,
    })

    // -------------------------------------------------------------------------
    // 6. Fire admin alerts at thresholds
    // -------------------------------------------------------------------------
    let adminAlertSent = false
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

    if (status === 'upgrade_required_95' && adminEmails.length > 0) {
      await sendEmail(
        adminEmails[0],
        '🚨 AOE: Resend quota at 95% — temporary upgrade required',
        `<p>AOE email quota has reached <strong>${Math.round(usagePercent * 100)}%</strong> for ${month}.</p>
         <p>Marketing sends are paused. <strong>Please log into Resend and temporarily upgrade the plan</strong> to avoid missing alerts.</p>
         <p>Total sent: ${totalSent.toLocaleString()} / ${quotaConfig.monthlyLimit.toLocaleString()}</p>`
      )
      adminAlertSent = true
    } else if (status === 'paused_85' && adminEmails.length > 0) {
      await sendEmail(
        adminEmails[0],
        '⚠️ AOE: Resend quota at 85% — marketing paused until refill',
        `<p>AOE email quota has reached <strong>${Math.round(usagePercent * 100)}%</strong> for ${month}.</p>
         <p>All marketing sends have been <strong>automatically paused</strong>. Alerts continue unaffected.</p>
         <p>Marketing will resume automatically when the quota resets next month.</p>
         <p>Total sent: ${totalSent.toLocaleString()} / ${quotaConfig.monthlyLimit.toLocaleString()}</p>`
      )
      adminAlertSent = true
    } else if (usagePercent >= quotaConfig.alertThreshold && adminEmails.length > 0) {
      await sendEmail(
        adminEmails[0],
        `ℹ️ AOE: Resend quota at ${Math.round(usagePercent * 100)}% — monitor closely`,
        `<p>AOE email quota is at <strong>${Math.round(usagePercent * 100)}%</strong> for ${month}.</p>
         <p>Total sent: ${totalSent.toLocaleString()} / ${quotaConfig.monthlyLimit.toLocaleString()}</p>
         <p>Marketing will auto-pause at 85%. No action needed yet.</p>`
      )
      adminAlertSent = true
    }

    const result: AoeQuotaManagerResult = {
      month,
      totalQuota: quotaConfig.monthlyLimit,
      reservedAlerts,
      safetyBuffer,
      hardReserve,
      availableMarketing,
      monitorsWithEmail: monitorCount,
      statusPageSubs: subscriberCount,
      status,
      adminAlertSent,
    }

    logger.info('AOE quota-manager completed', {
      month,
      usagePercent: Math.round(usagePercent * 100),
      status,
      availableMarketing,
      adminAlertSent,
    })

    await endCronRun(runId, cronStart, 'ok', { summary: `month: ${month}, status: ${status}, availableMarketing: ${availableMarketing}, usage: ${Math.round(usagePercent * 100)}%` })
    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE quota-manager error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
