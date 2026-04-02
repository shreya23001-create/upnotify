'use client'

import { useState, useCallback } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

interface AdminShellProps {
  userEmail: string
  children: React.ReactNode
}

export function AdminShell({ userEmail, children }: AdminShellProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleToggle = useCallback((): void => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback((): void => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="admin-shell">
      <AdminSidebar isOpen={sidebarOpen} onClose={handleClose} />
      <div className="admin-main">
        <AdminHeader userEmail={userEmail} onMenuToggle={handleToggle} />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
