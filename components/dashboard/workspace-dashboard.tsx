'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Telescope, Pencil } from 'lucide-react'
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

/** Average response times grouped by day for last 7 days */
function buildResponseChart(checkResults: CheckResult[]): { label: string; date: Date; avg: number }[] {
  const dayMap: Record<string, { sum: number; count: number; date: Date }> = {}
  for (const r of checkResults) {
    if (!r.response_time_ms) continue
    const d = new Date(r.checked_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!dayMap[key]) {
      dayMap[key] = { sum: 0, count: 0, date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0) }
    }
    dayMap[key].sum += r.response_time_ms
    dayMap[key].count++
  }
  return Object.values(dayMap)
    .map(v => ({ date: v.date, avg: Math.round(v.sum / v.count), label: `${v.date.getDate()}/${v.date.getMonth() + 1}` }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-7)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: MonitorStats }) {
  const healthPct = stats.total > 0 ? ((stats.up / stats.total) * 100).toFixed(1) : '0'
  return (
    <div className="db-stats db-stats-strip">
      <div className="db-stat-card db-stat-grad-violet all">
        <div className="db-stat-icon all">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div className="db-stat-label">Total Monitors</div>
        <div className="db-stat-value">{stats.total}</div>
        <div className="db-stat-delta">{stats.paused > 0 ? `${stats.paused} paused` : 'All active'}</div>
      </div>
      <div className="db-stat-card db-stat-grad-blue up">
        <div className="db-stat-icon up">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="db-stat-label">Healthy</div>
        <div className="db-stat-value">{stats.up}</div>
        <div className="db-stat-delta">{healthPct}% of monitors</div>
      </div>
      <div className="db-stat-card db-stat-grad-pink down">
        <div className="db-stat-icon down">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div className="db-stat-label">Down</div>
        <div className="db-stat-value">{stats.down}</div>
        <div className="db-stat-delta">{stats.down === 0 ? 'All systems clear' : 'Needs attention'}</div>
      </div>
      <div className="db-stat-card db-stat-grad-amber warn">
        <div className="db-stat-icon warn">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div className="db-stat-label">Degraded</div>
        <div className="db-stat-value">{stats.degraded}</div>
        <div className="db-stat-delta">{stats.degraded === 0 ? 'Performance normal' : 'Slow responses'}</div>
      </div>
    </div>
  )
}

function AddBtn({ hasMonitors }: { hasMonitors: boolean }): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent): void {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggleOpen(): void {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
  }

  if (!hasMonitors) {
    return (
      <Link href="/dashboard/monitors/scan" className="btn btn-primary btn-sm">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Monitor
      </Link>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="btn btn-primary btn-sm" onClick={toggleOpen}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Monitor
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginLeft: 4 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && menuPos && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', zIndex: 1000, minWidth: 210, overflow: 'hidden' }}>
          <Link href="/dashboard/monitors/scan" onClick={() => setOpen(false)} style={{ display: 'block', padding: '11px 14px', textDecoration: 'none', borderBottom: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}><Telescope size={14} /> Scan a domain</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-detect what needs monitoring</div>
          </Link>
          <Link href="/dashboard/monitors/new/manual" onClick={() => setOpen(false)} style={{ display: 'block', padding: '11px 14px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}><Pencil size={14} /> Add a specific monitor</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Choose a type and configure manually</div>
          </Link>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Domain grouping helpers ──────────────────────────────────────────────────

function extractDomain(target: string): string {
  try {
    const withProto = target.startsWith('http') ? target : `https://${target}`
    return new URL(withProto).hostname
  } catch {
    return target.split('/')[0] ?? target
  }
}

const STATUS_ORDER = ['down', 'degraded', 'paused', 'up', 'unknown'] as const
type AggStatus = typeof STATUS_ORDER[number]

// Only these types being 'down' means the site is truly unreachable
const AVAILABILITY_TYPES = new Set(['http', 'ping', 'ssl', 'heartbeat', 'api', 'port'])

function worstStatus(monitors: Monitor[]): AggStatus {
  const active = monitors.filter(m => !m.is_paused)
  // True outage — an availability monitor is down
  if (active.some(m => m.status === 'down' && AVAILABILITY_TYPES.has(m.type))) return 'down'
  // Degraded — any monitor has issues (change detected, slow, config problem)
  if (active.some(m => m.status === 'down' || m.status === 'degraded')) return 'degraded'
  if (monitors.some(m => m.is_paused)) return 'paused'
  if (active.some(m => m.status === 'up')) return 'up'
  return 'unknown'
}

interface DomainGroup {
  domain: string
  monitors: Monitor[]
  status: AggStatus
}

function groupByDomain(monitors: Monitor[]): DomainGroup[] {
  const map: Record<string, Monitor[]> = {}
  for (const m of monitors) {
    const d = extractDomain(m.target)
    if (!map[d]) map[d] = []
    map[d].push(m)
  }
  return Object.entries(map)
    .map(([domain, mons]) => ({ domain, monitors: mons, status: worstStatus(mons) }))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
}

// ─── Domain cards ─────────────────────────────────────────────────────────────

function DomainStatusDot({ status }: { status: AggStatus }) {
  const colors: Record<AggStatus, string> = {
    down:     'var(--color-down)',
    degraded: 'var(--color-warn)',
    paused:   'var(--text-muted)',
    up:       'var(--color-up)',
    unknown:  'var(--text-muted)',
  }
  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: colors[status],
      flexShrink: 0,
      animation: status === 'down' ? 'pulse 1.5s infinite' : undefined,
    }} />
  )
}

function DomainCards({ monitors }: { monitors: Monitor[] }) {
  const groups = useMemo(() => groupByDomain(monitors), [monitors])

  const statusLabel: Record<AggStatus, string> = {
    down: 'Down', degraded: 'Degraded', paused: 'Paused', up: 'All Up', unknown: 'Unknown',
  }
  const statusBadgeClass: Record<AggStatus, string> = {
    down: 'db-badge-down', degraded: 'db-badge-warn', paused: 'db-badge-outline', up: 'db-badge-up', unknown: 'db-badge-outline',
  }

  return (
    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="db-card-header">
        <div className="db-card-title">Domains</div>
        <div className="db-card-actions">
          <AddBtn hasMonitors={monitors.length > 0} />
          <Link href="/dashboard/monitors" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View all monitors →</Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="db-home-domains-fill" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No monitors yet. Add your first one to start tracking uptime.</p>
          <Link href="/dashboard/monitors/scan" className="btn btn-primary btn-sm">+ Add Your First Monitor</Link>
        </div>
      ) : (
        <div className="db-domains-scroll">
          {groups.map(g => (
            <Link
              key={g.domain}
              href={`/dashboard/monitors?search=${encodeURIComponent(g.domain)}`}
              className="db-domain-item"
            >
              <div
                className={`db-domain-inner${g.status === 'down' ? ' db-domain-inner--down' : g.status === 'degraded' ? ' db-domain-inner--warn' : ''}`}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <DomainStatusDot status={g.status} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {g.domain}
                  </span>
                  <span className={`db-badge ${statusBadgeClass[g.status]}`} style={{ fontSize: 10, flexShrink: 0 }}>
                    {statusLabel[g.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {g.monitors.length} monitor{g.monitors.length !== 1 ? 's' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    {[...new Set(g.monitors.map(m => m.type))].slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                        {t}
                      </span>
                    ))}
                    {new Set(g.monitors.map(m => m.type)).size > 4 && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>+{new Set(g.monitors.map(m => m.type)).size - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
              <div style={{ flex: 1, minWidth: 0 }}>
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

function ResponseBarChart({ days, maxAvg, barColor }: { days: { label: string; date: Date; avg: number }[]; maxAvg: number; barColor: (avg: number) => string }) {
  return (
    <div className="db-bar-chart">
      {days.map((d, i) => {
        const pct = maxAvg > 0 ? Math.max(8, Math.round((d.avg / maxAvg) * 100)) : 8
        return (
          <div key={i} className="db-bar-chart-col" title={`${d.label}: ${d.avg}ms`}>
            <div className="db-bar-chart-bar" style={{ height: `${pct}%`, background: barColor(d.avg) }} />
          </div>
        )
      })}
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
          <ResponseBarChart days={days} maxAvg={maxAvg} barColor={barColor} />
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
      <div className="db-stats db-stats-strip">
        {[1,2,3,4].map(i => (
          <div key={i} className="db-stat-card all" style={{ opacity: 0.4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--border-primary)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 9, background: 'var(--border-primary)', borderRadius: 4, width: '55%', marginBottom: 8 }} />
              <div style={{ height: 20, background: 'var(--border-primary)', borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="db-home-split">
        <div className="db-card" style={{ height: 260, opacity: 0.4 }} />
        <div className="db-home-side">
          <div className="db-card" style={{ height: 180, opacity: 0.4 }} />
          <div className="db-card" style={{ height: 180, opacity: 0.4 }} />
        </div>
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function WorkspaceDashboard(): React.ReactElement {
  const { currentWorkspace } = useWorkspace()
  const [data, setData]     = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <Skeleton />

  const stats        = data?.stats        ?? { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const monitors     = data?.monitors     ?? []
  const incidents    = data?.incidents    ?? []
  const checkResults = data?.checkResults ?? []

  return (
    <>
      <StatCards stats={stats} />
      <div className="db-home-split">
        <div className="db-home-side">
          <IncidentsPanel incidents={incidents} />
          <ResponseChart checkResults={checkResults} />
        </div>
        <DomainCards monitors={monitors} />
      </div>
    </>
  )
}
