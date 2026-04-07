'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CompetitorMonitor, CompetitorCheckResult } from '@/lib/db/competitor-monitors'

interface DailyStat {
  date: string
  up: number
  down: number
  degraded: number
  total: number
}

interface ResponsePoint {
  t: string
  ms: number
  status: string
}

interface DetailData {
  competitor: CompetitorMonitor
  stats: {
    uptimePct: number | null
    avgResponseMs: number | null
    totalChecks: number
    upCount: number
    downCount: number
    degradedCount: number
    downHoursApprox: number
  }
  dailyStats: DailyStat[]
  statusLog: CompetitorCheckResult[]
  responseSeries: ResponsePoint[]
  period: number
}

interface OrgMonitor { id: string; name: string; target: string }

interface Props {
  competitor: CompetitorMonitor
  orgMonitors: OrgMonitor[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  if (status === 'up') return '#22c55e'
  if (status === 'down') return '#ef4444'
  if (status === 'degraded') return '#f59e0b'
  return '#94a3b8'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Up'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Unknown'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ── SVG Uptime Bar Chart (90 days) ───────────────────────────────────────────

function UptimeBarChart({ dailyStats }: { dailyStats: DailyStat[] }): React.ReactElement {
  const W = 780
  const H = 48
  const BAR_COUNT = 90
  const BAR_W = 6
  const GAP = 2
  const TOTAL_W = BAR_COUNT * (BAR_W + GAP) - GAP

  // Build a map of date → stat
  const byDate: Record<string, DailyStat> = {}
  for (const d of dailyStats) byDate[d.date] = d

  // Generate last 90 days
  const days: string[] = []
  for (let i = BAR_COUNT - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }

  return (
    <div className="comp-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${TOTAL_W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {days.map((date, i) => {
          const stat = byDate[date]
          let fill = '#e2e8f0' // no data
          if (stat && stat.total > 0) {
            if (stat.down > 0) fill = '#ef4444'
            else if (stat.degraded > 0) fill = '#f59e0b'
            else fill = '#22c55e'
          }
          const x = i * (BAR_W + GAP)
          return (
            <rect key={date} x={x} y={0} width={BAR_W} height={H} rx={1} fill={fill}>
              <title>{date}{stat ? `: ${stat.up}↑ ${stat.down}↓ ${stat.degraded}⚠` : ': no data'}</title>
            </rect>
          )
        })}
      </svg>
      <div className="comp-chart-legend">
        <span><span style={{ background: '#22c55e' }} className="comp-legend-dot" /> Up</span>
        <span><span style={{ background: '#f59e0b' }} className="comp-legend-dot" /> Degraded</span>
        <span><span style={{ background: '#ef4444' }} className="comp-legend-dot" /> Down</span>
        <span><span style={{ background: '#e2e8f0' }} className="comp-legend-dot" /> No data</span>
      </div>
    </div>
  )
}

// ── SVG Response Time Line Chart ──────────────────────────────────────────────

function ResponseTimeChart({ series }: { series: ResponsePoint[] }): React.ReactElement {
  if (series.length < 2) {
    return <div className="comp-chart-empty">Not enough data yet</div>
  }

  const W = 780
  const H = 80
  const PAD = { t: 8, b: 20, l: 40, r: 8 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const times = series.map(p => new Date(p.t).getTime())
  const values = series.map(p => p.ms)
  const minT = Math.min(...times)
  const maxT = Math.max(...times)
  const minV = 0
  const maxV = Math.max(...values, 1000)

  const toX = (t: number) => PAD.l + ((t - minT) / (maxT - minT || 1)) * innerW
  const toY = (v: number) => PAD.t + innerH - ((v - minV) / (maxV - minV)) * innerH

  const points = series.map(p => `${toX(new Date(p.t).getTime())},${toY(p.ms)}`).join(' ')

  // Y-axis labels
  const yLabels = [0, Math.round(maxV / 2), maxV]

  return (
    <div className="comp-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {yLabels.map(v => (
          <g key={v}>
            <line
              x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)}
              stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="3 3"
            />
            <text x={PAD.l - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`}
            </text>
          </g>
        ))}
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Area fill */}
        <polygon
          points={`${PAD.l},${PAD.t + innerH} ${points} ${W - PAD.r},${PAD.t + innerH}`}
          fill="#3b82f620"
        />
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompetitorDetail({ competitor, orgMonitors }: Props): React.ReactElement {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [compareMonitorId, setCompareMonitorId] = useState<string>('')
  const [compareMonitor, setCompareMonitor] = useState<OrgMonitor | null>(null)
  const [compareStats, setCompareStats] = useState<{ uptimePct: number; avgResponseMs: number | null; status: string } | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(competitor.ai_summary)
  const [aiSummaryAt, setAiSummaryAt] = useState<string | null>(competitor.ai_summary_at)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/competitors/${competitor.id}?period=${p}`)
      if (res.ok) {
        const json = await res.json() as DetailData
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [competitor.id])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  useEffect(() => {
    if (compareMonitorId) {
      const monitor = orgMonitors.find(m => m.id === compareMonitorId) ?? null
      setCompareMonitor(monitor)
      if (monitor) {
        setCompareLoading(true)
        setCompareStats(null)
        fetch(`/api/v1/monitors/${compareMonitorId}/stats?days=${period}`)
          .then(r => r.json())
          .then((json: { success?: boolean; monitor?: { status: string }; stats?: { uptimePct: number; avgResponseMs: number | null } }) => {
            if (json.success && json.stats && json.monitor) {
              setCompareStats({ ...json.stats, status: json.monitor.status })
            }
          })
          .catch(() => null)
          .finally(() => setCompareLoading(false))
      }
    } else {
      setCompareMonitor(null)
      setCompareStats(null)
    }
  }, [compareMonitorId, orgMonitors, period])

  const canRefreshAi = !aiSummaryAt ||
    (Date.now() - new Date(aiSummaryAt).getTime()) > 24 * 3600000

  async function handleGenerateAi(): Promise<void> {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch(`/api/v1/competitors/${competitor.id}/ai-summary`, { method: 'POST' })
      const json = await res.json() as { success?: boolean; summary?: string; generatedAt?: string; error?: string }
      if (!res.ok) {
        setAiError(json.error ?? 'Failed to generate summary')
      } else {
        setAiSummary(json.summary ?? null)
        setAiSummaryAt(json.generatedAt ?? new Date().toISOString())
      }
    } catch {
      setAiError('Network error. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const stats = data?.stats
  const responseSeries = data?.responseSeries ?? []
  const filteredSeries = responseSeries.filter(p => {
    const age = (Date.now() - new Date(p.t).getTime()) / 86400000
    return age <= period
  })

  return (
    <div className="comp-detail">

      {/* Stat Cards */}
      <div className="comp-stat-cards">
        <div className="card comp-stat-card">
          <div className="comp-stat-card-label">Uptime ({period}d)</div>
          <div className="comp-stat-card-value" style={{ color: stats?.uptimePct !== null && stats?.uptimePct !== undefined && stats.uptimePct < 99 ? '#f59e0b' : '#22c55e' }}>
            {stats?.uptimePct !== null && stats?.uptimePct !== undefined ? `${stats.uptimePct}%` : '--'}
          </div>
        </div>
        <div className="card comp-stat-card">
          <div className="comp-stat-card-label">Avg Response ({period}d)</div>
          <div className="comp-stat-card-value">
            {stats?.avgResponseMs !== null && stats?.avgResponseMs !== undefined
              ? stats.avgResponseMs >= 1000
                ? `${(stats.avgResponseMs / 1000).toFixed(1)}s`
                : `${stats.avgResponseMs}ms`
              : '--'}
          </div>
        </div>
        <div className="card comp-stat-card">
          <div className="comp-stat-card-label">Downtime (est. 90d)</div>
          <div className="comp-stat-card-value" style={{ color: (stats?.downHoursApprox ?? 0) > 1 ? '#ef4444' : undefined }}>
            {stats !== undefined ? `${stats.downHoursApprox}h` : '--'}
          </div>
        </div>
        <div className="card comp-stat-card">
          <div className="comp-stat-card-label">Checks ({period}d)</div>
          <div className="comp-stat-card-value">{stats?.totalChecks.toLocaleString() ?? '--'}</div>
        </div>
        <div className="card comp-stat-card">
          <div className="comp-stat-card-label">Current Status</div>
          <div className="comp-stat-card-value" style={{ color: getStatusColor(competitor.last_status) }}>
            {getStatusLabel(competitor.last_status)}
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="comp-period-filter">
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 8 }}>Period:</span>
        {[7, 30, 90].map(p => (
          <button
            key={p}
            className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={() => setPeriod(p)}
          >
            {p}d
          </button>
        ))}
      </div>

      {/* Uptime Bar Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Uptime — Last 90 Days</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1 bar per day</div>
        </div>
        <div className="card-content">
          {data ? <UptimeBarChart dailyStats={data.dailyStats} /> : <div className="comp-chart-empty">Loading...</div>}
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Response Time — {period}d</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Successful checks only</div>
        </div>
        <div className="card-content">
          {loading
            ? <div className="comp-chart-empty">Loading...</div>
            : <ResponseTimeChart series={filteredSeries} />
          }
        </div>
      </div>

      {/* Compare + AI — side by side on wide screens */}
      <div className="comp-bottom-grid">

        {/* Compare against my site */}
        {orgMonitors.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Compare Against My Site</div></div>
            <div className="card-content">
              <select
                className="input"
                value={compareMonitorId}
                onChange={e => setCompareMonitorId(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                <option value="">— Select one of your monitors —</option>
                {orgMonitors.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.target})</option>
                ))}
              </select>
              {compareMonitor && stats && (
                <div className="comp-compare-table">
                  <div className="comp-compare-row comp-compare-header">
                    <div />
                    <div>{competitor.display_name}</div>
                    <div>{compareMonitor.name}</div>
                  </div>
                  <div className="comp-compare-row">
                    <div>Uptime ({period}d)</div>
                    <div style={{ color: stats.uptimePct !== null && stats.uptimePct < 99 ? '#f59e0b' : '#22c55e' }}>
                      {stats.uptimePct !== null ? `${stats.uptimePct}%` : '--'}
                    </div>
                    <div style={{ color: compareLoading ? 'var(--text-muted)' : compareStats && compareStats.uptimePct < 99 ? '#f59e0b' : '#22c55e' }}>
                      {compareLoading ? 'Loading...' : compareStats ? `${compareStats.uptimePct}%` : '--'}
                    </div>
                  </div>
                  <div className="comp-compare-row">
                    <div>Avg Response ({period}d)</div>
                    <div>
                      {stats.avgResponseMs !== null
                        ? stats.avgResponseMs >= 1000
                          ? `${(stats.avgResponseMs / 1000).toFixed(1)}s`
                          : `${stats.avgResponseMs}ms`
                        : '--'}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {compareLoading ? 'Loading...' : compareStats?.avgResponseMs !== null && compareStats?.avgResponseMs !== undefined
                        ? compareStats.avgResponseMs >= 1000
                          ? `${(compareStats.avgResponseMs / 1000).toFixed(1)}s`
                          : `${compareStats.avgResponseMs}ms`
                        : '--'}
                    </div>
                  </div>
                  <div className="comp-compare-row">
                    <div>Status now</div>
                    <div style={{ color: getStatusColor(competitor.last_status) }}>
                      {getStatusLabel(competitor.last_status)}
                    </div>
                    <div style={{ color: compareLoading ? 'var(--text-muted)' : getStatusColor(compareStats?.status ?? 'unknown') }}>
                      {compareLoading ? 'Loading...' : compareStats ? getStatusLabel(compareStats.status) : '--'}
                    </div>
                  </div>
                </div>
              )}
              {!compareMonitor && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Select one of your monitors above to compare side by side.
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">AI Reliability Summary</div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '4px 12px' }}
              disabled={!canRefreshAi || aiLoading}
              onClick={handleGenerateAi}
              title={!canRefreshAi ? 'Can only refresh once every 24 hours' : 'Generate AI summary'}
            >
              {aiLoading ? 'Generating...' : canRefreshAi ? 'Generate' : `Refresh in ${Math.ceil((24 * 3600000 - (Date.now() - new Date(aiSummaryAt!).getTime())) / 3600000)}h`}
            </button>
          </div>
          <div className="card-content">
            {aiError && (
              <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{aiError}</p>
            )}
            {aiSummary ? (
              <>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {aiSummary}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Based on Uptrue&apos;s automated monitoring data only. Does not represent the overall quality or reliability of this service. Generated {aiSummaryAt ? timeAgo(aiSummaryAt) : ''}.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No summary yet. Click Generate to create an AI reliability summary based on monitoring data.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Log */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Check Log</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 50 checks</div>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
          ) : !data?.statusLog.length ? (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>No check results yet.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>HTTP</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {data.statusLog.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtTime(r.checked_at)}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(r.status), flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{getStatusLabel(r.status)}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {r.response_time_ms !== null
                          ? r.response_time_ms >= 1000
                            ? `${(r.response_time_ms / 1000).toFixed(1)}s`
                            : `${r.response_time_ms}ms`
                          : '--'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {r.status_code ?? '--'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.keyword_matched
                          ? `${r.keyword_category === 'maintenance' ? 'Maintenance' : 'Error'}: "${r.keyword_matched}"`
                          : r.error_message ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
