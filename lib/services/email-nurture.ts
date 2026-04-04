import { sendEmail } from '@/lib/services/email'
import {
  hasEmailBeenSent,
  recordEmailSend,
  getEmailPreferences,
  getOrgMonitorStats,
} from '@/lib/db/email-nurture'
import {
  getEmailTemplateByKey,
  incrementEmailTemplateSendCount,
  type EmailTemplate,
} from '@/lib/db/email-templates'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailResult {
  success: boolean
  error?: string
  skipped?: boolean
  reason?: string
}

type EmailCategory = 'product_updates' | 'usage_digests' | 'upgrade_tips'

interface EmailConfig {
  key: string
  category: EmailCategory
}

// ---------------------------------------------------------------------------
// Email key constants
// ---------------------------------------------------------------------------

const EMAIL_KEYS = {
  WELCOME: 'welcome',
  TRIAL_ENDING_4_DAYS: 'trial_ending_4d',
  TRIAL_ENDING_2_DAYS: 'trial_ending_2d',
  TRIAL_ENDING_TODAY: 'trial_ending_today',
  WELCOME_TO_FREE: 'welcome_to_free',
  MONTHLY_DIGEST: 'monthly_digest',
} as const

// ---------------------------------------------------------------------------
// Shared template helpers
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  const config = getServerConfig()
  return config.app.url
}

function unsubscribeUrl(userId: string): string {
  const base = getAppUrl()
  // Simple token: base64 of userId. In production, use a signed token.
  const token = Buffer.from(userId).toString('base64url')
  return `${base}/api/v1/email/unsubscribe?token=${token}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nurtureBaseTemplate(content: string, userId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Uptrue</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header with gradient -->
<tr><td style="padding:32px 32px 24px;background:linear-gradient(135deg,#3b82f6,#06b6d4);text-align:center;">
<span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Uptrue</span>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px 32px 40px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;">
<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center;">
Uptrue &mdash; Uptime, performance &amp; infrastructure monitoring.<br>
Vision Software Solutions Limited, Brentford, United Kingdom.
</p>
<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center;">
<a href="${escapeHtml(unsubscribeUrl(userId))}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
&nbsp;&middot;&nbsp;
<a href="${escapeHtml(getAppUrl())}/dashboard/settings" style="color:#6b7280;text-decoration:underline;">Email preferences</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
<tr><td>
<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">${escapeHtml(text)}</a>
</td></tr>
</table>`
}

function statCell(label: string, value: string): string {
  return `<td style="padding:12px 16px;text-align:center;border:1px solid #e5e7eb;">
<div style="font-size:24px;font-weight:700;color:#111827;margin-bottom:4px;">${escapeHtml(value)}</div>
<div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</div>
</td>`
}

// ---------------------------------------------------------------------------
// Pre-send checks (dedup + preference)
// ---------------------------------------------------------------------------

async function canSendEmail(
  userId: string,
  config: EmailConfig
): Promise<{ allowed: boolean; reason?: string }> {
  // Check dedup
  const alreadySent = await hasEmailBeenSent(userId, config.key)
  if (alreadySent) {
    return { allowed: false, reason: 'already_sent' }
  }

  // Check preferences
  const prefs = await getEmailPreferences(userId)
  if (!prefs) {
    // If preferences cannot be loaded, default to allowed
    return { allowed: true }
  }

  const categoryAllowed = prefs[config.category]
  if (!categoryAllowed) {
    return { allowed: false, reason: 'user_opted_out' }
  }

  return { allowed: true }
}

// ---------------------------------------------------------------------------
// DB template helpers — check DB first, fall back to hardcoded
// ---------------------------------------------------------------------------

interface DbTemplateResult {
  found: boolean
  active: boolean
  template: EmailTemplate | null
}

async function getDbTemplate(templateKey: string): Promise<DbTemplateResult> {
  try {
    const template = await getEmailTemplateByKey(templateKey)
    if (!template) return { found: false, active: true, template: null }
    if (!template.is_active) return { found: true, active: false, template: null }
    return { found: true, active: true, template }
  } catch {
    // If DB is unavailable, fall back to hardcoded
    return { found: false, active: true, template: null }
  }
}

function replaceVariables(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

async function recordSendWithDbTracking(userId: string, emailKey: string): Promise<void> {
  await recordEmailSend(userId, emailKey)
  // Fire and forget — don't block on send count update
  incrementEmailTemplateSendCount(emailKey).catch(() => {
    // Silently ignore — non-critical
  })
}

// ---------------------------------------------------------------------------
// Email #1: Welcome
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  userId: string,
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  const config: EmailConfig = { key: EMAIL_KEYS.WELCOME, category: 'product_updates' }

  const check = await canSendEmail(userId, config)
  if (!check.allowed) {
    return { success: true, skipped: true, reason: check.reason }
  }

  const appUrl = getAppUrl()
  const firstName = userName.split(' ')[0] || 'there'

  // Check DB template first
  const dbResult = await getDbTemplate(EMAIL_KEYS.WELCOME)
  if (dbResult.found && !dbResult.active) {
    return { success: true, skipped: true, reason: 'template_inactive' }
  }

  let subject: string
  let html: string

  if (dbResult.template) {
    const vars: Record<string, string> = {
      first_name: escapeHtml(firstName),
      app_url: escapeHtml(appUrl),
      cta_button: ctaButton('Add Your First Monitor \u2192', `${appUrl}/dashboard`),
    }
    subject = replaceVariables(dbResult.template.subject, vars)
    html = nurtureBaseTemplate(replaceVariables(dbResult.template.body_html, vars), userId)
  } else {
    subject = 'Your first monitor is 30 seconds away'
    html = nurtureBaseTemplate(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">Welcome to Uptrue, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your account is ready. Setting up your first monitor takes about 30 seconds &mdash;
      just enter a URL and we'll start watching it immediately.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
      Here's what you get with your 14-day Builder trial:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
      <li><strong>10 monitors</strong> with 1-minute check intervals</li>
      <li><strong>10 check types</strong> &mdash; HTTP, SSL, DNS, keyword, port, ping &amp; more</li>
      <li><strong>Multi-channel alerts</strong> &mdash; email, Slack, Teams, webhooks</li>
      <li><strong>Public status pages</strong> with custom branding</li>
      <li><strong>AI-powered reports</strong> with executive summaries</li>
    </ul>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      No credit card required. After your trial, you'll move to our Free plan unless you upgrade.
    </p>
    ${ctaButton('Add Your First Monitor \u2192', `${appUrl}/dashboard`)}
  `, userId)
  }

  const result = await sendEmail(userEmail, subject, html)

  if (result.success) {
    await recordSendWithDbTracking(userId, config.key)
    logger.info('Welcome email sent', { userId })
  }

  return result
}

// ---------------------------------------------------------------------------
// Email #6/#7/#8: Trial ending
// ---------------------------------------------------------------------------

export async function sendTrialEndingEmail(
  userId: string,
  userEmail: string,
  userName: string,
  daysLeft: number
): Promise<EmailResult> {
  let emailKey: string
  if (daysLeft === 4) emailKey = EMAIL_KEYS.TRIAL_ENDING_4_DAYS
  else if (daysLeft === 2) emailKey = EMAIL_KEYS.TRIAL_ENDING_2_DAYS
  else emailKey = EMAIL_KEYS.TRIAL_ENDING_TODAY

  const config: EmailConfig = { key: emailKey, category: 'upgrade_tips' }

  const check = await canSendEmail(userId, config)
  if (!check.allowed) {
    return { success: true, skipped: true, reason: check.reason }
  }

  const appUrl = getAppUrl()
  const firstName = userName.split(' ')[0] || 'there'

  const urgencyWord = daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`

  // Check DB template first
  const dbResult = await getDbTemplate(emailKey)
  if (dbResult.found && !dbResult.active) {
    return { success: true, skipped: true, reason: 'template_inactive' }
  }

  let subject: string
  let html: string

  if (dbResult.template) {
    const vars: Record<string, string> = {
      first_name: escapeHtml(firstName),
      app_url: escapeHtml(appUrl),
      days_left: String(daysLeft),
      cta_button: ctaButton('Compare Plans \u2192', `${appUrl}/dashboard/settings`),
    }
    subject = replaceVariables(dbResult.template.subject, vars)
    html = nurtureBaseTemplate(replaceVariables(dbResult.template.body_html, vars), userId)
  } else {
    subject = daysLeft === 0
      ? 'Your Builder trial ends today'
      : `Your Builder trial ends in ${daysLeft} days`

    html = nurtureBaseTemplate(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
      ${escapeHtml(firstName)}, your trial ends ${escapeHtml(urgencyWord)}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your 14-day Builder trial is coming to an end. When it expires, your account
      will move to our Free plan. Here's what changes:
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border-collapse:collapse;">
    <tr style="background-color:#f9fafb;">
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;border:1px solid #e5e7eb;width:40%;">Feature</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;border:1px solid #e5e7eb;width:30%;">Free</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;border:1px solid #e5e7eb;width:30%;">Builder</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Monitors</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">3</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">10</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Check interval</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">5 min</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">1 min</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Alert channels</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Email only</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Email, Slack, Teams, webhook</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">Status pages</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">1</td>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">5</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#374151;border:1px solid #e5e7eb;">AI reports</td>
      <td style="padding:10px 16px;font-size:14px;color:#dc2626;border:1px solid #e5e7eb;">No</td>
      <td style="padding:10px 16px;font-size:14px;color:#16a34a;border:1px solid #e5e7eb;">Yes</td>
    </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Upgrade now to keep all your current features and monitors active.
    </p>
    ${ctaButton('Compare Plans \u2192', `${appUrl}/dashboard/settings`)}
  `, userId)
  }

  const result = await sendEmail(userEmail, subject, html)

  if (result.success) {
    await recordSendWithDbTracking(userId, config.key)
    logger.info('Trial ending email sent', { userId, daysLeft })
  }

  return result
}

// ---------------------------------------------------------------------------
// Email #9: Welcome to Free
// ---------------------------------------------------------------------------

export async function sendWelcomeToFreeEmail(
  userId: string,
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  const config: EmailConfig = { key: EMAIL_KEYS.WELCOME_TO_FREE, category: 'product_updates' }

  const check = await canSendEmail(userId, config)
  if (!check.allowed) {
    return { success: true, skipped: true, reason: check.reason }
  }

  const appUrl = getAppUrl()
  const firstName = userName.split(' ')[0] || 'there'

  // Check DB template first
  const dbResult = await getDbTemplate(EMAIL_KEYS.WELCOME_TO_FREE)
  if (dbResult.found && !dbResult.active) {
    return { success: true, skipped: true, reason: 'template_inactive' }
  }

  let subject: string
  let html: string

  if (dbResult.template) {
    const vars: Record<string, string> = {
      first_name: escapeHtml(firstName),
      app_url: escapeHtml(appUrl),
      cta_button: ctaButton('Upgrade Your Plan \u2192', `${appUrl}/dashboard/settings`),
    }
    subject = replaceVariables(dbResult.template.subject, vars)
    html = nurtureBaseTemplate(replaceVariables(dbResult.template.body_html, vars), userId)
  } else {
    subject = "You're on Free \u2014 here's what you've got"
    html = nurtureBaseTemplate(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
      You're on the Free plan now, ${escapeHtml(firstName)}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your Builder trial has ended and your account has moved to our Free plan.
      Don't worry &mdash; your monitors are still running. Here's what you've got:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
      <li><strong>3 monitors</strong> with 5-minute check intervals</li>
      <li><strong>Email alerts</strong> for downtime notifications</li>
      <li><strong>1 public status page</strong></li>
      <li><strong>24-hour data retention</strong> for check results</li>
    </ul>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      If you had more than 3 monitors, only the 3 most recently created will remain active.
      You can upgrade anytime to restore all your monitors and unlock advanced features.
    </p>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Plans start from just &pound;19/month.
    </p>
    ${ctaButton('Upgrade Your Plan \u2192', `${appUrl}/dashboard/settings`)}
  `, userId)
  }

  const result = await sendEmail(userEmail, subject, html)

  if (result.success) {
    await recordSendWithDbTracking(userId, config.key)
    logger.info('Welcome to free email sent', { userId })
  }

  return result
}

// ---------------------------------------------------------------------------
// Email #29: Monthly digest
// ---------------------------------------------------------------------------

export async function sendMonthlyDigest(
  userId: string,
  userEmail: string,
  userName: string,
  orgId: string
): Promise<EmailResult> {
  // Monthly digest uses a key with month to allow one per month
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const emailKey = `${EMAIL_KEYS.MONTHLY_DIGEST}_${monthKey}`
  const config: EmailConfig = { key: emailKey, category: 'usage_digests' }

  const check = await canSendEmail(userId, config)
  if (!check.allowed) {
    return { success: true, skipped: true, reason: check.reason }
  }

  const stats = await getOrgMonitorStats(orgId)

  // Skip digest if user has no monitors
  if (stats.totalMonitors === 0) {
    return { success: true, skipped: true, reason: 'no_monitors' }
  }

  const appUrl = getAppUrl()
  const firstName = userName.split(' ')[0] || 'there'
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  const totalChecksFormatted = stats.totalChecks.toLocaleString('en-GB')

  // Build performance note
  const performanceNote = stats.uptimePercent >= 99.9
    ? `<p style="margin:0 0 16px;font-size:14px;color:#16a34a;line-height:1.6;font-weight:500;">Excellent! Your infrastructure maintained ${stats.uptimePercent}% uptime this month.</p>`
    : stats.uptimePercent >= 99
      ? `<p style="margin:0 0 16px;font-size:14px;color:#f59e0b;line-height:1.6;font-weight:500;">Good performance. Consider reviewing the ${stats.incidentCount} incident${stats.incidentCount === 1 ? '' : 's'} that occurred.</p>`
      : `<p style="margin:0 0 16px;font-size:14px;color:#dc2626;line-height:1.6;font-weight:500;">Your uptime was below 99% this month. We recommend reviewing your incidents and monitor configuration.</p>`

  // Build stats table
  const statsTable = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border-collapse:collapse;">
    <tr>${statCell('Monitors', String(stats.totalMonitors))}${statCell('Total Checks', totalChecksFormatted)}</tr>
    <tr>${statCell('Uptime', `${stats.uptimePercent}%`)}${statCell('Incidents', String(stats.incidentCount))}</tr>
    </table>`

  // Check DB template first
  const dbResult = await getDbTemplate(EMAIL_KEYS.MONTHLY_DIGEST)
  if (dbResult.found && !dbResult.active) {
    return { success: true, skipped: true, reason: 'template_inactive' }
  }

  let subject: string
  let html: string

  if (dbResult.template) {
    const vars: Record<string, string> = {
      first_name: escapeHtml(firstName),
      app_url: escapeHtml(appUrl),
      month_name: escapeHtml(monthName),
      total_monitors: String(stats.totalMonitors),
      total_checks: totalChecksFormatted,
      uptime_percent: String(stats.uptimePercent),
      incident_count: String(stats.incidentCount),
      stats_table: statsTable,
      performance_note: performanceNote,
      cta_button: ctaButton('View Dashboard \u2192', `${appUrl}/dashboard`),
    }
    subject = replaceVariables(dbResult.template.subject, vars)
    html = nurtureBaseTemplate(replaceVariables(dbResult.template.body_html, vars), userId)
  } else {
    subject = `${monthName} report: ${totalChecksFormatted} checks, ${stats.uptimePercent}% uptime`
    html = nurtureBaseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">
      Your ${escapeHtml(monthName)} Report
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${escapeHtml(firstName)}, here's how your infrastructure performed this month.
    </p>
    ${statsTable}
    ${performanceNote}
    ${ctaButton('View Dashboard \u2192', `${appUrl}/dashboard`)}
  `, userId)
  }

  const result = await sendEmail(userEmail, subject, html)

  if (result.success) {
    await recordSendWithDbTracking(userId, emailKey)
    logger.info('Monthly digest sent', { userId, month: monthKey })
  }

  return result
}

// ---------------------------------------------------------------------------
// Export email keys for external use
// ---------------------------------------------------------------------------

export { EMAIL_KEYS }
