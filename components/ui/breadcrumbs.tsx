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

// Matches a raw database ID segment (UUID, or any long opaque id-looking
// string) in the URL — this component has no access to the actual record
// (e.g. a team member's name) behind that id, so rather than show a
// meaningless truncated UUID, that segment is dropped from the trail
// entirely. The page's own in-content breadcrumb/heading is expected to
// show the real, human-readable name instead.
const ID_SEGMENT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function Breadcrumbs() {
  const pathname = usePathname()
  const allSegments = pathname.split('/').filter(Boolean)
  // Every dashboard route starts with "dashboard" — drop it so the trail
  // starts at the page itself instead of a redundant "Dashboard /" prefix.
  const startIndex = allSegments[0] === 'dashboard' ? 1 : 0

  // Pair each visible segment with its real index into allSegments so hrefs
  // stay correct even after filtering out raw id segments below.
  const indexed = allSegments
    .map((seg, i) => ({ seg, i }))
    .slice(startIndex)
    .filter(({ seg }) => !ID_SEGMENT_PATTERN.test(seg))

  if (indexed.length === 0) return null

  const crumbs = indexed.map(({ seg, i }, pos) => {
    const href = '/' + allSegments.slice(0, i + 1).join('/')
    const label = labelMap[seg] ?? (seg.length > 24 ? seg.slice(0, 10) + '…' : seg)
    const isLast = pos === indexed.length - 1
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
