'use client'

import type { Monitor } from '@/lib/types'

interface Props {
  monitors: Monitor[]
  openIncidents: number
}

export function StatusOverallBanner({ monitors, openIncidents }: Props): React.ReactElement {
  const allUp = monitors.length === 0 || monitors.every(m => m.status === 'up')
  const anyDown = monitors.some(m => m.status === 'down')

  const isDown = anyDown
  const isWarn = !isDown && (openIncidents > 0 || (!allUp && monitors.length > 0))

  const statusClass = isDown ? 'outage' : isWarn ? 'incident' : 'all-up'
  const iconClass = isDown ? 'down' : isWarn ? 'warn' : 'up'
  const message = isDown ? 'Major System Outage'
    : isWarn ? 'Some Systems Experiencing Issues'
    : 'All Systems Operational'
  const subText = isDown ? 'One or more systems are currently down.'
    : isWarn ? 'Some systems may be experiencing degraded performance.'
    : 'No incidents reported recently.'

  const lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  return (
    <div className="sp-hero">
      <div className={`sp-overall-status ${statusClass}`}>
        <div className={`sp-overall-icon ${iconClass}`}>
          {isDown || isWarn ? (
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div>
          <div className="sp-overall-text">{message}</div>
          <div className="sp-overall-sub">{subText}</div>
        </div>
      </div>
      <div className="sp-updated">Last updated: {lastUpdated}</div>
    </div>
  )
}
