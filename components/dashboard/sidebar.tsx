'use client'

import Link from 'next/link'
import { UptrueLogo } from '@/components/ui/uptrue-logo'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'
import {
  IconDashboard, IconActivity, IconGlobe, IconAlertTriangle,
  IconBuilding, IconSettings, IconShield, IconChevronLeft, IconChevronRight,
  IconHelpCircle, IconTrendingUp, IconTarget, IconBarChart, IconInbox,
} from '@/components/icons'

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  badge?: number
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/dashboard/monitors', label: 'Monitors', icon: IconActivity },
  { href: '/dashboard/alerts', label: 'Alerts', icon: IconAlertTriangle },
  { href: '/dashboard/incidents', label: 'Incidents', icon: IconAlertTriangle },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: IconGlobe },
  { href: '/dashboard/reports', label: 'Reports', icon: IconTrendingUp },
  { href: '/dashboard/competitors', label: 'Competitors', icon: IconTarget },
  { href: '/dashboard/compete', label: 'Compete', icon: IconBarChart },
]

const secondaryNavItems: NavItem[] = [
  { href: '/dashboard/support', label: 'Support', icon: IconInbox },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  { href: '/dashboard/help', label: 'Help', icon: IconHelpCircle },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname()
  const { isAgency } = useWorkspace()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [openIncidentCount, setOpenIncidentCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchCount(): Promise<void> {
      try {
        const res = await fetch('/api/v1/incidents/count')
        if (!res.ok) return
        const data = await res.json() as { success: boolean; count: number }
        if (!cancelled && data.success) {
          setOpenIncidentCount(data.count)
        }
      } catch {
        // Silently ignore — badge just won't show
      }
    }

    fetchCount()
    // Refresh count every 60 seconds
    const interval = setInterval(fetchCount, 60_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

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
  // Inject open incident badge count onto Alerts and Incidents nav items
  const itemsWithBadges = mainNavItems.map(item => {
    if ((item.href === '/dashboard/alerts' || item.href === '/dashboard/incidents') && openIncidentCount > 0) {
      return { ...item, badge: openIncidentCount }
    }
    return item
  })
  mainItems.push(...itemsWithBadges)
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
            <UptrueLogo variant="light" />
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
                badge={item.badge}
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

      {/* Credits promo — collapsible, only for non-admin users */}
      {!collapsed && !user?.is_super_admin && (
        <CreditsPromo />
      )}

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

function CreditsPromo(): React.ReactElement {
  const [open, setOpen] = useState(true)

  return (
    <div className="sidebar-credits-promo">
      <div className="sidebar-credits-promo-header" onClick={() => setOpen(!open)}>
        <span className="sidebar-credits-promo-icon">✨</span>
        <span className="sidebar-credits-promo-title">Earn Credits</span>
        <span className="sidebar-credits-promo-toggle" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      <div className={`sidebar-credits-promo-body${open ? '' : ' collapsed'}`}>
        <div className="sidebar-credits-promo-text">Get up to £10/mo off your plan by referring friends.</div>
        <Link href="/dashboard/settings?tab=referrals" className="sidebar-credits-promo-link">
          Learn how →
        </Link>
      </div>
    </div>
  )
}

function SidebarLink({
  href, label, icon: Icon, isActive, collapsed, badge,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  isActive: boolean
  collapsed: boolean
  badge?: number
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={`sidebar-link${isActive ? ' active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-link-icon" style={{ position: 'relative' }}>
        <Icon size={18} />
        {collapsed && badge !== undefined && badge > 0 && (
          <span className="sidebar-link-badge-dot" />
        )}
      </span>
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="sidebar-link-badge">{badge > 99 ? '99+' : badge}</span>
      )}
    </Link>
  )
}
