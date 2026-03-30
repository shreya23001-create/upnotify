'use client'

interface StatsCardsProps {
  stats: { total: number; up: number; down: number; degraded: number; paused: number }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <div className="card">
        <div className="card-content-compact">
          <div className="stat-label">Total Monitors</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-content-compact">
          <div className="stat-label">Healthy</div>
          <div className="stat-value stat-value-green">{stats.up}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-content-compact">
          <div className="stat-label">Down</div>
          <div className="stat-value stat-value-red">{stats.down}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-content-compact">
          <div className="stat-label">Degraded</div>
          <div className="stat-value stat-value-yellow">{stats.degraded}</div>
        </div>
      </div>
    </div>
  )
}
