'use client'

import { useState, useEffect, useCallback } from 'react'

interface MonitorTypeHealth {
  type: string
  totalMonitors: number
  totalChecks: number
  upChecks: number
  downChecks: number
  degradedChecks: number
  failingMonitors: number
  avgResponseMs: number
  uptimePercent: number
  status: 'healthy' | 'warning' | 'critical' | 'no-data'
  topErrors: string[]
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

const TYPE_ICONS: Record<string, string> = {
  http: '🌐', ssl: '🔒', dns: '📡', keyword: '🔍', domain: '🏷️',
  port: '🔌', ping: '📶', api: '⚡', heartbeat: '💓', competitor: '👁️',
  'security-headers': '🛡️', 'response-time': '⏱️', 'robots-txt': '🤖',
  'ip-change': '📍', 'mx-health': '📧', 'whois-change': '📋',
  sitemap: '🗺️', 'redirect-chain': '↪️', 'spf-dmarc': '✉️',
  blacklist: '⛔', 'page-size': '📦', 'cookie-consent': '🍪', 'nameserver-change': '🔁',
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
  if (status === 'healthy') return 'rgba(16,185,129,0.08)'
  if (status === 'warning') return 'rgba(245,158,11,0.08)'
  if (status === 'critical') return 'rgba(239,68,68,0.08)'
  return 'var(--bg-muted)'
}

function UptimeBar({ percent, status }: { percent: number; status: MonitorTypeHealth['status'] }): React.ReactElement {
  const color = statusColor(status)
  const width = Math.max(0, Math.min(100, percent))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 44, textAlign: 'right' }}>
        {percent > 0 ? `${percent}%` : '—'}
      </span>
    </div>
  )
}

export function MonitorTypeHealthDashboard(): React.ReactElement {
  const [window, setWindow] = useState<number>(1)
  const [data, setData] = useState<MonitorTypeHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/monitor-type-health?hours=${window}`)
      if (res.ok) {
        const json = await res.json() as { data: MonitorTypeHealth[]; generatedAt: string }
        setData(json.data)
        setLastUpdated(json.generatedAt)
      }
    } finally {
      setLoading(false)
    }
  }, [window])

  useEffect(() => { void fetchData() }, [fetchData])

  async function handleSendReport(): Promise<void> {
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/cron/monitor-health-report')
      const json = await res.json() as { ok?: boolean; summary?: string; error?: string }
      setSendResult(json.ok ? `Report sent. ${json.summary ?? ''}` : (json.error ?? 'Failed'))
    } catch {
      setSendResult('Failed to send report')
    } finally {
      setSending(false)
    }
  }

  const critical = data.filter(d => d.status === 'critical')
  const warning = data.filter(d => d.status === 'warning')
  const healthy = data.filter(d => d.status === 'healthy')
  const noData = data.filter(d => d.status === 'no-data')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Monitor Type Health</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Platform-wide health across all monitor types and all organisations
            {lastUpdated && <span> · Updated {new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time window */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[1, 6, 24].map(h => (
              <button
                key={h}
                onClick={() => setWindow(h)}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: window === h ? 'var(--accent)' : 'transparent',
                  color: window === h ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {h}h
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => void fetchData()}
            disabled={loading}
            style={{ fontSize: 13 }}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => void handleSendReport()}
            disabled={sending}
            style={{ fontSize: 13 }}
          >
            {sending ? 'Sending…' : '📧 Send Report Now'}
          </button>
        </div>
      </div>

      {sendResult && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: sendResult.startsWith('Report sent') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${sendResult.startsWith('Report sent') ? '#6ee7b7' : '#fca5a5'}`, fontSize: 13, color: sendResult.startsWith('Report sent') ? '#065f46' : '#991b1b', marginBottom: 20 }}>
          {sendResult}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{critical.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Critical</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{warning.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Warning</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{healthy.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Healthy</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #94a3b8' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-muted)' }}>{noData.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>No Data</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.reduce((a, d) => a + d.totalMonitors, 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Total Monitors</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.reduce((a, d) => a + d.totalChecks, 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Checks ({window}h)</div>
        </div>
      </div>

      {/* Critical callout */}
      {critical.length > 0 && (
        <div style={{ padding: 16, borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚠ Critical — Requires Attention
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {critical.map(d => (
              <div key={d.type} style={{ padding: '8px 14px', background: '#fff', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{TYPE_ICONS[d.type] ?? '📊'} {TYPE_LABELS[d.type] ?? d.type}</span>
                <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: 8 }}>{d.uptimePercent}%</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>·</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{d.downChecks} failures</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type cards grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading health data…</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No monitor data found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {data.map(d => (
            <div key={d.type} style={{ borderRadius: 10, border: '1px solid var(--border)', background: statusBg(d.status), overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 20 }}>{TYPE_ICONS[d.type] ?? '📊'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{TYPE_LABELS[d.type] ?? d.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.totalMonitors} monitors</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: statusColor(d.status), color: '#fff', textTransform: 'capitalize' }}>
                  {statusDot(d.status)} {d.status === 'no-data' ? 'No data' : d.status}
                </span>
              </div>

              {/* Uptime bar */}
              <div style={{ padding: '12px 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uptime ({window}h window)</span>
                  {d.totalChecks > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {(100 - d.uptimePercent).toFixed(1)}% failure rate
                    </span>
                  )}
                </div>
                <UptimeBar percent={d.uptimePercent} status={d.status} />
              </div>

              {/* Stats */}
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Checks</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.totalChecks.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failures</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: d.downChecks > 0 ? '#ef4444' : 'inherit' }}>
                    {d.downChecks > 0 ? d.downChecks.toLocaleString() : '0'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg RT</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.avgResponseMs > 0 ? `${d.avgResponseMs}ms` : '—'}</div>
                </div>
              </div>

              {/* Top errors */}
              {d.topErrors.length > 0 && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Top error</div>
                  <div style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {d.topErrors[0]}
                  </div>
                </div>
              )}

              {d.failingMonitors > 0 && (
                <div style={{ padding: '0 16px 14px' }}>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
                    {d.failingMonitors} monitor{d.failingMonitors !== 1 ? 's' : ''} currently affected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div style={{ marginTop: 32, padding: 16, borderRadius: 8, background: 'var(--bg-muted)', fontSize: 13, color: 'var(--text-muted)' }}>
        <strong>Status thresholds (failure rate across all checks for that type):</strong> 🟢 Healthy &lt;75% failing · 🟡 Warning 75–85% failing · 🔴 Critical &gt;85% failing — high failure rates indicate a checker or infra issue, not just sites being down · Daily email report sent at 8:00 AM UTC
      </div>
    </div>
  )
}
