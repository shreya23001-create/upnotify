'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'
import {
  IconDashboard, IconActivity, IconGlobe, IconBell,
  IconBuilding, IconSettings, IconShield, IconChevronLeft, IconChevronRight,
  IconHelpCircle, IconTrendingUp,
} from '@/components/icons'

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/dashboard/monitors', label: 'Monitors', icon: IconActivity },
  { href: '/dashboard/alerts', label: 'Alerts', icon: IconBell },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: IconGlobe },
  { href: '/dashboard/reports', label: 'Reports', icon: IconTrendingUp },
]

const secondaryNavItems: NavItem[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  { href: '/dashboard/help', label: 'Help', icon: IconHelpCircle },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname()
  const { isAgency } = useWorkspace()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const sections: NavSection[] = []

  /* Main navigation section */
  const mainItems: NavItem[] = []
  if (isAgency) {
    mainItems.push({ href: '/dashboard/clients', label: 'Clients', icon: IconBuilding })
  }
  mainItems.push(...mainNavItems)
  sections.push({ title: 'MAIN', items: mainItems })

  /* Secondary section */
  sections.push({ title: 'SUPPORT', items: secondaryNavItems })

  return (
    <aside className={collapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-logo">
        <Link href="/dashboard" className="sidebar-logo-link">
          {collapsed ? (
            <span className="sidebar-logo-mark">U</span>
          ) : (
            <img
              src="/logo-light.svg"
              alt="Uptrue"
              width={130}
              height={32}
              className="sidebar-logo-img"
            />
          )}
        </Link>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, sIdx) => (
          <div key={section.title} className="sidebar-section">
            {!collapsed && sIdx > 0 && <div className="sidebar-divider" />}
            {!collapsed && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {collapsed && sIdx > 0 && <div className="sidebar-divider" />}
            {section.items.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}

        {user?.is_super_admin && (
          <>
            {!collapsed && <div className="sidebar-divider" />}
            {collapsed && <div className="sidebar-divider" />}
            {!collapsed && (
              <div className="sidebar-section-title">ADMIN</div>
            )}
            <SidebarLink
              href="/admin"
              label="Admin"
              icon={IconShield}
              isActive={pathname.startsWith('/admin')}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      <div className="sidebar-collapse-btn-wrapper">
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({
  href, label, icon: Icon, isActive, collapsed,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  isActive: boolean
  collapsed: boolean
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={`sidebar-link${isActive ? ' active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-link-icon">
        <Icon size={18} />
      </span>
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
    </Link>
  )
}
