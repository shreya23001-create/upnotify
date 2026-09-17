'use client'

import { useState, useRef, useEffect } from 'react'
import { IconMenu, IconLogOut } from '@/components/icons'
import { usePathname } from 'next/navigation'
import { AdminSearch } from '@/components/admin/admin-search'
import { signOut } from '@/lib/auth/actions'

interface AdminHeaderProps {
  userEmail: string
  onMenuToggle: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/organisations': 'Organisations',
  '/admin/plans': 'Plans & Pricing',
  '/admin/tracker': 'Public Tracker',
  '/admin/feature-flags': 'Feature Flags',
  '/admin/team': 'Admin Team',
  '/admin/blog': 'Blog',
  '/admin/emails': 'Email & Nurture',
  '/admin/settings': 'Settings',
  '/admin/ai-engines': 'AI Engines',
  '/admin/ai-profile-prompts': 'AI Profile Prompts',
  '/admin/aoe': 'AOE Outreach',
  '/admin/audit-log': 'Audit Log',
  '/admin/system': 'System Health',
  '/admin/revenue': 'Revenue',
  '/admin/credits': 'Credit Approvals',
  '/admin/messages': 'Messages',
  '/admin/support': 'Support',
  '/admin/agency-waitlist': 'Agency Waitlist',
  '/admin/user360': 'User 360',
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Admin'
}

export function AdminHeader({ userEmail, onMenuToggle }: AdminHeaderProps): React.ReactElement {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="admin-topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <IconMenu size={22} />
        </button>
        <div className="admin-topbar-title">
          <h1 className="admin-topbar-page">{title}</h1>
          <span className="admin-topbar-breadcrumb">Admin / {title}</span>
        </div>
      </div>
      <div className="admin-topbar-right">
        <AdminSearch />
        <div className="admin-topbar-user" ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setDropdownOpen(v => !v)}>
          <div className="admin-topbar-avatar">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="admin-topbar-email">{userEmail}</span>
          {dropdownOpen && (
            <div className="header-dropdown admin-header-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 100 }}>
              <button className="hd-item hd-item-danger" onClick={() => void signOut()}>
                <span className="hd-item-icon hd-item-icon-danger"><IconLogOut size={14} /></span>
                <span className="hd-item-label">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
