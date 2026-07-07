'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Wifi, ShieldCheck, BellRing, LayoutDashboard, BrainCircuit,
  Eye, Zap, TrendingUp, Sparkles, Building2,
  Activity, Bell, BarChart2, Cpu, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface FeatureCard {
  cat: string
  catColor: string
  catBg: string
  catBorder: string
  glow: string
  iconBg: string
  icon: string | React.ReactElement
  title: string
  desc: string
  tags: string[]
}

const CARDS: FeatureCard[] = [
  {
    cat: 'Monitoring', catColor: '#3b82f6', catBg: 'rgba(59,130,246,0.1)', catBorder: 'rgba(59,130,246,0.2)',
    glow: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.15))',
    icon: (<Wifi size={22} strokeWidth={1.8} color="#3b82f6" />), title: 'Uptime Monitoring',
    desc: '10 monitor types including HTTP, SSL, DNS, keyword detection, domain expiry, port, ping, API endpoint, heartbeat, and Watchdog tracking.',
    tags: ['HTTP/HTTPS', 'SSL', 'DNS', 'Keyword', 'Port', 'Ping'],
  },
  {
    cat: 'Monitoring', catColor: '#10b981', catBg: 'rgba(16,185,129,0.1)', catBorder: 'rgba(16,185,129,0.2)',
    glow: 'linear-gradient(90deg,#10b981,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.12))',
    icon: (<ShieldCheck size={22} strokeWidth={1.8} color="#10b981" />), title: 'Zero False Alarms',
    desc: 'Two-confirmation detection: when a check fails, Uptrue waits 30 seconds and verifies from a second region before triggering any alert.',
    tags: ['2-region confirm', '30s re-check', 'No alert fatigue'],
  },
  {
    cat: 'Alerting', catColor: '#f59e0b', catBg: 'rgba(245,158,11,0.1)', catBorder: 'rgba(245,158,11,0.2)',
    glow: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    iconBg: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.1))',
    icon: (<BellRing size={22} strokeWidth={1.8} color="#f59e0b" />), title: 'Multi-Channel Alerts',
    desc: 'Instant notifications via Email, Slack, Microsoft Teams, and signed webhooks. Configure different channels per monitor with escalation rules.',
    tags: ['Email', 'Slack', 'Teams', 'Webhooks', 'HMAC signed'],
  },
  {
    cat: 'Reporting', catColor: '#8b5cf6', catBg: 'rgba(139,92,246,0.1)', catBorder: 'rgba(139,92,246,0.2)',
    glow: 'linear-gradient(90deg,#8b5cf6,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1))',
    icon: (<LayoutDashboard size={22} strokeWidth={1.8} color="#8b5cf6" />), title: 'Public Status Pages',
    desc: 'Branded, real-time status pages your customers trust. Share uptime history, active incidents, and let visitors subscribe to updates. Custom domain support.',
    tags: ['Custom domain', 'Subscribe', 'Real-time', 'Branded'],
  },
  {
    cat: 'Reporting', catColor: '#ec4899', catBg: 'rgba(236,72,153,0.1)', catBorder: 'rgba(236,72,153,0.2)',
    glow: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
    iconBg: 'linear-gradient(135deg,rgba(236,72,153,0.12),rgba(139,92,246,0.12))',
    icon: (<BrainCircuit size={22} strokeWidth={1.8} color="#ec4899" />), title: 'AI-Powered Reports',
    desc: 'Claude AI analyses uptime trends, incident patterns, and performance metrics to generate executive summaries in plain, actionable language.',
    tags: ['Claude AI', 'Executive summary', 'Insights'],
  },
  {
    cat: 'Intelligence', catColor: '#06b6d4', catBg: 'rgba(6,182,212,0.1)', catBorder: 'rgba(6,182,212,0.2)',
    glow: 'linear-gradient(90deg,#06b6d4,#10b981)',
    iconBg: 'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(16,185,129,0.12))',
    icon: (<Eye size={22} strokeWidth={1.8} color="#06b6d4" />), title: 'Watchdog',
    desc: 'Monitor any website automatically. See when rivals go down before their customers do — and benchmark your reliability against the competition.',
    tags: ['Uptime tracking', 'Incident alerts', 'Benchmarking'],
  },
  // Compete card hidden — launching in v1.5
  {
    cat: 'Free Tool', catColor: '#10b981', catBg: 'rgba(16,185,129,0.1)', catBorder: 'rgba(16,185,129,0.2)',
    glow: 'linear-gradient(90deg,#10b981,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.1))',
    icon: (<Zap size={22} strokeWidth={1.8} color="#10b981" />), title: 'Uptrue Score',
    desc: 'Free instant website health check. Tests uptime, SSL, DNS, performance, and security. No signup required — share your score as a badge.',
    tags: ['Free · no signup', 'SSL check', 'Performance', 'Shareable badge'],
  },
  {
    cat: 'Free Tool', catColor: '#3b82f6', catBg: 'rgba(59,130,246,0.1)', catBorder: 'rgba(59,130,246,0.2)',
    glow: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
    iconBg: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.1))',
    icon: (<TrendingUp size={22} strokeWidth={1.8} color="#3b82f6" />), title: 'Public Tracker',
    desc: 'Browse real uptime data for 100+ famous websites. See who\'s been down, who\'s fastest, and how your stack compares — updated every minute.',
    tags: ['Free · no signup', '100+ sites', 'Live data', 'Leaderboard'],
  },
  {
    cat: 'Intelligence', catColor: '#8b5cf6', catBg: 'rgba(139,92,246,0.1)', catBorder: 'rgba(139,92,246,0.2)',
    glow: 'linear-gradient(90deg,#8b5cf6,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.12))',
    icon: (<Sparkles size={22} strokeWidth={1.8} color="#8b5cf6" />), title: 'AI Visibility',
    desc: 'See if ChatGPT, Perplexity, Gemini, and Claude cite your website. Generate your llms.txt in seconds, run citation checks, and track your AI search presence over time.',
    tags: ['llms.txt generator', 'Citation monitor', 'GEO · AEO', 'Free AI SEO checker'],
  },
  {
    cat: 'Coming Soon', catColor: '#06b6d4', catBg: 'rgba(6,182,212,0.1)', catBorder: 'rgba(6,182,212,0.2)',
    glow: 'linear-gradient(90deg,#0c1322,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(12,19,34,0.4),rgba(59,130,246,0.12))',
    icon: (<Building2 size={22} strokeWidth={1.8} color="#06b6d4" />), title: 'Agency White-Label',
    desc: 'Full white-label under your brand. Multi-tenant workspaces, client billing via revenue share, custom GTM/analytics per client. Built for agencies.',
    tags: ['White-label', 'Multi-tenant', 'Revenue share', 'Waitlist'],
  },
]

const TABS = [
  { label: 'All features', cat: 'all' },
  { label: 'Monitoring', cat: 'Monitoring', icon: <Activity size={12} strokeWidth={2.5} /> },
  { label: 'Alerting', cat: 'Alerting', icon: <Bell size={12} strokeWidth={2.5} /> },
  { label: 'Reporting', cat: 'Reporting', icon: <BarChart2 size={12} strokeWidth={2.5} /> },
  { label: 'Intelligence', cat: 'Intelligence', icon: <Cpu size={12} strokeWidth={2.5} /> },
  { label: 'Free Tools', cat: 'Free Tool', icon: <Settings size={12} strokeWidth={2.5} /> },
]

export function FeatureCarousel(): React.ReactElement {
  const [activeCat, setActiveCat] = useState('all')
  const [offset, setOffset] = useState(0)
  const [cardW, setCardW] = useState(300)
  const trackRef = useRef<HTMLDivElement>(null)

  const visible = activeCat === 'all' ? CARDS : CARDS.filter(c => c.cat === activeCat)
  const total = visible.length
  const maxOffset = Math.max(0, total - 3)

  const measureCard = useCallback(() => {
    const first = trackRef.current?.children[0] as HTMLElement | undefined
    if (first) setCardW(first.offsetWidth + 16)
  }, [])

  useEffect(() => {
    measureCard()
    window.addEventListener('resize', measureCard)
    return () => window.removeEventListener('resize', measureCard)
  }, [measureCard, visible.length])

  function move(dir: number): void {
    setOffset(prev => Math.min(maxOffset, Math.max(0, prev + dir)))
  }

  function switchTab(cat: string): void {
    // Immediately clear transform without animation, then restore transition
    if (trackRef.current) {
      trackRef.current.style.transition = 'none'
      trackRef.current.style.transform = 'translateX(0)'
      requestAnimationFrame(() => {
        if (trackRef.current) trackRef.current.style.transition = ''
      })
    }
    setActiveCat(cat)
    setOffset(0)
  }

  const pct = total <= 1 ? 100 : Math.round(((offset + 1) / total) * 100)
  const idx = Math.min(offset + 1, total)

  return (
    <div>
      {/* Category tabs — desktop/tablet: wrapping pill row */}
      <div className="feature-tabs feature-tabs-desktop">
        {TABS.map(tab => (
          <button
            key={tab.cat}
            className={`feature-tab-btn${activeCat === tab.cat ? ' active' : ''}`}
            onClick={() => switchTab(tab.cat)}
          >
            {'icon' in tab && tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category tabs — mobile: 2-row auto-scrolling marquee */}
      <div className="feature-tabs-mobile">
        {[TABS.slice(0, 3), TABS.slice(3)].map((row, i) => (
          <div key={i} className="feature-tabs-marquee-track">
            <div className={i === 0 ? 'feature-tabs-marquee-left' : 'feature-tabs-marquee-right'}>
              {[...row, ...row].map((tab, j) => (
                <button
                  key={`${tab.cat}-${j}`}
                  className={`feature-tab-btn${activeCat === tab.cat ? ' active' : ''}`}
                  onClick={() => switchTab(tab.cat)}
                >
                  {'icon' in tab && tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div className="feature-carousel-wrap">
        <button
          className={`carousel-arrow prev${offset === 0 ? ' disabled' : ''}`}
          onClick={() => move(-1)}
          aria-label="Previous"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button
          className={`carousel-arrow next${offset >= maxOffset ? ' disabled' : ''}`}
          onClick={() => move(1)}
          aria-label="Next"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

        <div className="feature-carousel-track-outer">
          <div
            className="feature-carousel-track"
            ref={trackRef}
            style={{ transform: `translateX(-${offset * cardW}px)` }}
          >
            {visible.map((card) => (
              <div key={card.title} className="feature-card" data-cat={card.cat}>
                <div className="feature-card-glow" style={{ background: card.glow }} />
                <div
                  className="feature-cat-badge"
                  style={{ background: card.catBg, color: card.catColor, border: `1px solid ${card.catBorder}` }}
                >
                  {card.cat}
                </div>
                <div className="feature-icon" style={{ background: card.iconBg }}>
                  {card.icon}
                </div>
                <div className="feature-title">{card.title}</div>
                <div className="feature-desc">{card.desc}</div>
                <div className="feature-tags">
                  {card.tags.map(t => <span key={t} className="feature-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="carousel-progress">
          <span className="carousel-counter">{idx} / {total}</span>
          <div className="carousel-track-bar">
            <div className="carousel-track-fill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Drag or use arrows</span>
        </div>
      </div>
    </div>
  )
}
