'use client'

interface ReportData {
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  totalChecks: number
  meanResolutionMinutes: number
  previousMonthUptime: number | null
}

export function ReportStats({ data }: { data: ReportData }) {
  const uptimeChange = data.previousMonthUptime != null
    ? Math.round((data.overallUptime - data.previousMonthUptime) * 100) / 100
    : null

  return (
    <div className="stats-grid" style={{ marginBottom: 24 }}>
      <div className="card stat-card stat-card-green">
        <div className="card-content-compact">
          <div className="stat-label">Overall Uptime</div>
          <div className="stat-value" style={{ color: data.overallUptime >= 99.9 ? '#059669' : data.overallUptime >= 99 ? '#d97706' : '#dc2626' }}>
            {data.overallUptime}%
          </div>
          {uptimeChange != null && (
            <div style={{ fontSize: 13, color: uptimeChange >= 0 ? '#059669' : '#dc2626', marginTop: 4 }}>
              {uptimeChange >= 0 ? '\u2191' : '\u2193'} {Math.abs(uptimeChange)}% vs last month
            </div>
          )}
        </div>
      </div>
      <div className="card stat-card stat-card-blue">
        <div className="card-content-compact">
          <div className="stat-label">Monitors</div>
          <div className="stat-value">{data.totalMonitors}</div>
        </div>
      </div>
      <div className="card stat-card stat-card-red">
        <div className="card-content-compact">
          <div className="stat-label">Incidents</div>
          <div className="stat-value stat-value-red">{data.totalIncidents}</div>
        </div>
      </div>
      <div className="card stat-card stat-card-yellow">
        <div className="card-content-compact">
          <div className="stat-label">Avg Resolution</div>
          <div className="stat-value">{data.meanResolutionMinutes}m</div>
        </div>
      </div>
    </div>
  )
}
