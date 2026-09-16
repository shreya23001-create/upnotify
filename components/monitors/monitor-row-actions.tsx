'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreVertical, Eye, Edit2, Pause, Play, Trash2 } from 'lucide-react'

interface Props {
  detailHref: string
  editHref: string
  isPaused: boolean
  disabled?: boolean
  onTogglePause: () => void
  onDelete: () => void
}

export function MonitorRowActions({ detailHref, editHref, isPaused, disabled, onTogglePause, onDelete }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="mon-row-menu" ref={ref}>
      <button
        type="button"
        className="mon-row-menu-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-label="Monitor actions"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="mon-row-menu-panel" role="menu">
          <Link href={detailHref} className="mon-row-menu-item" onClick={() => setOpen(false)}>
            <Eye size={14} /> View
          </Link>
          <Link href={editHref} className="mon-row-menu-item" onClick={() => setOpen(false)}>
            <Edit2 size={14} /> Edit
          </Link>
          <button
            type="button"
            className="mon-row-menu-item"
            onClick={() => { setOpen(false); onTogglePause() }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div className="mon-row-menu-divider" />
          <button
            type="button"
            className="mon-row-menu-item mon-row-menu-item--danger"
            onClick={() => { setOpen(false); onDelete() }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}
