'use client'

import Link from 'next/link'
import { ReportStats } from './report-stats'
import { ReportAiSummary } from './report-ai-summary'
import { ReportMonitorBreakdown } from './report-monitor-breakdown'
import type { Report } from '@/lib/types'

interface ReportData {
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  totalChecks: number
  meanResolutionMinutes: number
  monitors: Array<{
    monitorId: string; name: string; type: string; target: string;
    uptimePercent: number; avgResponseMs: number; minResponseMs: number;
    maxResponseMs: number; totalChecks: number; incidentCount: number; status: string
  }>
  previousMonthUptime: number | null
}

export function ReportViewer({ report }: { report: Report }) {
  const data = report.data as unknown as ReportData

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="badge badge-muted" style={{ textTransform: 'capitalize', marginRight: 12, fontSize: 13 }}>
              {report.type.replace('_', ' ')}
            </span>
            Report
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            {report.period_start} — {report.period_end} · Generated {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <Link href="/dashboard/reports" className="btn btn-secondary">Back to Reports</Link>
      </div>

      <ReportStats data={data} />

      {report.ai_summary && <ReportAiSummary summary={report.ai_summary} />}

      <ReportMonitorBreakdown monitors={data.monitors || []} />
    </div>
  )
}
