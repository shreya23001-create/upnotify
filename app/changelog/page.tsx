import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Changelog — Uptrue',
  description: 'See what\'s new in Uptrue. Product updates, new features, and improvements shipped by the Uptrue team.',
  alternates: { canonical: 'https://uptrue.io/changelog' },
  openGraph: {
    title: 'Changelog — Uptrue',
    description: 'See what\'s new in Uptrue. Product updates, new features, and improvements.',
    url: 'https://uptrue.io/changelog',
    type: 'website',
  },
}

const ENTRIES = [
  {
    date: 'April 2026',
    version: 'v1.0',
    badge: 'Launch',
    badgeColor: '#3b82f6',
    items: [
      { type: 'new', text: 'AI SEO Checker — free public tool to score any website\'s AI readiness' },
      { type: 'new', text: 'AI Visibility dashboard — monitor how AI engines like ChatGPT, Perplexity, and Gemini see your site' },
      { type: 'new', text: 'Public Tracker — real-time uptime monitoring of 100+ major websites' },
      { type: 'new', text: 'Dark mode — full dark theme with system preference detection' },
      { type: 'new', text: 'India pricing — INR billing via Razorpay with 18% GST' },
    ],
  },
  {
    date: 'March 2026',
    version: 'v0.9',
    badge: 'Beta',
    badgeColor: '#8b5cf6',
    items: [
      { type: 'new', text: 'Uptrue launched — uptime, SSL, domain, keyword, API, port, DNS, ping, heartbeat, and competitor monitoring' },
      { type: 'new', text: 'Alert channels — email, Slack, Microsoft Teams, Telegram, and webhooks' },
      { type: 'new', text: 'Public status pages — branded pages with real-time incident feed and subscriber notifications' },
      { type: 'new', text: 'AI executive reports — weekly summaries powered by Claude' },
      { type: 'new', text: 'Billing — Free, Lite, Builder, and Scale plans via Stripe' },
    ],
  },
]

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:      { label: 'New',      color: '#16a34a', bg: '#dcfce7' },
  improved: { label: 'Improved', color: '#2563eb', bg: '#dbeafe' },
  fixed:    { label: 'Fixed',    color: '#d97706', bg: '#fef3c7' },
}

export default function ChangelogPage(): React.ReactElement {
  return (
    <div className="landing">
      <PublicNav />

      <section className="changelog-hero">
        <div className="container" style={{ maxWidth: 760, padding: '80px 24px 48px' }}>
          <h1 className="changelog-title">Changelog</h1>
          <p className="changelog-subtitle">
            Every update, improvement, and new feature we ship — newest first.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {ENTRIES.map((entry, ei) => (
            <div key={ei} className="changelog-entry">

              {/* Entry header */}
              <div className="changelog-entry-header">
                <div className="changelog-entry-meta">
                  <span className="changelog-date">{entry.date}</span>
                  <span className="changelog-version">{entry.version}</span>
                  <span className="changelog-badge" style={{ background: entry.badgeColor }}>
                    {entry.badge}
                  </span>
                </div>
                <div className="changelog-divider" />
              </div>

              {/* Items */}
              <ul className="changelog-items">
                {entry.items.map((item, ii) => {
                  const t = TYPE_LABELS[item.type] ?? TYPE_LABELS.new
                  return (
                    <li key={ii} className="changelog-item">
                      <span className="changelog-type-badge" style={{ color: t.color, background: t.bg }}>
                        {t.label}
                      </span>
                      <span className="changelog-item-text">{item.text}</span>
                    </li>
                  )
                })}
              </ul>

            </div>
          ))}

          {/* Subscribe nudge */}
          <div className="changelog-subscribe">
            <div className="changelog-subscribe-icon">📬</div>
            <div>
              <div className="changelog-subscribe-title">Stay in the loop</div>
              <div className="changelog-subscribe-desc">
                New features land every week. <a href="/signup" className="changelog-link">Sign up free</a> and
                we&apos;ll email you when something big ships.
              </div>
            </div>
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
