'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScanSearch, SlidersHorizontal } from 'lucide-react'

interface AddMonitorButtonProps {
  hasMonitors: boolean
  size?: 'sm' | 'default'
}

export function AddMonitorButton({ hasMonitors, size = 'default' }: AddMonitorButtonProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handler(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const dropdownWidth = 240
      // Align right edge of dropdown to right edge of button, but clamp to viewport
      const rightAligned = rect.right - dropdownWidth
      const left = Math.max(8, Math.min(rightAligned, window.innerWidth - dropdownWidth - 8))
      setDropdownPos({ top: rect.bottom + 6, left })
    }
    setOpen(o => !o)
  }

  const btnClass = size === 'sm' ? 'btn btn-primary btn-sm' : 'btn btn-primary'

  if (!hasMonitors) {
    return (
      <button className={btnClass} onClick={() => router.push('/dashboard/monitors/scan')}>
        + Add Monitor
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button ref={btnRef} className={btnClass} onClick={handleOpen}>
        + Add Monitor
        <svg
          width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
          viewBox="0 0 24 24" style={{ marginLeft: 6, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : '' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          top: dropdownPos.top,
          left: dropdownPos.left,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 10,
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          zIndex: 300,
          width: 240,
          overflow: 'hidden',
        }}>
          <Link
            href="/dashboard/monitors/scan"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '14px 16px', textDecoration: 'none', borderBottom: '1px solid var(--border-primary)' }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
              <ScanSearch size={15} strokeWidth={2} /> Scan a domain
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Auto-detect what needs monitoring
            </div>
          </Link>
          <Link
            href="/dashboard/monitors/new/manual"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '14px 16px', textDecoration: 'none' }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
              <SlidersHorizontal size={15} strokeWidth={2} /> Add a specific monitor
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Choose a type and configure manually
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
