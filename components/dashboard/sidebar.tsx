'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/monitors', label: 'Monitors' },
  { href: '/dashboard/status-pages', label: 'Status Pages' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/alerts', label: 'Alerts' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAgency } = useWorkspace()
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/dashboard">Uptrue</Link>
      </div>
      <nav className="sidebar-nav">
        {isAgency && (
          <Link href="/dashboard/clients" className={`sidebar-link${pathname.startsWith('/dashboard/clients') ? ' active' : ''}`}>
            Clients
          </Link>
        )}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${(item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)) ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
        {user?.is_super_admin && (
          <Link href="/admin" className={`sidebar-link${pathname.startsWith('/admin') ? ' active' : ''}`}>
            Admin
          </Link>
        )}
      </nav>
    </aside>
  )
}
