'use client'

import { useState, useTransition } from 'react'
import type { Monitor } from '@/lib/types'
import type { WpMonitor, WpFinding, WpSnapshot, WpPlugin } from '@/lib/db/wp-monitors'

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--color-down)',
  high: '#f97316',
  medium: '#eab308',
  low: 'var(--color-up)',
  info: 'var(--text-secondary)',
}
const SEVERITY_BG: Record<string, string> = {
  critical: 'var(--color-down-bg)',
  high: '#fff7ed',
  medium: '#fefce8',
  low: 'var(--color-up-bg)',
  info: 'var(--bg-muted)',
}

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
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h}:${m} UTC`
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
  const [activeTab, setActiveTab] = useState<'issues' | 'timeline'>('issues')

  const openFindings = findings
    .filter(f => f.status === 'open' || f.status === 'acknowledged')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const score = latestSnapshot?.health_score ?? 100
  const criticalCount = openFindings.filter(f => f.severity === 'critical').length
  const highCount = openFindings.filter(f => f.severity === 'high').length

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
      <div className="page-header">
        <div>
          <h1 className="page-title">🔌 {monitor.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {wpMonitor.site_url} · Last push: {wpMonitor.last_push_at ? fmtDate(wpMonitor.last_push_at) : 'Never'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleGenerateAiReport} className="btn btn-outline" style={{ fontSize: 13 }}>
            🤖 Generate AI Report
          </button>
          <a href="/dashboard/monitors" className="btn btn-ghost">← Monitors</a>
        </div>
      </div>

      {!wpMonitor.token_verified && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          Waiting for first push from your WordPress site. Make sure the plugin is installed and the token is saved in{' '}
          <strong>Uptrue → Settings</strong> in your WP Admin.
        </div>
      )}

      {/* Health score hero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `conic-gradient(${scoreColor(score)} ${score}%, var(--bg-muted) 0%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{
            width: 94, height: 94, borderRadius: '50%', background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{scoreLabel(score)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Critical', value: criticalCount, color: 'var(--color-down)' },
            { label: 'High', value: highCount, color: '#f97316' },
            { label: 'Open Issues', value: openFindings.length, color: '#667eea' },
            { label: 'WP Version', value: latestSnapshot?.wp_version ?? '—', color: 'var(--text-primary)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-primary)', marginBottom: 20 }}>
        {(['issues', 'timeline'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, border: 'none', background: 'none',
              cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #667eea' : '2px solid transparent',
              color: activeTab === tab ? '#667eea' : 'var(--text-secondary)',
              marginBottom: -2, textTransform: 'capitalize',
            }}
          >
            {tab === 'issues' ? `Issues (${openFindings.length})` : 'Timeline'}
          </button>
        ))}
      </div>

      {/* Issues tab */}
      {activeTab === 'issues' && (
        <div>
          {openFindings.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600 }}>No open issues</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Your WordPress site looks healthy.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {openFindings.map(finding => (
                <div
                  key={finding.id}
                  className="card"
                  style={{
                    border: `1px solid ${SEVERITY_COLOR[finding.severity]}33`,
                    background: SEVERITY_BG[finding.severity],
                    padding: 0, overflow: 'hidden',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                  >
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: SEVERITY_COLOR[finding.severity], color: '#fff', flexShrink: 0,
                    }}>
                      {finding.severity.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{finding.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {fmtDate(finding.first_detected_at)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                      {expandedFinding === finding.id ? '▲' : '▼'}
                    </span>
                  </div>

                  {expandedFinding === finding.id && (
                    <div style={{ borderTop: `1px solid ${SEVERITY_COLOR[finding.severity]}33`, padding: '16px' }}>
                      {finding.ai_explanation ? (
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {finding.ai_explanation}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          Click <strong>Generate AI Report</strong> at the top of the page for a full explanation and fix instructions for all open issues.
                        </div>
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
          )}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              No snapshots yet. Waiting for first push.
            </div>
          ) : (
            history.map(snap => (
              <div key={snap.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${scoreColor(snap.health_score ?? 100)} ${snap.health_score ?? 100}%, var(--bg-muted) 0%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: scoreColor(snap.health_score ?? 100),
                  }}>
                    {snap.health_score ?? 100}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(snap.received_at)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    WP {(snap as unknown as Record<string, string>).wp_version ?? '—'} · PHP {(snap as unknown as Record<string, string>).php_version ?? '—'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: scoreColor(snap.health_score ?? 100), fontWeight: 700 }}>
                  {scoreLabel(snap.health_score ?? 100)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Software summary from latest snapshot */}
      {latestSnapshot && (
        <div style={{ marginTop: 28 }}>
          <div className="sp-section-title" style={{ marginBottom: 12 }}>Software Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {/* Outdated plugins */}
            {(latestSnapshot.active_plugins as WpPlugin[]).filter(p => p.update_available).map(p => (
              <div key={p.slug} className="card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', borderLeft: '3px solid #eab308' }}>
                <span style={{ fontSize: 18 }}>🔌</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.version} → {p.new_version ?? 'update available'}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#eab308', background: '#fefce8', padding: '2px 8px', borderRadius: 10 }}>UPDATE</span>
              </div>
            ))}
            {/* Outdated theme */}
            {latestSnapshot.active_theme && (latestSnapshot.active_theme as { update_available: boolean }).update_available && (
              <div className="card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', borderLeft: '3px solid #eab308' }}>
                <span style={{ fontSize: 18 }}>🎨</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{(latestSnapshot.active_theme as { name: string }).name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Theme update available</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#eab308', background: '#fefce8', padding: '2px 8px', borderRadius: 10 }}>UPDATE</span>
              </div>
            )}
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
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>🤖 AI Security Report</h2>
              <button type="button" onClick={() => setAiReportOpen(false)} className="btn btn-ghost" style={{ fontSize: 18, padding: '4px 10px' }}>×</button>
            </div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                Analysing your WordPress site with AI…
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
