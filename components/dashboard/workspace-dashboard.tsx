'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { StatsCards } from './stats-cards'
import { RecentIncidents } from './recent-incidents'
import type { Monitor, Incident } from '@/lib/types'

interface MonitorStats {
  total: number
  up: number
  down: number
  degraded: number
  paused: number
}

interface CheckResultLike {
  status: string
  response_time_ms?: number | null
  checked_at: string
}

interface DashboardData {
  stats: MonitorStats
  monitors: Monitor[]
  incidents: Incident[]
  checkResults: CheckResultLike[]
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="db-stats">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="db-stat-card all" style={{ minHeight: 110, opacity: 0.4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--border-primary)', marginBottom: 12 }} />
          <div style={{ height: 10, background: 'var(--border-primary)', borderRadius: 4, width: '55%', marginBottom: 8 }} />
          <div style={{ height: 26, background: 'var(--border-primary)', borderRadius: 4, width: '35%' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Monitors mini-table ────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  up:       'badge-up',
  down:     'badge-down',
  degraded: 'badge-warn',
  paused:   'badge-outline',
}
const STATUS_DOT: Record<string, string> = {
  up:       'var(--color-up)',
  down:     'var(--color-down)',
  degraded: 'var(--color-warn)',
  paused:   'var(--text-muted)',
}
const STATUS_LABEL: Record<string, string> = {
  up: 'Up', down: 'Down', degraded: 'Slow', paused: 'Paused',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function MonitorsTable({ monitors }: { monitors: Monitor[] }): React.ReactElement {
  return (
    <div className="db-card" style={{ marginBottom: 20 }}>
      <div className="db-card-header">
        <div className="db-card-title">Monitors</div>
        <div className="db-card-actions">
          <Link href="/dashboard/monitors/new" className="btn btn-primary btn-sm">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </Link>
        </div>
      </div>

      {monitors.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No monitors yet. Add one to start tracking uptime.</div>
          <Link href="/dashboard/monitors/new" className="btn btn-primary btn-sm">Add Your First Monitor</Link>
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
                  <th>Last Check</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {monitors.map(monitor => (
                  <tr key={monitor.id}>
                    <td>
                      <div className="monitor-name">{monitor.name}</div>
                      <div className="monitor-url">{monitor.target}</div>
                    </td>
                    <td><span className="monitor-type-tag">{monitor.type.toUpperCase()}</span></td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[monitor.status] ?? 'badge-outline'}`}>
                        <span style={{ width: 6, height: 6, background: STATUS_DOT[monitor.status] ?? 'var(--text-muted)', borderRadius: '50%', display: 'inline-block' }} />
                        {' '}{STATUS_LABEL[monitor.status] ?? monitor.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(monitor.last_checked_at)}</td>
                    <td>
                      <Link href={`/dashboard/monitors/${monitor.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="db-table-footer">
            <span>Showing {monitors.length} monitor{monitors.length !== 1 ? 's' : ''}</span>
            <Link href="/dashboard/monitors" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View all →</Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Response time bar chart ─────────────────────────────────────────────────

function ResponseTimeWidget({ checkResults }: { checkResults: CheckResultLike[] }): React.ReactElement {
  // Group by day — last 7 days
  const dayMap: Record<string, { sum: number; count: number }> = {}
  for (const r of checkResults) {
    if (!r.response_time_ms) continue
    const d = new Date(r.checked_at)
    const key = `${d.getDate()}/${d.getMonth() + 1}`
    if (!dayMap[key]) dayMap[key] = { sum: 0, count: 0 }
    dayMap[key].sum += r.response_time_ms
    dayMap[key].count++
  }

  const days = Object.entries(dayMap)
    .map(([label, v]) => ({ label, avg: Math.round(v.sum / v.count) }))
    .slice(-7)

  const maxAvg = days.length > 0 ? Math.max(...days.map(d => d.avg)) : 0
  const latestAvg = days.length > 0 ? days[days.length - 1].avg : 0

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-title">Response Time · 7d</div>
        <div className="db-card-actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 7 days</span>
        </div>
      </div>

      {days.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          No response time data yet. Checks will appear here once monitors run.
        </div>
      ) : (
        <>
          <div style={{ padding: '16px 20px 4px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: latestAvg < 500 ? 'var(--color-up)' : latestAvg < 1500 ? 'var(--color-warn)' : 'var(--color-down)', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
              {latestAvg}ms
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg response · latest day</div>
          </div>
          <div className="chart-placeholder">
            {days.map((d, i) => (
              <div
                key={i}
                className={`chart-bar${d.avg === 0 ? ' empty' : ''}`}
                style={{
                  height: maxAvg > 0 ? `${Math.max(8, Math.round((d.avg / maxAvg) * 100))}%` : '8%',
                  background: d.avg < 500 ? 'var(--color-up)' : d.avg < 1500 ? 'var(--color-warn)' : 'var(--color-down)',
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

// ─── Main component ──────────────────────────────────────────────────────────

export function WorkspaceDashboard(): React.ReactElement {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchStats(): Promise<void> {
      try {
        const url = currentWorkspace
          ? `/api/v1/dashboard/stats?workspaceId=${encodeURIComponent(currentWorkspace.id)}`
          : '/api/v1/dashboard/stats'

        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json() as {
          success: boolean
          stats: MonitorStats
          monitors: Monitor[]
          incidents: Incident[]
          checkResults: CheckResultLike[]
        }
        if (!cancelled && json.success) {
          setData({
            stats: json.stats,
            monitors: json.monitors ?? [],
            incidents: json.incidents,
            checkResults: json.checkResults,
          })
        }
      } catch {
        // Silently fail — page still loads without data
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [currentWorkspace])

  if (loading) return <LoadingSkeleton />

  const stats    = data?.stats        ?? { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const monitors = data?.monitors     ?? []
  const incidents = data?.incidents   ?? []
  const checkResults = data?.checkResults ?? []

  return (
    <>
      <StatsCards stats={stats} />
      <MonitorsTable monitors={monitors} />
      <div className="db-two-col">
        <RecentIncidents incidents={incidents} />
        <ResponseTimeWidget checkResults={checkResults} />
      </div>
    </>
  )
}
