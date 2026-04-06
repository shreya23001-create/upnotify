import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getActivePublicMonitorsPaginated,
  getPublicMonitorCategories,
} from '@/lib/db/public-monitors'
import { TrackerInfiniteGrid } from '@/components/tracker/tracker-infinite-grid'

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

function buildCategoryHref(category: string | undefined): string {
  if (!category || category === 'all') return '/tracker'
  return `/tracker?category=${encodeURIComponent(category)}`
}

export default async function TrackerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<React.ReactElement> {
  const resolvedParams = await searchParams
  const selectedCategory = resolvedParams.category || undefined

  const [paginatedResult, allCategories] = await Promise.all([
    getActivePublicMonitorsPaginated({
      page: 1,
      pageSize: PAGE_SIZE,
      category: selectedCategory,
    }),
    getPublicMonitorCategories(),
  ])

  const { monitors, total, totalPages } = paginatedResult

  return (
    <div className="tracker-directory">
      <div className="tracker-hero">
        <h1 className="tracker-hero-title">Website Status Tracker</h1>
        <p className="tracker-hero-subtitle">
          Real-time uptime monitoring for {total} popular websites and services.
        </p>
      </div>

      {/* Category filter */}
      <div className="tracker-category-filter">
        <Link
          href={buildCategoryHref(undefined)}
          className={`tracker-category-pill${!selectedCategory || selectedCategory === 'all' ? ' tracker-category-pill-active' : ''}`}
        >
          All
        </Link>
        {allCategories.map((cat) => (
          <Link
            key={cat}
            href={buildCategoryHref(cat)}
            className={`tracker-category-pill${selectedCategory === cat ? ' tracker-category-pill-active' : ''}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {monitors.length === 0 ? (
        <div className="tracker-empty">
          <p>No sites are being tracked yet. Check back soon.</p>
        </div>
      ) : (
        <TrackerInfiniteGrid
          initialMonitors={monitors}
          initialPage={1}
          initialTotalPages={totalPages}
          selectedCategory={selectedCategory}
        />
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
