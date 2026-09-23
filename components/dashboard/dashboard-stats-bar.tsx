import { Activity, CheckCircle2, XCircle } from 'lucide-react'

interface MonitorStats { total: number; up: number; down: number; degraded: number; paused: number }

export function DashboardStatsBar({ stats }: { stats: MonitorStats }): React.ReactElement {
  const cards = [
    { label: 'Total Monitors', value: stats.total, icon: Activity, tone: 'neutral' as const },
    { label: 'Healthy', value: stats.up, icon: CheckCircle2, tone: 'up' as const },
    { label: 'Down', value: stats.down, icon: XCircle, tone: 'down' as const },
  ]

  return (
    <div className="db-stats-bar">
      {cards.map(c => {
        const Icon = c.icon
        return (
          <div key={c.label} className={`db-stat-card db-stat-card--${c.tone}`}>
            <div className="db-stat-card-icon">
              <Icon size={15} strokeWidth={2.25} />
            </div>
            <div className="db-stat-card-label">{c.label}</div>
            <div className="db-stat-card-value">{c.value}</div>
          </div>
        )
      })}
    </div>
  )
}
