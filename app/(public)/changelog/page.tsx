import '../landing.css'
import type { Metadata } from 'next'
import { Rocket, Sparkles, ArrowUpCircle, Wrench, Mail } from 'lucide-react'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Changelog — Upnotify',
  description: 'See what\'s new in Upnotify. Product updates, new features, and improvements shipped by the Upnotify team.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/changelog' },
  openGraph: {
    title: 'Changelog — Upnotify',
    description: 'See what\'s new in Upnotify. Product updates, new features, and improvements.',
    url: 'https://upnotify-monitoring.vercel.app/changelog',
    type: 'website',
  },
}

const ENTRIES = [
  {
    date: 'April 2026',
    version: 'v1.0',
    badge: 'Launch',
    badgeIcon: Rocket,
    items: [
      { type: 'new',      text: '13 advanced monitor types — security headers, response time threshold, robots.txt change, IP change, MX health, WHOIS change, sitemap validity, redirect chain, SPF/DMARC, blacklist, page size, cookie consent, and nameserver change' },
      { type: 'new',      text: 'AI SEO Checker — free public tool to score any website\'s AI readiness across 4 categories' },
      { type: 'new',      text: 'AI Visibility dashboard — monitor how AI engines like ChatGPT, Perplexity, and Gemini cite your site' },
      { type: 'new',      text: 'Public Tracker — real-time uptime leaderboard for 100+ major websites and services' },
      { type: 'new',      text: 'Dark mode — full dark theme with system preference detection and manual toggle on all pages' },
      { type: 'new',      text: 'India pricing — INR billing via Razorpay with 18% GST, auto-detected by IP' },
      { type: 'new',      text: 'Blog RSS feed — machine-readable feed at /blog/feed.xml for RSS readers and aggregators' },
      { type: 'improved', text: 'Full mobile responsiveness across all public pages — blog, tracker, tools, score, status pages, auth' },
    ],
  },
  {
    date: 'March 2026',
    version: 'v0.9',
    badge: 'Beta',
    badgeIcon: Sparkles,
    items: [
      { type: 'new', text: 'Upnotify launched — 10 core monitor types: HTTP/HTTPS uptime, SSL certificate, DNS records, keyword detection, domain expiry, port check, ping, API endpoint, heartbeat, and page change detection' },
      { type: 'new', text: 'Alert channels — email, Slack, Microsoft Teams, Telegram, and HMAC-signed webhooks' },
      { type: 'new', text: 'Public status pages — branded pages with real-time incident feed and subscriber notifications' },
      { type: 'new', text: 'AI executive reports — monthly summaries powered by Claude API' },
      { type: 'new', text: 'Billing — Free, Lite, Builder, and Scale plans via Stripe and Razorpay' },
    ],
  },
]

const TYPE_LABELS: Record<string, { label: string; icon: typeof Sparkles; className: string }> = {
  new:      { label: 'New',      icon: Sparkles,      className: 'is-new' },
  improved: { label: 'Improved', icon: ArrowUpCircle, className: 'is-improved' },
  fixed:    { label: 'Fixed',    icon: Wrench,         className: 'is-fixed' },
}

export default function ChangelogPage(): React.ReactElement {
  return (
    <div className="landing">
      <ScrollReveal />

      <section className="changelog-hero">
        <div className="container" style={{ maxWidth: 760, padding: '80px 24px 48px' }}>
          <h1 className="changelog-title reveal-title">Changelog</h1>
          <p className="changelog-subtitle reveal-title">
            Every update, improvement, and new feature we ship — newest first.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div className="changelog-timeline" style={{ maxWidth: 760, margin: '0 auto' }}>
          {ENTRIES.map((entry, ei) => {
            const BadgeIcon = entry.badgeIcon
            return (
              <div key={ei} className="changelog-entry reveal">
                <div className="changelog-entry-dot">
                  <BadgeIcon size={16} strokeWidth={2.25} />
                </div>

                <div className="changelog-entry-body">
                  {/* Entry header */}
                  <div className="changelog-entry-header">
                    <div className="changelog-entry-meta">
                      <span className="changelog-date">{entry.date}</span>
                      <span className="changelog-version">{entry.version}</span>
                      <span className="changelog-badge">{entry.badge}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="changelog-items reveal-stagger">
                    {entry.items.map((item, ii) => {
                      const t = TYPE_LABELS[item.type] ?? TYPE_LABELS.new
                      const TypeIcon = t.icon
                      return (
                        <li key={ii} className="changelog-item">
                          <span className={`changelog-type-badge ${t.className}`}>
                            <TypeIcon size={12} strokeWidth={2.5} />
                            {t.label}
                          </span>
                          <span className="changelog-item-text">{item.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}

          {/* Subscribe nudge */}
          <div className="changelog-subscribe reveal">
            <div className="changelog-subscribe-icon"><Mail size={22} /></div>
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
    </div>
  )
}
