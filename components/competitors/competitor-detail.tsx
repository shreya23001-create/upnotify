'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Zap, Clock, AlertTriangle, CheckCircle, BarChart2, Sparkles, RefreshCw, ArrowUpDown } from 'lucide-react'
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

function getStatusColor(status: string): string {
  if (status === 'up') return '#22c55e'
  if (status === 'down') return '#ef4444'
  if (status === 'degraded') return '#f59e0b'
  return '#94a3b8'
}

function getStatusBg(status: string): string {
  if (status === 'up') return 'rgba(34,197,94,0.1)'
  if (status === 'down') return 'rgba(239,68,68,0.1)'
  if (status === 'degraded') return 'rgba(245,158,11,0.1)'
  return 'rgba(148,163,184,0.1)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Up'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Unknown'
}

function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
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

// ── Uptime Bar Chart ──────────────────────────────────────────────────────────

function UptimeBarChart({ dailyStats }: { dailyStats: DailyStat[] }): React.ReactElement {
  const BAR_COUNT = 90
  const BAR_W = 6
  const GAP = 2
  const H = 48
  const TOTAL_W = BAR_COUNT * (BAR_W + GAP) - GAP

  const byDate: Record<string, DailyStat> = {}
  for (const d of dailyStats) byDate[d.date] = d

  const days: string[] = []
  for (let i = BAR_COUNT - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }

  return (
    <div className="wd-bar-wrap">
      <svg width="100%" viewBox={`0 0 ${TOTAL_W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {days.map((date, i) => {
          const stat = byDate[date]
          let fill = 'var(--border-color, #e2e8f0)'
          if (stat && stat.total > 0) {
            if (stat.down > 0) fill = '#ef4444'
            else if (stat.degraded > 0) fill = '#f59e0b'
            else fill = '#22c55e'
          }
          return (
            <rect key={date} x={i * (BAR_W + GAP)} y={0} width={BAR_W} height={H} rx={1} fill={fill}>
              <title>{date}{stat ? `: ${stat.up}↑ ${stat.down}↓ ${stat.degraded} degraded` : ': no data'}</title>
            </rect>
          )
        })}
      </svg>
      <div className="wd-bar-legend">
        <span><span className="wd-legend-dot" style={{ background: '#22c55e' }} /> Up</span>
        <span><span className="wd-legend-dot" style={{ background: '#f59e0b' }} /> Degraded</span>
        <span><span className="wd-legend-dot" style={{ background: '#ef4444' }} /> Down</span>
        <span><span className="wd-legend-dot" style={{ background: 'var(--border-color)' }} /> No data</span>
      </div>
    </div>
  )
}

// ── Response Time Chart ───────────────────────────────────────────────────────

function ResponseTimeChart({ series }: { series: ResponsePoint[] }): React.ReactElement {
  if (series.length < 2) {
    return <div className="wd-chart-empty">Not enough data yet — checks will appear here once data is collected.</div>
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
  const maxV = Math.max(...values, 1000)

  const toX = (t: number) => PAD.l + ((t - minT) / (maxT - minT || 1)) * innerW
  const toY = (v: number) => PAD.t + innerH - (v / maxV) * innerH

  const points = series.map(p => `${toX(new Date(p.t).getTime())},${toY(p.ms)}`).join(' ')
  const yLabels = [0, Math.round(maxV / 2), maxV]

  return (
    <div className="wd-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {yLabels.map(v => (
          <g key={v}>
            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={PAD.l - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`}
            </text>
          </g>
        ))}
        <polygon
          points={`${PAD.l},${PAD.t + innerH} ${points} ${W - PAD.r},${PAD.t + innerH}`}
          fill="rgba(59,130,246,0.08)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function CompetitorDetail({ competitor, orgMonitors }: Props): React.ReactElement {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [compareMonitorId, setCompareMonitorId] = useState('')
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
      if (res.ok) setData(await res.json() as DetailData)
    } finally {
      setLoading(false)
    }
  }, [competitor.id])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  useEffect(() => {
    if (!compareMonitorId) { setCompareMonitor(null); setCompareStats(null); return }
    const monitor = orgMonitors.find(m => m.id === compareMonitorId) ?? null
    setCompareMonitor(monitor)
    if (!monitor) return
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
  const filteredSeries = (data?.responseSeries ?? []).filter(p =>
    (Date.now() - new Date(p.t).getTime()) / 86400000 <= period
  )

  const statusColor = getStatusColor(competitor.last_status)
  const statusBg = getStatusBg(competitor.last_status)

  return (
    <div className="wd-detail">

      {/* Stat strip */}
      <div className="wd-stat-strip">
        <div className="wd-stat-item">
          <div className="wd-stat-icon" style={{ background: statusBg, color: statusColor }}>
            <Activity size={15} />
          </div>
          <div>
            <div className="wd-stat-label">Current Status</div>
            <div className="wd-stat-value" style={{ color: statusColor }}>
              {getStatusLabel(competitor.last_status)}
            </div>
          </div>
        </div>
        <div className="wd-stat-divider" />
        <div className="wd-stat-item">
          <div className="wd-stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            <BarChart2 size={15} />
          </div>
          <div>
            <div className="wd-stat-label">Uptime ({period}d)</div>
            <div className="wd-stat-value" style={{ color: stats?.uptimePct !== null && stats?.uptimePct !== undefined && stats.uptimePct < 99 ? '#f59e0b' : '#22c55e' }}>
              {stats?.uptimePct !== null && stats?.uptimePct !== undefined ? `${stats.uptimePct}%` : '—'}
            </div>
          </div>
        </div>
        <div className="wd-stat-divider" />
        <div className="wd-stat-item">
          <div className="wd-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Zap size={15} />
          </div>
          <div>
            <div className="wd-stat-label">Avg Response ({period}d)</div>
            <div className="wd-stat-value">{fmtMs(stats?.avgResponseMs)}</div>
          </div>
        </div>
        <div className="wd-stat-divider" />
        <div className="wd-stat-item">
          <div className="wd-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertTriangle size={15} />
          </div>
          <div>
            <div className="wd-stat-label">Down (est. 90d)</div>
            <div className="wd-stat-value" style={{ color: (stats?.downHoursApprox ?? 0) > 1 ? '#ef4444' : undefined }}>
              {stats !== undefined ? `${stats.downHoursApprox}h` : '—'}
            </div>
          </div>
        </div>
        <div className="wd-stat-divider" />
        <div className="wd-stat-item">
          <div className="wd-stat-icon" style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>
            <CheckCircle size={15} />
          </div>
          <div>
            <div className="wd-stat-label">Checks ({period}d)</div>
            <div className="wd-stat-value">{stats?.totalChecks.toLocaleString() ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Period pills */}
      <div className="wd-period-bar">
        <span className="wd-period-label">Period:</span>
        {[7, 30, 90].map(p => (
          <button
            key={p}
            className={`wd-period-btn${period === p ? ' wd-period-btn--active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p}d
          </button>
        ))}
      </div>

      {/* Uptime bars */}
      <div className="card wd-chart-card">
        <div className="card-header">
          <div className="card-title">Uptime — Last 90 Days</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>1 bar per day</span>
        </div>
        <div className="card-content">
          {data ? <UptimeBarChart dailyStats={data.dailyStats} /> : <div className="wd-chart-empty">Loading…</div>}
        </div>
      </div>

      {/* Response time chart */}
      <div className="card wd-chart-card">
        <div className="card-header">
          <div className="card-title">Response Time — {period}d</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Successful checks only</span>
        </div>
        <div className="card-content">
          {loading
            ? <div className="wd-chart-empty">Loading…</div>
            : <ResponseTimeChart series={filteredSeries} />
          }
        </div>
      </div>

      {/* Compare + AI side by side */}
      <div className="wd-bottom-grid">

        {/* Compare */}
        {orgMonitors.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ArrowUpDown size={14} style={{ marginRight: 6 }} />
                Compare Against My Site
              </div>
            </div>
            <div className="card-content">
              <select
                className="form-input"
                value={compareMonitorId}
                onChange={e => setCompareMonitorId(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                <option value="">— Select one of your monitors —</option>
                {orgMonitors.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.target})</option>
                ))}
              </select>

              {compareMonitor && stats ? (
                <div className="wd-compare-table">
                  <div className="wd-compare-row wd-compare-head">
                    <div />
                    <div>{competitor.display_name}</div>
                    <div>{compareMonitor.name}</div>
                  </div>
                  <div className="wd-compare-row">
                    <div>Uptime ({period}d)</div>
                    <div style={{ color: stats.uptimePct !== null && stats.uptimePct < 99 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                      {stats.uptimePct !== null ? `${stats.uptimePct}%` : '—'}
                    </div>
                    <div style={{ color: compareLoading ? 'var(--text-muted)' : compareStats && compareStats.uptimePct < 99 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                      {compareLoading ? '…' : compareStats ? `${compareStats.uptimePct}%` : '—'}
                    </div>
                  </div>
                  <div className="wd-compare-row">
                    <div>Avg Response ({period}d)</div>
                    <div>{fmtMs(stats.avgResponseMs)}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {compareLoading ? '…' : fmtMs(compareStats?.avgResponseMs)}
                    </div>
                  </div>
                  <div className="wd-compare-row">
                    <div>Status now</div>
                    <div style={{ color: getStatusColor(competitor.last_status), fontWeight: 600 }}>
                      {getStatusLabel(competitor.last_status)}
                    </div>
                    <div style={{ color: compareLoading ? 'var(--text-muted)' : getStatusColor(compareStats?.status ?? 'unknown'), fontWeight: 600 }}>
                      {compareLoading ? '…' : compareStats ? getStatusLabel(compareStats.status) : '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Select one of your monitors above to see a side-by-side comparison.
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={14} style={{ marginRight: 6, color: '#8b5cf6' }} />
              AI Reliability Summary
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '4px 12px', display: 'flex', gap: 6, alignItems: 'center' }}
              disabled={!canRefreshAi || aiLoading}
              onClick={handleGenerateAi}
              title={!canRefreshAi ? 'Can only refresh once every 24 hours' : 'Generate AI summary'}
            >
              <RefreshCw size={12} className={aiLoading ? 'wd-spin' : ''} />
              {aiLoading
                ? 'Generating…'
                : canRefreshAi
                  ? 'Generate'
                  : `Refresh in ${Math.ceil((24 * 3600000 - (Date.now() - new Date(aiSummaryAt!).getTime())) / 3600000)}h`
              }
            </button>
          </div>
          <div className="card-content">
            {aiError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{aiError}</p>}
            {aiSummary ? (
              <>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {aiSummary}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Based on Uptrue&apos;s automated monitoring data only. Does not represent the overall quality or reliability of this service.
                  {aiSummaryAt && ` Generated ${timeAgo(aiSummaryAt)}.`}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No summary yet. Click Generate to create an AI reliability analysis based on uptime and response data.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Check log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={14} style={{ marginRight: 6 }} />
            Check Log
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 50 checks</span>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
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
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }} suppressHydrationWarning>
                        {fmtTime(r.checked_at)}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: getStatusColor(r.status), flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: getStatusColor(r.status) }}>{getStatusLabel(r.status)}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{fmtMs(r.response_time_ms)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.status_code ?? '—'}</td>
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
