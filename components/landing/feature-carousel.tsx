'use client'

import { useState, useRef } from 'react'

interface FeatureCard {
  cat: string
  catColor: string
  catBg: string
  catBorder: string
  glow: string
  iconBg: string
  icon: string
  title: string
  desc: string
  tags: string[]
}

const CARDS: FeatureCard[] = [
  {
    cat: 'Monitoring', catColor: '#3b82f6', catBg: 'rgba(59,130,246,0.1)', catBorder: 'rgba(59,130,246,0.2)',
    glow: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.15))',
    icon: '📡', title: 'Uptime Monitoring',
    desc: '10 monitor types including HTTP, SSL, DNS, keyword detection, domain expiry, port, ping, API endpoint, heartbeat, and competitor tracking.',
    tags: ['HTTP/HTTPS', 'SSL', 'DNS', 'Keyword', 'Port', 'Ping'],
  },
  {
    cat: 'Monitoring', catColor: '#10b981', catBg: 'rgba(16,185,129,0.1)', catBorder: 'rgba(16,185,129,0.2)',
    glow: 'linear-gradient(90deg,#10b981,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.12))',
    icon: '🛡️', title: 'Zero False Alarms',
    desc: 'Two-confirmation detection: when a check fails, Uptrue waits 30 seconds and verifies from a second region before triggering any alert.',
    tags: ['2-region confirm', '30s re-check', 'No alert fatigue'],
  },
  {
    cat: 'Alerting', catColor: '#f59e0b', catBg: 'rgba(245,158,11,0.1)', catBorder: 'rgba(245,158,11,0.2)',
    glow: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    iconBg: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.1))',
    icon: '🔔', title: 'Multi-Channel Alerts',
    desc: 'Instant notifications via Email, Slack, Microsoft Teams, and signed webhooks. Configure different channels per monitor with escalation rules.',
    tags: ['Email', 'Slack', 'Teams', 'Webhooks', 'HMAC signed'],
  },
  {
    cat: 'Reporting', catColor: '#8b5cf6', catBg: 'rgba(139,92,246,0.1)', catBorder: 'rgba(139,92,246,0.2)',
    glow: 'linear-gradient(90deg,#8b5cf6,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1))',
    icon: '📊', title: 'Public Status Pages',
    desc: 'Branded, real-time status pages your customers trust. Share uptime history, active incidents, and let visitors subscribe to updates. Custom domain support.',
    tags: ['Custom domain', 'Subscribe', 'Real-time', 'Branded'],
  },
  {
    cat: 'Reporting', catColor: '#ec4899', catBg: 'rgba(236,72,153,0.1)', catBorder: 'rgba(236,72,153,0.2)',
    glow: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
    iconBg: 'linear-gradient(135deg,rgba(236,72,153,0.12),rgba(139,92,246,0.12))',
    icon: '🤖', title: 'AI-Powered Reports',
    desc: 'Claude AI analyses uptime trends, incident patterns, and performance metrics to generate executive summaries in plain, actionable language.',
    tags: ['Claude AI', 'Executive summary', 'Insights'],
  },
  {
    cat: 'Intelligence', catColor: '#06b6d4', catBg: 'rgba(6,182,212,0.1)', catBorder: 'rgba(6,182,212,0.2)',
    glow: 'linear-gradient(90deg,#06b6d4,#10b981)',
    iconBg: 'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(16,185,129,0.12))',
    icon: '🏆', title: 'Competitor Intelligence',
    desc: 'Monitor competitor uptime automatically. See when rivals go down before their customers do — and use it to your advantage.',
    tags: ['Uptime tracking', 'Incident alerts', 'Benchmarking'],
  },
  {
    cat: 'Intelligence', catColor: '#f59e0b', catBg: 'rgba(245,158,11,0.1)', catBorder: 'rgba(245,158,11,0.2)',
    glow: 'linear-gradient(90deg,#f59e0b,#06b6d4)',
    iconBg: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(6,182,212,0.1))',
    icon: '💰', title: 'Uptrue Compete',
    desc: 'Track competitor prices and stock changes automatically. Get alerts the moment a price drops. Ecommerce intelligence starting at £9/month.',
    tags: ['Price tracking', 'Stock alerts', 'CSV export', 'From £9/mo'],
  },
  {
    cat: 'Free Tool', catColor: '#10b981', catBg: 'rgba(16,185,129,0.1)', catBorder: 'rgba(16,185,129,0.2)',
    glow: 'linear-gradient(90deg,#10b981,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.1))',
    icon: '⚡', title: 'Uptrue Score',
    desc: 'Free instant website health check. Tests uptime, SSL, DNS, performance, and security. No signup required — share your score as a badge.',
    tags: ['Free · no signup', 'SSL check', 'Performance', 'Shareable badge'],
  },
  {
    cat: 'Free Tool', catColor: '#3b82f6', catBg: 'rgba(59,130,246,0.1)', catBorder: 'rgba(59,130,246,0.2)',
    glow: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
    iconBg: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.1))',
    icon: '📈', title: 'Public Tracker',
    desc: 'Browse real uptime data for 100+ famous websites. See who\'s been down, who\'s fastest, and how your stack compares — updated every minute.',
    tags: ['Free · no signup', '100+ sites', 'Live data', 'Leaderboard'],
  },
  {
    cat: 'Coming Soon', catColor: '#06b6d4', catBg: 'rgba(6,182,212,0.1)', catBorder: 'rgba(6,182,212,0.2)',
    glow: 'linear-gradient(90deg,#0c1322,#3b82f6)',
    iconBg: 'linear-gradient(135deg,rgba(12,19,34,0.4),rgba(59,130,246,0.12))',
    icon: '🏢', title: 'Agency White-Label',
    desc: 'Full white-label under your brand. Multi-tenant workspaces, client billing via revenue share, custom GTM/analytics per client. Built for agencies.',
    tags: ['White-label', 'Multi-tenant', 'Revenue share', 'Waitlist'],
  },
]

const TABS = [
  { label: 'All features', cat: 'all' },
  { label: 'Monitoring', cat: 'Monitoring', icon: (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  )},
  { label: 'Alerting', cat: 'Alerting', icon: (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
  )},
  { label: 'Reporting', cat: 'Reporting', icon: (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  )},
  { label: 'Intelligence', cat: 'Intelligence', icon: (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
  )},
  { label: 'Free Tools', cat: 'Free Tool', icon: (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
  )},
]

const CARD_VISIBLE = 3.5

export function FeatureCarousel(): React.ReactElement {
  const [activeCat, setActiveCat] = useState('all')
  const [offset, setOffset] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const visible = activeCat === 'all' ? CARDS : CARDS.filter(c => c.cat === activeCat || c.cat === 'Coming Soon')
  const total = visible.length
  const cardW = 280 + 20 // card width + gap
  const maxOffset = Math.max(0, total - Math.floor(CARD_VISIBLE))

  function move(dir: number): void {
    setOffset(prev => Math.min(maxOffset, Math.max(0, prev + dir)))
  }

  function switchTab(cat: string): void {
    setActiveCat(cat)
    setOffset(0)
  }

  const pct = total <= 1 ? 100 : Math.round(((offset + 1) / total) * 100)
  const idx = Math.min(offset + 1, total)

  return (
    <div>
      {/* Category tabs */}
      <div className="feature-tabs">
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

      {/* Carousel */}
      <div className="feature-carousel-wrap">
        <button className="carousel-arrow prev" onClick={() => move(-1)} disabled={offset === 0} aria-label="Previous">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="carousel-arrow next" onClick={() => move(1)} disabled={offset >= maxOffset} aria-label="Next">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
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
                <div className="feature-icon" style={{ background: card.iconBg, fontSize: 26 }}>
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
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drag or use arrows</span>
        </div>
      </div>
    </div>
  )
}
