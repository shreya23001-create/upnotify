'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { IconMenu } from '@/components/icons'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
        <IconMenu size={22} />
      </button>
      {open && (
        <>
          <div className="mobile-overlay open" onClick={() => setOpen(false)} />
          <div className="sidebar-mobile open">
            <Sidebar />
          </div>
        </>
      )}
    </>
  )
}
