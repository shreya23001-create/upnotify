'use client'

import { useState, useTransition } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteMonitorAction, pauseMonitorAction, resumeMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'

export function MonitorActions({ monitorId, isPaused }: { monitorId: string; isPaused: boolean }): React.ReactNode {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
    setShowDeleteConfirm(true)
  }

  function executeDelete(): void {
    setShowDeleteConfirm(false)
    startTransition(async () => {
      await deleteMonitorAction(monitorId)
    })
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={handlePauseResume} disabled={isPending}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn btn-sm" style={{ color: '#dc2626' }} onClick={handleDelete} disabled={isPending}>
          Delete
        </button>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Monitor"
        message="This monitor and all its check history will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  )
}
