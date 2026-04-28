'use client'

import type { Incident } from '@/lib/types'

export function StatusIncidentList({ incidents }: { incidents: Incident[] }): React.ReactElement {
  return (
    <>
      {incidents.map(inc => (
        <div key={inc.id} className="sp-incident-card" style={{ margin: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          <div className="sp-incident-header" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
            <svg width="14" height="14" fill="none" stroke="#92400e" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="sp-incident-title">{inc.title}</div>
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>
                {fmtDate(inc.started_at)}
                {inc.status === 'resolved' ? ' · Resolved' : ''}
                {inc.duration_seconds ? ` · Duration: ${formatDuration(inc.duration_seconds)}` : ''}
              </div>
            </div>
            {inc.status === 'resolved' && (
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700, background: 'var(--color-up-bg)', color: 'var(--color-up)', border: '1px solid var(--color-up-border)' }}>
                  RESOLVED
                </span>
              </div>
            )}
          </div>
          <div className="sp-incident-body">
            {inc.resolved_at && (
              <div className="sp-incident-update">
                <div className="sp-incident-timeline">
                  <div className="sp-timeline-dot" style={{ background: 'var(--color-up)' }} />
                  <div className="sp-timeline-line" />
                </div>
                <div>
                  <div className="sp-incident-update-time">
                    {fmtDateTime(inc.resolved_at)}
                  </div>
                  <div className="sp-incident-update-msg">Services returned to normal operation.</div>
                  <div className="sp-incident-update-status" style={{ color: 'var(--color-up)' }}>Status: Resolved</div>
                </div>
              </div>
            )}
            <div className="sp-incident-update">
              <div className="sp-incident-timeline">
                <div className="sp-timeline-dot" />
                <div className="sp-timeline-line" />
              </div>
              <div>
                <div className="sp-incident-update-time">
                  {fmtDateTime(inc.started_at)}
                </div>
                <div className="sp-incident-update-msg">Incident detected. Our team began investigating.</div>
                <div className="sp-incident-update-status" style={{ color: 'var(--color-warn)' }}>Status: Investigating</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h}:${m} UTC`
}
