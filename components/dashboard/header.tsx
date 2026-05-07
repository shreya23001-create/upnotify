'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { WorkspaceSwitcher } from './workspace-switcher'
import { IconLogOut, IconUser, IconSettings, IconHelpCircle, IconBuilding } from '@/components/icons'
import { MobileSidebar } from './mobile-sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MessagesBell } from './messages-bell'

export function Header() {
  const { user, signOut } = useAuth()
  const { organisation } = useWorkspace()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'

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
    <header className="header">
      <MobileSidebar />
      <span className="header-org">{organisation?.name}</span>
      <WorkspaceSwitcher />
      <ThemeToggle />
      <MessagesBell />
      <div className="header-user" ref={dropdownRef}>
        <div className="header-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {organisation?.logo_url ? (
            <img src={organisation.logo_url} alt={`${organisation.name} logo`} className="header-avatar-img" />
          ) : (
            initials
          )}
        </div>
        {dropdownOpen && (
          <div className="header-dropdown">
            <div className="hd-profile">
              <div className="hd-profile-avatar">
                {organisation?.logo_url ? (
                  <img src={organisation.logo_url} alt="" className="hd-profile-avatar-img" />
                ) : (
                  initials
                )}
              </div>
              <div className="hd-profile-info">
                <div className="hd-profile-name">{user?.full_name ?? 'User'}</div>
                <div className="hd-profile-email">{user?.email}</div>
              </div>
            </div>
            <div className="header-dropdown-divider" />
            <Link href="/dashboard/settings" className="hd-item" onClick={() => setDropdownOpen(false)}>
              <span className="hd-item-icon"><IconUser size={15} /></span>
              <span className="hd-item-label">Profile</span>
            </Link>
            <Link href="/dashboard/settings?tab=billing" className="hd-item" onClick={() => setDropdownOpen(false)}>
              <span className="hd-item-icon"><IconBuilding size={15} /></span>
              <span className="hd-item-label">Billing &amp; Plan</span>
            </Link>
            <Link href="/dashboard/settings" className="hd-item" onClick={() => setDropdownOpen(false)}>
              <span className="hd-item-icon"><IconSettings size={15} /></span>
              <span className="hd-item-label">Settings</span>
            </Link>
            <div className="header-dropdown-divider" />
            <Link href="/dashboard/help" className="hd-item" onClick={() => setDropdownOpen(false)}>
              <span className="hd-item-icon"><IconHelpCircle size={15} /></span>
              <span className="hd-item-label">Help Center</span>
            </Link>
            <button className="hd-item hd-item-danger" onClick={() => signOut()}>
              <span className="hd-item-icon hd-item-icon-danger"><IconLogOut size={15} /></span>
              <span className="hd-item-label">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
