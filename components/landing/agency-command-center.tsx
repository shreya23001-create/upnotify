import { Tag, Users, Coins, FileBarChart, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AgencyWaitlistCta } from './agency-waitlist-cta'

interface ClientSite {
  name: string
  pct: string
  status: 'up' | 'warn'
  spark: number[] // 6-8 relative points, 0-100, for the mini sparkline
}

const CLIENT_SITES: ClientSite[] = [
  { name: 'clientco.com', pct: '99.98%', status: 'up', spark: [92, 96, 94, 98, 97, 99, 98, 100] },
  { name: 'shopfront.io', pct: '99.91%', status: 'up', spark: [88, 90, 93, 91, 95, 94, 96, 97] },
  { name: 'checkout.acme.dev', pct: '97.4%', status: 'warn', spark: [90, 85, 88, 70, 75, 82, 78, 84] },
]

const BADGE_ICONS: LucideIcon[] = [Tag, Users, Coins, FileBarChart, BarChart3]

function stripLeadingEmoji(text: string): string {
  return text.replace(/^\p{Emoji_Presentation}\p{Extended_Pictographic}?\s*/u, '').trim()
}

function Sparkline({ points, tone }: { points: number[]; tone: 'up' | 'warn' }): React.ReactElement {
  const w = 64
  const h = 20
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(max - min, 1)
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(' ')
  const color = tone === 'up' ? '#16a34a' : '#d97706'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="acc-sparkline" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface AgencyCommandCenterProps {
  badge?: string
  headline?: React.ReactNode
  description?: string
  badges?: string[]
  ctaNote?: string
}

export function AgencyCommandCenter({
  badge, headline, description, badges, ctaNote,
}: AgencyCommandCenterProps): React.ReactElement {
  const capabilityBadges = badges ?? ['Full white-label', 'Multi-tenant workspaces', 'Revenue sharing', 'Branded AI reports', 'Custom analytics']

  return (
    <section className="acc-section" id="agency">
      <div className="container acc-layout">
        {/* Copy column */}
        <div className="acc-copy">
          <span className="acc-badge">
            <span className="acc-badge-dot" />
            {badge ?? 'Coming Soon · Join Waitlist'}
          </span>
          <h2 className="acc-headline">{headline}</h2>
          <p className="acc-description">{description}</p>

          <div className="acc-capabilities">
            {capabilityBadges.map((b, i) => {
              const Icon = BADGE_ICONS[i % BADGE_ICONS.length]
              return (
                <div key={b} className="acc-capability" tabIndex={0}>
                  <span className="acc-capability-icon"><Icon size={14} strokeWidth={2.25} /></span>
                  {stripLeadingEmoji(b)}
                </div>
              )
            })}
          </div>

          <div className="acc-cta-row">
            <AgencyWaitlistCta />
            <span className="acc-cta-note">{ctaNote ?? 'No commitment · Early access pricing'}</span>
          </div>
        </div>

        {/* Workspace mockup — framed like a browser window */}
        <div className="acc-workspace" aria-hidden="true">
          <div className="acc-workspace-chrome">
            <div className="acc-workspace-dots">
              <span /><span /><span />
            </div>
            <span className="acc-workspace-live"><span className="acc-live-pulse" /> Live</span>
          </div>

          <div className="acc-workspace-body">
            <div className="acc-workspace-brand">
              <span className="acc-workspace-brandmark">Your Agency Workspace</span>
              <span className="acc-workspace-sub">White-labeled monitoring, under your name</span>
            </div>

            <div className="acc-workspace-stats">
              <div className="acc-stat">
                <span className="acc-stat-value">50</span>
                <span className="acc-stat-label">Client sites</span>
              </div>
              <div className="acc-stat">
                <span className="acc-stat-value acc-stat-value-up">99.1%</span>
                <span className="acc-stat-label">Avg uptime</span>
              </div>
              <div className="acc-stat">
                <span className="acc-stat-value acc-stat-value-accent">₹0</span>
                <span className="acc-stat-label">Your branding cost</span>
              </div>
            </div>

            <div className="acc-client-list">
              {CLIENT_SITES.map((c) => (
                <div key={c.name} className="acc-client-row">
                  <span className={`acc-client-dot acc-client-dot-${c.status}`} />
                  <span className="acc-client-name">{c.name}</span>
                  <Sparkline points={c.spark} tone={c.status} />
                  <span className={`acc-client-pct acc-client-pct-${c.status}`}>{c.pct}</span>
                </div>
              ))}
              <div className="acc-client-more">+ 47 more client sites</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
