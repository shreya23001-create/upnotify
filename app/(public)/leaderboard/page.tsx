import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Lock, Globe, Gauge, Clock, Trophy } from 'lucide-react'
import { getLeaderboardEntries } from '@/lib/db/leaderboard'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

// engineering-app#69 — was force-dynamic; load test showed the page
// killed sessions at 50+ concurrent users (heavy aggregation query).
// 5-minute ISR is plenty for a 30-day rolling leaderboard.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Uptime Leaderboard — Most Reliable Websites Ranked by Uptime | Upnotify',
  description:
    'The top 50 most reliable websites ranked by 30-day uptime percentage. Real-time leaderboard powered by Upnotify monitoring data — see who is genuinely the most stable. Is your site in the top 50?',
  alternates: { canonical: 'https://uptrue.io/leaderboard' },
  openGraph: {
    title: 'Uptime Leaderboard — Most Reliable Websites Ranked by Uptime | Upnotify',
    description:
      'The top 50 most reliable websites ranked by uptime. Real-time data from Upnotify monitoring.',
    url: 'https://uptrue.io/leaderboard',
    type: 'website',
  },
}

const FAQ = [
  {
    q: 'How is uptime calculated for the leaderboard?',
    a: 'Each site on the leaderboard is checked from our edge network, and the percentage shown is the share of successful checks over the rolling last 30 days. A successful check means a 2xx HTTP response within the response-time threshold, with a valid SSL chain. Failures, timeouts, and 5xx errors all count as downtime.',
  },
  {
    q: 'How often is the leaderboard updated?',
    a: 'Every 5 minutes. The 30-day uptime percentage is recomputed continuously as new check results come in, so the rankings reflect the most recent monitoring data — not a snapshot from days ago.',
  },
  {
    q: 'How can my site appear on the leaderboard?',
    a: 'The leaderboard is curated from popular public sites we already monitor on the public tracker. To track your own uptime privately, sign up for a free Upnotify account — you get the same monitoring engine, alerts, and 30-day uptime stats on your own dashboard.',
  },
  {
    q: 'What does it take to hit 99.99% uptime?',
    a: 'Roughly 4.3 minutes of downtime per month, or 52 minutes per year. Sites at this tier typically run multi-region failover, CDN-fronted origins, and continuous SSL certificate monitoring. Most outages at this level come from DNS or certificate misconfiguration, not infrastructure failure.',
  },
  {
    q: 'Why does a site I expected to be reliable rank low?',
    a: 'The leaderboard is honest. Even well-known services have intermittent failures — slow SSL handshakes, regional outages, expired certificates, response time degradation. The leaderboard captures all of this, not just complete outages. Click any site to see its incident timeline.',
  },
  {
    q: 'Can I get a badge for my site?',
    a: 'Sites that rank in the top 10 can embed a "Top 10 on Upnotify Leaderboard" badge. The badge updates dynamically — if a site drops out of the top 10, the badge automatically reflects the new ranking.',
  },
]

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '--'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getRankBadge(rank: number): string {
  if (rank === 1) return 'leaderboard-rank-gold'
  if (rank === 2) return 'leaderboard-rank-silver'
  if (rank === 3) return 'leaderboard-rank-bronze'
  return ''
}

const RELATED_MONITORS = [
  {
    icon: Activity,
    href: '/monitoring/http-uptime-monitoring',
    title: 'HTTP uptime monitoring',
    desc: 'The foundational check that drives the leaderboard percentage.',
  },
  {
    icon: Lock,
    href: '/monitoring/ssl-certificate-monitoring',
    title: 'SSL certificate monitoring',
    desc: 'Expired certificates are one of the top causes of uptime drops.',
  },
  {
    icon: Globe,
    href: '/monitoring/dns-monitoring',
    title: 'DNS record monitoring',
    desc: 'DNS misconfiguration takes more sites offline than infrastructure failure.',
  },
  {
    icon: Gauge,
    href: '/monitoring/response-time-monitoring',
    title: 'Response time monitoring',
    desc: 'Slow responses count against availability on most strict SLAs.',
  },
  {
    icon: Clock,
    href: '/monitoring/domain-expiry-monitoring',
    title: 'Domain expiry monitoring',
    desc: 'Expired domains are a common, embarrassing reason sites drop off the leaderboard.',
  },
]

function getUptimeColor(pct: number): string {
  if (pct >= 99.99) return 'var(--color-success, #22c55e)'
  if (pct >= 99.9) return 'var(--color-success, #22c55e)'
  if (pct >= 99.0) return 'var(--color-warning, #f59e0b)'
  return 'var(--color-danger, #ef4444)'
}

export default async function LeaderboardPage(): Promise<React.ReactElement> {
  const entries = await getLeaderboardEntries(50)

  return (
    <div className="leaderboard-page">
      <ScrollReveal />

      <div className="leaderboard-hero">
        <div className="leaderboard-hero-badge reveal-title">
          <Trophy size={14} /> Live rankings, updated every 5 minutes
        </div>
        <h1 className="leaderboard-hero-title reveal-title">
          Uptime <span className="gradient-text leaderboard-title-gradient">Leaderboard</span>
        </h1>
        <p className="leaderboard-hero-subtitle reveal">
          The most reliable websites ranked by uptime — real monitoring data,
          no self-reported numbers.
        </p>
      </div>

      <div className="leaderboard-container">
        {entries.length > 0 && (
          <>
            {/* Top 3 podium */}
            <div className="leaderboard-podium reveal-stagger">
              {entries.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`leaderboard-podium-card ${getRankBadge(idx + 1)}`}
                >
                  <div className="leaderboard-podium-rank">#{idx + 1}</div>
                  <div className="leaderboard-podium-name">{entry.display_name}</div>
                  <div className="leaderboard-podium-domain">{entry.domain}</div>
                  <div
                    className="leaderboard-podium-uptime"
                    style={{ color: getUptimeColor(entry.uptime_pct) }}
                  >
                    {entry.uptime_pct.toFixed(2)}%
                  </div>
                  <div className="leaderboard-podium-response">
                    {formatResponseTime(entry.last_response_time_ms)}
                  </div>
                  <Link
                    href={`/tracker/${entry.domain}`}
                    className="leaderboard-podium-link"
                  >
                    View Status
                  </Link>
                </div>
              ))}
            </div>

            {/* Full ranked table */}
            <div className="card leaderboard-table-card">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Site</th>
                    <th>Category</th>
                    <th>Uptime (30d)</th>
                    <th>Response Time</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td className="leaderboard-rank-cell">
                        <span className={`leaderboard-rank-num ${getRankBadge(idx + 1)}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <div className="leaderboard-site-cell">
                          <span className="leaderboard-site-name">{entry.display_name}</span>
                          <span className="leaderboard-site-domain">{entry.domain}</span>
                        </div>
                      </td>
                      <td>
                        <span className="leaderboard-category">{entry.category}</span>
                      </td>
                      <td>
                        <span style={{ color: getUptimeColor(entry.uptime_pct), fontWeight: 700 }}>
                          {entry.uptime_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td>{formatResponseTime(entry.last_response_time_ms)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ color: getStatusColor(entry.last_status) }}
                        >
                          <span
                            className="status-dot"
                            style={{ background: getStatusColor(entry.last_status) }}
                          />
                          {entry.last_status === 'up' ? 'Operational' : entry.last_status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/tracker/${entry.domain}`} className="btn-link">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {entries.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              The leaderboard is being compiled. Check back soon.
            </p>
          </div>
        )}

        {/* Badge section */}
        <div className="leaderboard-badge-section reveal">
          <h2 className="leaderboard-badge-title">Earn a Leaderboard Badge</h2>
          <p className="leaderboard-badge-text">
            Sites ranked in the top 10 can embed a &quot;Top 10 on Upnotify Leaderboard&quot;
            badge on their website. A mark of exceptional reliability.
          </p>
          <div className="leaderboard-badge-preview">
            <div className="leaderboard-embeddable-badge">
              <span className="leaderboard-badge-icon">&#9733;</span>
              <span>Top 10 on Upnotify Leaderboard</span>
            </div>
          </div>
        </div>

        {/* Related continuous monitors */}
        <section className="landing-section">
          <div className="landing-container" style={{ maxWidth: 880 }}>
            <h2 className="landing-section-title reveal-title">Hit the leaderboard with your own monitors</h2>
            <p className="landing-section-subtitle reveal">
              Sites at the top of this leaderboard run more than just an uptime check.
              Match the standard with continuous monitoring across the categories that
              matter:
            </p>
            <div className="leaderboard-related-grid reveal-stagger">
              {RELATED_MONITORS.map(({ icon: Icon, href, title, desc }) => (
                <Link key={href} href={href} className="leaderboard-related-card">
                  <span className="leaderboard-related-icon">
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <div className="leaderboard-related-title">{title}</div>
                  <div className="leaderboard-related-desc">{desc}</div>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
              Or run a one-off <Link href="/score">website health score</Link> to see how
              your site stacks up before you start monitoring.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <Faq
          items={FAQ.map(item => ({ question: item.q, answer: item.a }))}
          headline="Frequently asked questions"
        />

        {/* JSON-LD FAQPage schema mirroring the FAQ array above */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />

        {/* CTA */}
        <div className="leaderboard-cta reveal">
          <h2>Want your site on the leaderboard?</h2>
          <p>
            Start monitoring your uptime for free and climb the rankings.{' '}
            <Link href="/tools">Browse free tools</Link> or{' '}
            <Link href="/signup">create an account</Link> to start.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </Link>
        </div>
      </div>
    </div>
  )
}
