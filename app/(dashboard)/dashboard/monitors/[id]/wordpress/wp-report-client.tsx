'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Monitor } from '@/lib/types'
import type { WpMonitor, WpFinding, WpSnapshot, WpPlugin } from '@/lib/db/wp-monitors'
import { MonitorStatusBadge } from '@/components/monitors/monitor-status-badge'
import { MonitorActions } from '@/components/monitors/monitor-actions'
import { CopyUrlButton } from '@/components/monitors/copy-url-button'
import { BadgeEmbed } from '@/components/monitors/badge-embed'

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
  const [aiLoading, startAiTransition] = useTransition()

  const openFindings = findings
    .filter(f => f.status === 'open' || f.status === 'acknowledged')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const score = latestSnapshot?.health_score ?? 100
  const criticalCount = openFindings.filter(f => f.severity === 'critical').length
  const highCount = openFindings.filter(f => f.severity === 'high').length
  const outdatedPlugins = (latestSnapshot?.active_plugins as WpPlugin[] | undefined ?? []).filter(p => p.update_available)

  function handleGenerateAiReport(): void {
    setAiReportOpen(true)
    if (aiReport) return
    startAiTransition(async () => {
      try {
        const res = await fetch(`/api/v1/wp-agent/ai-report?monitor_id=${monitor.id}`, { method: 'POST' })
        const data = await res.json() as { report?: string; error?: string }
        setAiReport(data.report ?? data.error ?? 'Could not generate report.')
      } catch {
        setAiReport('Failed to generate AI report. Please try again.')
      }
    })
  }

  return (
    <div>
      {/* Header — same structure as standard monitor detail page */}
      <div className="monitor-header-v2">
        <div className="monitor-header-v2-left">
          <div className="monitor-header-v2-title-row">
            <h1 className="monitor-header-v2-name">{monitor.name}</h1>
            <MonitorStatusBadge status={monitor.status} monitorType={monitor.type} />
            <span className="monitor-type-badge">wordpress</span>
          </div>
          <div className="monitor-target-row">
            <div className="monitor-header-v2-url">{wpMonitor.site_url}</div>
            <CopyUrlButton url={wpMonitor.site_url} />
          </div>
        </div>
        <div className="monitor-header-v2-right">
          <button type="button" onClick={handleGenerateAiReport} className="btn btn-sm btn-outline">
            AI Report
          </button>
          <Link href={`/dashboard/monitors/${monitor.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
          <MonitorActions monitorId={monitor.id} isPaused={monitor.is_paused} />
        </div>
      </div>

      {/* Stat cards — same grid as standard monitor page */}
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

      {/* Config + top findings — same 2-column grid as standard monitor page */}
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
                <div
                  key={finding.id}
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-primary)',
                    padding: '0',
                  }}
                >
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

      {/* Snapshot history */}
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

      {/* Badge embed */}
      <div style={{ marginBottom: 24 }}>
        <BadgeEmbed monitorId={monitor.id} />
      </div>

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
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                Analysing your WordPress site…
              </div>
            ) : (
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {aiReport}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
