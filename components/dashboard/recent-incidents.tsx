'use client'

import type { Incident } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function IncidentIcon({ status, severity }: { status: string; severity: string }): React.ReactElement {
  const isResolved = status === 'resolved'
  const isWarn = severity === 'P3' || severity === 'P4'
  const variant = isResolved ? 'up' : isWarn ? 'warn' : 'down'

  const icons = {
    down: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    warn: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    ),
    up: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  }

  return <div className={`incident-icon ${variant}`}>{icons[variant]}</div>
}

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  const openCount = incidents.filter(i => i.status !== 'resolved').length

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-title">Recent Incidents</div>
        <div className="db-card-actions">
          {openCount > 0 && (
            <span className="badge badge-down" style={{ fontSize: 10 }}>{openCount} open</span>
          )}
          <a href="/dashboard/incidents" className="btn btn-ghost btn-sm">View all</a>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No incidents recorded yet — all systems clear.</div>
        </div>
      ) : (
        incidents.map(incident => (
          <div key={incident.id} className="incident-item" style={incident.status === 'resolved' ? { opacity: 0.6 } : undefined}>
            <IncidentIcon status={incident.status} severity={incident.severity} />
            <div style={{ flex: 1 }}>
              <div className="incident-name">{incident.title}</div>
              <div className="incident-detail">
                {incident.root_cause ?? incident.severity}
                {incident.duration_seconds && incident.status === 'resolved'
                  ? ` · resolved in ${Math.round(incident.duration_seconds / 60)}m`
                  : ''}
              </div>
              <div style={{ marginTop: 4 }}>
                <span
                  className={`badge ${incident.status === 'resolved' ? 'badge-outline' : incident.severity === 'P1' || incident.severity === 'P2' ? 'badge-down' : 'badge-warn'}`}
                  style={{ fontSize: 10 }}
                >
                  {incident.status === 'resolved' ? 'Resolved' : `Open · ${timeAgo(incident.started_at)}`}
                </span>
              </div>
            </div>
            <div className="incident-time">{formatTime(incident.started_at)}</div>
          </div>
        ))
      )}
    </div>
  )
}
