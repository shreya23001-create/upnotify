import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getActivePublicMonitorsPaginated,
  getPublicMonitorCategories,
} from '@/lib/db/public-monitors'
import type { PublicMonitor } from '@/lib/db/public-monitors'

const PAGE_SIZE = 20

// engineering-app#69 — tracker index was force-dynamic (failed at 150+
// concurrent users). 60s revalidate matches the check-runner cadence:
// users see status updates within a minute of the underlying change
// while the DB is queried at most once per minute regardless of traffic.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Is It Down? Live Website Status Tracker — Real-Time Uptime | Uptrue',
  description:
    'Check if popular websites are down right now. Live uptime monitoring for Google, Facebook, GitHub, AWS, OpenAI and 100+ more services. Real-time status, response time, incident history.',
  alternates: { canonical: 'https://uptrue.io/tracker' },
  openGraph: {
    title: 'Is It Down? Live Website Status Tracker — Real-Time Uptime | Uptrue',
    description:
      'Real-time uptime monitoring for popular websites and services. Free, public, no signup required.',
    url: 'https://uptrue.io/tracker',
    type: 'website',
  },
}

const FAQ = [
  {
    q: 'How often is the tracker updated?',
    a: 'Every minute. Each site is checked from our edge network, and the live status, response time and incident timeline on this page reflect the most recent check. If a site goes down, the card turns red within a minute and the site moves to the Currently Down section.',
  },
  {
    q: 'Why is a site marked as "Down" when it loads in my browser?',
    a: 'Our checker enforces strict timeouts and validates HTTP status, SSL chain, and response body. A site can load in a browser but fail one of these — for example, slow TTFB above the threshold, a 5xx error on the homepage, or a broken SSL chain. Click any site to see the exact failure mode and a 90-day incident history.',
  },
  {
    q: 'How can I add a site to the public tracker?',
    a: 'The public tracker covers popular websites that everyone wants to know about. To monitor your own site, sign up for a free Uptrue account — you get HTTP, SSL, DNS and response-time monitoring with email alerts on the Free plan.',
  },
  {
    q: 'Can I monitor my own site continuously instead of refreshing this page?',
    a: 'Yes. The Free plan includes 3 monitors with email alerts. Each tracker site here corresponds to a continuous monitor type you can run on your own domain — HTTP uptime, SSL certificate, DNS, response time, and security headers.',
  },
  {
    q: 'Are the response times shown on the tracker accurate?',
    a: 'They are accurate for the check region we run from. Real-world performance varies by user location, network, and the time of day. For a representative view, we run multiple checks and show a 24-hour rolling response time on each site detail page.',
  },
  {
    q: 'Is there a way to subscribe to alerts for specific sites?',
    a: 'Subscriber alerts on the public tracker are coming. For now, the fastest path is to add the sites you care about as monitors in your own Uptrue account — you can monitor any public URL on the Free plan and receive email, Slack, Telegram, or Microsoft Teams alerts on every status change.',
  },
]

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Operational'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Unknown'
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function groupByCategory(monitors: PublicMonitor[]): Record<string, PublicMonitor[]> {
  const groups: Record<string, PublicMonitor[]> = {}
  for (const m of monitors) {
    const cat = m.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(m)
  }
  return groups
}

function buildPaginationHref(page: number, category: string | undefined): string {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/tracker?${qs}` : '/tracker'
}

export default async function TrackerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}): Promise<React.ReactElement> {
  const resolvedParams = await searchParams
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1)
  const selectedCategory = resolvedParams.category || undefined

  const [paginatedResult, allCategories] = await Promise.all([
    getActivePublicMonitorsPaginated({
      page: currentPage,
      pageSize: PAGE_SIZE,
      category: selectedCategory,
    }),
    getPublicMonitorCategories(),
  ])

  const { monitors, total, totalPages } = paginatedResult
  const downMonitors = monitors.filter((m) => m.last_status === 'down')
  const grouped = groupByCategory(monitors)
  const categoryNames = Object.keys(grouped).sort()

  return (
    <div className="tracker-directory">
      <div className="tracker-hero">
        <div className="container">
          <div className="tracker-hero-inner">
            <div className="tracker-hero-eyebrow">Live Status</div>
            <h1 className="tracker-hero-title">Is It Down Right Now?</h1>
            <p className="tracker-hero-subtitle">
              Real-time uptime monitoring for {total} popular websites and services. Updated every minute.
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="tracker-category-filter">
        <Link
          href={buildPaginationHref(1, undefined)}
          className={`tracker-category-pill${!selectedCategory || selectedCategory === 'all' ? ' tracker-category-pill-active' : ''}`}
        >
          All
        </Link>
        {allCategories.map((cat) => (
          <Link
            key={cat}
            href={buildPaginationHref(1, cat)}
            className={`tracker-category-pill${selectedCategory === cat ? ' tracker-category-pill-active' : ''}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {downMonitors.length > 0 && (
        <div className="tracker-section tracker-down-section">
          <h2 className="tracker-section-title tracker-down-title">
            Currently Down
          </h2>
          <div className="tracker-grid">
            {downMonitors.map((m) => (
              <Link
                key={m.id}
                href={`/tracker/${m.domain}`}
                className="tracker-card tracker-card-down"
              >
                <div className="tracker-card-header">
                  <span
                    className="tracker-status-dot"
                    style={{ background: getStatusColor(m.last_status) }}
                  />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span
                    className="tracker-card-status"
                    style={{ color: getStatusColor(m.last_status) }}
                  >
                    {getStatusLabel(m.last_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categoryNames.map((category) => (
        <div key={category} className="tracker-section">
          <h2 className="tracker-section-title">{category}</h2>
          <div className="tracker-grid">
            {grouped[category].map((m) => (
              <Link
                key={m.id}
                href={`/tracker/${m.domain}`}
                className="tracker-card"
              >
                <div className="tracker-card-header">
                  <span
                    className="tracker-status-dot"
                    style={{ background: getStatusColor(m.last_status) }}
                  />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span className="tracker-card-response">
                    {formatResponseTime(m.last_response_time_ms)}
                  </span>
                </div>
                <div className="tracker-card-footer">
                  <span
                    className="tracker-card-status"
                    style={{ color: getStatusColor(m.last_status) }}
                  >
                    {getStatusLabel(m.last_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {monitors.length === 0 && (
        <div className="tracker-empty">
          <p>No sites are being tracked yet. Check back soon.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="tracker-pagination">
          {currentPage > 1 ? (
            <Link
              href={buildPaginationHref(currentPage - 1, selectedCategory)}
              className="tracker-pagination-btn"
            >
              Previous
            </Link>
          ) : (
            <span className="tracker-pagination-btn tracker-pagination-btn-disabled">
              Previous
            </span>
          )}

          <span className="tracker-pagination-info">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={buildPaginationHref(currentPage + 1, selectedCategory)}
              className="tracker-pagination-btn"
            >
              Next
            </Link>
          ) : (
            <span className="tracker-pagination-btn tracker-pagination-btn-disabled">
              Next
            </span>
          )}
        </div>
      )}

      {/* Related continuous monitors — each tracker site maps to a continuous monitor type */}
      <section className="landing-section">
        <div className="landing-container" style={{ maxWidth: 880 }}>
          <h2 className="landing-section-title">Monitor your own site continuously</h2>
          <p className="landing-section-subtitle">
            The tracker shows live status for popular sites. To get the same visibility on
            your own domain — plus alerts when something breaks — set up the matching
            monitor type:
          </p>
          <ul className="about-list" style={{ marginTop: 24, fontSize: 15, lineHeight: 1.9 }}>
            <li><Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> — the same up/down check that powers every card on this page.</li>
            <li><Link href="/monitoring/response-time-monitoring">Response time monitoring</Link> — alert when your TTFB or full response degrades past a threshold.</li>
            <li><Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> — get warned 30, 14 and 3 days before your certificate expires.</li>
            <li><Link href="/monitoring/dns-monitoring">DNS record monitoring</Link> — detect unauthorised record changes within minutes.</li>
            <li><Link href="/monitoring/keyword-monitoring">Keyword monitoring</Link> — catch silent partial outages where the homepage loads but the cart, login or pricing block is broken.</li>
          </ul>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Or browse all <Link href="/tools">free website monitoring tools</Link> — SSL,
            DNS, security headers, blacklist and more, no signup required.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" style={{ background: 'var(--bg-muted)' }}>
        <div className="landing-container" style={{ maxWidth: 760 }}>
          <h2 className="landing-section-title">Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.q}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <div className="tracker-cta-section">
        <h2>Monitor your own website</h2>
        <p>
          Get instant alerts when your site goes down. Free plan available — no credit card required.
        </p>
        <Link href="/signup" className="btn btn-primary">
          Start Monitoring Free
        </Link>
      </div>
    </div>
  )
}
