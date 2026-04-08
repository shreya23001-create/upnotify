'use client'

import { useState, useEffect, useRef } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Phase = 'normal' | 'degrading' | 'down' | 'recovering'
type MonitorStatus = 'up' | 'slow' | 'down' | 'recovering'

interface PhaseState {
  status: MonitorStatus
  response: string
  responseClass: 'fast' | 'med' | 'slow'
  lastCheck: string
  rowBg: string | undefined
  uptime: string
  uptimeBad: boolean
  stats: { healthy: number; down: number; degraded: number }
}

interface UserMonitor {
  id: string
  name: string
  url: string
  type: string
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const PHASE_ORDER: Phase[] = ['normal', 'degrading', 'down', 'recovering']
const PHASE_DURATIONS: Record<Phase, number> = {
  normal: 7000, degrading: 1200, down: 2000, recovering: 1800,
}
const PHASE_DATA: Record<Phase, PhaseState> = {
  normal: {
    status: 'up', response: '198ms', responseClass: 'fast', lastCheck: '30s ago',
    rowBg: undefined, uptime: '99.8%', uptimeBad: false,
    stats: { healthy: 24, down: 0, degraded: 0 },
  },
  degrading: {
    status: 'slow', response: '2,341ms', responseClass: 'med', lastCheck: '15s ago',
    rowBg: 'rgba(245,158,11,0.06)', uptime: '99.5%', uptimeBad: true,
    stats: { healthy: 23, down: 0, degraded: 1 },
  },
  down: {
    status: 'down', response: 'timeout', responseClass: 'slow', lastCheck: 'Down · 3m',
    rowBg: 'rgba(239,68,68,0.06)', uptime: '98.2%', uptimeBad: true,
    stats: { healthy: 22, down: 1, degraded: 0 },
  },
  recovering: {
    status: 'recovering', response: '945ms', responseClass: 'med', lastCheck: 'Recovering',
    rowBg: 'rgba(59,130,246,0.04)', uptime: '98.2%', uptimeBad: true,
    stats: { healthy: 23, down: 0, degraded: 1 },
  },
}

// Fixed heights — avoids hydration mismatch from Math.random()
const BARS_GOOD = [10, 14, 8, 16, 12, 15, 9, 13, 11, 16, 14, 10, 15, 12, 8, 14, 13, 11, 16, 9]
const BARS_BAD  = [10, 14, 8, 16, 12, 15, 9, 13, 11, 16, 14, 10, 15, 12, 8, 7, 4, 2, 1, 0]

// Spark chart values for row 2 detail (checkout.shop.io)
const CHECKOUT_SPARK = [24, 25, 23, 26, 0, 0, 16] // 0 = down (timeout), scaled /8 px height

/* ─── Sub-components ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: MonitorStatus | string }): React.ReactElement {
  const map: Record<string, { cls: string; dot: string; label: string; pulse?: boolean }> = {
    up:         { cls: 'badge-up',   dot: 'var(--color-up)',   label: 'Up' },
    down:       { cls: 'badge-down', dot: 'var(--color-down)', label: 'Down',       pulse: true },
    slow:       { cls: 'badge-warn', dot: 'var(--color-warn)', label: 'Slow' },
    recovering: { cls: 'badge-warn', dot: 'var(--color-warn)', label: 'Recovering', pulse: true },
  }
  const m = map[status] ?? map.up
  return (
    <span className={`badge ${m.cls}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
      <span style={{
        width: '5px', height: '5px', background: m.dot, borderRadius: '50%',
        display: 'inline-block', animation: m.pulse ? 'pulse 1s infinite' : undefined,
      }} />{' '}{m.label}
    </span>
  )
}

function UptimeBars({ bad }: { bad: boolean }): React.ReactElement {
  const bars = bad ? BARS_BAD : BARS_GOOD
  return (
    <div className="mm-uptime-bars">
      {bars.map((h, i) => {
        let bg = 'var(--color-up)'
        if (bad && i >= 17) bg = 'var(--color-down)'
        else if (bad && i >= 15) bg = 'var(--color-warn)'
        return <div key={i} className="mm-uptick" style={{ height: `${h}px`, background: bg }} />
      })}
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function HeroDashboardMockup(): React.ReactElement {
  const [phase, setPhase]               = useState<Phase>('normal')
  const [expandedRow, setExpandedRow]   = useState<string | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [userMonitors, setUserMonitors] = useState<UserMonitor[]>([])
  const [form, setForm]                 = useState({ name: '', url: '', type: 'HTTP', interval: '1m' })
  const [addSuccess, setAddSuccess]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Auto-animation cycle */
  useEffect(() => {
    let current: Phase = 'normal'
    function schedule(): void {
      timerRef.current = setTimeout(() => {
        const idx = PHASE_ORDER.indexOf(current)
        current = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length]
        setPhase(current)
        schedule()
      }, PHASE_DURATIONS[current])
    }
    schedule()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const pd    = PHASE_DATA[phase]
  const total = 24 + userMonitors.length

  function toggleRow(id: string): void {
    setExpandedRow(r => r === id ? null : id)
  }

  function handleSave(): void {
    if (!form.name.trim() || !form.url.trim()) return
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`
    setUserMonitors(prev => [...prev, { id: `u${Date.now()}`, name: form.name.trim(), url, type: form.type }])
    setAddSuccess(true)
    setTimeout(() => {
      setAddSuccess(false)
      setShowModal(false)
      setForm({ name: '', url: '', type: 'HTTP', interval: '1m' })
    }, 1200)
  }

  function statClass(f: string): string {
    return activeFilter === f ? ' hm-stat-active' : ''
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="hero-mockup fade-up delay-3">
      <div className="hero-mockup-shadow" />
      <div className="mockup-window">

        {/* Title bar */}
        <div className="mockup-titlebar">
          <div className="titlebar-dot td-red" />
          <div className="titlebar-dot td-yellow" />
          <div className="titlebar-dot td-green" />
          <div className="mockup-url">app.uptrue.io/dashboard</div>
        </div>

        <div className="mockup-body" style={{ position: 'relative' }}>

          {/* ── Alert banner (auto-animation) ────────────────────────── */}
          <div className={`hm-alert-banner${phase === 'down' ? ' hm-alert-down' : phase === 'recovering' ? ' hm-alert-recovery' : ' hm-alert-hidden'}`}>
            {phase === 'down' ? (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <strong>Incident detected:</strong>&nbsp;checkout.shop.io is down — alert sent to 3 channels
                <span className="hm-alert-time">3 min ago</span>
              </>
            ) : phase === 'recovering' ? (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                <strong>Recovering:</strong>&nbsp;checkout.shop.io is responding again
                <span className="hm-alert-time">Just now</span>
              </>
            ) : null}
          </div>

          {/* ── Add Monitor modal ────────────────────────────────────── */}
          {showModal && (
            <div className="hm-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="hm-modal" onClick={e => e.stopPropagation()}>
                <div className="hm-modal-hdr">
                  <span className="hm-modal-title">Add Monitor</span>
                  <button className="hm-modal-close" onClick={() => setShowModal(false)}>✕</button>
                </div>
                {addSuccess ? (
                  <div className="hm-modal-success">
                    <svg width="22" height="22" fill="none" stroke="var(--color-up)" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    Monitor added successfully!
                  </div>
                ) : (
                  <>
                    <div className="hm-modal-body">
                      <div className="hm-form-row">
                        <label className="hm-form-label">Monitor name</label>
                        <input
                          className="hm-form-input"
                          placeholder="My Website"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="hm-form-row">
                        <label className="hm-form-label">URL to monitor</label>
                        <input
                          className="hm-form-input"
                          placeholder="https://example.com"
                          value={form.url}
                          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        />
                      </div>
                      <div className="hm-form-row hm-form-two">
                        <div>
                          <label className="hm-form-label">Type</label>
                          <select className="hm-form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                            <option>HTTP</option><option>SSL</option><option>Domain</option>
                            <option>Ping</option><option>API</option><option>Port</option>
                          </select>
                        </div>
                        <div>
                          <label className="hm-form-label">Check every</label>
                          <select className="hm-form-select" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                            <option value="30s">30 seconds</option>
                            <option value="1m">1 minute</option>
                            <option value="5m">5 minutes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="hm-modal-footer">
                      <button className="hm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                      <button className="hm-btn-save" onClick={handleSave}>
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Save Monitor
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="mockup-sidebar">
            <div className="ms-top">
              <div className="ms-logo">
                <div className="ms-logo-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Uptrue
              </div>
              <div className="ms-org-btn">
                <div>
                  <div className="ms-org-name">Acme Agency</div>
                  <div className="ms-org-sub">Main workspace · Builder</div>
                </div>
                <svg width="10" height="10" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
            <div className="ms-nav">
              <div className="ms-section">Monitoring</div>
              <div className="ms-item active">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  Dashboard
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  Monitors
                </div>
                <span className="ms-badge-blue">{total}</span>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  Alerts
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Incidents
                </div>
                {pd.stats.down > 0 && <span className="ms-badge">{pd.stats.down}</span>}
              </div>
              <div className="ms-section">Reporting</div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Reports
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                  Status Pages
                </div>
              </div>
              <div className="ms-section">Intelligence</div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  Competitors
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Compete
                </div>
              </div>
            </div>
            <div className="ms-bottom">
              <div className="ms-credits">
                <div className="ms-credits-title">✨ Earn Credits</div>
                <div className="ms-credits-sub">Get up to £10/mo off your plan</div>
              </div>
            </div>
          </div>

          {/* ── Main area ────────────────────────────────────────────── */}
          <div className="mockup-main">

            {/* Header */}
            <div className="mm-header">
              <div className="mm-header-left">
                <span className="mm-org-label">Acme Agency</span>
                <div className="mm-ws-chip">
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                  Main workspace
                  <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
              <div className="mm-header-right">
                <div className="mm-icon-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </div>
                <div className="mm-icon-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
                </div>
                <div className="mm-icon-btn" style={{ position: 'relative' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {pd.stats.down > 0 && <div className="mm-notif-dot" />}
                </div>
                <div className="mm-avatar">A</div>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="mm-breadcrumbs">
              <span>Acme Agency</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              <span>Main workspace</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              <span className="crumb-current">Dashboard</span>
            </div>

            {/* Content */}
            <div className="mm-content">

              {/* Page header */}
              <div className="mm-page-hdr">
                <div className="mm-page-title">Dashboard</div>
                <div className="mm-page-actions">
                  <div className="mm-btn-ghost">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Generate Report
                  </div>
                  <div className="mm-btn-primary hm-clickable" onClick={() => setShowModal(true)} title="Try it — add a monitor">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add Monitor
                  </div>
                </div>
              </div>

              {/* Stat cards — clickable */}
              <div className="mm-stats">
                {([
                  { key: 'all', variant: 'all', label: 'Total Monitors', value: total, color: undefined,
                    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
                  { key: 'up',  variant: 'up',  label: 'Healthy',        value: pd.stats.healthy + userMonitors.length, color: 'var(--color-up)',
                    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg> },
                  { key: 'down',variant: 'down', label: 'Down',          value: pd.stats.down, color: pd.stats.down > 0 ? 'var(--color-down)' : undefined,
                    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
                  { key: 'warn',variant: 'warn', label: 'Degraded',      value: pd.stats.degraded, color: pd.stats.degraded > 0 ? 'var(--color-warn)' : undefined,
                    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
                ] as const).map(card => (
                  <div
                    key={card.key}
                    className={`mm-stat ${card.variant} hm-stat-card${statClass(card.key)}`}
                    onClick={() => setActiveFilter(f => f === card.key ? null : card.key)}
                    title="Click to filter"
                  >
                    <div className={`mm-stat-icon ${card.variant}`}>{card.icon}</div>
                    <div className="mm-stat-label">{card.label}</div>
                    <div className="mm-stat-value" style={card.color ? { color: card.color } : undefined}>{card.value}</div>
                    {activeFilter === card.key && (
                      <div className="hm-filter-chip">Filtered</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Monitor table */}
              <div className="mm-card">
                <div className="mm-card-hdr">
                  <div className="mm-card-title">
                    Monitors
                    {activeFilter && activeFilter !== 'all' && (
                      <span className="hm-active-filter-tag">
                        {activeFilter === 'up' ? 'Healthy' : activeFilter === 'down' ? 'Down' : 'Degraded'}
                        <span className="hm-filter-clear" onClick={() => setActiveFilter(null)}>✕</span>
                      </span>
                    )}
                  </div>
                  <div className="mm-card-search">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    Search monitors…
                  </div>
                </div>
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18px' }}><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></th>
                      <th>Monitor</th><th>Type</th><th>Status</th><th>Uptime (90d)</th><th>Response</th><th>Last check</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Row 1 */}
                    <tr className="hm-clickable-row" onClick={() => toggleRow('r1')}>
                      <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></td>
                      <td><div className="mm-monitor-name">api.acmecorp.com</div><div className="mm-monitor-url">https://api.acmecorp.com/health</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UptimeBars bad={false} />
                          <span className="mm-uptime-pct">99.98%</span>
                        </div>
                      </td>
                      <td><span className="mm-response fast">142ms</span></td>
                      <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>8s ago</td>
                    </tr>
                    {expandedRow === 'r1' && (
                      <tr className="hm-row-detail-row"><td colSpan={7}>
                        <div className="hm-row-detail">
                          <div className="hm-detail-item">
                            <span className="hm-detail-label">Response trend</span>
                            <div className="hm-spark">{[142,138,145,141,149,143,142].map((v,i) => <div key={i} className="hm-spark-bar" style={{ height: `${Math.round(v/5)}px`, background: 'var(--color-up)' }} />)}</div>
                          </div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Avg response</span><span className="hm-detail-val hm-val-fast">143ms</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Incidents (30d)</span><span className="hm-detail-val">0</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">SSL expires</span><span className="hm-detail-val">84 days</span></div>
                        </div>
                      </td></tr>
                    )}

                    {/* Row 2 — checkout.shop.io (animated) */}
                    <tr className="hm-clickable-row" style={{ background: pd.rowBg }} onClick={() => toggleRow('r2')}>
                      <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></td>
                      <td><div className="mm-monitor-name">checkout.shop.io</div><div className="mm-monitor-url">https://checkout.shop.io</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status={pd.status} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UptimeBars bad={pd.uptimeBad} />
                          <span className={`mm-uptime-pct${pd.uptimeBad ? ' bad' : ''}`}>{pd.uptime}</span>
                        </div>
                      </td>
                      <td><span className={`mm-response ${pd.responseClass}`}>{pd.response}</span></td>
                      <td style={{ fontSize: '9px', color: pd.stats.down > 0 ? 'var(--color-down)' : 'var(--text-muted)' }}>{pd.lastCheck}</td>
                    </tr>
                    {expandedRow === 'r2' && (
                      <tr className="hm-row-detail-row" style={{ background: pd.rowBg }}><td colSpan={7}>
                        <div className="hm-row-detail">
                          <div className="hm-detail-item">
                            <span className="hm-detail-label">Response trend</span>
                            <div className="hm-spark">
                              {CHECKOUT_SPARK.map((v,i) => (
                                <div key={i} className="hm-spark-bar" style={{
                                  height: v === 0 ? '4px' : `${Math.round(v)}px`,
                                  background: v === 0 ? 'var(--color-down)' : i === 6 ? 'var(--color-warn)' : 'var(--color-up)',
                                }} />
                              ))}
                            </div>
                          </div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Current</span><StatusBadge status={pd.status} /></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Incidents (30d)</span><span className="hm-detail-val" style={{ color: 'var(--color-down)' }}>1 open</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">SSL expires</span><span className="hm-detail-val">12 days</span></div>
                        </div>
                      </td></tr>
                    )}

                    {/* Row 3 */}
                    <tr className="hm-clickable-row" onClick={() => toggleRow('r3')}>
                      <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></td>
                      <td><div className="mm-monitor-name">cdn.assets.io</div><div className="mm-monitor-url">https://cdn.assets.io</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UptimeBars bad={false} />
                          <span className="mm-uptime-pct">99.9%</span>
                        </div>
                      </td>
                      <td><span className="mm-response fast">241ms</span></td>
                      <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>1m ago</td>
                    </tr>
                    {expandedRow === 'r3' && (
                      <tr className="hm-row-detail-row"><td colSpan={7}>
                        <div className="hm-row-detail">
                          <div className="hm-detail-item">
                            <span className="hm-detail-label">Response trend</span>
                            <div className="hm-spark">{[241,235,248,238,245,242,241].map((v,i) => <div key={i} className="hm-spark-bar" style={{ height: `${Math.round(v/8)}px`, background: 'var(--color-up)' }} />)}</div>
                          </div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Avg response</span><span className="hm-detail-val hm-val-fast">241ms</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Incidents (30d)</span><span className="hm-detail-val">0</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">SSL expires</span><span className="hm-detail-val">201 days</span></div>
                        </div>
                      </td></tr>
                    )}

                    {/* Row 4 */}
                    <tr className="hm-clickable-row" onClick={() => toggleRow('r4')}>
                      <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></td>
                      <td><div className="mm-monitor-name">blog.example.com</div><div className="mm-monitor-url">https://blog.example.com</div></td>
                      <td><span className="mm-type-tag">SSL</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UptimeBars bad={false} />
                          <span className="mm-uptime-pct">100%</span>
                        </div>
                      </td>
                      <td><span className="mm-response fast">89ms</span></td>
                      <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>3m ago</td>
                    </tr>
                    {expandedRow === 'r4' && (
                      <tr className="hm-row-detail-row"><td colSpan={7}>
                        <div className="hm-row-detail">
                          <div className="hm-detail-item">
                            <span className="hm-detail-label">Response trend</span>
                            <div className="hm-spark">{[89,91,87,92,88,90,89].map((v,i) => <div key={i} className="hm-spark-bar" style={{ height: `${Math.round(v/3)}px`, background: 'var(--color-up)' }} />)}</div>
                          </div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Avg response</span><span className="hm-detail-val hm-val-fast">89ms</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">SSL valid</span><span className="hm-detail-val" style={{ color: 'var(--color-up)' }}>✓ 347 days</span></div>
                          <div className="hm-detail-item"><span className="hm-detail-label">Incidents (30d)</span><span className="hm-detail-val">0</span></div>
                        </div>
                      </td></tr>
                    )}

                    {/* User-added monitors */}
                    {userMonitors.map(m => (
                      <>
                        <tr key={m.id} className="hm-clickable-row hm-new-row" onClick={() => toggleRow(m.id)}>
                          <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly /></td>
                          <td><div className="mm-monitor-name">{m.name}</div><div className="mm-monitor-url">{m.url}</div></td>
                          <td><span className="mm-type-tag">{m.type}</span></td>
                          <td>
                            <span className="badge badge-outline" style={{ fontSize: '9px', padding: '2px 7px' }}>
                              <span style={{ width: '5px', height: '5px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />{' '}Pending
                            </span>
                          </td>
                          <td><span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Awaiting first check…</span></td>
                          <td><span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>—</span></td>
                          <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Just added</td>
                        </tr>
                        {expandedRow === m.id && (
                          <tr key={`${m.id}-d`} className="hm-row-detail-row"><td colSpan={7}>
                            <div className="hm-row-detail">
                              <div className="hm-detail-item"><span className="hm-detail-label">Status</span><span className="hm-detail-val">First check in progress — usually takes 30s</span></div>
                            </div>
                          </td></tr>
                        )}
                      </>
                    ))}

                  </tbody>
                </table>
              </div>

            </div>{/* /mm-content */}
          </div>{/* /mockup-main */}
        </div>{/* /mockup-body */}
      </div>
    </div>
  )
}
