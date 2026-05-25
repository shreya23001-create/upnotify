// =============================================================================
// AOE — Automated Outreach Engine
// Cron: daily-snapshot — runs daily at 9am UTC
// Sends a digest email to ADMIN_EMAILS with quota, pipeline, and campaign stats
// =============================================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { AOE_CONFIG } from '@/lib/aoe/config'
import { getCurrentMonth, getQuotaForDashboard } from '@/lib/aoe/db/aoe-email-quota'
import { getAoeCampaignStats } from '@/lib/aoe/db/aoe-outreach-log'
import { getDiscoveryStats } from '@/lib/aoe/db/aoe-site-discovery'
import { sendEmail } from '@/lib/services/email'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function bar(value: number, total: number): string {
  const filled = total > 0 ? Math.round((value / total) * 20) : 0
  const empty  = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function statusColour(status: string): string {
  if (status === 'active')               return '#22c55e'
  if (status === 'paused_85')            return '#f59e0b'
  if (status === 'upgrade_required_95')  return '#ef4444'
  return '#6b7280'
}

function statusLabel(status: string): string {
  if (status === 'active')               return '✓ Active'
  if (status === 'paused_85')            return '⚠ Paused — 85% used'
  if (status === 'upgrade_required_95')  return '🚨 Upgrade required — 95% used'
  return status
}

function cronAge(lastRun: string | null): string {
  if (!lastRun) return '<span style="color:#ef4444">Never run</span>'
  const mins = Math.round((Date.now() - new Date(lastRun).getTime()) / 60000)
  if (mins < 90)   return `<span style="color:#22c55e">${mins}m ago</span>`
  if (mins < 1500) return `<span style="color:#22c55e">${Math.round(mins / 60)}h ago</span>`
  return `<span style="color:#ef4444">${Math.round(mins / 60)}h ago — check logs</span>`
}

// ---------------------------------------------------------------------------
// Build the snapshot email HTML
// ---------------------------------------------------------------------------

function buildSnapshotEmail(data: {
  date: string
  month: string
  quota: Awaited<ReturnType<typeof getQuotaForDashboard>>
  sentToday: number
  campaigns: Awaited<ReturnType<typeof getAoeCampaignStats>>
  discovery: Record<string, number>
  lastRuns: {
    quotaManager:    string | null
    siteDiscovery:   string | null
    outreachChecker: string | null
    outreachEmailer: string | null
  }
}): string {
  const { quota, campaigns, discovery, lastRuns } = data
  const q = quota
  const totalSent  = q ? q.marketing_sent + q.alert_sent + q.burst_sent : 0
  const totalQuota = q?.total_quota ?? AOE_CONFIG.quota.monthlyLimit
  const usagePct   = Math.round((totalSent / totalQuota) * 100)
  const quotaStatus = q?.status ?? 'unknown'

  // Campaign totals
  const totalEmailed   = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalOpened    = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked   = campaigns.reduce((s, c) => s + c.clicked, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0)
  const totalBounced   = campaigns.reduce((s, c) => s + c.bounced, 0)
  const totalSpam      = campaigns.reduce((s, c) => s + c.spam, 0)

  const openRate    = totalEmailed ? pct(totalOpened, totalEmailed) : '—'
  const clickRate   = totalEmailed ? pct(totalClicked, totalEmailed) : '—'
  const convertRate = totalEmailed ? pct(totalConverted, totalEmailed) : '—'

  // Discovery totals
  const discTotal   = Object.values(discovery).reduce((a, b) => a + b, 0)
  const discReady   = discovery['ready']   ?? 0
  const discEmailed = discovery['emailed'] ?? 0
  const discChecking = discovery['checking'] ?? 0
  const discPending  = discovery['pending_check'] ?? 0

  const campaignRows = campaigns.length > 0
    ? campaigns.map(c => `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${c.campaign.replace(/_/g, ' ')}</td>
          <td style="padding:8px 12px;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">${c.sent.toLocaleString()}</td>
          <td style="padding:8px 12px;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">${c.sent ? pct(c.opened, c.sent) : '—'}</td>
          <td style="padding:8px 12px;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">${c.sent ? pct(c.clicked, c.sent) : '—'}</td>
          <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:600;color:#22c55e;border-bottom:1px solid #f3f4f6;">${c.converted}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="padding:12px;font-size:13px;color:#9ca3af;text-align:center;">No emails sent this month yet</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AOE Daily Snapshot — ${data.date}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #eaeaea;display:flex;justify-content:space-between;align-items:center;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><span style="font-size:17px;font-weight:700;color:#111827;">Uptrue · AOE Daily Snapshot</span></td>
    <td align="right"><span style="font-size:13px;color:#9ca3af;">${data.date}</span></td>
  </tr></table>
</td></tr>

<!-- Quota -->
<tr><td style="padding:24px 32px 20px;border-bottom:1px solid #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td><span style="font-size:14px;font-weight:600;color:#111827;">Email Quota — ${data.month}</span></td>
      <td align="right"><span style="font-size:12px;font-weight:600;color:${statusColour(quotaStatus)};">${statusLabel(quotaStatus)}</span></td>
    </tr>
  </table>
  <div style="margin:10px 0 4px;font-family:monospace;font-size:12px;color:#374151;">${bar(totalSent, totalQuota)} ${usagePct}%</div>
  <div style="font-size:12px;color:#6b7280;">${totalSent.toLocaleString()} used of ${totalQuota.toLocaleString()} · ${(totalQuota - totalSent).toLocaleString()} remaining</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr>
      <td style="font-size:12px;color:#6b7280;">Marketing sent</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;">${(q?.marketing_sent ?? 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;">Alert sent</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;">${(q?.alert_sent ?? 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;">Available for marketing</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;">${(q?.available_marketing ?? 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;">Sent today</td>
      <td style="font-size:12px;color:${data.sentToday > 0 ? '#22c55e' : '#9ca3af'};font-weight:600;text-align:right;">${data.sentToday.toLocaleString()}</td>
    </tr>
  </table>
</td></tr>

<!-- Discovery pipeline -->
<tr><td style="padding:20px 32px;border-bottom:1px solid #f3f4f6;">
  <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:12px;">Discovery Pipeline</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Pending check</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;padding:3px 0;">${discPending.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Checking (in progress)</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;padding:3px 0;">${discChecking.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Ready to email</td>
      <td style="font-size:12px;color:${discReady > 0 ? '#3b82f6' : '#374151'};font-weight:600;text-align:right;padding:3px 0;">${discReady.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Emailed (all time)</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;padding:3px 0;">${discEmailed.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Total discovered</td>
      <td style="font-size:12px;color:#374151;font-weight:600;text-align:right;padding:3px 0;">${discTotal.toLocaleString()}</td>
    </tr>
  </table>
</td></tr>

<!-- Campaign performance -->
<tr><td style="padding:20px 32px;border-bottom:1px solid #f3f4f6;">
  <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Campaign Performance — ${data.month}</div>
  <div style="font-size:12px;color:#9ca3af;margin-bottom:12px;">${totalEmailed.toLocaleString()} sent · ${openRate} open · ${clickRate} click · ${convertRate} convert · ${totalConverted} signups</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;font-weight:600;border-bottom:1px solid #e5e7eb;">Campaign</th>
        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:right;font-weight:600;border-bottom:1px solid #e5e7eb;">Sent</th>
        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:right;font-weight:600;border-bottom:1px solid #e5e7eb;">Open</th>
        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:right;font-weight:600;border-bottom:1px solid #e5e7eb;">Click</th>
        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:right;font-weight:600;border-bottom:1px solid #e5e7eb;">Converted</th>
      </tr>
    </thead>
    <tbody>${campaignRows}</tbody>
  </table>
  ${totalBounced > 0 || totalSpam > 0 ? `<div style="margin-top:8px;font-size:12px;color:#f59e0b;">⚠ ${totalBounced} bounce${totalBounced !== 1 ? 's' : ''} · ${totalSpam} spam complaint${totalSpam !== 1 ? 's' : ''} this month</div>` : ''}
</td></tr>

<!-- Cron health -->
<tr><td style="padding:20px 32px 24px;">
  <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:12px;">Cron Health</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Quota manager (daily midnight)</td>
      <td style="font-size:12px;text-align:right;padding:3px 0;">${cronAge(lastRuns.quotaManager)}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Site discovery (weekly Sun 2am)</td>
      <td style="font-size:12px;text-align:right;padding:3px 0;">${cronAge(lastRuns.siteDiscovery)}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Outreach checker (daily 3am)</td>
      <td style="font-size:12px;text-align:right;padding:3px 0;">${cronAge(lastRuns.outreachChecker)}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:3px 0;">Outreach emailer (daily 8am)</td>
      <td style="font-size:12px;text-align:right;padding:3px 0;">${cronAge(lastRuns.outreachEmailer)}</td>
    </tr>
  </table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/aoe/daily-snapshot', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()
    const month    = getCurrentMonth()
    const today    = new Date().toISOString().slice(0, 10)
    const date     = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

    const [quota, campaigns, discovery, sentTodayRes, lastRuns] = await Promise.all([
      getQuotaForDashboard(),
      getAoeCampaignStats(month),
      getDiscoveryStats(),

      // Emails sent today
      supabase
        .from('aoe_outreach_log')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', `${today}T00:00:00Z`),

      // Last run timestamps
      Promise.all([
        supabase.from('aoe_email_quota').select('calculated_at').not('calculated_at', 'is', null).order('calculated_at', { ascending: false }).limit(1).single(),
        supabase.from('aoe_site_discovery').select('discovered_at').order('discovered_at', { ascending: false }).limit(1).single(),
        supabase.from('aoe_site_checks').select('checked_at').order('checked_at', { ascending: false }).limit(1).single(),
        supabase.from('aoe_outreach_log').select('sent_at').order('sent_at', { ascending: false }).limit(1).single(),
      ]),
    ])

    const [quotaManagerRes, siteDiscoveryRes, outreachCheckerRes, outreachEmailerRes] = lastRuns

    const html = buildSnapshotEmail({
      date,
      month,
      quota,
      sentToday: sentTodayRes.count ?? 0,
      campaigns,
      discovery,
      lastRuns: {
        quotaManager:    quotaManagerRes.data?.calculated_at ?? null,
        siteDiscovery:   siteDiscoveryRes.data?.discovered_at ?? null,
        outreachChecker: outreachCheckerRes.data?.checked_at ?? null,
        outreachEmailer: outreachEmailerRes.data?.sent_at ?? null,
      },
    })

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

    if (adminEmails.length === 0) {
      logger.warn('AOE daily-snapshot: no ADMIN_EMAILS configured')
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no_admin_emails' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_admin_emails' })
    }

    await sendEmail(adminEmails[0], `AOE Daily Snapshot — ${date}`, html)

    logger.info('AOE daily-snapshot sent', { to: adminEmails[0], date })

    await endCronRun(runId, cronStart, 'ok', { summary: `snapshot sent for ${date}` })
    return NextResponse.json({ ok: true, date, month })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE daily-snapshot error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
