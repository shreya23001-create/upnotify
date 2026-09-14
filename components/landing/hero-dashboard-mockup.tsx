'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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

interface NotifState {
  email: boolean
  slack: boolean
  telegram: boolean
  recover: boolean
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const PHASE_ORDER: Phase[] = ['normal', 'degrading', 'down', 'recovering']
const PHASE_DURATIONS: Record<Phase, number> = {
  normal: 7000, degrading: 1200, down: 2800, recovering: 2000,
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

const RECENT_INCIDENTS = [
  { title: 'Domain registration expiring soon', severity: 'P2', status: 'Open', time: '1d ago' },
  { title: 'Domain or IP is on a blacklist', severity: 'P2', status: 'Open', time: '1d ago' },
  { title: 'XML sitemap is invalid or unreachable', severity: 'P3', status: 'Open', time: '1d ago' },
]

const DOMAINS = [
  { domain: 'checkout.shop.io', monitors: 24, status: 'down' as const },
  { domain: 'api.acmecorp.com', monitors: 24, status: 'up' as const },
  { domain: 'cdn.assets.io', monitors: 24, status: 'degraded' as const },
  { domain: 'blog.example.com', monitors: 24, status: 'up' as const },
]

/* ─── Sub-components ────────────────────────────────────────────────────── */
/* ─── Notification card ─────────────────────────────────────────────────── */
interface NotifCardProps {
  visible: boolean
  icon: React.ReactNode
  iconBg: string
  source: string
  title: string
  titleColor?: string
  body: string
  isRecover?: boolean
}
function NotifCard({ visible, icon, iconBg, source, title, titleColor, body, isRecover }: NotifCardProps): React.ReactElement {
  return (
    <div className={`hm-notif-card${visible ? ' hm-notif-show' : ''}${isRecover ? ' hm-notif-recover' : ''}`}>
      <div className="hm-notif-hdr">
        <div className="hm-notif-icon" style={{ background: iconBg }}>{icon}</div>
        <span className="hm-notif-source">{source}</span>
        <span className="hm-notif-time">now</span>
      </div>
      <div className="hm-notif-title" style={titleColor ? { color: titleColor } : undefined}>{title}</div>
      <div className="hm-notif-body">{body}</div>
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function HeroDashboardMockup(): React.ReactElement {
  const [phase, setPhase]               = useState<Phase>('normal')
  const [showModal, setShowModal]       = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [userMonitors, setUserMonitors] = useState<UserMonitor[]>([])
  const [form, setForm]                 = useState({ name: '', url: '', type: 'HTTP', interval: '1m' })
  const [addSuccess, setAddSuccess]     = useState(false)

  // Notification cards
  const [notif, setNotif] = useState<NotifState>({ email: false, slack: false, telegram: false, recover: false })

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearNotifTimers(): void {
    notifTimers.current.forEach(t => clearTimeout(t))
    notifTimers.current = []
  }

  /* ── Auto-animation cycle ───────────────────────────────────────────── */
  const schedule = useCallback((current: Phase): void => {
    timerRef.current = setTimeout(() => {
      const idx = PHASE_ORDER.indexOf(current)
      const next = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length]
      setPhase(next)

      clearNotifTimers()

      if (next === 'down') {
        setNotif({ email: false, slack: false, telegram: false, recover: false })
        notifTimers.current.push(setTimeout(() => setNotif(n => ({ ...n, email: true })), 400))
        notifTimers.current.push(setTimeout(() => setNotif(n => ({ ...n, slack: true })), 900))
        notifTimers.current.push(setTimeout(() => setNotif(n => ({ ...n, telegram: true })), 1400))
      } else if (next === 'recovering') {
        setNotif({ email: false, slack: false, telegram: false, recover: true })
        notifTimers.current.push(setTimeout(() => {
          setNotif(n => ({ ...n, recover: false }))
        }, 2800))
      } else {
        setNotif({ email: false, slack: false, telegram: false, recover: false })
      }

      schedule(next)
    }, PHASE_DURATIONS[current])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    schedule('normal')
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearNotifTimers()
    }
  }, [schedule])

  /* ── Add monitor modal ──────────────────────────────────────────────── */
  const pd    = PHASE_DATA[phase]
  const total = 24 + userMonitors.length

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
          <div className="mockup-url">upnotify-monitoring.vercel.app/dashboard</div>
        </div>

        <div className="mockup-body" style={{ position: 'relative' }}>

          {/* ── Notification cards ───────────────────────────────────── */}
          <div className="hm-notif-stack">
            <NotifCard
              visible={notif.email}
              iconBg="#dcfce7"
              icon={<svg width="10" height="10" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              source="Email Alert"
              title="⚠ checkout.shop.io is DOWN"
              titleColor="#dc2626"
              body="Response timeout · confirmed from 2 regions"
            />
            <NotifCard
              visible={notif.slack}
              iconBg="#4a154b"
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>}
              source="Slack · #alerts"
              title="🔴 Monitor DOWN"
              titleColor="#dc2626"
              body="checkout.shop.io · HTTP 504 · 2/2 regions failed"
            />
            <NotifCard
              visible={notif.telegram}
              iconBg="#0088cc"
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.829.941z"/></svg>}
              source="Telegram"
              title="🚨 checkout.shop.io is DOWN"
              titleColor="#dc2626"
              body="Incident #483 opened · 3:42 PM UTC"
            />
            <NotifCard
              visible={notif.recover}
              isRecover
              iconBg="linear-gradient(135deg,#1392FB,#0068DB)"
              icon={<svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
              source="Slack · #alerts"
              title="✅ Recovered"
              titleColor="#16a34a"
              body="checkout.shop.io · back online · downtime 4m 12s"
            />
          </div>

          {/* ── Alert banner (auto-animation) ────────────────────────── */}
          <div className={`hm-alert-banner${phase === 'down' ? ' hm-alert-down' : phase === 'recovering' ? ' hm-alert-recovery' : ' hm-alert-hidden'}`}>
            {phase === 'down' ? (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <strong>Incident detected:</strong>&nbsp;checkout.shop.io is down — alerts firing
                <span className="hm-alert-time">just now</span>
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
                        <label className="hm-form-label" htmlFor="hm-monitor-name">Monitor name</label>
                        <input
                          className="hm-form-input"
                          id="hm-monitor-name"
                          name="hm-monitor-name"
                          placeholder="My Website"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="hm-form-row">
                        <label className="hm-form-label" htmlFor="hm-monitor-url">URL to monitor</label>
                        <input
                          className="hm-form-input"
                          id="hm-monitor-url"
                          name="hm-monitor-url"
                          placeholder="https://example.com"
                          value={form.url}
                          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        />
                      </div>
                      <div className="hm-form-row hm-form-two">
                        <div>
                          <label className="hm-form-label" htmlFor="hm-monitor-type">Type</label>
                          <select id="hm-monitor-type" name="hm-monitor-type" className="hm-form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                            <option>HTTP</option><option>SSL</option><option>Domain</option>
                            <option>Ping</option><option>API</option><option>Port</option>
                          </select>
                        </div>
                        <div>
                          <label className="hm-form-label" htmlFor="hm-monitor-interval">Check every</label>
                          <select id="hm-monitor-interval" name="hm-monitor-interval" className="hm-form-select" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Logo_2.png" alt="Upnotify" height={22} style={{ height: 22, width: 'auto' }} />
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
              <div className="ms-section">Main</div>
              <div className="ms-item active">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  <span className="ms-label">Dashboard</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  <span className="ms-label">Monitors</span>
                </div>
                <span className="ms-badge-blue">{total}</span>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="ms-label">Alert Channels</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span className="ms-label">Incidents</span>
                </div>
                {pd.stats.down > 0 && <span className="ms-badge">{pd.stats.down}</span>}
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                  <span className="ms-label">Status Pages</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="ms-label">Reports</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 10 C5 5 19 5 19 10 L19 15 C19 19 5 19 5 15 Z" />
                    <path d="M5 10 C4 7 2 6 3 4 C4 3 6 5 7 7" />
                    <path d="M19 10 C20 7 22 6 21 4 C20 3 18 5 17 7" />
                    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span className="ms-label">Competitor</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <span className="ms-label">Websites</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="11" y2="15" /></svg>
                  <span className="ms-label">Plans</span>
                </div>
              </div>

              <div className="ms-divider" />
              <div className="ms-section">Support</div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="ms-label">Support</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                  <span className="ms-label">Settings</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  <span className="ms-label">Help</span>
                </div>
              </div>
            </div>
            <div className="ms-user">
              <div className="ms-user-avatar">A</div>
              <div className="ms-user-info">
                <div className="ms-user-name">Acme Agency</div>
                <div className="ms-user-email">acmeagency@gmail.com</div>
              </div>
              <svg width="10" height="10" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
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

              {/* Stat cards */}
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
                    {activeFilter === card.key && <div className="hm-filter-chip">Filtered</div>}
                  </div>
                ))}
              </div>

              {/* Incidents + Domains, side by side */}
              <div className="hm-two-col">

                {/* Recent Incidents */}
                <div className="mm-card hm-incidents-card">
                  <div className="mm-card-hdr">
                    <div className="mm-card-title">Recent Incidents</div>
                    <span className="hm-incidents-open-pill">{pd.stats.down > 0 ? pd.stats.down + 1 : RECENT_INCIDENTS.length} open</span>
                  </div>
                  <div className="hm-incidents-list">
                    {(pd.status === 'down' ? [
                      { title: 'checkout.shop.io is DOWN', severity: 'P1', status: 'Open', time: 'just now' },
                      ...RECENT_INCIDENTS,
                    ] : RECENT_INCIDENTS).map((inc, i) => (
                      <div key={i} className="hm-incident-row">
                        <div className={`hm-incident-icon${inc.severity === 'P1' ? ' p1' : ''}`}>
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        </div>
                        <div className="hm-incident-body">
                          <div className="hm-incident-title">{inc.title}</div>
                          <div className="hm-incident-meta">{inc.severity}</div>
                        </div>
                        <span className="hm-incident-status">{inc.status} · {inc.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domains */}
                <div className="mm-card hm-domains-card">
                  <div className="mm-card-hdr">
                    <div className="mm-card-title">Domains</div>
                    <div className="mm-btn-primary hm-clickable" style={{ fontSize: '10px', padding: '5px 10px' }} onClick={() => setShowModal(true)} title="Try it — add a monitor">
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add Monitor
                    </div>
                  </div>
                  <div className="hm-domains-list">
                    {DOMAINS.map(d => {
                      const isCheckout = d.domain === 'checkout.shop.io'
                      const status = isCheckout ? pd.status : d.status
                      const isDown = isCheckout ? phase === 'down' : status === 'down'
                      const isDeg = isCheckout ? (phase === 'degrading' || phase === 'recovering') : status === 'degraded'
                      return (
                        <div key={d.domain} className="hm-domain-row">
                          <div className="hm-domain-left">
                            <span className={`hm-domain-dot${isDown ? ' down' : isDeg ? ' degraded' : ''}`} />
                            <span className="hm-domain-name">{d.domain}</span>
                          </div>
                          <span className={`hm-domain-badge${isDown ? ' down' : isDeg ? ' degraded' : ''}`}>
                            {isDown ? 'Down' : isDeg ? 'Degraded' : 'Up'}
                          </span>
                        </div>
                      )
                    })}
                    {userMonitors.length > 0 && (
                      <div className="hm-domain-row hm-new-row">
                        <div className="hm-domain-left">
                          <span className="hm-domain-dot pending" />
                          <span className="hm-domain-name">{userMonitors[userMonitors.length - 1].url.replace(/^https?:\/\//, '')}</span>
                        </div>
                        <span className="hm-domain-badge pending">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>{/* /mm-content */}
          </div>{/* /mockup-main */}
        </div>{/* /mockup-body */}
      </div>
    </div>
  )
}
