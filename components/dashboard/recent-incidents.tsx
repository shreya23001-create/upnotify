'use client'

import type { Incident } from '@/lib/types'

const severityClass: Record<string, string> = {
  P1: 'badge-danger', P2: 'badge-danger', P3: 'badge-muted', P4: 'badge-outline',
}

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Recent Incidents</div></div>
      <div className="card-content">
        {incidents.length === 0 ? (
          <p style={{ fontSize: 14, color: '#71717a' }}>No incidents recorded yet.</p>
        ) : (
          <div className="space-y-sm">
            {incidents.map((incident) => (
              <div key={incident.id} className="incident-row">
                <div className="incident-row-info">
                  <span className="incident-row-title">{incident.title}</span>
                  <span className="incident-row-time">{new Date(incident.started_at).toLocaleString()}</span>
                </div>
                <div className="incident-row-badges">
                  <span className={`badge ${severityClass[incident.severity] ?? 'badge-muted'}`}>{incident.severity}</span>
                  <span className={`badge ${incident.status === 'resolved' ? 'badge-outline' : 'badge-muted'}`}>{incident.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
