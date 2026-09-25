import { Globe, Activity, PauseCircle, AlertTriangle } from 'lucide-react'

interface Props {
  websites: number
  active: number
  paused: number
  issues: number
}

export function MonitorStatsBar({ websites, active, paused, issues }: Props): React.ReactElement {
  const stats = [
    { label: 'Total Websites', value: websites, icon: Globe, tone: 'neutral' as const },
    { label: 'Active', value: active, icon: Activity, tone: 'up' as const },
    { label: 'Paused', value: paused, icon: PauseCircle, tone: 'paused' as const },
    { label: 'Issues Detected', value: issues, icon: AlertTriangle, tone: 'down' as const },
  ]

  return (
    <div className="mon-stats-bar">
      {stats.map(s => {
        const Icon = s.icon
        return (
          <div key={s.label} className={`mon-stat-card mon-stat-card--${s.tone}`}>
            <div className="mon-stat-icon">
              <Icon size={15} strokeWidth={2.25} />
            </div>
            <div className="mon-stat-body">
              <div className="mon-stat-value">{s.value}</div>
              <div className="mon-stat-label">{s.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
