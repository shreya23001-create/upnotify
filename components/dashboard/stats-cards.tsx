'use client'

interface StatsCardsProps {
  stats: { total: number; up: number; down: number; degraded: number; paused: number }
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  )
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <div className="card stat-card stat-card-blue">
        <div className="card-content-compact">
          <div className="stat-icon stat-icon-blue"><ActivityIcon /></div>
          <div className="stat-label">Total Monitors</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-delta">{stats.paused} paused</div>
        </div>
      </div>

      <div className="card stat-card stat-card-green">
        <div className="card-content-compact">
          <div className="stat-icon stat-icon-green"><CheckIcon /></div>
          <div className="stat-label">Healthy</div>
          <div className="stat-value stat-value-green">{stats.up}</div>
          <div className="stat-delta">
            {stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 0}% of total
          </div>
        </div>
      </div>

      <div className="card stat-card stat-card-red">
        <div className="card-content-compact">
          <div className="stat-icon stat-icon-red"><AlertIcon /></div>
          <div className="stat-label">Down</div>
          <div className="stat-value stat-value-red">{stats.down}</div>
          <div className="stat-delta">{stats.down === 0 ? 'All systems clear' : 'Needs attention'}</div>
        </div>
      </div>

      <div className="card stat-card stat-card-yellow">
        <div className="card-content-compact">
          <div className="stat-icon stat-icon-yellow"><WarnIcon /></div>
          <div className="stat-label">Degraded</div>
          <div className="stat-value stat-value-yellow">{stats.degraded}</div>
          <div className="stat-delta">{stats.degraded === 0 ? 'Performance normal' : 'Slow responses'}</div>
        </div>
      </div>
    </div>
  )
}
