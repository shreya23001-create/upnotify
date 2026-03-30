'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'
import {
  IconDashboard, IconActivity, IconGlobe, IconFileText, IconBell,
  IconBuilding, IconSettings, IconShield, IconChevronLeft, IconChevronRight,
} from '@/components/icons'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/dashboard/monitors', label: 'Monitors', icon: IconActivity },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: IconGlobe },
  { href: '/dashboard/reports', label: 'Reports', icon: IconFileText },
  { href: '/dashboard/alerts', label: 'Alerts', icon: IconBell },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAgency } = useWorkspace()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={collapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-logo">
        <Link href="/dashboard">{collapsed ? 'U' : 'Uptrue'}</Link>
      </div>
      <nav className="sidebar-nav">
        {isAgency && (
          <SidebarLink
            href="/dashboard/clients"
            label="Clients"
            icon={IconBuilding}
            isActive={pathname.startsWith('/dashboard/clients')}
            collapsed={collapsed}
          />
        )}
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
        {user?.is_super_admin && (
          <SidebarLink
            href="/admin"
            label="Admin"
            icon={IconShield}
            isActive={pathname.startsWith('/admin')}
            collapsed={collapsed}
          />
        )}
      </nav>
      <div className="sidebar-collapse-btn-wrapper">
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({
  href, label, icon: Icon, isActive, collapsed,
}: {
  href: string; label: string; icon: React.ComponentType<{ size?: number }>; isActive: boolean; collapsed: boolean
}) {
  return (
    <Link href={href} className={`sidebar-link${isActive ? ' active' : ''}`} title={collapsed ? label : undefined}>
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
