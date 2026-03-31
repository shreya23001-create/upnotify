'use client'

import type { Incident } from '@/lib/types'

export function StatusIncidentList({ incidents }: { incidents: Incident[] }): React.ReactElement {
  const grouped = groupByDate(incidents)

  return (
    <div className="status-incidents">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="status-incident-group">
          <div className="status-incident-date">{date}</div>
          {items.map(inc => (
            <div key={inc.id} className="status-incident-item">
              <div className="status-incident-header">
                <span className={`badge ${inc.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
                  {inc.status}
                </span>
                <span className={`badge ${inc.severity === 'P1' || inc.severity === 'P2' ? 'badge-danger' : 'badge-muted'}`}>
                  {inc.severity}
                </span>
              </div>
              <div className="status-incident-title">{inc.title}</div>
              <div className="status-incident-time">
                {new Date(inc.started_at).toLocaleTimeString()}
                {inc.resolved_at && ` — Resolved at ${new Date(inc.resolved_at).toLocaleTimeString()}`}
                {inc.duration_seconds != null && ` (${formatDuration(inc.duration_seconds)})`}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function groupByDate(incidents: Incident[]): Record<string, Incident[]> {
  const groups: Record<string, Incident[]> = {}
  for (const inc of incidents) {
    const date = new Date(inc.started_at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!groups[date]) groups[date] = []
    groups[date].push(inc)
  }
  return groups
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
