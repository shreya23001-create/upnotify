import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { computeMonitorTypeHealth, type MonitorTypeHealth } from '@/app/api/admin/monitor-type-health/route'
import { sendEmail } from '@/lib/services/email'
import { getServerConfig } from '@/lib/utils/config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function isAuthorised(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

function statusDot(status: MonitorTypeHealth['status']): string {
  if (status === 'healthy') return '🟢'
  if (status === 'warning') return '🟡'
  if (status === 'critical') return '🔴'
  return '⚪'
}

function statusColor(status: MonitorTypeHealth['status']): string {
  if (status === 'healthy') return '#10b981'
  if (status === 'warning') return '#f59e0b'
  if (status === 'critical') return '#ef4444'
  return '#94a3b8'
}

function statusBg(status: MonitorTypeHealth['status']): string {
  if (status === 'healthy') return '#ecfdf5'
  if (status === 'warning') return '#fffbeb'
  if (status === 'critical') return '#fef2f2'
  return '#f8fafc'
}

const TYPE_LABELS: Record<string, string> = {
  http: 'HTTP Uptime', ssl: 'SSL Certificate', dns: 'DNS Records',
  keyword: 'Keyword Detection', domain: 'Domain Expiry', port: 'Port Check',
  ping: 'Ping', api: 'API Endpoint', heartbeat: 'Heartbeat',
  competitor: 'Page Change', 'security-headers': 'Security Headers',
  'response-time': 'Response Time', 'robots-txt': 'robots.txt',
  'ip-change': 'IP Address', 'mx-health': 'MX Health', 'whois-change': 'WHOIS',
  sitemap: 'Sitemap', 'redirect-chain': 'Redirect Chain', 'spf-dmarc': 'SPF/DMARC',
  blacklist: 'Blacklist', 'page-size': 'Page Size',
  'cookie-consent': 'Cookie Consent', 'nameserver-change': 'Nameservers',
}

function buildEmailHtml(data: MonitorTypeHealth[], date: string, appUrl: string): string {
  const critical = data.filter(d => d.status === 'critical')
  const warning = data.filter(d => d.status === 'warning')
  const healthy = data.filter(d => d.status === 'healthy')

  const summaryColor = critical.length > 0 ? '#ef4444' : warning.length > 0 ? '#f59e0b' : '#10b981'
  const summaryText = critical.length > 0
    ? `⚠️ ${critical.length} monitor type${critical.length !== 1 ? 's' : ''} need attention`
    : warning.length > 0
    ? `${warning.length} monitor type${warning.length !== 1 ? 's' : ''} showing warnings`
    : `All ${healthy.length} monitor types healthy ✓`

  const rows = data.map(d => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:10px 14px;">
        <span style="font-size:14px;">${statusDot(d.status)}</span>
        <strong style="margin-left:8px;color:#1e293b;">${TYPE_LABELS[d.type] ?? d.type}</strong>
      </td>
      <td style="padding:10px 14px;text-align:center;font-weight:700;color:${statusColor(d.status)};font-size:15px;">
        ${d.totalChecks > 0 ? `${d.uptimePercent}%` : '—'}
      </td>
      <td style="padding:10px 14px;text-align:center;color:#475569;">${d.totalMonitors}</td>
      <td style="padding:10px 14px;text-align:center;color:#475569;">${d.totalChecks.toLocaleString()}</td>
      <td style="padding:10px 14px;text-align:center;color:#475569;">${d.downChecks > 0 ? `<span style="color:#ef4444;font-weight:600;">${d.downChecks}</span>` : '0'}</td>
      <td style="padding:10px 14px;text-align:center;color:#475569;">${d.avgResponseMs > 0 ? `${d.avgResponseMs}ms` : '—'}</td>
      <td style="padding:10px 14px;">
        <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${statusBg(d.status)};color:${statusColor(d.status)};text-transform:capitalize;">
          ${d.status === 'no-data' ? 'No data' : d.status}
        </span>
        ${d.topErrors.length > 0 ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${d.topErrors[0]}</div>` : ''}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fa;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#1a1a2e;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">uptrue</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Super Admin · Monitor Health Report</div>
              </td>
              <td align="right">
                <div style="font-size:12px;color:#94a3b8;">${date}</div>
                <div style="font-size:12px;color:#94a3b8;">Last 24 hours</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Summary banner -->
      <tr>
        <td style="padding:20px 32px;background:${critical.length > 0 ? '#fef2f2' : warning.length > 0 ? '#fffbeb' : '#ecfdf5'};border-bottom:1px solid ${critical.length > 0 ? '#fecaca' : warning.length > 0 ? '#fde68a' : '#a7f3d0'};">
          <div style="font-size:16px;font-weight:700;color:${summaryColor};">${summaryText}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">
            🟢 ${healthy.length} healthy &nbsp;·&nbsp; 🟡 ${warning.length} warning &nbsp;·&nbsp; 🔴 ${critical.length} critical
          </div>
        </td>
      </tr>

      ${critical.length > 0 ? `
      <!-- Critical issues callout -->
      <tr>
        <td style="padding:20px 32px;">
          <div style="font-size:14px;font-weight:700;color:#ef4444;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">⚠ Critical — Requires Attention</div>
          ${critical.map(d => `
          <div style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:8px;">
            <div style="font-weight:600;color:#1e293b;">${TYPE_LABELS[d.type] ?? d.type} — ${d.uptimePercent}% uptime</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">
              ${d.totalMonitors} monitors · ${d.downChecks} failing checks · ${d.failingMonitors} monitors affected
            </div>
            ${d.topErrors.length > 0 ? `
            <div style="font-size:12px;color:#ef4444;margin-top:6px;font-style:italic;">
              Top error: ${d.topErrors[0]}
            </div>` : ''}
          </div>`).join('')}
        </td>
      </tr>` : ''}

      <!-- Full table -->
      <tr>
        <td style="padding:8px 32px 24px;">
          <div style="font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">All Monitor Types</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                <th style="padding:10px 14px;text-align:left;font-weight:600;color:#475569;">Type</th>
                <th style="padding:10px 14px;text-align:center;font-weight:600;color:#475569;">Uptime</th>
                <th style="padding:10px 14px;text-align:center;font-weight:600;color:#475569;">Monitors</th>
                <th style="padding:10px 14px;text-align:center;font-weight:600;color:#475569;">Checks</th>
                <th style="padding:10px 14px;text-align:center;font-weight:600;color:#475569;">Failures</th>
                <th style="padding:10px 14px;text-align:center;font-weight:600;color:#475569;">Avg RT</th>
                <th style="padding:10px 14px;text-align:left;font-weight:600;color:#475569;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:16px 32px 28px;text-align:center;">
          <a href="${appUrl}/admin/monitor-health" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#ffffff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
            View Full Dashboard →
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <div style="font-size:12px;color:#94a3b8;">Upnotify Super Admin · Monitor Health Report · Sent daily at 8:00 AM</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">uptrue.io</div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/monitor-health-report', getTriggeredBy(req))
  const { adminEmails, app: { url: appUrl } } = getServerConfig()

  try {
    const data = await computeMonitorTypeHealth(24)

    const critical = data.filter(d => d.status === 'critical')
    const warning = data.filter(d => d.status === 'warning')
    const healthy = data.filter(d => d.status === 'healthy')

    const date = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const subject = critical.length > 0
      ? `🔴 Upnotify Monitor Health — ${critical.length} type${critical.length !== 1 ? 's' : ''} critical — ${date}`
      : warning.length > 0
      ? `🟡 Upnotify Monitor Health — ${warning.length} warning${warning.length !== 1 ? 's' : ''} — ${date}`
      : `🟢 Upnotify Monitor Health — All healthy — ${date}`

    const html = buildEmailHtml(data, date, appUrl)

    let sent = 0
    for (const email of adminEmails) {
      const result = await sendEmail(email, subject, html)
      if (result.success) sent++
    }

    const summary = `types: ${data.length}, critical: ${critical.length}, warning: ${warning.length}, healthy: ${healthy.length}, emails: ${sent}`
    logger.info('Monitor health report sent', { critical: critical.length, warning: warning.length, healthy: healthy.length })
    await endCronRun(runId, cronStart, 'ok', { summary })

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Monitor health report cron failed', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
