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
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = labelMap[seg] || (seg.length > 20 ? seg.slice(0, 8) + '...' : seg)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="breadcrumbs">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
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
