'use client'

import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'

interface MonitorMetric {
  monitorId: string; name: string; type: string; target: string;
  uptimePercent: number; avgResponseMs: number; minResponseMs: number;
  maxResponseMs: number; totalChecks: number; incidentCount: number; status: string
}

export function ReportMonitorBreakdown({ monitors }: { monitors: MonitorMetric[] }) {
  if (monitors.length === 0) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Per-Monitor Breakdown</div>
      </div>
      <div className="card-content">
        <table className="table report-breakdown-table">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Monitor</th>
              <th>Uptime</th>
              <th>Avg Response</th>
              <th>Min/Max</th>
              <th>Checks</th>
              <th>Incidents</th>
            </tr>
          </thead>
          <tbody>
            {monitors.map(m => (
              <tr key={m.monitorId}>
                <td>
                  <span className="report-breakdown-monitor">
                    <MonitorTypeIcon type={m.type} iconOnly iconSize={14} />
                    <span className="report-breakdown-monitor-name">{m.name}</span>
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: m.uptimePercent >= 99.9 ? '#059669' : m.uptimePercent >= 99 ? '#d97706' : '#dc2626' }}>
                    {m.uptimePercent}%
                  </span>
                </td>
                <td className="table-muted">{m.avgResponseMs}ms</td>
                <td className="table-muted">{m.minResponseMs}/{m.maxResponseMs}ms</td>
                <td className="table-muted">{m.totalChecks}</td>
                <td>
                  {m.incidentCount > 0 ? (
                    <span className="badge badge-danger">{m.incidentCount}</span>
                  ) : (
                    <span className="badge badge-success">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
