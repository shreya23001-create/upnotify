'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { IconMenu } from '@/components/icons'
import { usePathname } from 'next/navigation'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
        <IconMenu size={22} />
      </button>
      {open && (
        <>
          <div className="mobile-overlay open" onClick={() => setOpen(false)} />
          <div className="sidebar-mobile open">
            <button
              className="mobile-sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <Sidebar forceExpanded />
          </div>
        </>
      )}
    </>
  )
}
