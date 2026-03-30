'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { WorkspaceSwitcher } from './workspace-switcher'
import { IconSettings, IconLogOut, IconUser } from '@/components/icons'

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
      <span className="header-org">{organisation?.name}</span>
      <WorkspaceSwitcher />
      <div className="header-user" ref={dropdownRef}>
        <div className="header-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {initials}
        </div>
        {dropdownOpen && (
          <div className="header-dropdown">
            <div className="header-dropdown-info">
              <div className="header-dropdown-info-name">{user?.full_name ?? 'User'}</div>
              <div className="header-dropdown-info-email">{user?.email}</div>
            </div>
            <div className="header-dropdown-divider" />
            <Link href="/dashboard/settings" className="header-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <IconSettings size={15} /> Settings
            </Link>
            <Link href="/dashboard/settings" className="header-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <IconUser size={15} /> Profile
            </Link>
            <div className="header-dropdown-divider" />
            <button className="header-dropdown-item header-dropdown-item-danger" onClick={() => signOut()}>
              <IconLogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
