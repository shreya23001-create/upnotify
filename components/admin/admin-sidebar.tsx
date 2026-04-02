'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconDashboard, IconUsers, IconBuilding, IconCreditCard,
  IconGlobe, IconToggle, IconEdit, IconMail, IconSettings, IconX, IconShield,
} from '@/components/icons'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  disabled?: boolean
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: IconDashboard },
  { href: '/admin/users', label: 'Users', icon: IconUsers },
  { href: '/admin/organisations', label: 'Organisations', icon: IconBuilding },
  { href: '/admin/plans', label: 'Plans & Pricing', icon: IconCreditCard },
  { href: '/admin/tracker', label: 'Public Tracker', icon: IconGlobe },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: IconToggle },
  { href: '/admin/team', label: 'Admin Team', icon: IconShield },
  { href: '/admin/blog', label: 'Blog', icon: IconEdit, disabled: true, badge: 'Soon' },
  { href: '/admin/emails', label: 'Email & Nurture', icon: IconMail, disabled: true, badge: 'Soon' },
  { href: '/admin/settings', label: 'Settings', icon: IconSettings, disabled: true, badge: 'Soon' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname()

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
            <img src="/logo-light.svg" alt="Uptrue Admin" width={130} height={32} style={{ display: 'block' }} />
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
          <div className="admin-sidebar-section-label">Main</div>
          {NAV_ITEMS.map((item) => {
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
              </Link>
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
