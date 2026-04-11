'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UptrueLogo } from '@/components/ui/uptrue-logo'
import {
  IconDashboard, IconUsers, IconBuilding, IconCreditCard,
  IconGlobe, IconToggle, IconEdit, IconMail, IconSettings, IconX, IconShield,
  IconBell, IconTag, IconActivity, IconFileText, IconChevronDown,
} from '@/components/icons'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  pendingBlogCount?: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  disabled?: boolean
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    defaultOpen: true,
    items: [
      { href: '/admin', label: 'Dashboard', icon: IconDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users', label: 'Users', icon: IconUsers },
      { href: '/admin/organisations', label: 'Organisations', icon: IconBuilding },
      { href: '/admin/agency-waitlist', label: 'Agency Waitlist', icon: IconUsers },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/admin/plans', label: 'Plans & Pricing', icon: IconCreditCard },
      { href: '/admin/revenue', label: 'Revenue', icon: IconCreditCard },
      { href: '/admin/revenue/entities', label: 'Vision vs Crozent', icon: IconBuilding },
      { href: '/admin/credits', label: 'Credit Approvals', icon: IconTag },
    ],
  },
  {
    label: 'Product',
    items: [
      { href: '/admin/tracker', label: 'Public Tracker', icon: IconGlobe },
      { href: '/admin/feature-flags', label: 'Feature Flags', icon: IconToggle },
      { href: '/admin/ai-engines', label: 'AI Engines', icon: IconActivity },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', icon: IconEdit },
      { href: '/admin/autoblog', label: 'Autoblog Engine', icon: IconActivity },
      { href: '/admin/aoe', label: 'AOE Outreach', icon: IconMail },
      { href: '/admin/emails', label: 'Email & Nurture', icon: IconMail },
      { href: '/admin/messages', label: 'Messages', icon: IconBell },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/system', label: 'System Health', icon: IconActivity },
      { href: '/admin/audit-log', label: 'Audit Log', icon: IconFileText },
      { href: '/admin/team', label: 'Admin Team', icon: IconShield },
      { href: '/admin/settings', label: 'Settings', icon: IconSettings },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

function groupHasActive(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isActive(pathname, item.href))
}

export function AdminSidebar({ isOpen, onClose, pendingBlogCount }: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname()

  // Inject pending blog badge dynamically
  const navGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item =>
      item.href === '/admin/blog' && pendingBlogCount && pendingBlogCount > 0
        ? { ...item, badge: String(pendingBlogCount) }
        : item
    ),
  }))

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const group of NAV_GROUPS) {
      initial[group.label] = group.defaultOpen === true || groupHasActive(pathname, group.items)
    }
    return initial
  })

  function toggleGroup(label: string): void {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onClose}
          role="presentation"
        />
      )}

      <aside className={`admin-sidebar${isOpen ? ' admin-sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <Link href="/admin" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
            <UptrueLogo variant="light" />
          </Link>
          <button
            className="admin-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {navGroups.map((group) => {
            const isGroupOpen = openGroups[group.label] ?? false
            const hasActive = groupHasActive(pathname, group.items)

            return (
              <div key={group.label} className="admin-sidebar-group">
                <button
                  className={`admin-sidebar-section-label${hasActive ? ' admin-sidebar-section-label-active' : ''}`}
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isGroupOpen}
                >
                  <span>{group.label}</span>
                  <IconChevronDown
                    size={12}
                    className={`admin-sidebar-chevron${isGroupOpen ? ' admin-sidebar-chevron-open' : ''}`}
                  />
                </button>

                {isGroupOpen && (
                  <div className="admin-sidebar-group-items">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href)
                      const Icon = item.icon

                      if (item.disabled) {
                        return (
                          <span
                            key={item.href}
                            className="admin-sidebar-item admin-sidebar-item-disabled"
                          >
                            <Icon size={18} className="admin-sidebar-item-icon" />
                            <span className="admin-sidebar-item-label">{item.label}</span>
                            {item.badge && (
                              <span className="admin-sidebar-badge">{item.badge}</span>
                            )}
                          </span>
                        )
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`admin-sidebar-item${active ? ' admin-sidebar-item-active' : ''}`}
                          onClick={onClose}
                        >
                          <Icon size={18} className="admin-sidebar-item-icon" />
                          <span className="admin-sidebar-item-label">{item.label}</span>
                          {item.badge && (
                            <span className="admin-sidebar-badge">{item.badge}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <Link href="/dashboard" className="admin-sidebar-back" onClick={onClose}>
            <IconDashboard size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
