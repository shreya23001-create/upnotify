import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getActivePublicMonitorsPaginated,
  getPublicMonitorCategories,
} from '@/lib/db/public-monitors'
import type { PublicMonitor } from '@/lib/db/public-monitors'

const PAGE_SIZE = 20

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Is It Down? Live Website Status Tracker | Uptrue',
  description:
    'Check if popular websites are down right now. Real-time uptime monitoring for Google, Facebook, GitHub, AWS, and 50+ more services.',
  alternates: { canonical: 'https://uptrue.io/tracker' },
  openGraph: {
    title: 'Is It Down? Live Website Status Tracker | Uptrue',
    description:
      'Real-time uptime monitoring for popular websites and services.',
    url: 'https://uptrue.io/tracker',
    type: 'website',
  },
}

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

      <div className="tracker-cta-section">
        <h2>Monitor Your Own Website</h2>
        <p>
          Get instant alerts when your site goes down. Free plan available.
        </p>
        <a href="https://uptrue.io" className="btn btn-primary">
          Start Monitoring Free
        </a>
      </div>
    </div>
  )
}
