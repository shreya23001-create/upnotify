import { Resend } from 'resend'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailResult {
  success: boolean
  error?: string
}

interface AlertEmailParams {
  to: string
  subject: string
  body: string
}

interface MonitorDownEmailParams {
  to: string
  monitorName: string
  monitorUrl: string
  errorMessage: string
  timestamp: string
  severity: string
  dashboardUrl: string
}

interface MonitorUpEmailParams {
  to: string
  monitorName: string
  monitorUrl: string
  downtimeDuration: string
  timestamp: string
  dashboardUrl: string
}

interface IncidentCreatedEmailParams {
  to: string
  incidentTitle: string
  monitorName: string
  monitorUrl: string
  severity: string
  startedAt: string
  dashboardUrl: string
}

interface IncidentResolvedEmailParams {
  to: string
  incidentTitle: string
  monitorName: string
  monitorUrl: string
  startedAt: string
  resolvedAt: string
  downtimeDuration: string
  dashboardUrl: string
}

// ---------------------------------------------------------------------------
// Rate limit tracking (free tier: 100 emails/day)
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 100
const WARNING_THRESHOLD = 80

interface RateTracker {
  count: number
  resetDate: string
}

let rateTracker: RateTracker = {
  count: 0,
  resetDate: new Date().toISOString().slice(0, 10),
}

function incrementAndCheckRate(): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10)

  if (rateTracker.resetDate !== today) {
    rateTracker = { count: 0, resetDate: today }
  }

  rateTracker.count += 1

  if (rateTracker.count > DAILY_LIMIT) {
    logger.error('Resend daily email limit exceeded', {
      count: rateTracker.count,
      limit: DAILY_LIMIT,
    })
    return { allowed: false, remaining: 0 }
  }

  const remaining = DAILY_LIMIT - rateTracker.count

  if (rateTracker.count >= WARNING_THRESHOLD) {
    logger.warn('Approaching Resend daily email limit', {
      sent: rateTracker.count,
      remaining,
      limit: DAILY_LIMIT,
    })
  }

  return { allowed: true, remaining }
}

// ---------------------------------------------------------------------------
// Resend client (lazy singleton)
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (resendClient) return resendClient

  const config = getServerConfig()

  if (!config.resend.apiKey) {
    logger.warn('RESEND_API_KEY is not configured — emails will be logged only')
    return null
  }

  resendClient = new Resend(config.resend.apiKey)
  return resendClient
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const config = getServerConfig()
  const client = getResendClient()

  if (!client) {
    logger.warn('Email send skipped — RESEND_API_KEY is not configured. Set the RESEND_API_KEY environment variable to enable email delivery.', { to, subject })
    return { success: false, error: 'Email not sent — RESEND_API_KEY is not configured' }
  }

  const rateCheck = incrementAndCheckRate()
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: 'Daily email limit exceeded (100/day free tier). Email not sent.',
    }
  }

  try {
    const { error } = await client.emails.send({
      from: `${config.resend.fromName} <${config.resend.fromEmail}>`,
      to: [to],
      subject,
      html,
    })

    if (error) {
      logger.error('Resend API error', {
        to,
        subject,
        error: error.message,
      })
      return { success: false, error: error.message }
    }

    logger.info('Email sent successfully', {
      to,
      subject,
      remaining: rateCheck.remaining,
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email send error'
    logger.error('Email send exception', { to, subject, error: message })
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// HTML email templates
// ---------------------------------------------------------------------------

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Uptrue Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #eaeaea;">
<span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Uptrue</span>
</td></tr>

<!-- Content -->
<tr><td style="padding:24px 32px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;">
<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
You are receiving this because you have alert notifications enabled on Uptrue.<br>
<a href="https://uptrue.io" style="color:#6b7280;text-decoration:underline;">uptrue.io</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function statusBadge(status: 'down' | 'up' | 'incident' | 'resolved'): string {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    down: { bg: '#fef2f2', text: '#dc2626', label: 'DOWN' },
    up: { bg: '#f0fdf4', text: '#16a34a', label: 'RECOVERED' },
    incident: { bg: '#fef2f2', text: '#dc2626', label: 'INCIDENT' },
    resolved: { bg: '#f0fdf4', text: '#16a34a', label: 'RESOLVED' },
  }
  const c = colors[status]
  return `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;background-color:${c.bg};color:${c.text};letter-spacing:0.5px;">${c.label}</span>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
<td style="padding:8px 0;font-size:14px;color:#6b7280;width:120px;vertical-align:top;">${label}</td>
<td style="padding:8px 0;font-size:14px;color:#111827;font-weight:500;">${value}</td>
</tr>`
}

function actionButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:10px 24px;background-color:#111827;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px;margin-top:8px;">${text}</a>`
}

// ---------------------------------------------------------------------------
// Public email functions
// ---------------------------------------------------------------------------

/**
 * Generic alert email — used by the alert dispatcher for backward compatibility.
 * Sends a plain-text-style HTML email.
 */
export async function sendAlertEmail(params: AlertEmailParams): Promise<EmailResult> {
  const html = baseTemplate(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${escapeHtml(params.subject)}</p>
    <pre style="margin:0;padding:16px;background-color:#f9fafb;border-radius:6px;font-size:13px;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.6;font-family:monospace;">${escapeHtml(params.body)}</pre>
  `)

  return sendEmail(params.to, params.subject, html)
}

/**
 * Monitor DOWN alert with structured HTML template.
 */
export async function sendMonitorDownEmail(params: MonitorDownEmailParams): Promise<EmailResult> {
  const subject = `[${params.severity.toUpperCase()}] ${params.monitorName} is DOWN`

  const html = baseTemplate(`
    <div style="margin-bottom:20px;">
      ${statusBadge('down')}
    </div>
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(params.monitorName)} is down</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">We detected that your monitor is not responding.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${detailRow('Monitor', escapeHtml(params.monitorName))}
      ${detailRow('URL', escapeHtml(params.monitorUrl))}
      ${detailRow('Error', escapeHtml(params.errorMessage))}
      ${detailRow('Severity', params.severity.toUpperCase())}
      ${detailRow('Detected', formatTimestamp(params.timestamp))}
    </table>

    ${actionButton('View Monitor', params.dashboardUrl)}
  `)

  return sendEmail(params.to, subject, html)
}

/**
 * Monitor UP recovery email with structured HTML template.
 */
export async function sendMonitorUpEmail(params: MonitorUpEmailParams): Promise<EmailResult> {
  const subject = `Recovered: ${params.monitorName} is back up`

  const html = baseTemplate(`
    <div style="margin-bottom:20px;">
      ${statusBadge('up')}
    </div>
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(params.monitorName)} is back up</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Your monitor has recovered and is responding normally.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${detailRow('Monitor', escapeHtml(params.monitorName))}
      ${detailRow('URL', escapeHtml(params.monitorUrl))}
      ${detailRow('Downtime', escapeHtml(params.downtimeDuration))}
      ${detailRow('Recovered', formatTimestamp(params.timestamp))}
    </table>

    ${actionButton('View Monitor', params.dashboardUrl)}
  `)

  return sendEmail(params.to, subject, html)
}

/**
 * Incident created notification email.
 */
export async function sendIncidentCreatedEmail(params: IncidentCreatedEmailParams): Promise<EmailResult> {
  const subject = `[Incident] ${params.incidentTitle}`

  const html = baseTemplate(`
    <div style="margin-bottom:20px;">
      ${statusBadge('incident')}
    </div>
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(params.incidentTitle)}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">A new incident has been created for one of your monitors.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${detailRow('Monitor', escapeHtml(params.monitorName))}
      ${detailRow('URL', escapeHtml(params.monitorUrl))}
      ${detailRow('Severity', params.severity.toUpperCase())}
      ${detailRow('Started', formatTimestamp(params.startedAt))}
    </table>

    ${actionButton('View Incident', params.dashboardUrl)}
  `)

  return sendEmail(params.to, subject, html)
}

/**
 * Incident resolved notification email.
 */
export async function sendIncidentResolvedEmail(params: IncidentResolvedEmailParams): Promise<EmailResult> {
  const subject = `[Resolved] ${params.incidentTitle}`

  const html = baseTemplate(`
    <div style="margin-bottom:20px;">
      ${statusBadge('resolved')}
    </div>
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(params.incidentTitle)}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">This incident has been resolved. Your service is operational.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${detailRow('Monitor', escapeHtml(params.monitorName))}
      ${detailRow('URL', escapeHtml(params.monitorUrl))}
      ${detailRow('Started', formatTimestamp(params.startedAt))}
      ${detailRow('Resolved', formatTimestamp(params.resolvedAt))}
      ${detailRow('Duration', escapeHtml(params.downtimeDuration))}
    </table>

    ${actionButton('View Incident', params.dashboardUrl)}
  `)

  return sendEmail(params.to, subject, html)
}

// ---------------------------------------------------------------------------
// Utility: get current rate usage (for admin dashboards / health checks)
// ---------------------------------------------------------------------------

export function getEmailRateStatus(): { sent: number; limit: number; remaining: number; resetDate: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (rateTracker.resetDate !== today) {
    return { sent: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetDate: today }
  }
  return {
    sent: rateTracker.count,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - rateTracker.count),
    resetDate: rateTracker.resetDate,
  }
}

// ---------------------------------------------------------------------------
// Team invite email
// ---------------------------------------------------------------------------

interface TeamInviteEmailParams {
  to: string
  orgName: string
  inviterName: string
  role: string
  acceptUrl: string
}

/**
 * Sends an email inviting someone to join an organisation on Uptrue.
 */
export async function sendTeamInviteEmail(params: TeamInviteEmailParams): Promise<EmailResult> {
  const subject = `You've been invited to join ${params.orgName} on Uptrue`

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">You&rsquo;ve been invited!</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      ${escapeHtml(params.inviterName)} has invited you to join
      <strong>${escapeHtml(params.orgName)}</strong> on Uptrue as a
      <strong>${escapeHtml(params.role)}</strong>.
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
      Click the button below to accept the invite and join the team.
    </p>

    ${actionButton('Accept Invite', params.acceptUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
      This invite expires in 7 days. If you did not expect this email, you can safely ignore it.
    </p>
  `)

  return sendEmail(params.to, subject, html)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}
