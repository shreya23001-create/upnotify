import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help Centre — Uptrue',
  description:
    'Browse Uptrue help topics — getting started, monitors, alerts, status pages, billing, and more. Full articles open in your dashboard.',
  alternates: {
    canonical: 'https://uptrue.io/help',
  },
  openGraph: {
    title: 'Help Centre — Uptrue',
    description:
      'Browse Uptrue help topics — getting started, monitors, alerts, status pages, billing, and more.',
    url: 'https://uptrue.io/help',
    type: 'website',
  },
}

interface HelpTopic {
  href: string
  title: string
  description: string
  icon: string
}

// Mirrors the in-app topic list in app/(dashboard)/dashboard/help/help-sidebar.tsx
// but points unauthenticated visitors at the dashboard equivalents. The proxy
// will gate /dashboard/* behind login, so a not-logged-in click lands on /login
// with a sensible redirect target — same as every other dashboard link from
// the marketing surface.
const PUBLIC_HELP_TOPICS: HelpTopic[] = [
  {
    href: '/dashboard/help/getting-started',
    title: 'Getting Started',
    description: 'Create your first monitor, understand your dashboard, and set up alerts in minutes.',
    icon: '🚀',
  },
  {
    href: '/dashboard/help/monitors',
    title: 'Understanding Monitors',
    description: 'All 24 monitor types — HTTP, SSL, DNS, ping, keyword, API, heartbeat and more.',
    icon: '📡',
  },
  {
    href: '/dashboard/help/wordpress',
    title: 'WordPress Plugin',
    description: 'Free plugin that watches your WordPress site from the inside — file injections, rogue users, security audits.',
    icon: '📝',
  },
  {
    href: '/dashboard/help/alerts',
    title: 'Setting Up Alerts',
    description: 'Get notified by email, Slack, Teams, or webhook when something goes wrong.',
    icon: '🔔',
  },
  {
    href: '/dashboard/help/status-pages',
    title: 'Public Status Pages',
    description: 'A branded page that shows your customers whether your services are up.',
    icon: '🌐',
  },
  {
    href: '/dashboard/help/billing',
    title: 'Plans & Billing',
    description: 'Understand plans, upgrade or downgrade, and manage your subscription.',
    icon: '💳',
  },
  {
    href: '/dashboard/help/incidents',
    title: 'Incidents',
    description: 'Manage outage lifecycle from detection to resolution.',
    icon: '🚨',
  },
  {
    href: '/dashboard/help/ai-visibility',
    title: 'AI Visibility',
    description: 'Generate your llms.txt, track AI citations, improve presence on ChatGPT, Perplexity, Claude, Gemini.',
    icon: '✨',
  },
  {
    href: '/dashboard/help/tools',
    title: 'Free Tools',
    description: 'SSL Checker, Uptime Calculator, Uptrue Score — free, no signup needed.',
    icon: '🧰',
  },
]

export default function PublicHelpPage(): React.ReactElement {
  return (
    <div className="landing">
      <section className="about-hero">
        <div className="landing-container">
          <h1 className="about-hero-title">Help Centre</h1>
          <p className="about-hero-subtitle">
            Guides, walkthroughs and answers for every part of Uptrue. Sign in to read the full articles, or
            <Link href="/contact" style={{ marginLeft: 4 }}>contact us</Link> if you need a hand.
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="help-topics-grid">
            {PUBLIC_HELP_TOPICS.map((topic) => (
              <Link key={topic.href} href={topic.href} className="card help-topic-card">
                <div className="help-topic-icon-wrap">{topic.icon}</div>
                <h2 className="help-topic-title">{topic.title}</h2>
                <p className="help-topic-desc">{topic.description}</p>
                <span className="help-topic-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ marginBottom: 16, color: '#94a3b8' }}>
              Can&rsquo;t find what you&rsquo;re looking for?
            </p>
            <Link href="/contact" className="btn btn-primary">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
