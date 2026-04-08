'use client'

interface StatsCardsProps {
  stats: { total: number; up: number; down: number; degraded: number; paused: number }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const healthPct = stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 0

  return (
    <div className="db-stats">
      <div className="db-stat-card all">
        <div className="db-stat-icon all">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div className="db-stat-label">Total Monitors</div>
        <div className="db-stat-value">{stats.total}</div>
        <div className="db-stat-delta">{stats.paused > 0 ? `${stats.paused} paused` : 'All active'}</div>
      </div>

      <div className="db-stat-card up">
        <div className="db-stat-icon up">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div className="db-stat-label">Healthy</div>
        <div className="db-stat-value db-stat-value-up">{stats.up}</div>
        <div className="db-stat-delta">{healthPct}% of monitors</div>
      </div>

      <div className="db-stat-card down">
        <div className="db-stat-icon down">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div className="db-stat-label">Down</div>
        <div className="db-stat-value db-stat-value-down">{stats.down}</div>
        <div className="db-stat-delta">{stats.down === 0 ? 'All systems clear' : 'Needs attention'}</div>
      </div>

      <div className="db-stat-card warn">
        <div className="db-stat-icon warn">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div className="db-stat-label">Degraded</div>
        <div className="db-stat-value db-stat-value-warn">{stats.degraded}</div>
        <div className="db-stat-delta">{stats.degraded === 0 ? 'Performance normal' : 'Slow responses'}</div>
      </div>
    </div>
  )
}
