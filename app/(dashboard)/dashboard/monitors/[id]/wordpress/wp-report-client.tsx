'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Monitor } from '@/lib/types'
import type { WpMonitor, WpFinding, WpSnapshot, WpPlugin } from '@/lib/db/wp-monitors'
import { MonitorActions } from '@/components/monitors/monitor-actions'
import { CopyUrlButton } from '@/components/monitors/copy-url-button'

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function scoreColor(score: number): string {
  if (score >= 90) return 'var(--color-up)'
  if (score >= 70) return '#f97316'
  if (score >= 50) return '#eab308'
  return 'var(--color-down)'
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const severityBadgeClass: Record<string, string> = {
  critical: 'badge-danger',
  high: 'badge-warning',
  medium: 'badge-warning',
  low: 'badge-outline',
  info: 'badge-outline',
}

function WpAgentStatusBadge({ lastPushAt, intervalMinutes }: { lastPushAt: string | null; intervalMinutes: number }): React.ReactElement {
  if (!lastPushAt) {
    return <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="status-dot" style={{ background: 'var(--text-muted)' }} />Not connected</span>
  }
  const minutesSince = (Date.now() - new Date(lastPushAt).getTime()) / 60000
  if (minutesSince <= intervalMinutes * 3) {
    return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="status-dot status-dot-up" />Connected</span>
  }
  return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="status-dot status-dot-degraded" />Stale</span>
}

function HealthTrendChart({ history }: { history: WpSnapshot[] }): React.ReactElement | null {
  const data = [...history].reverse()
  if (data.length < 2) return null

  const W = 520, H = 90, PAD_X = 24, PAD_B = 18
  const chartH = H - PAD_B
  const count = Math.min(data.length, 12)
  const slice = data.slice(-count)
  const barW = Math.max(14, Math.min(36, Math.floor((W - PAD_X * 2) / count) - 4))
  const step = (W - PAD_X * 2) / count

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 90, display: 'block' }} aria-label="Health score trend chart">
      {/* Reference lines */}
      {[100, 70, 50].map(val => {
        const y = chartH - (val / 100) * (chartH - 6)
        return (
          <g key={val}>
            <line x1={PAD_X} y1={y} x2={W - 4} y2={y} stroke="var(--border-primary)" strokeWidth="0.5" strokeDasharray={val === 70 ? '3,3' : undefined} />
            <text x={PAD_X - 4} y={y + 3} fontSize="8" fill="var(--text-muted)" textAnchor="end">{val}</text>
          </g>
        )
      })}

      {slice.map((snap, i) => {
        const score = snap.health_score ?? 100
        const barH = Math.max(3, (score / 100) * (chartH - 6))
        const x = PAD_X + i * step + (step - barW) / 2
        const y = chartH - barH
        const color = score >= 70 ? 'var(--color-up)' : score >= 50 ? '#eab308' : 'var(--color-down)'
        return (
          <g key={snap.id}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="2" opacity="0.82" />
            <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="7.5" fill="var(--text-muted)">
              {new Date(snap.received_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
            </text>
            <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="8" fill={color} fontWeight="600">
              {score}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function generatePrintHtml(opts: {
  siteName: string
  siteUrl: string
  score: number
  openFindings: WpFinding[]
  latestSnapshot: WpSnapshot | null
  generatedAt: string
}): string {
  const { siteName, siteUrl, score, openFindings, latestSnapshot, generatedAt } = opts
  const scoreCardClass = score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red'
  const scoreTextColor = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const outdated = (latestSnapshot?.active_plugins as WpPlugin[] ?? []).filter(p => p.update_available)

  const badgeStyle: Record<string, string> = {
    critical: 'background:#fef2f2;color:#dc2626',
    high: 'background:#fffbeb;color:#d97706',
    medium: 'background:#fffbeb;color:#d97706',
    low: 'background:#f9fafb;color:#6b7280',
    info: 'background:#f9fafb;color:#6b7280',
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>WordPress Report — ${siteName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;padding:40px;font-size:14px}
  .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #667eea;margin-bottom:28px}
  .logo{font-size:26px;font-weight:800;color:#667eea;letter-spacing:-0.5px}.logo span{color:#06b6d4}
  .logo-sub{font-size:11px;color:#9ca3af;margin-top:3px}
  .meta{text-align:right;font-size:12px;color:#6b7280}
  .meta strong{font-size:15px;color:#1a1a2e;display:block;margin-bottom:2px}
  .cards{display:flex;gap:16px;margin-bottom:28px}
  .card{flex:1;padding:18px 20px;border-radius:10px;border:1px solid #e5e7eb}
  .card.green{background:#f0fdf4;border-color:#86efac}
  .card.yellow{background:#fffbeb;border-color:#fcd34d}
  .card.red{background:#fef2f2;border-color:#fca5a5}
  .card.grey{background:#f9fafb}
  .val{font-size:40px;font-weight:800;line-height:1}
  .val-sm{font-size:28px;font-weight:800;line-height:1}
  .lbl{font-size:12px;color:#6b7280;margin-top:4px}
  h2{font-size:15px;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}
  .row{display:flex;justify-content:space-between;align-items:flex-start;padding:11px 0;border-bottom:1px solid #f3f4f6}
  .row:last-child{border-bottom:none}
  .ftitle{font-weight:500;font-size:13px}
  .fdate{font-size:11px;color:#9ca3af;margin-top:2px}
  .badge{padding:2px 9px;border-radius:4px;font-size:11px;font-weight:600}
  .sysrow{display:flex;gap:24px;margin-bottom:28px}
  .syscard{flex:1;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px}
  .sys-val{font-size:18px;font-weight:700;margin-bottom:2px}
  .sys-lbl{font-size:11px;color:#9ca3af}
  .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af}
  @media print{body{padding:20px}}
</style>
</head>
<body>
<div class="hd">
  <div>
    <div class="logo">Up<span>true</span></div>
    <div class="logo-sub">WordPress Security &amp; Health Report</div>
  </div>
  <div class="meta">
    <strong>${siteName}</strong>
    <div>${siteUrl}</div>
    <div style="margin-top:4px">Generated: ${generatedAt}</div>
  </div>
</div>

<div class="cards">
  <div class="card ${scoreCardClass}">
    <div class="val" style="color:${scoreTextColor}">${score}</div>
    <div class="lbl">Health Score / 100 — ${scoreLabel(score)}</div>
  </div>
  <div class="card grey">
    <div class="val-sm">${openFindings.length}</div>
    <div class="lbl">Open Issues${openFindings.filter(f => f.severity === 'critical').length > 0 ? ` (${openFindings.filter(f => f.severity === 'critical').length} critical)` : ''}</div>
  </div>
  ${latestSnapshot ? `<div class="card grey">
    <div class="val-sm">${latestSnapshot.wp_version ?? '—'}</div>
    <div class="lbl">WordPress · PHP ${latestSnapshot.php_version ?? '—'}</div>
  </div>` : ''}
  ${outdated.length > 0 ? `<div class="card yellow">
    <div class="val-sm" style="color:#d97706">${outdated.length}</div>
    <div class="lbl">Plugin Updates Needed</div>
  </div>` : ''}
</div>

${latestSnapshot ? `<div class="sysrow">
  <div class="syscard"><div class="sys-val">${(latestSnapshot.active_plugins as WpPlugin[]).length}</div><div class="sys-lbl">Active Plugins</div></div>
  ${latestSnapshot.memory_limit ? `<div class="syscard"><div class="sys-val">${latestSnapshot.memory_limit}</div><div class="sys-lbl">PHP Memory Limit</div></div>` : ''}
  ${latestSnapshot.db_size_mb ? `<div class="syscard"><div class="sys-val">${latestSnapshot.db_size_mb} MB</div><div class="sys-lbl">Database Size</div></div>` : ''}
</div>` : ''}

${openFindings.length > 0 ? `<h2>Open Issues (${openFindings.length})</h2>
${openFindings.map(f => `<div class="row">
  <div><div class="ftitle">${escapeHtml(f.title)}</div><div class="fdate">Detected: ${new Date(f.first_detected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
  <span class="badge" style="${badgeStyle[f.severity] ?? badgeStyle.info}">${f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}</span>
</div>`).join('')}` : `<p style="color:#16a34a;font-weight:600;padding:16px 0">✓ No open issues found — your WordPress site looks healthy.</p>`}

<div class="footer">
  <div>Powered by <strong>Uptrue</strong> — uptrue.io</div>
  <div>Automated WordPress monitoring &amp; security scanning</div>
</div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface Props {
  monitor: Monitor
  wpMonitor: WpMonitor
  findings: WpFinding[]
  latestSnapshot: WpSnapshot | null
  history: WpSnapshot[]
}

export function WpReportClient({ monitor, wpMonitor, findings, latestSnapshot, history }: Props): React.ReactElement {
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)
  const [aiReportOpen, setAiReportOpen] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [aiRateMsg, setAiRateMsg] = useState<string | null>(null)
  const [aiLoading, startAiTransition] = useTransition()

  const openFindings = findings
    .filter(f => f.status === 'open' || f.status === 'acknowledged')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const score = latestSnapshot?.health_score ?? 100
  const criticalCount = openFindings.filter(f => f.severity === 'critical').length
  const highCount = openFindings.filter(f => f.severity === 'high').length
  const outdatedPlugins = (latestSnapshot?.active_plugins as WpPlugin[] | undefined ?? []).filter(p => p.update_available)

  // Derive AI report availability from wpMonitor.settings
  const settings = (wpMonitor.settings ?? {}) as Record<string, unknown>
  const lastAiReportAt = settings.last_ai_report_at as string | undefined
  const aiAvailableAt = lastAiReportAt ? new Date(new Date(lastAiReportAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null
  const aiRateLimited = aiAvailableAt ? Date.now() < aiAvailableAt.getTime() : false

  function handleGenerateAiReport(): void {
    if (aiRateLimited) return
    setAiRateMsg(null)
    setAiReportOpen(true)
    if (aiReport) return
    startAiTransition(async () => {
      try {
        const res = await fetch(`/api/v1/wp-agent/ai-report?monitor_id=${monitor.id}`, { method: 'POST' })
        if (res.status === 429) {
          const data = await res.json() as { message?: string }
          setAiRateMsg(data.message ?? 'Rate limit reached. Try again next week.')
          return
        }
        const data = await res.json() as { report?: string; error?: string }
        setAiReport(data.report ?? data.error ?? 'Could not generate report.')
      } catch {
        setAiReport('Failed to generate AI report. Please try again.')
      }
    })
  }

  function handleDownload(): void {
    const generatedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const html = generatePrintHtml({
      siteName: monitor.name,
      siteUrl: wpMonitor.site_url,
      score,
      openFindings,
      latestSnapshot,
      generatedAt,
    })
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      {/* Header */}
      <div className="monitor-header-v2">
        <div className="monitor-header-v2-left">
          <div className="monitor-header-v2-title-row">
            <h1 className="monitor-header-v2-name">{monitor.name}</h1>
            <WpAgentStatusBadge lastPushAt={wpMonitor.last_push_at} intervalMinutes={wpMonitor.check_interval_minutes} />
            <span className="monitor-type-badge">wordpress</span>
          </div>
          <div className="monitor-target-row">
            <div className="monitor-header-v2-url">{wpMonitor.site_url}</div>
            <CopyUrlButton url={wpMonitor.site_url} />
          </div>
        </div>
        <div className="monitor-header-v2-right">
          <button
            type="button"
            onClick={handleGenerateAiReport}
            className="btn btn-sm btn-outline"
            disabled={aiRateLimited}
            title={aiRateLimited && aiAvailableAt ? `Next AI report: ${aiAvailableAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : undefined}
          >
            {aiRateLimited && aiAvailableAt
              ? `AI Report (from ${aiAvailableAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
              : 'AI Report'}
          </button>
          <button type="button" onClick={handleDownload} className="btn btn-sm btn-outline">
            ↓ Download
          </button>
          <Link href={`/dashboard/monitors/${monitor.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
          <MonitorActions monitorId={monitor.id} isPaused={monitor.is_paused} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="monitor-stat-grid">
        <div className={`monitor-stat-card ${score >= 70 ? 'card-up' : 'card-warn'}`}>
          <div className={`monitor-stat-icon ${score >= 70 ? 'icon-up' : 'icon-warn'}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className="monitor-stat-label">Health Score</div>
          <div className="monitor-stat-value">
            {score}<span className="monitor-stat-unit">/ 100</span>
          </div>
          <div className="monitor-stat-sub">{scoreLabel(score)}</div>
        </div>

        <div className={`monitor-stat-card ${criticalCount > 0 ? 'card-warn' : 'card-blue'}`}>
          <div className={`monitor-stat-icon ${criticalCount > 0 ? 'icon-warn' : 'icon-blue'}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="monitor-stat-label">Open Issues</div>
          <div className="monitor-stat-value">{openFindings.length}</div>
          <div className="monitor-stat-sub">
            {criticalCount > 0 ? `${criticalCount} critical` : highCount > 0 ? `${highCount} high` : 'No critical issues'}
          </div>
        </div>

        <div className="monitor-stat-card card-up">
          <div className="monitor-stat-icon icon-up">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="monitor-stat-label">Last Push</div>
          <div className="monitor-stat-value" style={{ fontSize: 18 }}>
            {wpMonitor.last_push_at ? timeAgo(wpMonitor.last_push_at) : '—'}
          </div>
          <div className="monitor-stat-sub">
            {wpMonitor.last_push_at ? fmtDate(wpMonitor.last_push_at) : 'No data yet'}
          </div>
        </div>

        <div className={`monitor-stat-card ${outdatedPlugins.length > 0 ? 'card-warn' : 'card-up'}`}>
          <div className={`monitor-stat-icon ${outdatedPlugins.length > 0 ? 'icon-warn' : 'icon-up'}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="6,8 8.5,16 12,12 15.5,16 18,8"/></svg>
          </div>
          <div className="monitor-stat-label">Plugin Updates</div>
          <div className="monitor-stat-value">{outdatedPlugins.length}</div>
          <div className="monitor-stat-sub">
            {latestSnapshot ? `WP ${latestSnapshot.wp_version ?? '—'} · PHP ${latestSnapshot.php_version ?? '—'}` : 'No data yet'}
          </div>
        </div>
      </div>

      {/* Config + top findings */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monitor Settings</div>
          </div>
          <div className="mon-config-grid">
            <div className="mon-config-item">
              <div className="mon-config-item-label">WordPress Version</div>
              <div className="mon-config-item-value">{latestSnapshot?.wp_version ?? '—'}</div>
              <div className="mon-config-item-sub">
                {latestSnapshot?.php_version ? `PHP ${latestSnapshot.php_version}` : 'No data yet'}
              </div>
            </div>
            <div className="mon-config-item">
              <div className="mon-config-item-label">Active Plugins</div>
              <div className="mon-config-item-value">
                {latestSnapshot ? (latestSnapshot.active_plugins as WpPlugin[]).length : '—'}
              </div>
              <div className="mon-config-item-sub">
                {outdatedPlugins.length > 0 ? `${outdatedPlugins.length} need updates` : 'All up to date'}
              </div>
            </div>
            <div className="mon-config-item">
              <div className="mon-config-item-label">Check Interval</div>
              <div className="mon-config-item-value">Every {wpMonitor.check_interval_minutes}m</div>
              <div className="mon-config-item-sub">Agent-based push</div>
            </div>
          </div>
          {latestSnapshot?.memory_limit && (
            <div className="alert-channels-row">
              <div className="alert-channels-label">Server</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Memory limit: {latestSnapshot.memory_limit}
                {latestSnapshot.db_size_mb ? ` · DB size: ${latestSnapshot.db_size_mb} MB` : ''}
                {latestSnapshot.debug_mode ? ' · Debug mode ON' : ''}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Issues</div>
          </div>
          <div className="card-content">
            {openFindings.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {latestSnapshot ? 'No open issues — your WordPress site looks healthy.' : 'No data received yet.'}
              </p>
            ) : (
              <div className="space-y-sm">
                {openFindings.slice(0, 5).map(f => (
                  <div key={f.id} className="incident-row">
                    <div className="incident-row-info">
                      <span className="incident-row-title">{f.title}</span>
                      <span className="incident-row-time">{fmtDate(f.first_detected_at)}</span>
                    </div>
                    <span className={`badge ${severityBadgeClass[f.severity] ?? 'badge-outline'}`}>
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full findings list */}
      {openFindings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">All Open Issues ({openFindings.length})</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {openFindings.map((finding, i) => (
                <div key={finding.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-primary)', padding: '0' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer' }}
                    onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                  >
                    <span className={`badge ${severityBadgeClass[finding.severity] ?? 'badge-outline'}`}>
                      {finding.severity}
                    </span>
                    <span style={{ fontWeight: 500, flex: 1, fontSize: 14 }}>{finding.title}</span>
                    <span className="table-muted">{fmtDate(finding.first_detected_at)}</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      style={{ transform: expandedFinding === finding.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {expandedFinding === finding.id && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-primary)' }}>
                      {finding.ai_explanation ? (
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>
                          {finding.ai_explanation}
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 0' }}>
                          Click <strong>AI Report</strong> at the top for a full explanation and fix instructions.
                        </p>
                      )}
                      {Object.keys(finding.detail).length > 0 && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-muted)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
                          {Object.entries(finding.detail).map(([k, v]) => (
                            <div key={k}><strong>{k}:</strong> {String(v)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health trend chart */}
      {history.length >= 2 && (
        <div style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Health Score Trend</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last {Math.min(history.length, 12)} pushes</div>
            </div>
            <div style={{ padding: '16px 20px 8px' }}>
              <HealthTrendChart history={history} />
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: 'var(--color-up)', borderRadius: 2, display: 'inline-block' }} />
                  Good (70+)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: '#eab308', borderRadius: 2, display: 'inline-block' }} />
                  Fair (50–69)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: 'var(--color-down)', borderRadius: 2, display: 'inline-block' }} />
                  Poor (&lt;50)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 16, height: 1, background: 'var(--border-primary)', borderTop: '1px dashed', display: 'inline-block' }} />
                  70 threshold
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Push history */}
      {history.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Push History</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {history.map((snap, i) => (
                <div
                  key={snap.id}
                  className="incident-row"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-primary)', padding: '12px 20px' }}
                >
                  <div className="incident-row-info">
                    <span className="incident-row-title">
                      WP {snap.wp_version ?? '—'} · PHP {snap.php_version ?? '—'}
                    </span>
                    <span className="incident-row-time">{fmtDate(snap.received_at)}</span>
                  </div>
                  <span
                    className={`badge ${(snap.health_score ?? 100) >= 70 ? 'badge-outline' : 'badge-warning'}`}
                    style={{ color: scoreColor(snap.health_score ?? 100) }}
                  >
                    {snap.health_score ?? 100} — {scoreLabel(snap.health_score ?? 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Report modal */}
      {aiReportOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ maxWidth: 700, width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>AI Security Report</h2>
              <button type="button" onClick={() => setAiReportOpen(false)} className="btn btn-ghost" style={{ fontSize: 18, padding: '4px 10px' }}>×</button>
            </div>
            {aiRateMsg ? (
              <div className="form-error">{aiRateMsg}</div>
            ) : aiLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                Analysing your WordPress site…
              </div>
            ) : (
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {aiReport}
              </div>
            )}
            {lastAiReportAt && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
                Reports are generated once per week. Next available: {new Date(new Date(lastAiReportAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
