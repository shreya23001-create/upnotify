// =============================================================================
// AOE — Automated Outreach Engine
// Admin API: aoe-discovery-report — sends a pipeline data quality report email
//
// GET /api/admin/aoe-discovery-report
//
// Queries aoe_site_discovery and emails a full breakdown to the super admin.
// Use this to test the pipeline without sending outreach emails.
//
// NOTE: daily_discovery_limit is currently set to 50 for dev testing.
//       Run: UPDATE aoe_settings SET value = '500' WHERE key = 'daily_discovery_limit'
//       before production go-live.
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/services/email'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

// ---------------------------------------------------------------------------
// Types (local — no import needed)
// ---------------------------------------------------------------------------

interface DiscoveryRow {
  domain: string
  email: string | null
  email_source: string | null
  platform: string | null
  status: string
  skip_reason: string | null
  check_count: number
  has_llms_txt: boolean | null
  discovered_at: string
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '—'
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${color};color:#fff;">${escapeHtml(label)}</span>`
}

function sourceBadge(source: string | null): string {
  const map: Record<string, string> = {
    whois:         '#7c3aed',
    rdap:          '#2563eb',
    website_scrape:'#059669',
    pattern_guess: '#d97706',
  }
  const s = source ?? 'unknown'
  return badge(s, map[s] ?? '#6b7280')
}

function platformBadge(platform: string | null): string {
  const map: Record<string, string> = {
    shopify:    '#96bf48',
    woocommerce:'#7f54b3',
    general:    '#6b7280',
  }
  const p = platform ?? 'general'
  return badge(p, map[p] ?? '#6b7280')
}

function llmsBadge(has: boolean | null): string {
  if (has === true)  return badge('has llms.txt', '#059669')
  if (has === false) return badge('no llms.txt', '#dc2626')
  return badge('not checked', '#9ca3af')
}

// ---------------------------------------------------------------------------
// Build HTML email
// ---------------------------------------------------------------------------

function buildReportEmail(rows: DiscoveryRow[]): string {
  const withEmail    = rows.filter(r => r.email)
  const withoutEmail = rows.filter(r => !r.email)
  const emailed      = rows.filter(r => r.status === 'emailed')
  const ready        = rows.filter(r => r.status === 'ready')
  const checking     = rows.filter(r => r.status === 'checking' || r.status === 'pending_check')
  const skipped      = rows.filter(r => r.status === 'skip')

  const findRate = rows.length > 0 ? Math.round((withEmail.length / rows.length) * 100) : 0

  // Source breakdown
  const sourceCount: Record<string, number> = {}
  for (const r of withEmail) {
    const s = r.email_source ?? 'unknown'
    sourceCount[s] = (sourceCount[s] ?? 0) + 1
  }

  // Platform breakdown
  const platformCount: Record<string, number> = {}
  for (const r of rows) {
    const p = r.platform ?? 'general'
    platformCount[p] = (platformCount[p] ?? 0) + 1
  }

  // llms.txt stats (only from rows that had it checked)
  const llmsChecked    = withEmail.filter(r => r.has_llms_txt !== null)
  const llmsMissing    = llmsChecked.filter(r => r.has_llms_txt === false).length
  const llmsPresent    = llmsChecked.filter(r => r.has_llms_txt === true).length

  // Skip reason breakdown
  const skipCount: Record<string, number> = {}
  for (const r of withoutEmail) {
    const sr = r.skip_reason ?? 'unknown'
    skipCount[sr] = (skipCount[sr] ?? 0) + 1
  }

  // --- Summary section ---
  const summaryRows = [
    ['Total discovered',          rows.length.toString()],
    ['With valid email',          `${withEmail.length} <span style="color:#6b7280;font-size:13px;">(${findRate}% find rate)</span>`],
    ['Without email',             withoutEmail.length.toString()],
    ['Status — ready to email',   ready.length.toString()],
    ['Status — checking',         checking.length.toString()],
    ['Status — emailed',          emailed.length.toString()],
    ['Status — skipped',          skipped.length.toString()],
    ['llms.txt — missing',        llmsMissing.toString()],
    ['llms.txt — present',        llmsPresent.toString()],
    ['llms.txt — not yet checked',llmsChecked.length === 0 ? '(run outreach-checker first)' : (llmsChecked.length - llmsMissing - llmsPresent).toString()],
  ]

  const summaryHtml = summaryRows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:14px;color:#6b7280;white-space:nowrap;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${value}</td>
    </tr>`).join('')

  const sourceHtml = Object.entries(sourceCount).map(([src, cnt]) => `
    <tr>
      <td style="padding:6px 12px 6px 0;font-size:13px;">${sourceBadge(src)}</td>
      <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${cnt} emails (${Math.round((cnt / withEmail.length) * 100)}%)</td>
    </tr>`).join('') || '<tr><td colspan="2" style="color:#9ca3af;font-size:13px;padding:8px 0;">No emails found yet</td></tr>'

  const platformHtml = Object.entries(platformCount).map(([p, cnt]) => `
    <tr>
      <td style="padding:6px 12px 6px 0;font-size:13px;">${platformBadge(p)}</td>
      <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${cnt} sites</td>
    </tr>`).join('')

  // --- Table 1: With email ---
  const withEmailRows = withEmail.map(r => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:8px;font-size:13px;color:#111827;font-weight:500;">${escapeHtml(r.domain)}</td>
      <td style="padding:8px;font-size:12px;color:#374151;word-break:break-all;">${escapeHtml(r.email)}</td>
      <td style="padding:8px;">${sourceBadge(r.email_source)}</td>
      <td style="padding:8px;">${platformBadge(r.platform)}</td>
      <td style="padding:8px;">${llmsBadge(r.has_llms_txt)}</td>
      <td style="padding:8px;font-size:12px;color:#6b7280;text-align:center;">${r.check_count}</td>
      <td style="padding:8px;font-size:12px;color:#6b7280;">${badge(r.status, r.status === 'ready' ? '#059669' : r.status === 'emailed' ? '#7c3aed' : '#6b7280')}</td>
    </tr>`).join('')

  // --- Table 2: Without email ---
  const withoutEmailRows = withoutEmail.map(r => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:8px;font-size:13px;color:#111827;font-weight:500;">${escapeHtml(r.domain)}</td>
      <td style="padding:8px;">${platformBadge(r.platform)}</td>
      <td style="padding:8px;font-size:12px;color:#9ca3af;font-style:italic;">${escapeHtml(r.skip_reason)}</td>
      <td style="padding:8px;font-size:12px;color:#6b7280;">${new Date(r.discovered_at).toLocaleDateString('en-GB')}</td>
    </tr>`).join('')

  const skipBreakdownHtml = Object.entries(skipCount).map(([reason, cnt]) =>
    `<li style="margin:4px 0;font-size:13px;color:#374151;"><strong>${cnt}</strong> × ${escapeHtml(reason)}</li>`
  ).join('') || '<li style="font-size:13px;color:#9ca3af;">No skipped sites</li>'

  const tableStyle = 'width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,sans-serif;'
  const thStyle    = 'padding:8px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;text-align:left;border-bottom:2px solid #e5e7eb;background:#f9fafb;'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AOE Discovery Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:900px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #eaeaea;background:linear-gradient(135deg,#1e293b,#0f172a);">
  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Uptrue</span>
  <span style="font-size:14px;color:#94a3b8;margin-left:12px;">AOE Discovery Report</span>
  <p style="margin:6px 0 0;font-size:12px;color:#64748b;">Generated: ${new Date().toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</p>
</td></tr>

<!-- Summary -->
<tr><td style="padding:28px 32px 0;">
  <h2 style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;">Pipeline Summary</h2>
  <div style="display:grid;gap:16px;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${summaryHtml}
    </table>
  </div>

  <div style="display:flex;gap:40px;flex-wrap:wrap;margin-top:24px;">
    <div>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Email source breakdown</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${sourceHtml}</table>
    </div>
    <div>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Platform breakdown</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${platformHtml}</table>
    </div>
    <div>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Skip reasons</p>
      <ul style="margin:0;padding-left:20px;">${skipBreakdownHtml}</ul>
    </div>
  </div>
</td></tr>

<!-- Table 1: With email -->
<tr><td style="padding:28px 32px 0;">
  <h2 style="margin:0 0 4px;font-size:18px;color:#111827;font-weight:700;">
    Sites with valid email
    <span style="font-size:14px;font-weight:400;color:#6b7280;margin-left:8px;">${withEmail.length} sites</span>
  </h2>
  <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">These are outreach candidates. Ready = categorised and queued. Checking = still being monitored.</p>
  ${withEmail.length === 0
    ? '<p style="color:#9ca3af;font-size:14px;">No sites with email yet. Run the site-discovery cron first.</p>'
    : `<div style="overflow-x:auto;">
    <table style="${tableStyle}">
      <thead><tr>
        <th style="${thStyle}">Domain</th>
        <th style="${thStyle}">Email</th>
        <th style="${thStyle}">Source</th>
        <th style="${thStyle}">Platform</th>
        <th style="${thStyle}">llms.txt</th>
        <th style="${thStyle}">Checks</th>
        <th style="${thStyle}">Status</th>
      </tr></thead>
      <tbody>${withEmailRows}</tbody>
    </table>
  </div>`}
</td></tr>

<!-- Table 2: Without email -->
<tr><td style="padding:28px 32px 32px;">
  <h2 style="margin:0 0 4px;font-size:18px;color:#111827;font-weight:700;">
    Sites without email
    <span style="font-size:14px;font-weight:400;color:#6b7280;margin-left:8px;">${withoutEmail.length} sites</span>
  </h2>
  <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Could not find an email. Automatically marked as skip — will not be emailed.</p>
  ${withoutEmail.length === 0
    ? '<p style="color:#9ca3af;font-size:14px;">None — all discovered sites had an email found.</p>'
    : `<div style="overflow-x:auto;">
    <table style="${tableStyle}">
      <thead><tr>
        <th style="${thStyle}">Domain</th>
        <th style="${thStyle}">Platform</th>
        <th style="${thStyle}">Skip reason</th>
        <th style="${thStyle}">Discovered</th>
      </tr></thead>
      <tbody>${withoutEmailRows}</tbody>
    </table>
  </div>`}
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eaeaea;">
  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
    AOE internal report — not for external sharing.<br>
    <strong>Reminder:</strong> daily_discovery_limit is currently set to 50 (dev testing).
    Run <code>UPDATE aoe_settings SET value = '500' WHERE key = 'daily_discovery_limit'</code> before prod go-live.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Pull all discovery rows
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('aoe_site_discovery')
    .select('domain, email, email_source, platform, status, skip_reason, check_count, has_llms_txt, discovered_at')
    .order('discovered_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to query aoe_site_discovery: ' + error.message }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as DiscoveryRow[]

  if (rows.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'No sites discovered yet. Run the site-discovery cron first (/api/cron/aoe/site-discovery).',
    }, { status: 200 })
  }

  const html   = buildReportEmail(rows)
  const to     = process.env.ADMIN_REPORT_EMAIL || 'sachindiwaker@gmail.com'
  const withEmail    = rows.filter(r => r.email).length
  const withoutEmail = rows.filter(r => !r.email).length
  const subject = `AOE Discovery Report — ${rows.length} sites (${withEmail} with email, ${withoutEmail} without)`

  const result = await sendEmail(to, subject, html)

  if (!result.success) {
    return NextResponse.json({
      ok: false,
      error: 'Email build succeeded but send failed: ' + result.error,
      totalRows: rows.length,
      withEmail,
      withoutEmail,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    to,
    totalRows: rows.length,
    withEmail,
    withoutEmail,
  })
}
