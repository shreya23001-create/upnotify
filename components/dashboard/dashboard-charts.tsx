'use client'

import Link from 'next/link'
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

interface CheckResultLike {
  status: string
  response_time_ms?: number | null
  checked_at: string
}

interface DashboardChartsProps {
  stats: MonitorStats
  incidents: IncidentLike[]
  checkResults?: CheckResultLike[]
}

/** Group check results by day and calculate daily uptime % */
function calculateDailyUptime(results: CheckResultLike[]): { label: string; value: number }[] {
  if (results.length === 0) return []

  const dayMap: Record<string, { total: number; up: number }> = {}

  for (const r of results) {
    const date = new Date(r.checked_at)
    const key = `${date.getDate()}/${date.getMonth() + 1}`
    if (!dayMap[key]) dayMap[key] = { total: 0, up: 0 }
    dayMap[key].total++
    if (r.status === 'up') dayMap[key].up++
  }

  return Object.entries(dayMap).map(([label, counts]) => ({
    label,
    value: Math.round((counts.up / counts.total) * 10000) / 100,
  }))
}

/** Group check results by day and calculate avg response time */
function calculateDailyResponseTime(results: CheckResultLike[]): { label: string; value: number }[] {
  if (results.length === 0) return []

  const dayMap: Record<string, { total: number; sum: number }> = {}

  for (const r of results) {
    if (!r.response_time_ms) continue
    const date = new Date(r.checked_at)
    const key = `${date.getDate()}/${date.getMonth() + 1}`
    if (!dayMap[key]) dayMap[key] = { total: 0, sum: 0 }
    dayMap[key].total++
    dayMap[key].sum += r.response_time_ms
  }

  return Object.entries(dayMap).map(([label, counts]) => ({
    label,
    value: Math.round(counts.sum / counts.total),
  }))
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

function EmptyChartState({ title, message, cta, href }: {
  title: string
  message: string
  cta: string
  href: string
}): React.ReactElement {
  return (
    <div className="chart-empty-state">
      <div className="chart-empty-icon">📊</div>
      <h4 className="chart-empty-title">{title}</h4>
      <p className="chart-empty-message">{message}</p>
      <Link href={href} className="btn btn-primary btn-sm">{cta}</Link>
    </div>
  )
}

export function DashboardCharts({ stats, incidents, checkResults = [] }: DashboardChartsProps): React.ReactElement {
  const hasMonitors = stats.total > 0
  const hasCheckData = checkResults.length > 0
  const hasIncidents = incidents.length > 0

  const uptimeData = hasCheckData ? calculateDailyUptime(checkResults) : []
  const responseTimeData = hasCheckData ? calculateDailyResponseTime(checkResults) : []
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
            {hasCheckData && <span className="chart-card-period">Last 30 days</span>}
          </div>
          <div className="chart-card-body">
            {hasCheckData && uptimeData.length > 0 ? (
              <LineChart
                data={uptimeData}
                color="#22c55e"
                gradientId="uptimeGrad"
                yLabel="%"
                yMin={97}
                yMax={100}
                formatValue={(v: number): string => `${v.toFixed(1)}%`}
              />
            ) : (
              <EmptyChartState
                title="No uptime data yet"
                message="Add a monitor and we'll start tracking uptime. Your first chart will appear within minutes."
                cta="Add Your First Monitor"
                href="/dashboard/monitors/new"
              />
            )}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">
              <IconActivity size={18} />
              <span>Response Time</span>
            </div>
            {hasCheckData && <span className="chart-card-period">Last 30 days</span>}
          </div>
          <div className="chart-card-body">
            {hasCheckData && responseTimeData.length > 0 ? (
              <LineChart
                data={responseTimeData}
                color="#3b82f6"
                gradientId="responseGrad"
                yLabel="ms"
                formatValue={(v: number): string => `${Math.round(v)}ms`}
              />
            ) : (
              <EmptyChartState
                title="No response time data yet"
                message="Once your monitors run their first checks, response time trends will show up here."
                cta="Add a Monitor"
                href="/dashboard/monitors/new"
              />
            )}
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
            {hasIncidents ? (
              <DonutChart segments={donutSegments} />
            ) : (
              <EmptyChartState
                title="No incidents recorded"
                message="Good news — no downtime detected yet. When incidents occur, you'll see the severity breakdown here."
                cta="Set Up Alert Channels"
                href="/dashboard/alerts/new"
              />
            )}
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
            {hasMonitors ? (
              <BarChart bars={statusBars} maxValue={stats.total || undefined} />
            ) : (
              <EmptyChartState
                title="No monitors yet"
                message="Your monitor health overview will appear here once you start monitoring. It takes 30 seconds to set up."
                cta="Create Your First Monitor"
                href="/dashboard/monitors/new"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
