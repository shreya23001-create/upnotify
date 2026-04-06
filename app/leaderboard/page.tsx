import type { Metadata } from 'next'
import Link from 'next/link'
import { getLeaderboardEntries } from '@/lib/db/leaderboard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Uptime Leaderboard — Most Reliable Websites | Uptrue',
  description:
    'See the most reliable websites ranked by uptime percentage. Real-time leaderboard powered by Uptrue monitoring data. Is your site in the top 50?',
  alternates: { canonical: 'https://uptrue.io/leaderboard' },
  openGraph: {
    title: 'Uptime Leaderboard — Most Reliable Websites | Uptrue',
    description:
      'The top 50 most reliable websites ranked by uptime. Real-time data from Uptrue monitoring.',
    url: 'https://uptrue.io/leaderboard',
    type: 'website',
  },
}

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
      <div className="leaderboard-hero">
        <h1 className="leaderboard-hero-title">Uptime Leaderboard</h1>
        <p className="leaderboard-hero-subtitle">
          The most reliable websites ranked by uptime. Updated every 5 minutes
          from real monitoring data.
        </p>
      </div>

      <div className="leaderboard-container">
        {entries.length > 0 && (
          <>
            {/* Top 3 podium */}
            <div className="leaderboard-podium">
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
        <div className="leaderboard-badge-section">
          <h2 className="leaderboard-badge-title">Earn a Leaderboard Badge</h2>
          <p className="leaderboard-badge-text">
            Sites ranked in the top 10 can embed a &quot;Top 10 on Uptrue Leaderboard&quot;
            badge on their website. A mark of exceptional reliability.
          </p>
          <div className="leaderboard-badge-preview">
            <div className="leaderboard-embeddable-badge">
              <span className="leaderboard-badge-icon">&#9733;</span>
              <span>Top 10 on Uptrue Leaderboard</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="leaderboard-cta">
          <h2>Want your site on the leaderboard?</h2>
          <p>Start monitoring your uptime for free and climb the rankings.</p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}
