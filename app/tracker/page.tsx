import type { Metadata } from 'next'
import Link from 'next/link'
import { getActivePublicMonitors } from '@/lib/db/public-monitors'
import type { PublicMonitor } from '@/lib/db/public-monitors'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Is It Down? Live Website Status Tracker | Uptrue',
  description: 'Check if popular websites are down right now. Real-time uptime monitoring for Google, Facebook, GitHub, AWS, and 50+ more services.',
  alternates: { canonical: 'https://uptrue.io/tracker' },
  openGraph: {
    title: 'Is It Down? Live Website Status Tracker | Uptrue',
    description: 'Real-time uptime monitoring for popular websites and services.',
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

export default async function TrackerDirectoryPage(): Promise<React.ReactElement> {
  const monitors = await getActivePublicMonitors()
  const downMonitors = monitors.filter(m => m.last_status === 'down')
  const grouped = groupByCategory(monitors)
  const categoryNames = Object.keys(grouped).sort()

  return (
    <div className="tracker-directory">
      <div className="tracker-hero">
        <h1 className="tracker-hero-title">Website Status Tracker</h1>
        <p className="tracker-hero-subtitle">
          Real-time uptime monitoring for {monitors.length} popular websites and services.
        </p>
      </div>

      {downMonitors.length > 0 && (
        <div className="tracker-section tracker-down-section">
          <h2 className="tracker-section-title tracker-down-title">Currently Down</h2>
          <div className="tracker-grid">
            {downMonitors.map(m => (
              <Link key={m.id} href={`/tracker/${m.domain}`} className="tracker-card tracker-card-down">
                <div className="tracker-card-header">
                  <span className="tracker-status-dot" style={{ background: getStatusColor(m.last_status) }} />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span className="tracker-card-status" style={{ color: getStatusColor(m.last_status) }}>
                    {getStatusLabel(m.last_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categoryNames.map(category => (
        <div key={category} className="tracker-section">
          <h2 className="tracker-section-title">{category}</h2>
          <div className="tracker-grid">
            {grouped[category].map(m => (
              <Link key={m.id} href={`/tracker/${m.domain}`} className="tracker-card">
                <div className="tracker-card-header">
                  <span className="tracker-status-dot" style={{ background: getStatusColor(m.last_status) }} />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span className="tracker-card-response">{formatResponseTime(m.last_response_time_ms)}</span>
                </div>
                <div className="tracker-card-footer">
                  <span className="tracker-card-status" style={{ color: getStatusColor(m.last_status) }}>
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

      <div className="tracker-cta-section">
        <h2>Monitor Your Own Website</h2>
        <p>Get instant alerts when your site goes down. Free plan available.</p>
        <a href="https://uptrue.io" className="btn btn-primary">Start Monitoring Free</a>
      </div>
    </div>
  )
}
