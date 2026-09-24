'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  monitors: 'Monitors',
  alerts: 'Alert Channels',
  'status-pages': 'Status Pages',
  reports: 'Reports',
  settings: 'Settings',
  clients: 'Clients',
  new: 'New',
  edit: 'Edit',
  admin: 'Admin',
  incidents: 'Incidents',
  watchdog: 'Watchdog',
  compete: 'Compete',
  support: 'Support',
  help: 'Help',
}

function ChevronRight() {
  return (
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const allSegments = pathname.split('/').filter(Boolean)
  // Every dashboard route starts with "dashboard" — drop it so the trail
  // starts at the page itself instead of a redundant "Dashboard /" prefix.
  const segments = allSegments[0] === 'dashboard' ? allSegments.slice(1) : allSegments

  if (segments.length === 0) return null

  const crumbs = segments.map((seg, i) => {
    const href = '/' + allSegments.slice(0, allSegments.length - segments.length + i + 1).join('/')
    const label = labelMap[seg] ?? (seg.length > 24 ? seg.slice(0, 10) + '…' : seg)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span className="breadcrumb-sep"><ChevronRight /></span>}
          {crumb.isLast ? (
            <span className="breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="breadcrumb-link">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
