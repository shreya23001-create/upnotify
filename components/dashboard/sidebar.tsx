'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'
import type { SupportedCurrency } from '@/lib/utils/currency'
import {
  IconDashboard, IconActivity, IconGlobe, IconAlertTriangle,
  IconBuilding, IconSettings, IconShield, IconChevronLeft, IconChevronRight,
  IconHelpCircle, IconTrendingUp, IconInbox, IconCreditCard,
  IconServer,
} from '@/components/icons'

/** The gated dashboard routes (see lib/auth/require-activated-org.ts) —
 *  shown locked in the sidebar when the org has no active plan. Plans
 *  itself is the only page never gated. */
const GATED_HREFS: ReadonlySet<string> = new Set([
  '/dashboard',
  '/dashboard/monitors',
  '/dashboard/alerts',
  '/dashboard/incidents',
  '/dashboard/status-pages',
  '/dashboard/reports',
  '/dashboard/watchdog',
  '/dashboard/support',
  '/dashboard/settings',
  '/dashboard/help',
])

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
  { href: '/dashboard/plans', label: 'Plans', icon: IconCreditCard },
  // AI Visibility hidden per request
  // Websites hidden per request
  // Compete hidden — launching in v1.5
  // Competitor hidden per request
]

const secondaryNavItems: NavItem[] = [
  { href: '/dashboard/support', label: 'Support', icon: IconInbox },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  { href: '/dashboard/help', label: 'Help', icon: IconHelpCircle },
]

interface SidebarProps {
  currency?: SupportedCurrency
  forceExpanded?: boolean
}

export function Sidebar({ forceExpanded = false }: SidebarProps): React.ReactElement {
  const pathname = usePathname()
  const { isAgency, hasActivePlan } = useWorkspace()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const effectiveCollapsed = forceExpanded ? false : collapsed
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

  // Per-member tab restriction: only applies to role === 'viewer' (the
  // actual DB value for a non-admin team member — see
  // lib/auth/require-tab-access.ts for why it's not 'member') with a
  // non-null tab_access array. Admins, and viewers with tab_access left
  // null (unrestricted), see everything as before.
  const tabAccess = (user as { tab_access?: string[] | null } | null)?.tab_access ?? null
  const isRestrictedMember = user?.role === 'viewer' && Array.isArray(tabAccess)
  function isTabVisible(href: string): boolean {
    if (!isRestrictedMember) return true
    return (tabAccess as string[]).includes(href)
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
  mainItems.push(...itemsWithBadges.filter(item => isTabVisible(item.href)))
  sections.push({ title: 'MAIN', items: mainItems })

  /* Secondary section */
  sections.push({ title: 'SUPPORT', items: secondaryNavItems.filter(item => isTabVisible(item.href)) })

  return (
    <aside className={effectiveCollapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-logo">
        <Link href="/dashboard" className="sidebar-logo-link">
          {effectiveCollapsed ? (
            <span className="sidebar-logo-mark">U</span>
          ) : (
            <img src="/Logo_2.png" alt="Upnotify" height={35} style={{ height: 35, width: 'auto' }} />
          )}
        </Link>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar-section">
            {section.items.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive(item.href)}
                collapsed={effectiveCollapsed}
                badge={item.badge}
                badgeVariant={item.badgeVariant}
                isLocked={!hasActivePlan && GATED_HREFS.has(item.href)}
              />
            ))}
          </div>
        ))}

        {user?.is_super_admin && (
          <>
            <div className="sidebar-divider" />
            {!effectiveCollapsed && (
              <div className="sidebar-section-title">ADMIN</div>
            )}
            <SidebarLink
              href="/admin"
              label="Admin"
              icon={IconShield}
              isActive={pathname.startsWith('/admin')}
              collapsed={effectiveCollapsed}
            />
          </>
        )}
      </nav>

      <div className="sidebar-user-footer">
        {user && (
          <>
            <span className="sidebar-user-avatar">
              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
            </span>
            {!effectiveCollapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.full_name || user.email}</div>
                {user.full_name && <div className="sidebar-user-role">{user.email}</div>}
              </div>
            )}
          </>
        )}
        {!forceExpanded && (
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {effectiveCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </button>
        )}
      </div>
    </aside>
  )
}

function SidebarLink({
  href, label, icon: Icon, isActive, collapsed, badge, badgeVariant = 'red', isLocked = false,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  isActive: boolean
  collapsed: boolean
  badge?: number
  badgeVariant?: 'red' | 'blue'
  isLocked?: boolean
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={`sidebar-link${isActive ? ' active' : ''}${isLocked ? ' sidebar-link-locked' : ''}`}
      title={collapsed ? label : (isLocked ? `${label} — requires an active plan` : undefined)}
    >
      <span className="sidebar-link-icon" style={{ position: 'relative' }}>
        <Icon size={18} />
        {collapsed && badge !== undefined && badge > 0 && !isLocked && (
          <span className="sidebar-link-badge-dot" />
        )}
      </span>
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
      {isLocked && <Lock size={13} strokeWidth={2} className="sidebar-link-lock-icon" />}
      {!collapsed && !isLocked && badge !== undefined && badge > 0 && (
        <span className={`sidebar-link-badge${badgeVariant === 'blue' ? ' sidebar-link-badge-blue' : ''}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
