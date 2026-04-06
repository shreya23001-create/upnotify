import Link from 'next/link'
import type { PublicMonitor } from '@/lib/db/public-monitors'
import type { PublishedBlogPostSummary } from '@/lib/db/blog-posts'

interface Props {
  siteName: string
  outagePost: Pick<PublishedBlogPostSummary, 'id' | 'title' | 'slug' | 'excerpt' | 'published_at'> | null
  downSites: Pick<PublicMonitor, 'id' | 'domain' | 'display_name' | 'category' | 'last_status'>[]
}

function getStatusColor(status: string): string {
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  return 'var(--color-warning, #f59e0b)'
}

function getStatusLabel(status: string): string {
  if (status === 'down') return 'Down'
  return 'Degraded'
}

export function AlsoDownSection({ siteName, outagePost, downSites }: Props): React.ReactElement | null {
  // Don't render if nothing to show
  if (!outagePost && downSites.length === 0) return null

  return (
    <div className="also-down-section">
      <h2 className="tracker-section-heading also-down-heading">
        <span className="also-down-pulse" />
        Also Having Issues Right Now
      </h2>
      <p className="also-down-subtitle">
        Other services experiencing problems at the same time as {siteName}.
      </p>

      <div className="also-down-grid">

        {/* Blog coverage card — full width, only if a published post exists */}
        {outagePost && (
          <Link href={`/blog/${outagePost.slug}`} className="also-down-card also-down-card-blog">
            <div className="also-down-blog-icon">📰</div>
            <div className="also-down-blog-body">
              <div className="also-down-card-badge">Our Coverage</div>
              <div className="also-down-card-title">{outagePost.title}</div>
              {outagePost.excerpt && (
                <div className="also-down-card-excerpt">{outagePost.excerpt}</div>
              )}
            </div>
            <div className="also-down-blog-arrow">→</div>
          </Link>
        )}

        {/* Currently down sites */}
        {downSites.map((site) => (
          <Link
            key={site.id}
            href={`/tracker/${site.domain}`}
            className="also-down-card also-down-card-site"
          >
            <div className="also-down-card-site-header">
              <span
                className="also-down-status-dot"
                style={{ background: getStatusColor(site.last_status) }}
              />
              <span
                className="also-down-status-label"
                style={{ color: getStatusColor(site.last_status) }}
              >
                {getStatusLabel(site.last_status)}
              </span>
            </div>
            <div className="also-down-card-title">{site.display_name}</div>
            <div className="also-down-card-domain">{site.domain}</div>
          </Link>
        ))}

      </div>
    </div>
  )
}
