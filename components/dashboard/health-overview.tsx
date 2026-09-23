'use client'

import { LineChart } from '@/components/ui/line-chart'

interface MonitorStats { total: number; up: number; down: number; degraded: number; paused: number }

interface TrendPoint { label: string; date: Date; avg: number }

interface HealthOverviewProps {
  stats: MonitorStats
  trend: TrendPoint[]
}

function trendColor(avg: number): string {
  if (avg < 500) return 'var(--color-up)'
  if (avg < 1500) return 'var(--color-warn)'
  return 'var(--color-down)'
}

export function HealthOverview({ stats, trend }: HealthOverviewProps): React.ReactElement {
  const uptimePct = stats.total > 0 ? (stats.up / stats.total) * 100 : 100
  const latest = trend.length > 0 ? trend[trend.length - 1].avg : null
  const overallState: 'up' | 'warn' | 'down' = stats.down > 0 ? 'down' : stats.degraded > 0 ? 'warn' : 'up'

  const statusItems: Array<{ key: string; label: string; count: number; color: string }> = [
    { key: 'up', label: 'Operational', count: stats.up, color: 'var(--color-up)' },
    { key: 'degraded', label: 'Degraded', count: stats.degraded, color: 'var(--color-warn)' },
    { key: 'down', label: 'Down', count: stats.down, color: 'var(--color-down)' },
  ]
  if (stats.paused > 0) {
    statusItems.push({ key: 'paused', label: 'Paused', count: stats.paused, color: 'var(--text-muted)' })
  }

  return (
    <div className="health-overview">
      <div className="health-overview-primary">
        <div className="health-overview-label">Monitoring Health</div>
        <div className="health-overview-metric">
          <span className={`health-overview-pct health-overview-pct-${overallState}`}>{uptimePct.toFixed(1)}%</span>
          <span className="health-overview-metric-sub">Overall uptime</span>
        </div>

        <div className="health-overview-status-row">
          {statusItems.map(item => (
            <div key={item.key} className="health-status-chip">
              <span className="health-status-dot" style={{ background: item.color }} />
              <span className="health-status-count">{item.count}</span>
              <span className="health-status-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="health-overview-trend">
        <div className="health-overview-trend-header">
          <span className="health-overview-trend-title">Response time</span>
          {latest !== null && (
            <span className="health-overview-trend-value" style={{ color: trendColor(latest) }}>{latest}ms</span>
          )}
        </div>
        {trend.length > 0 ? (
          <LineChart
            data={trend.map(t => ({ label: t.label, value: t.avg }))}
            color={latest !== null ? trendColor(latest) : 'var(--brand-blue)'}
            gradientId="health-trend-gradient"
            yLabel="ms"
            formatValue={(v) => `${Math.round(v)}`}
            height={140}
          />
        ) : (
          <div className="health-overview-trend-empty">No response time data yet</div>
        )}
      </div>
    </div>
  )
}
