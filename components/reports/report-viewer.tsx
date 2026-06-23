'use client'

import Link from 'next/link'
import { ReportStats } from './report-stats'
import { ReportAiSummary } from './report-ai-summary'
import { ReportMonitorBreakdown } from './report-monitor-breakdown'
import { ReportPrintWrapper } from './report-print-wrapper'
import { ReportSiteHealth } from './report-site-health'
import { ReportSecurityAudit } from './report-security-audit'
import { ReportAvailabilitySummary } from './report-availability-summary'
import { ReportChangeDigest } from './report-change-digest'
import { ReportResponseTrend } from './report-response-trend'
import type { Report } from '@/lib/types'
import type { ReportType } from '@/lib/services/reports'

interface MonitorData {
  monitorId: string
  name: string
  type: string
  target: string
  uptimePercent: number
  avgResponseMs: number
  minResponseMs: number
  maxResponseMs: number
  totalChecks: number
  incidentCount: number
  status: string
}

interface ReportData {
  reportType?: ReportType
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  totalChecks: number
  meanResolutionMinutes: number
  monitors: MonitorData[]
  previousMonthUptime: number | null
  domainGroups?: unknown[]
  securityScore?: number
  securityMonitors?: unknown[]
  changes?: unknown[]
  monitorTrends?: unknown[]
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  uptime: 'Uptime Report',
  performance: 'Performance Report',
  incident: 'Incident Report',
  sla: 'SLA Compliance Report',
  'site-health': 'Site Health Report',
  'security-audit': 'Security Audit Report',
  'availability-summary': 'Availability Summary',
  'change-digest': 'Change Detection Digest',
  'response-trend': 'Response Time Trends',
}

export function ReportViewer({ report, hasWhiteLabel = false }: { report: Report; hasWhiteLabel?: boolean }): React.ReactElement {
  const data = report.data as unknown as ReportData
  const reportType = data.reportType ?? 'uptime'
  const typeLabel = REPORT_TYPE_LABELS[reportType] ?? 'Report'
  const period = `${report.period_start} — ${report.period_end}`

  return (
    <div>
      {/* Non-printable nav header */}
      <div className="no-print page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">
            <span className="badge badge-muted" style={{ textTransform: 'capitalize', marginRight: 12, fontSize: 13 }}>
              {report.type.replace('_', ' ')}
            </span>
            {typeLabel}
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            {period} · Generated {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <Link href="/dashboard/reports" className="btn btn-secondary">← Back to Reports</Link>
      </div>

      {/* Printable A4 content */}
      <ReportPrintWrapper title={typeLabel} period={period} generatedAt={report.generated_at} hasWhiteLabel={hasWhiteLabel}>

        <ReportStats data={data} />

        {report.ai_summary && <ReportAiSummary summary={report.ai_summary} />}

        {/* ── Original 4 report types ── */}

        {reportType === 'uptime' && (
          <ReportMonitorBreakdown monitors={data.monitors || []} />
        )}

        {reportType === 'performance' && (
          <div className="report-section">
            <h2 className="report-section-title">Performance Breakdown</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>Avg Response</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Checks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.monitors || []).sort((a, b) => b.avgResponseMs - a.avgResponseMs).map((m) => (
                  <tr key={m.monitorId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.type} · {m.target}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: m.avgResponseMs > 1000 ? '#ef4444' : m.avgResponseMs > 500 ? '#f59e0b' : '#10b981' }}>
                      {m.avgResponseMs}ms
                    </td>
                    <td>{m.minResponseMs}ms</td>
                    <td>{m.maxResponseMs}ms</td>
                    <td>{m.totalChecks.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${m.status === 'up' ? 'badge-success' : 'badge-danger'}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'incident' && (
          <div className="report-section">
            <h2 className="report-section-title">Incident Summary</h2>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div className="report-stat-box">
                <span className="report-stat-value">{data.totalIncidents}</span>
                <span className="report-stat-label">Total Incidents</span>
              </div>
              <div className="report-stat-box">
                <span className="report-stat-value">{data.meanResolutionMinutes}min</span>
                <span className="report-stat-label">Mean Resolution Time</span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Monitor</th><th>Type</th><th>Incidents</th><th>Uptime</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(data.monitors || []).filter(m => m.incidentCount > 0).sort((a, b) => b.incidentCount - a.incidentCount).map(m => (
                  <tr key={m.monitorId}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td>{m.type}</td>
                    <td style={{ fontWeight: 600, color: '#ef4444' }}>{m.incidentCount}</td>
                    <td>{m.uptimePercent}%</td>
                    <td><span className={`badge ${m.status === 'up' ? 'badge-success' : 'badge-danger'}`}>{m.status}</span></td>
                  </tr>
                ))}
                {(data.monitors || []).filter(m => m.incidentCount > 0).length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No incidents recorded during this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'sla' && (
          <div className="report-section">
            <h2 className="report-section-title">SLA Compliance</h2>
            <table className="data-table">
              <thead>
                <tr><th>Monitor</th><th>Uptime</th><th>SLA Target</th><th>Status</th><th>Incidents</th></tr>
              </thead>
              <tbody>
                {(data.monitors || []).map(m => {
                  const compliant = m.uptimePercent >= 99.9
                  return (
                    <tr key={m.monitorId}>
                      <td><div style={{ fontWeight: 500 }}>{m.name}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{m.type}</div></td>
                      <td style={{ fontWeight: 600, color: compliant ? '#10b981' : '#ef4444' }}>{m.uptimePercent}%</td>
                      <td>99.9%</td>
                      <td><span className={`badge ${compliant ? 'badge-success' : 'badge-danger'}`}>{compliant ? 'Compliant' : 'Breached'}</span></td>
                      <td>{m.incidentCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-muted)', borderRadius: 10, fontSize: 14 }}>
              <strong>Overall SLA Status: </strong>
              {data.overallUptime >= 99.9
                ? <span style={{ color: '#10b981', fontWeight: 600 }}>Compliant ({data.overallUptime}% vs 99.9% target)</span>
                : <span style={{ color: '#ef4444', fontWeight: 600 }}>Breached ({data.overallUptime}% vs 99.9% target)</span>
              }
            </div>
          </div>
        )}

        {/* ── 5 new report types ── */}

        {reportType === 'site-health' && (
          <ReportSiteHealth data={data as Parameters<typeof ReportSiteHealth>[0]['data']} />
        )}

        {reportType === 'security-audit' && (
          <ReportSecurityAudit data={data as Parameters<typeof ReportSecurityAudit>[0]['data']} />
        )}

        {reportType === 'availability-summary' && (
          <ReportAvailabilitySummary data={data as Parameters<typeof ReportAvailabilitySummary>[0]['data']} />
        )}

        {reportType === 'change-digest' && (
          <ReportChangeDigest data={data as Parameters<typeof ReportChangeDigest>[0]['data']} />
        )}

        {reportType === 'response-trend' && (
          <ReportResponseTrend data={data as Parameters<typeof ReportResponseTrend>[0]['data']} />
        )}

      </ReportPrintWrapper>
    </div>
  )
}
