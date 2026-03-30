'use client'

import { useTransition } from 'react'
import { deleteMonitorAction, pauseMonitorAction, resumeMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'

export function MonitorActions({ monitorId, isPaused }: { monitorId: string; isPaused: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handlePauseResume(): void {
    startTransition(async () => {
      if (isPaused) {
        await resumeMonitorAction(monitorId)
      } else {
        await pauseMonitorAction(monitorId)
      }
    })
  }

  function handleDelete(): void {
    if (!confirm('Are you sure you want to delete this monitor? This cannot be undone.')) return
    startTransition(async () => {
      await deleteMonitorAction(monitorId)
    })
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-secondary btn-sm" onClick={handlePauseResume} disabled={isPending}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button className="btn btn-sm" style={{ color: '#dc2626' }} onClick={handleDelete} disabled={isPending}>
        Delete
      </button>
    </div>
  )
}
