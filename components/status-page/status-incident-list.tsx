'use client'

import type { Incident } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
}

const STATUS_PILL: Record<string, string> = {
  investigating: 'status-pill status-pill-down',
  identified:    'status-pill status-pill-degraded',
  monitoring:    'status-pill status-pill-degraded',
  resolved:      'status-pill status-pill-up',
}

export function StatusIncidentList({ incidents }: { incidents: Incident[] }): React.ReactElement {
  if (incidents.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        No incidents recorded. All systems have been operating normally.
      </div>
    )
  }

  const grouped = groupByDate(incidents)

  return (
    <div className="status-incidents">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="status-incident-group">
          <div className="status-incident-date">{date}</div>
          {items.map(inc => (
            <div key={inc.id} className="status-incident-item">
              <div className="status-incident-header">
                <span className={STATUS_PILL[inc.status] ?? 'status-pill status-pill-paused'}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                  {STATUS_LABEL[inc.status] ?? inc.status}
                </span>
                {inc.severity && (inc.severity === 'P1' || inc.severity === 'P2') && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '2px 8px' }}>
                    {inc.severity === 'P1' ? 'Critical' : 'High'}
                  </span>
                )}
              </div>
              <div className="status-incident-title">{inc.title}</div>
              <div className="status-incident-time">
                Started: {new Date(inc.started_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                {inc.resolved_at && (
                  <> &middot; Resolved: {new Date(inc.resolved_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</>
                )}
                {inc.duration_seconds != null && inc.duration_seconds > 0 && (
                  <> &middot; Duration: {formatDuration(inc.duration_seconds)}</>
                )}
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
    const date = new Date(inc.started_at).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
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
