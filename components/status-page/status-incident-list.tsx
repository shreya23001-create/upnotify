'use client'

import type { Incident } from '@/lib/types'

export function StatusIncidentList({ incidents }: { incidents: Incident[] }): React.ReactElement {
  return (
    <>
      {incidents.map(inc => {
        const isResolved = inc.status === 'resolved'
        return (
          <div key={inc.id} className={`sp-incident-card ${isResolved ? 'resolved' : 'active'}`}>
            <div className="sp-incident-header">
              <div className={`sp-incident-icon ${isResolved ? 'ok' : 'warn'}`}>
                {isResolved ? (
                  <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="sp-incident-info">
                <div className="sp-incident-title">{inc.title}</div>
                <div className="sp-incident-meta">
                  {new Date(inc.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {inc.duration_seconds ? ` · ${formatDuration(inc.duration_seconds)}` : ''}
                </div>
              </div>
              <div className="sp-incident-badge-wrap">
                {isResolved ? (
                  <span className="sp-incident-badge-resolved">RESOLVED</span>
                ) : (
                  <span className="sp-incident-badge-active">ONGOING</span>
                )}
              </div>
            </div>

            <div className="sp-incident-body">
              {inc.resolved_at && (
                <div className="sp-incident-update">
                  <div className="sp-incident-timeline">
                    <div className="sp-timeline-dot resolved" />
                    <div className="sp-timeline-line" />
                  </div>
                  <div>
                    <div className="sp-incident-update-time">
                      {new Date(inc.resolved_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                    </div>
                    <div className="sp-incident-update-msg">Services returned to normal operation.</div>
                    <div className="sp-incident-update-status" style={{ color: '#16a34a' }}>Resolved</div>
                  </div>
                </div>
              )}
              <div className="sp-incident-update">
                <div className="sp-incident-timeline">
                  <div className="sp-timeline-dot warn" />
                  <div className="sp-timeline-line" />
                </div>
                <div>
                  <div className="sp-incident-update-time">
                    {new Date(inc.started_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                  </div>
                  <div className="sp-incident-update-msg">Incident detected. Our team began investigating.</div>
                  <div className="sp-incident-update-status" style={{ color: '#d97706' }}>Investigating</div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
