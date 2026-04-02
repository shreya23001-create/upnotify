'use client'

import { IconMenu } from '@/components/icons'
import { usePathname } from 'next/navigation'

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
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Admin'
}

export function AdminHeader({ userEmail, onMenuToggle }: AdminHeaderProps): React.ReactElement {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

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
        <div className="admin-topbar-user">
          <div className="admin-topbar-avatar">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="admin-topbar-email">{userEmail}</span>
        </div>
      </div>
    </header>
  )
}
