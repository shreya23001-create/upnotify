'use client'

import { useState, useEffect } from 'react'
import type { Monitor } from '@/lib/types'

interface Props {
  monitors: Monitor[]
  openIncidents: number
  name: string
  logoUrl: string | null
}

export function StatusOverallBanner({ monitors, openIncidents, name, logoUrl }: Props): React.ReactElement {
  const allUp   = monitors.length === 0 || monitors.every(m => m.status === 'up')
  const anyDown = monitors.some(m => m.status === 'down')
  const isDown  = anyDown
  const isWarn  = !isDown && (openIncidents > 0 || (!allUp && monitors.length > 0))

  const heroClass = isDown ? 'outage' : isWarn ? 'incident' : 'all-up'
  const iconClass = isDown ? 'down'   : isWarn ? 'warn'     : 'up'

  const message = isDown ? 'Major System Outage'
    : isWarn ? 'Some Systems Experiencing Issues'
    : 'All Systems Operational'
  const subText = isDown ? 'One or more services are currently down.'
    : isWarn ? 'Some services may be experiencing degraded performance.'
    : 'All services are running normally.'

  const [lastUpdated, setLastUpdated] = useState<string>('')
  useEffect(() => {
    setLastUpdated(new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    }))
  }, [])

  const upCount   = monitors.filter(m => m.status === 'up').length
  const downCount = monitors.filter(m => m.status === 'down').length
  const warnCount = monitors.filter(m => m.status === 'degraded').length

  return (
    <div className={`sp-hero ${heroClass}`}>
      {/* Logo + name */}
      <div className="sp-hero-brand">
        <div className="sp-hero-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>
        <h1 className="sp-hero-title">{name}</h1>
      </div>

      {/* Main status badge */}
      <div className={`sp-hero-badge ${heroClass}`}>
        <div className={`sp-hero-badge-icon ${iconClass}`}>
          {isDown || isWarn ? (
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div className="sp-hero-badge-body">
          <div className="sp-hero-badge-msg">{message}</div>
          <div className="sp-hero-badge-sub">{subText}</div>
        </div>
      </div>

      {/* Monitor counts strip */}
      {monitors.length > 0 && (
        <div className="sp-hero-stats">
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-num sp-hero-stat-up">{upCount}</span>
            <span className="sp-hero-stat-label">Operational</span>
          </div>
          {warnCount > 0 && (
            <div className="sp-hero-stat">
              <span className="sp-hero-stat-num sp-hero-stat-warn">{warnCount}</span>
              <span className="sp-hero-stat-label">Degraded</span>
            </div>
          )}
          {downCount > 0 && (
            <div className="sp-hero-stat">
              <span className="sp-hero-stat-num sp-hero-stat-down">{downCount}</span>
              <span className="sp-hero-stat-label">Down</span>
            </div>
          )}
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-num sp-hero-stat-total">{monitors.length}</span>
            <span className="sp-hero-stat-label">Total</span>
          </div>
        </div>
      )}

      <div className="sp-updated">Last updated: {lastUpdated || '—'}</div>
    </div>
  )
}
