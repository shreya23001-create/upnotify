'use client'

import type { Monitor } from '@/lib/types'

interface Props {
  monitors: Monitor[]
  openIncidents: number
}

export function StatusOverallBanner({ monitors, openIncidents }: Props): React.ReactElement {
  const allUp = monitors.every(m => m.status === 'up')
  const anyDown = monitors.some(m => m.status === 'down')

  let bannerClass = 'status-banner-up'
  let message = 'All Systems Operational'

  if (anyDown) {
    bannerClass = 'status-banner-down'
    message = 'Major System Outage'
  } else if (openIncidents > 0) {
    bannerClass = 'status-banner-degraded'
    message = 'Some Systems Experiencing Issues'
  } else if (!allUp && monitors.length > 0) {
    bannerClass = 'status-banner-degraded'
    message = 'Partial System Degradation'
  }

  return (
    <div className={`status-banner ${bannerClass}`}>
      <span className="status-banner-dot" />
      {message}
    </div>
  )
}
