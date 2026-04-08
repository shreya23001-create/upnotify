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
  IconHelpCircle, IconTrendingUp, IconWatchdog, IconSparkles, IconInbox,
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
  badgeVariant?: 'red' | 'blue'
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/dashboard/monitors', label: 'Monitors', icon: IconActivity },
  { href: '/dashboard/alerts', label: 'Alert Channels', icon: IconAlertTriangle },
  { href: '/dashboard/incidents', label: 'Incidents', icon: IconAlertTriangle },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: IconGlobe },
  { href: '/dashboard/reports', label: 'Reports', icon: IconTrendingUp },
  { href: '/dashboard/watchdog', label: 'Watchdog', icon: IconWatchdog },
  { href: '/dashboard/ai-visibility', label: 'AI Visibility', icon: IconSparkles },
  // Compete hidden — launching in v1.5
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
  const [monitorCount, setMonitorCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchCounts(): Promise<void> {
      try {
        const [incRes, monRes] = await Promise.allSettled([
          fetch('/api/v1/incidents/count'),
          fetch('/api/v1/monitors/count'),
        ])
        if (incRes.status === 'fulfilled' && incRes.value.ok) {
          const data = await incRes.value.json() as { success: boolean; count: number }
          if (!cancelled && data.success) setOpenIncidentCount(data.count)
        }
        if (monRes.status === 'fulfilled' && monRes.value.ok) {
          const data = await monRes.value.json() as { success: boolean; count: number }
          if (!cancelled && data.success) setMonitorCount(data.count)
        }
      } catch {
        // Silently ignore — badges just won't show
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 60_000)

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
  // Inject badge counts onto nav items
  const itemsWithBadges = mainNavItems.map(item => {
    if (item.href === '/dashboard/incidents' && openIncidentCount > 0) {
      return { ...item, badge: openIncidentCount, badgeVariant: 'red' as const }
    }
    if (item.href === '/dashboard/monitors' && monitorCount > 0) {
      return { ...item, badge: monitorCount, badgeVariant: 'blue' as const }
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
                badgeVariant={item.badgeVariant}
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
  href, label, icon: Icon, isActive, collapsed, badge, badgeVariant = 'red',
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  isActive: boolean
  collapsed: boolean
  badge?: number
  badgeVariant?: 'red' | 'blue'
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
        <span className={`sidebar-link-badge${badgeVariant === 'blue' ? ' sidebar-link-badge-blue' : ''}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
