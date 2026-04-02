'use client'

import { LineChart } from '@/components/ui/line-chart'
import { DonutChart } from '@/components/ui/donut-chart'
import { BarChart } from '@/components/ui/bar-chart'
import { IconTrendingUp, IconActivity, IconPieChart, IconBarChart } from '@/components/icons'

interface MonitorStats {
  total: number
  up: number
  down: number
  degraded: number
  paused: number
}

interface IncidentLike {
  severity?: string | null
  created_at?: string | null
}

interface DashboardChartsProps {
  stats: MonitorStats
  incidents: IncidentLike[]
}

/** Generate demo uptime data for the last 30 days */
function generateUptimeData(): { label: string; value: number }[] {
  const data: { label: string; value: number }[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const label = `${date.getDate()}/${date.getMonth() + 1}`
    /* Simulate realistic uptime: 98.5% to 100% range */
    const value = 98.5 + Math.random() * 1.5
    data.push({ label, value: Math.round(value * 100) / 100 })
  }
  return data
}

/** Generate demo response time data for the last 30 days */
function generateResponseTimeData(): { label: string; value: number }[] {
  const data: { label: string; value: number }[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const label = `${date.getDate()}/${date.getMonth() + 1}`
    /* Simulate realistic response times: 120ms to 350ms */
    const value = 120 + Math.random() * 230
    data.push({ label, value: Math.round(value) })
  }
  return data
}

/** Count incidents by severity */
function countIncidentsBySeverity(incidents: IncidentLike[]): { p1: number; p2: number; p3: number; p4: number } {
  const counts = { p1: 0, p2: 0, p3: 0, p4: 0 }
  for (const incident of incidents) {
    const sev = (incident.severity ?? 'p3').toLowerCase()
    if (sev === 'p1') counts.p1++
    else if (sev === 'p2') counts.p2++
    else if (sev === 'p3') counts.p3++
    else counts.p4++
  }
  return counts
}

export function DashboardCharts({ stats, incidents }: DashboardChartsProps): React.ReactElement {
  const uptimeData = generateUptimeData()
  const responseTimeData = generateResponseTimeData()
  const incidentCounts = countIncidentsBySeverity(incidents)

  const donutSegments = [
    { label: 'P1 — Critical', value: incidentCounts.p1, color: '#ef4444' },
    { label: 'P2 — Major', value: incidentCounts.p2, color: '#f59e0b' },
    { label: 'P3 — Minor', value: incidentCounts.p3, color: '#3b82f6' },
    { label: 'P4 — Low', value: incidentCounts.p4, color: '#94a3b8' },
  ]

  const statusBars = [
    { label: 'Up', value: stats.up, color: '#22c55e' },
    { label: 'Down', value: stats.down, color: '#ef4444' },
    { label: 'Degraded', value: stats.degraded, color: '#f59e0b' },
    { label: 'Paused', value: stats.paused, color: '#94a3b8' },
  ]

  return (
    <div className="dashboard-charts">
      {/* Row 1: Line charts */}
      <div className="charts-grid-2">
        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">
              <IconTrendingUp size={18} />
              <span>Uptime Overview</span>
            </div>
            <span className="chart-card-period">Last 30 days</span>
          </div>
          <div className="chart-card-body">
            <LineChart
              data={uptimeData}
              color="#22c55e"
              gradientId="uptimeGrad"
              yLabel="%"
              yMin={97}
              yMax={100}
              formatValue={(v: number): string => `${v.toFixed(1)}%`}
            />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">
              <IconActivity size={18} />
              <span>Response Time</span>
            </div>
            <span className="chart-card-period">Last 30 days</span>
          </div>
          <div className="chart-card-body">
            <LineChart
              data={responseTimeData}
              color="#3b82f6"
              gradientId="responseGrad"
              yLabel="ms"
              formatValue={(v: number): string => `${Math.round(v)}ms`}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Donut + Bar */}
      <div className="charts-grid-2">
        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">
              <IconPieChart size={18} />
              <span>Incidents by Severity</span>
            </div>
          </div>
          <div className="chart-card-body chart-card-body-centered">
            <DonutChart segments={donutSegments} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">
              <IconBarChart size={18} />
              <span>Monitor Status</span>
            </div>
          </div>
          <div className="chart-card-body">
            <BarChart bars={statusBars} maxValue={stats.total || undefined} />
          </div>
        </div>
      </div>
    </div>
  )
}
