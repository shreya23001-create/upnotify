'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/components/providers/workspace-provider'
import type { Monitor, Incident } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonitorStats { total: number; up: number; down: number; degraded: number; paused: number }
interface CheckResult   { status: string; response_time_ms?: number | null; checked_at: string; monitor_id: string }
interface DashboardData {
  stats: MonitorStats
  monitors: Monitor[]
  incidents: Incident[]
  checkResults: CheckResult[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** Per-monitor: latest response time and 30-day uptime % */
function buildMonitorMetrics(checkResults: CheckResult[]): Record<string, { uptime: number; latestMs: number | null }> {
  const byMonitor: Record<string, CheckResult[]> = {}
  for (const r of checkResults) {
    if (!byMonitor[r.monitor_id]) byMonitor[r.monitor_id] = []
    byMonitor[r.monitor_id].push(r)
  }
  const out: Record<string, { uptime: number; latestMs: number | null }> = {}
  for (const [id, results] of Object.entries(byMonitor)) {
    const sorted = [...results].sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())
    const upCount = results.filter(r => r.status === 'up').length
    out[id] = {
      uptime: results.length > 0 ? Math.round((upCount / results.length) * 10000) / 100 : 100,
      latestMs: sorted[0]?.response_time_ms ?? null,
    }
  }
  return out
}

/** Average response times grouped by day for last 7 days */
function buildResponseChart(checkResults: CheckResult[]): { label: string; avg: number }[] {
  const dayMap: Record<string, { sum: number; count: number }> = {}
  for (const r of checkResults) {
    if (!r.response_time_ms) continue
    const d = new Date(r.checked_at)
    const key = `${d.getDate()}/${d.getMonth() + 1}`
    if (!dayMap[key]) dayMap[key] = { sum: 0, count: 0 }
    dayMap[key].sum += r.response_time_ms
    dayMap[key].count++
  }
  return Object.entries(dayMap)
    .map(([label, v]) => ({ label, avg: Math.round(v.sum / v.count) }))
    .slice(-7)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: MonitorStats }) {
  const healthPct = stats.total > 0 ? ((stats.up / stats.total) * 100).toFixed(1) : '0'
  return (
    <div className="db-stats">
      <div className="db-stat-card all">
        <div className="db-stat-icon all">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div className="db-stat-label">Total Monitors</div>
        <div className="db-stat-value">{stats.total}</div>
        <div className="db-stat-delta">{stats.paused > 0 ? `${stats.paused} paused` : 'All active'}</div>
      </div>
      <div className="db-stat-card up">
        <div className="db-stat-icon up">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="db-stat-label">Healthy</div>
        <div className="db-stat-value" style={{ color: 'var(--color-up)' }}>{stats.up}</div>
        <div className="db-stat-delta">{healthPct}% of monitors</div>
      </div>
      <div className="db-stat-card down">
        <div className="db-stat-icon down">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div className="db-stat-label">Down</div>
        <div className="db-stat-value" style={{ color: 'var(--color-down)' }}>{stats.down}</div>
        <div className="db-stat-delta">{stats.down === 0 ? 'All systems clear' : 'Needs attention'}</div>
      </div>
      <div className="db-stat-card warn">
        <div className="db-stat-icon warn">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div className="db-stat-label">Degraded</div>
        <div className="db-stat-value" style={{ color: 'var(--color-warn)' }}>{stats.degraded}</div>
        <div className="db-stat-delta">{stats.degraded === 0 ? 'Performance normal' : 'Slow responses'}</div>
      </div>
    </div>
  )
}

function MonitorsTable({ monitors, metrics, search, setSearch }: {
  monitors: Monitor[]
  metrics: Record<string, { uptime: number; latestMs: number | null }>
  search: string
  setSearch: (v: string) => void
}) {
  const filtered = monitors.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.target.toLowerCase().includes(search.toLowerCase())
  )

  function statusBadge(m: Monitor) {
    if (m.is_paused) return <span className="db-badge db-badge-outline"><span className="db-dot" style={{ background: 'var(--text-muted)' }} /> Paused</span>
    if (m.status === 'up')       return <span className="db-badge db-badge-up"><span className="db-dot" style={{ background: 'var(--color-up)' }} /> Up</span>
    if (m.status === 'down')     return <span className="db-badge db-badge-down"><span className="db-dot db-dot-pulse" style={{ background: 'var(--color-down)' }} /> Down</span>
    if (m.status === 'degraded') return <span className="db-badge db-badge-warn"><span className="db-dot" style={{ background: 'var(--color-warn)' }} /> Slow</span>
    return <span className="db-badge db-badge-outline">{m.status}</span>
  }

  function responseCell(m: Monitor) {
    const ms = metrics[m.id]?.latestMs
    if (m.status === 'down') return <span className="db-response-time slow">timeout</span>
    if (!ms) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
    const cls = ms < 500 ? 'fast' : ms < 1500 ? 'med' : 'slow'
    return <span className={`db-response-time ${cls}`}>{ms.toLocaleString()}ms</span>
  }

  function uptimeCell(m: Monitor) {
    const pct = metrics[m.id]?.uptime ?? 100
    const cls = pct >= 99 ? '' : pct >= 95 ? ' partial' : ' partial'
    return <span className={`db-uptime-pct${cls}`}>{pct.toFixed(2)}%</span>
  }

  const rowBg = (m: Monitor) => {
    if (m.status === 'down') return { background: 'rgba(239,68,68,0.03)' }
    if (m.status === 'degraded') return { background: 'rgba(245,158,11,0.03)' }
    return undefined
  }

  return (
    <div className="db-card" style={{ marginBottom: 20 }}>
      <div className="db-card-header">
        <div className="db-card-title">Monitors</div>
        <div className="db-card-actions">
          <div className="db-search">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search monitors…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Link href="/dashboard/monitors/new" className="btn btn-primary btn-sm">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </Link>
        </div>
      </div>

      {monitors.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No monitors yet. Add your first one to start tracking uptime.</p>
          <Link href="/dashboard/monitors/scan" className="btn btn-primary btn-sm">🔭 Scan Your Website</Link>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uptime (30d)</th>
                  <th>Response</th>
                  <th>Last Check</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={rowBg(m)}>
                    <td>
                      <div className="monitor-name">{m.name}</div>
                      <div className="monitor-url">{m.target}</div>
                    </td>
                    <td><span className="monitor-type-tag">{m.type}</span></td>
                    <td>{statusBadge(m)}</td>
                    <td>{uptimeCell(m)}</td>
                    <td>{responseCell(m)}</td>
                    <td style={{ fontSize: 11, color: m.status === 'down' ? 'var(--color-down)' : 'var(--text-muted)' }}>
                      {m.status === 'down' && metrics[m.id] ? `Down · ${timeAgo(m.last_checked_at)}` : timeAgo(m.last_checked_at)}
                    </td>
                    <td>
                      <Link href={`/dashboard/monitors/${m.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>No monitors match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="db-table-footer">
            <span>Showing {filtered.length} of {monitors.length} monitors</span>
            <Link href="/dashboard/monitors" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View all →</Link>
          </div>
        </>
      )}
    </div>
  )
}

function IncidentsPanel({ incidents }: { incidents: Incident[] }) {
  const openCount = incidents.filter(i => i.status !== 'resolved').length

  function iconVariant(inc: Incident): 'down' | 'warn' | 'up' {
    if (inc.status === 'resolved') return 'up'
    if (inc.severity === 'P3' || inc.severity === 'P4') return 'warn'
    return 'down'
  }

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-title">Recent Incidents</div>
        <div className="db-card-actions">
          {openCount > 0 && <span className="db-badge db-badge-down" style={{ fontSize: 10 }}>{openCount} open</span>}
          <Link href="/dashboard/incidents" className="btn btn-ghost btn-sm">View all</Link>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          No incidents recorded — all systems clear.
        </div>
      ) : (
        incidents.map(inc => {
          const v = iconVariant(inc)
          const icons = {
            down: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
            warn: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
            up:   <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
          }
          return (
            <div key={inc.id} className="incident-item" style={inc.status === 'resolved' ? { opacity: 0.6 } : undefined}>
              <div className={`incident-icon ${v}`}>{icons[v]}</div>
              <div style={{ flex: 1 }}>
                <div className="incident-name">{inc.title}</div>
                <div className="incident-detail">{inc.root_cause ?? inc.severity}</div>
                <div style={{ marginTop: 4 }}>
                  {inc.status === 'resolved'
                    ? <span className="db-badge db-badge-outline" style={{ fontSize: 10 }}>Resolved{inc.duration_seconds ? ` · ${Math.round(inc.duration_seconds / 60)}m` : ''}</span>
                    : <span className={`db-badge ${v === 'down' ? 'db-badge-down' : 'db-badge-warn'}`} style={{ fontSize: 10 }}>Open · {timeAgo(inc.started_at)}</span>
                  }
                </div>
              </div>
              <div className="incident-time">{fmtTime(inc.started_at)}</div>
            </div>
          )
        })
      )}
    </div>
  )
}

function ResponseChart({ checkResults }: { checkResults: CheckResult[] }) {
  const days = buildResponseChart(checkResults)
  const maxAvg = days.length > 0 ? Math.max(...days.map(d => d.avg)) : 0
  const latestAvg = days.length > 0 ? days[days.length - 1].avg : null

  function barColor(avg: number): string {
    if (avg < 500)  return 'var(--color-up)'
    if (avg < 1500) return 'var(--color-warn)'
    return 'var(--color-down)'
  }

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-title">Response Time · 7d</div>
        <div className="db-card-actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 7 days</span>
        </div>
      </div>

      {days.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          No response time data yet — checks will appear here once monitors run.
        </div>
      ) : (
        <>
          <div style={{ padding: '16px 20px 4px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'monospace', color: latestAvg ? barColor(latestAvg) : 'var(--text-primary)' }}>
              {latestAvg}ms
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg response · latest day</div>
          </div>
          <div className="chart-placeholder">
            {days.map((d, i) => (
              <div
                key={i}
                className="chart-bar"
                style={{
                  height: `${Math.max(6, Math.round((d.avg / maxAvg) * 100))}%`,
                  background: barColor(d.avg),
                  opacity: 0.85,
                }}
                title={`${d.label}: ${d.avg}ms`}
              />
            ))}
          </div>
          <div className="chart-x-labels">
            {days.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <>
      <div className="db-stats">
        {[1,2,3,4].map(i => (
          <div key={i} className="db-stat-card all" style={{ opacity: 0.4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--border-primary)', marginBottom: 12 }} />
            <div style={{ height: 10, background: 'var(--border-primary)', borderRadius: 4, width: '55%', marginBottom: 8 }} />
            <div style={{ height: 26, background: 'var(--border-primary)', borderRadius: 4, width: '35%', marginBottom: 4 }} />
            <div style={{ height: 8,  background: 'var(--border-primary)', borderRadius: 4, width: '65%' }} />
          </div>
        ))}
      </div>
      <div className="db-card" style={{ marginBottom: 20, height: 200, opacity: 0.4 }} />
      <div className="db-two-col">
        <div className="db-card" style={{ height: 180, opacity: 0.4 }} />
        <div className="db-card" style={{ height: 180, opacity: 0.4 }} />
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function WorkspaceDashboard(): React.ReactElement {
  const { currentWorkspace } = useWorkspace()
  const [data, setData]     = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load(): Promise<void> {
      try {
        const url = currentWorkspace
          ? `/api/v1/dashboard/stats?workspaceId=${encodeURIComponent(currentWorkspace.id)}`
          : '/api/v1/dashboard/stats'
        const res  = await fetch(url)
        if (!res.ok) return
        const json = await res.json() as { success: boolean } & DashboardData
        if (!cancelled && json.success) setData(json)
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentWorkspace])

  const metrics = useMemo(() => buildMonitorMetrics(data?.checkResults ?? []), [data?.checkResults])

  if (loading) return <Skeleton />

  const stats        = data?.stats        ?? { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const monitors     = data?.monitors     ?? []
  const incidents    = data?.incidents    ?? []
  const checkResults = data?.checkResults ?? []

  return (
    <>
      <StatCards stats={stats} />
      <MonitorsTable monitors={monitors} metrics={metrics} search={search} setSearch={setSearch} />
      <div className="db-two-col">
        <IncidentsPanel incidents={incidents} />
        <ResponseChart checkResults={checkResults} />
      </div>
    </>
  )
}
