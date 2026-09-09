'use client'

import { Fragment, useState, useEffect, useRef, useCallback } from 'react'

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

// Fixed heights — avoids hydration mismatch from Math.random()
const BARS_GOOD = [10, 14, 8, 16, 12, 15, 9, 13, 11, 16, 14, 10, 15, 12, 8, 14, 13, 11, 16, 9]
const BARS_BAD  = [10, 14, 8, 16, 12, 15, 9, 13, 11, 16, 14, 10, 15, 12, 8, 7, 4, 2, 1, 0]

const CHECKOUT_SPARK = [24, 25, 23, 26, 0, 0, 16]

const AIV_ENGINES = [
  { id: 'chatgpt',    name: 'ChatGPT',       color: '#10a37f', letter: 'G', score: 82, cited: true  },
  { id: 'perplexity', name: 'Perplexity',    color: '#20b2aa', letter: 'P', score: 71, cited: true  },
  { id: 'claude',     name: 'Claude',        color: '#c97046', letter: 'C', score: 24, cited: false },
  { id: 'gemini',     name: 'Google Gemini', color: '#4285f4', letter: 'G', score: 68, cited: true  },
]
const AIV_TOTAL = Math.round(AIV_ENGINES.reduce((s, e) => s + e.score, 0) / AIV_ENGINES.length)
const AIV_CIRC  = 2 * Math.PI * 44 // r=44

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
  const [expandedRow, setExpandedRow]   = useState<string | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [userMonitors, setUserMonitors] = useState<UserMonitor[]>([])
  const [form, setForm]                 = useState({ name: '', url: '', type: 'HTTP', interval: '1m' })
  const [addSuccess, setAddSuccess]     = useState(false)

  // Notification cards
  const [notif, setNotif] = useState<NotifState>({ email: false, slack: false, telegram: false, recover: false })

  // AI Visibility
  const [aivOpen, setAivOpen]         = useState(false)
  const [pulseAiv, setPulseAiv]       = useState(false)
  const [aivRevealed, setAivRevealed] = useState<Record<string, boolean>>({})
  const [aivScore, setAivScore]       = useState(0)

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aivOpenRef  = useRef(false)
  const notifTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearNotifTimers(): void {
    notifTimers.current.forEach(t => clearTimeout(t))
    notifTimers.current = []
  }

  /* ── Auto-animation cycle ───────────────────────────────────────────── */
  const schedule = useCallback((current: Phase): void => {
    timerRef.current = setTimeout(() => {
      if (aivOpenRef.current) return // paused while AIV is open
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
        // Pulse AI Visibility after recovery settles
        notifTimers.current.push(setTimeout(() => {
          if (!aivOpenRef.current) setPulseAiv(true)
        }, 1600))
        notifTimers.current.push(setTimeout(() => {
          setNotif(n => ({ ...n, recover: false }))
        }, 2800))
        notifTimers.current.push(setTimeout(() => {
          if (!aivOpenRef.current) setPulseAiv(false)
        }, 5500))
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

  /* ── AI Visibility open / close ─────────────────────────────────────── */
  function openAiv(): void {
    aivOpenRef.current = true
    setAivOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    clearNotifTimers()
    setNotif({ email: false, slack: false, telegram: false, recover: false })
    setPulseAiv(false)
    setAivRevealed({})
    setAivScore(0)

    // Reveal engines in sequence
    AIV_ENGINES.forEach((e, i) => {
      notifTimers.current.push(setTimeout(() => {
        setAivRevealed(r => ({ ...r, [e.id]: true }))
        if (i === AIV_ENGINES.length - 1) {
          // Animate score dial after last engine
          notifTimers.current.push(setTimeout(() => {
            const dur = 900
            const startTs = Date.now()
            const tick = (): void => {
              const t = Math.min((Date.now() - startTs) / dur, 1)
              setAivScore(Math.round(AIV_TOTAL * t))
              if (t < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          }, 200))
        }
      }, 400 + i * 500))
    })
  }

  function closeAiv(): void {
    aivOpenRef.current = false
    setAivOpen(false)
    setAivRevealed({})
    setAivScore(0)
    clearNotifTimers()
    setPhase('normal')
    schedule('normal')
  }

  /* ── Add monitor modal ──────────────────────────────────────────────── */
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

  /* ── Computed AIV ring fill ─────────────────────────────────────────── */
  const aivFilled = (aivScore / 100) * AIV_CIRC

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

          {/* ── AI Visibility panel (overlay) ────────────────────────── */}
          {aivOpen && (
            <div className="hm-aiv-panel">
              {/* Panel header */}
              <div className="hm-aiv-hdr">
                <div className="hm-aiv-hdr-left">
                  <div className="hm-aiv-hdr-icon">
                    <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </div>
                  <span className="hm-aiv-hdr-title">AI Visibility</span>
                  <span className="hm-aiv-badge">NEW</span>
                </div>
                <button className="hm-aiv-back" onClick={closeAiv}>
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Dashboard
                </button>
              </div>

              {/* Panel body */}
              <div className="hm-aiv-body">
                {/* Score ring */}
                <div className="hm-aiv-score-col">
                  <svg width="104" height="104" viewBox="0 0 104 104">
                    <circle cx="52" cy="52" r="44" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    <circle
                      cx="52" cy="52" r="44"
                      fill="none" strokeWidth="10"
                      stroke="url(#aivG)"
                      strokeLinecap="round"
                      strokeDasharray={`${aivFilled} ${AIV_CIRC}`}
                      transform="rotate(-90 52 52)"
                      style={{ transition: 'stroke-dasharray 0.1s linear' }}
                    />
                    <defs>
                      <linearGradient id="aivG" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1392FB"/>
                        <stop offset="100%" stopColor="#0068DB"/>
                      </linearGradient>
                    </defs>
                    <text x="52" y="48" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">{aivScore}</text>
                    <text x="52" y="62" textAnchor="middle" fontSize="9" fill="#64748b">/100</text>
                    <text x="52" y="75" textAnchor="middle" fontSize="8" fill="#64748b">
                      {aivScore >= 60 ? 'Good visibility' : aivScore > 0 ? 'Moderate' : 'Scanning…'}
                    </text>
                  </svg>
                  <div className="hm-aiv-score-label">
                    AI Visibility Score<br/>
                    <strong>mywebsite.com</strong>
                  </div>
                  <button className="hm-aiv-back-btn" onClick={closeAiv}>
                    <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back
                  </button>
                </div>

                {/* Engine list */}
                <div className="hm-aiv-engines">
                  <div className="hm-aiv-engines-label">AI Engine Citations</div>
                  {AIV_ENGINES.map(e => {
                    const revealed = aivRevealed[e.id]
                    return (
                      <div key={e.id} className="hm-aiv-engine-row">
                        <div className="hm-aiv-engine-logo" style={{ background: e.color }}>{e.letter}</div>
                        <div className="hm-aiv-engine-name">{e.name}</div>
                        <div className="hm-aiv-engine-bar-wrap">
                          <div className="hm-aiv-engine-bar" style={{ width: revealed ? `${e.score}%` : '0%' }} />
                        </div>
                        <div className={`hm-aiv-engine-status${revealed ? (e.cited ? ' cited' : ' notcited') : ''}`}>
                          {revealed ? (e.cited ? 'Cited ✓' : 'Not cited') : '—'}
                        </div>
                      </div>
                    )
                  })}

                  {/* CTA */}
                  <div className="hm-aiv-cta">
                    <div className="hm-aiv-cta-title">📄 No llms.txt detected</div>
                    <div className="hm-aiv-cta-body">AI engines can&apos;t read your site structure. Generate your llms.txt to boost citation rate.</div>
                    <div className="hm-aiv-cta-btn">
                      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Generate llms.txt →
                    </div>
                  </div>
                </div>
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
                <span className="ms-label">Upnotify</span>
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
              <div className={`ms-item${!aivOpen ? ' active' : ''}`}>
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
                  <span className="ms-label">Alerts</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span className="ms-label">Incidents</span>
                </div>
                {pd.stats.down > 0 && <span className="ms-badge">{pd.stats.down}</span>}
              </div>
              <div className="ms-section">Reporting</div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="ms-label">Reports</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                  <span className="ms-label">Status Pages</span>
                </div>
              </div>
              <div className="ms-section">Intelligence</div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 10 C5 5 19 5 19 10 L19 15 C19 19 5 19 5 15 Z" />
                    <path d="M5 10 C4 7 2 6 3 4 C4 3 6 5 7 7" />
                    <path d="M19 10 C20 7 22 6 21 4 C20 3 18 5 17 7" />
                    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span className="ms-label">Watchdog</span>
                </div>
              </div>
              <div className="ms-item">
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <span className="ms-label">Compete</span>
                </div>
              </div>

              {/* AI Visibility — clickable, pulses after recovery */}
              <div
                className={`ms-item hm-aiv-nav-item${aivOpen ? ' active' : ''}${pulseAiv ? ' hm-aiv-pulse' : ''}`}
                onClick={openAiv}
                title="Try AI Visibility"
              >
                <div className="ms-item-left">
                  <svg width="13" height="13" fill="none" stroke={aivOpen ? 'currentColor' : '#1392FB'} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span className="ms-label" style={{ color: aivOpen ? undefined : '#1392FB', fontWeight: 700 }}>AI Visibility</span>
                </div>
                <span className="hm-aiv-new-badge">NEW</span>
                {pulseAiv && <span className="hm-aiv-hint">← Try it</span>}
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
                      <th style={{ width: '18px' }}><input type="checkbox" name="select-all" id="hm-select-all" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label="Select all monitors" /></th>
                      <th>Monitor</th><th>Type</th><th>Status</th><th>Uptime (90d)</th><th>Response</th><th>Last check</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Row 1 */}
                    <tr className="hm-clickable-row" onClick={() => toggleRow('r1')}>
                      <td><input type="checkbox" name="hm-row-r1" id="hm-row-r1" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label="Select row 1" /></td>
                      <td><div className="mm-monitor-name">api.acmecorp.com</div><div className="mm-monitor-url">https://api.acmecorp.com/health</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><UptimeBars bad={false} /><span className="mm-uptime-pct">99.98%</span></div></td>
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
                      <td><input type="checkbox" name="hm-row-r2" id="hm-row-r2" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label="Select row 2" /></td>
                      <td><div className="mm-monitor-name">checkout.shop.io</div><div className="mm-monitor-url">https://checkout.shop.io</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status={pd.status} /></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><UptimeBars bad={pd.uptimeBad} /><span className={`mm-uptime-pct${pd.uptimeBad ? ' bad' : ''}`}>{pd.uptime}</span></div></td>
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
                      <td><input type="checkbox" name="hm-row-r3" id="hm-row-r3" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label="Select row 3" /></td>
                      <td><div className="mm-monitor-name">cdn.assets.io</div><div className="mm-monitor-url">https://cdn.assets.io</div></td>
                      <td><span className="mm-type-tag">HTTP</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><UptimeBars bad={false} /><span className="mm-uptime-pct">99.9%</span></div></td>
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
                      <td><input type="checkbox" name="hm-row-r4" id="hm-row-r4" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label="Select row 4" /></td>
                      <td><div className="mm-monitor-name">blog.example.com</div><div className="mm-monitor-url">https://blog.example.com</div></td>
                      <td><span className="mm-type-tag">SSL</span></td>
                      <td><StatusBadge status="up" /></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><UptimeBars bad={false} /><span className="mm-uptime-pct">100%</span></div></td>
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
                      <Fragment key={m.id}>
                        <tr className="hm-clickable-row hm-new-row" onClick={() => toggleRow(m.id)}>
                          <td><input type="checkbox" name={`hm-row-${m.id}`} id={`hm-row-${m.id}`} style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} readOnly aria-label={`Select ${m.name}`} /></td>
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
                          <tr className="hm-row-detail-row"><td colSpan={7}>
                            <div className="hm-row-detail">
                              <div className="hm-detail-item"><span className="hm-detail-label">Status</span><span className="hm-detail-val">First check in progress — usually takes 30s</span></div>
                            </div>
                          </td></tr>
                        )}
                      </Fragment>
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
