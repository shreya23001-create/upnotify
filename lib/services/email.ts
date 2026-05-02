import { Resend } from 'resend'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { resolveProviderForType } from '@/lib/db/email-providers'
import type { EmailType, EmailProvider } from '@/lib/db/email-providers'

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
// Provider-specific send functions
// ---------------------------------------------------------------------------

async function sendViaResend(
  provider: EmailProvider,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const cfg = provider.config as { api_key?: string }
  const apiKey = cfg.api_key
  if (!apiKey) return { success: false, error: 'Resend: api_key not configured' }

  const client = new Resend(apiKey)
  const { error } = await client.emails.send({
    from: `${provider.from_name} <${provider.from_email}>`,
    to: [to],
    subject,
    html,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

async function sendViaSendGrid(
  provider: EmailProvider,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const cfg = provider.config as { api_key?: string }
  if (!cfg.api_key) return { success: false, error: 'SendGrid: api_key not configured' }

  const sgMail = (await import('@sendgrid/mail')).default
  sgMail.setApiKey(cfg.api_key)
  await sgMail.send({
    from: { name: provider.from_name, email: provider.from_email },
    to,
    subject,
    html,
  })
  return { success: true }
}

async function sendViaSmtp(
  provider: EmailProvider,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const cfg = provider.config as {
    host?: string
    port?: number
    secure?: boolean
    user?: string
    pass?: string
  }
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { success: false, error: 'SMTP: host, user, and pass are required' }
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: cfg.host,
    port: cfg.port ?? 587,
    secure: cfg.secure ?? false,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  await transporter.sendMail({
    from: `"${provider.from_name}" <${provider.from_email}>`,
    to,
    subject,
    html,
  })
  return { success: true }
}

async function sendViaProvider(
  provider: EmailProvider,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    if (provider.type === 'resend') return await sendViaResend(provider, to, subject, html)
    if (provider.type === 'sendgrid') return await sendViaSendGrid(provider, to, subject, html)
    if (provider.type === 'smtp') return await sendViaSmtp(provider, to, subject, html)
    return { success: false, error: `Unknown provider type: ${provider.type}` }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// Env-var Resend fallback (used when no DB provider is configured)
// ---------------------------------------------------------------------------

function getEnvResendClient(): Resend | null {
  const config = getServerConfig()
  if (!config.resend.apiKey) return null
  return new Resend(config.resend.apiKey)
}

async function sendViaEnvResend(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const config = getServerConfig()
  const client = getEnvResendClient()
  if (!client) {
    logger.warn('No email provider configured and RESEND_API_KEY is not set', { to, subject })
    return { success: false, error: 'No email provider configured' }
  }

  const rateCheck = incrementAndCheckRate()
  if (!rateCheck.allowed) {
    return { success: false, error: 'Daily email limit exceeded (100/day free tier). Email not sent.' }
  }

  const { error } = await client.emails.send({
    from: `${config.resend.fromName} <${config.resend.fromEmail}>`,
    to: [to],
    subject,
    html,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Core send function — routes by email type, falls back to env Resend
// ---------------------------------------------------------------------------

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  emailType: EmailType = 'system'
): Promise<EmailResult> {
  try {
    const provider = await resolveProviderForType(emailType)

    if (provider) {
      const result = await sendViaProvider(provider, to, subject, html)
      if (result.success) {
        logger.info('Email sent', { to, subject, provider: provider.name, type: emailType })
      } else {
        logger.error('Email send failed', { to, subject, provider: provider.name, error: result.error })
      }
      return result
    }

    // No DB provider — fall back to env var Resend
    return await sendViaEnvResend(to, subject, html)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email send error'
    logger.error('Email send exception', { to, subject, error: message })
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// Test send — used by admin UI to verify a provider works
// ---------------------------------------------------------------------------

export async function testEmailProvider(
  provider: EmailProvider,
  testTo: string
): Promise<EmailResult> {
  return sendViaProvider(provider, testTo, 'Uptrue — Email Provider Test', `
    <p style="font-family:sans-serif;font-size:15px;color:#111;">
      ✅ <strong>${provider.name}</strong> is working correctly.<br><br>
      This is a test email from your Uptrue admin panel.
    </p>
  `)
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

  return sendEmail(params.to, params.subject, html, 'monitor_alert')
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

  return sendEmail(params.to, subject, html, 'monitor_alert')
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

  return sendEmail(params.to, subject, html, 'monitor_alert')
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

  return sendEmail(params.to, subject, html, 'incident_notification')
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

  return sendEmail(params.to, subject, html, 'incident_notification')
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

  return sendEmail(params.to, subject, html, 'team_invite')
}

// ---------------------------------------------------------------------------
// Blog approval email
// ---------------------------------------------------------------------------

interface BlogApprovalSource {
  title: string
  url: string
  source: string
  publishedAt?: string
}

type BlogCategory = 'down_alert' | 'llm_news' | 'topic' | 'custom'

const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  down_alert: 'Down Alert',
  llm_news:   'LLM News',
  topic:      'Topic',
  custom:     'Custom',
}

interface BlogApprovalEmailParams {
  to: string
  blogTitle: string
  blogSlug: string
  siteDisplayName: string
  excerpt: string
  category?: BlogCategory  // Used in subject prefix e.g. [Blog:LLM News]
  bodyMarkdown?: string    // Full blog body — rendered as plain text in email
  sourcesCount?: number    // How many sources were used
  sources?: BlogApprovalSource[]  // Full source list with titles, URLs, publish dates
  approveUrl: string
  rejectUrl: string
}

/**
 * Sends an approval request email to the admin with approve/reject buttons.
 * Opened in browser — clicking a button calls the approval endpoint.
 */
export async function sendBlogApprovalEmail(params: BlogApprovalEmailParams): Promise<EmailResult> {
  const categoryLabel = BLOG_CATEGORY_LABELS[params.category ?? 'custom']
  const subject = `[Blog:${categoryLabel}] ${params.blogTitle}`

  // Convert markdown body to basic HTML for email rendering
  const bodyHtml = params.bodyMarkdown
    ? params.bodyMarkdown
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Headings
        .replace(/^### (.+)$/gm, '<h4 style="margin:20px 0 6px;font-size:14px;font-weight:700;color:#111827;">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin:24px 0 8px;font-size:16px;font-weight:700;color:#111827;">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="margin:24px 0 8px;font-size:18px;font-weight:700;color:#111827;">$1</h2>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Inline links — unescape angle brackets first for URLs
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#3b82f6;">$1</a>')
        // Bullet points
        .replace(/^[-*] (.+)$/gm, '<li style="margin:4px 0;font-size:14px;color:#374151;line-height:1.6;">$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:8px 0;padding-left:20px;">${m}</ul>`)
        // Paragraphs — double newline
        .replace(/\n\n/g, '</p><p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.7;">')
    : ''

  // Build sources table — shown at the very top for quick review
  let sourcesBlock = ''
  if (params.sources && params.sources.length > 0) {
    const rows = params.sources.map(s => {
      const pubDate = s.publishedAt ? new Date(s.publishedAt).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      }) + ' UTC' : 'Date unknown'
      return `<tr>
        <td style="padding:6px 8px;font-size:12px;color:#6b7280;white-space:nowrap;vertical-align:top;">${escapeHtml(s.source)}</td>
        <td style="padding:6px 8px;font-size:13px;vertical-align:top;"><a href="${s.url}" style="color:#3b82f6;text-decoration:none;">${escapeHtml(s.title)}</a></td>
        <td style="padding:6px 8px;font-size:12px;color:#9ca3af;white-space:nowrap;vertical-align:top;">${pubDate}</td>
      </tr>`
    }).join('')
    sourcesBlock = `
    <div style="margin:0 0 24px;padding:16px;background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;">Research Sources (${params.sources.length})</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>`
  } else if (params.sourcesCount) {
    sourcesBlock = `<p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Research pulled from <strong>${params.sourcesCount} sources</strong> (official status page, Google News, Reddit, X).</p>`
  }

  const headerTitle = `New Blog Draft — ${categoryLabel}`
  const headerDesc = params.category === 'down_alert'
    ? `Uptrue auto-generated a blog post about the <strong>${escapeHtml(params.siteDisplayName)}</strong> outage.`
    : params.category === 'llm_news'
    ? `Uptrue detected a new LLM launch: <strong>${escapeHtml(params.siteDisplayName)}</strong>.`
    : `Uptrue auto-generated a blog post for topic: <strong>${escapeHtml(params.siteDisplayName)}</strong>.`

  const html = baseTemplate(`
    <h2 style="margin:0 0 4px;font-size:18px;color:#111827;">${escapeHtml(headerTitle)}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      ${headerDesc}
      Review the sources below, read the full post, then approve or reject.
    </p>

    ${sourcesBlock}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${params.approveUrl}" style="display:block;padding:12px 0;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">
            ✓ Approve &amp; Publish
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="${params.rejectUrl}" style="display:block;padding:12px 0;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">
            ✗ Reject
          </a>
        </td>
      </tr>
    </table>

    <div style="margin:0 0 24px;padding:20px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Title</p>
      <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#111827;">${escapeHtml(params.blogTitle)}</p>
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Meta excerpt</p>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280;font-style:italic;">${escapeHtml(params.excerpt)}</p>
      <hr style="margin:0 0 20px;border:none;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.7;">${bodyHtml}</p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${params.approveUrl}" style="display:block;padding:12px 0;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">
            ✓ Approve &amp; Publish
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="${params.rejectUrl}" style="display:block;padding:12px 0;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">
            ✗ Reject
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
      Approving publishes immediately. Rejecting deletes the draft. Links expire in 7 days.
    </p>
  `)

  return sendEmail(params.to, subject, html, 'blog_approval')
}

// ---------------------------------------------------------------------------
// AI Visibility — Citation report email
// ---------------------------------------------------------------------------

interface CitationReportEmailParams {
  to:      string
  domain:  string
  score:   number
  citedBy: string[]
  runUrl:  string
}

export async function sendCitationReportEmail(params: CitationReportEmailParams): Promise<EmailResult> {
  const scoreColor  = params.score >= 75 ? '#16a34a' : params.score >= 40 ? '#d97706' : '#dc2626'
  const scoreLabel  = params.score >= 75 ? 'Good' : params.score >= 40 ? 'Needs Work' : 'Low Visibility'
  const citedList   = params.citedBy.length > 0
    ? params.citedBy.map(e => `<li style="margin:4px 0;font-size:14px;color:#374151;">✓ ${escapeHtml(e)}</li>`).join('')
    : '<li style="margin:4px 0;font-size:14px;color:#6b7280;">Not cited by any engine in this check</li>'

  const html = baseTemplate(`
    <h2 style="margin:0 0 4px;font-size:18px;color:#111827;">AI Citation Check Complete</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
      Your citation check for <strong>${escapeHtml(params.domain)}</strong> has finished.
    </p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:42px;font-weight:800;color:${scoreColor};">${params.score}</div>
      <div style="font-size:13px;color:${scoreColor};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${scoreLabel}</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px;">AI Visibility Score</div>
    </div>

    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;">Cited by:</p>
    <ul style="margin:0 0 24px;padding-left:20px;">
      ${citedList}
    </ul>

    <a href="${params.runUrl}" style="display:block;padding:12px 0;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">
      View Full Report →
    </a>

    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      Manage your AI Visibility settings at uptrue.io/dashboard/ai-visibility
    </p>
  `)

  return sendEmail(params.to, `AI Citation Check: ${params.domain} — Score ${params.score}/100`, html, 'citation_report')
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


// ---------------------------------------------------------------------------
// Boss Digest — daily 07:00 batched email of all pending calendar drafts
// ---------------------------------------------------------------------------

interface BossDigestPostCard {
  id: string
  title: string
  slug: string
  excerpt: string
  postType: string
  primaryKeyword: string
  author: string
  wordCount: number
  faqCount: number
  internalLinkCount: number
  dodPass: boolean
  review: {
    highlights: string[]
    worries: string[]
    toneScore: number
    factsToVerify: string[]
    legalSensitivities: string[]
    recommendedAction: 'approve' | 'edit' | 'reject'
    recommendedActionReason: string
    dodSummary: {
      pass: boolean
      hardFailCount: number
      softFailCount: number
      hardFailIds: string[]
      softFailIds: string[]
    }
  } | null
  approveToken: string
  rejectToken: string
}

interface BossDigestEmailParams {
  to: string[]
  posts: BossDigestPostCard[]
}

interface BossDigestResult extends EmailResult {
  messageId?: string
}

export async function sendBossDigestEmail(params: BossDigestEmailParams): Promise<BossDigestResult> {
  const { app } = getServerConfig()
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const subject = `📋 Uptrue Daily Boss Digest — ${today} (${params.posts.length} draft${params.posts.length === 1 ? '' : 's'})`
  const html = buildDigestHtml(params.posts, app.url, today)

  const results = await Promise.all(
    params.to.map(addr => sendEmail(addr, subject, html, 'system'))
  )

  const allSucceeded = results.every(r => r.success)
  const firstError = results.find(r => !r.success)?.error

  return {
    success: allSucceeded,
    error: firstError,
  }
}

function buildDigestHtml(posts: BossDigestPostCard[], appUrl: string, today: string): string {
  const cards = posts.map((p, i) => buildDigestCard(p, i + 1, appUrl)).join('\n')

  const summary = `
    <p style="font-family:sans-serif;font-size:14px;color:#475569;margin:0 0 16px;">
      ${posts.length} draft${posts.length === 1 ? '' : 's'} pending your approval.
      Click <strong>Approve</strong> to publish (auto-social posts will fire).
      Click <strong>Read full draft</strong> to review the body before deciding.
    </p>
  `

  const inner = `
    <h1 style="font-family:sans-serif;font-size:22px;color:#0f172a;margin:0 0 8px;">Uptrue Daily Boss Digest</h1>
    <div style="font-family:sans-serif;font-size:13px;color:#64748b;margin:0 0 24px;">${today} · ${posts.length} draft${posts.length === 1 ? '' : 's'}</div>
    ${summary}
    ${cards}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;" />
    <p style="font-family:sans-serif;font-size:12px;color:#94a3b8;margin:0;">
      Pipeline: content_calendar → calendar-blog-generator → blog-reviewer → Boss Digest (you are here) → /api/admin/blog-approve → published.
      Drafts not approved within 7 days are auto-rejected (configurable).
    </p>
  `

  return baseTemplate(inner)
}

function buildDigestCard(p: BossDigestPostCard, index: number, appUrl: string): string {
  const approveUrl = `${appUrl}/api/admin/blog-approve?token=${p.approveToken}`
  const rejectUrl = `${appUrl}/api/admin/blog-approve?token=${p.rejectToken}`
  const draftUrl = `${appUrl}/admin/blog/${p.id}`

  const dodColour = p.dodPass ? '#16a34a' : '#dc2626'
  const dodLabel = p.dodPass ? 'PASS' : 'HARD FAILS'

  const highlights = p.review?.highlights ?? []
  const worries = p.review?.worries ?? []
  const recommendedAction = p.review?.recommendedAction ?? 'edit'
  const actionColour = recommendedAction === 'approve' ? '#16a34a' : recommendedAction === 'reject' ? '#dc2626' : '#ea580c'

  const highlightsHtml = highlights.length === 0
    ? '<em style="color:#94a3b8;">No highlights generated</em>'
    : highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')

  const worriesHtml = worries.length === 0
    ? '<em style="color:#94a3b8;">No concerns</em>'
    : worries.map(w => `<li>${escapeHtml(w)}</li>`).join('')

  const factsHtml = p.review && p.review.factsToVerify.length > 0
    ? `<div style="font-family:sans-serif;font-size:13px;margin:8px 0;">
        <strong style="color:#92400e;">📌 Facts to verify:</strong>
        <ul style="margin:4px 0 0 20px;color:#475569;">${p.review.factsToVerify.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      </div>`
    : ''

  const legalHtml = p.review && p.review.legalSensitivities.length > 0
    ? `<div style="font-family:sans-serif;font-size:13px;margin:8px 0;">
        <strong style="color:#dc2626;">⚖️ Legal/brand:</strong>
        <ul style="margin:4px 0 0 20px;color:#475569;">${p.review.legalSensitivities.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
      </div>`
    : ''

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 16px;background:#fff;font-family:sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin:0 0 8px;">
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">#${index} · ${escapeHtml(p.postType)} · ${escapeHtml(p.author)}</div>
          <h2 style="font-size:18px;color:#0f172a;margin:4px 0 0;font-weight:700;">${escapeHtml(p.title)}</h2>
        </div>
        <div style="text-align:right;">
          <div style="display:inline-block;background:${dodColour};color:#fff;font-size:11px;padding:3px 8px;border-radius:4px;font-weight:600;">DoD ${dodLabel}</div>
        </div>
      </div>

      <div style="font-size:13px;color:#475569;margin:0 0 12px;">
        Primary KW: <strong>"${escapeHtml(p.primaryKeyword)}"</strong> · Words: ${p.wordCount} · FAQ: ${p.faqCount} · Internal links: ${p.internalLinkCount} · Tone: ${p.review?.toneScore ?? '—'}/10
      </div>

      <p style="font-size:13px;color:#334155;margin:0 0 12px;line-height:1.5;">${escapeHtml(p.excerpt)}</p>

      <div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:8px 12px;margin:8px 0;font-size:13px;">
        <strong style="color:#15803d;">✅ Highlights:</strong>
        <ul style="margin:4px 0 0 20px;color:#334155;">${highlightsHtml}</ul>
      </div>

      <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:8px 12px;margin:8px 0;font-size:13px;">
        <strong style="color:#b45309;">⚠️ Worries:</strong>
        <ul style="margin:4px 0 0 20px;color:#334155;">${worriesHtml}</ul>
      </div>

      ${factsHtml}
      ${legalHtml}

      <div style="font-size:13px;color:#64748b;margin:12px 0 8px;">
        <strong style="color:${actionColour};">Reviewer recommends: ${escapeHtml(recommendedAction)}</strong>
        ${p.review?.recommendedActionReason ? ` — ${escapeHtml(p.review.recommendedActionReason)}` : ''}
      </div>

      <div style="margin-top:12px;">
        <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;margin-right:6px;">✅ Approve</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#fff;color:#dc2626;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #dc2626;margin-right:6px;">❌ Reject</a>
        <a href="${draftUrl}" style="display:inline-block;color:#3b82f6;text-decoration:none;padding:8px 16px;font-size:13px;font-weight:500;">👀 Read full draft →</a>
      </div>
    </div>
  `
}