'use client'

interface StatsCardsProps {
  stats: { total: number; up: number; down: number; degraded: number; paused: number }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <div className="card stat-card stat-card-blue">
        <div className="card-content-compact">
          <div className="stat-label">Total Monitors</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>
      <div className="card stat-card stat-card-green">
        <div className="card-content-compact">
          <div className="stat-label"><span className="status-dot status-dot-up" /> Healthy</div>
          <div className="stat-value stat-value-green">{stats.up}</div>
        </div>
      </div>
      <div className="card stat-card stat-card-red">
        <div className="card-content-compact">
          <div className="stat-label"><span className="status-dot status-dot-down" /> Down</div>
          <div className="stat-value stat-value-red">{stats.down}</div>
        </div>
      </div>
      <div className="card stat-card stat-card-yellow">
        <div className="card-content-compact">
          <div className="stat-label"><span className="status-dot status-dot-degraded" /> Degraded</div>
          <div className="stat-value stat-value-yellow">{stats.degraded}</div>
        </div>
      </div>
    </div>
  )
}
