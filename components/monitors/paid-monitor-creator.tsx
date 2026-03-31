'use client'

import { useEffect, useState, useTransition } from 'react'
import { createMonitorAfterPaymentAction } from '@/app/(dashboard)/dashboard/monitors/actions'

export function PaidMonitorCreator() {
  const [status, setStatus] = useState<'creating' | 'success' | 'error'>('creating')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const stored = localStorage.getItem('uptrue_pending_monitor')
    if (!stored) {
      setStatus('error')
      setError('No pending monitor data found. Please create a monitor again.')
      return
    }

    const data = JSON.parse(stored) as Record<string, string>
    localStorage.removeItem('uptrue_pending_monitor')

    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => formData.set(key, val))

    startTransition(async () => {
      const result = await createMonitorAfterPaymentAction(formData)
      if (result?.error) {
        setStatus('error')
        setError(result.error)
      } else {
        setStatus('success')
      }
    })
  }, [startTransition])

  if (status === 'creating' || isPending) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Payment received!</h3>
          <p style={{ color: '#94a3b8' }}>Creating your monitor...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card">
        <div className="card-content">
          <div className="form-error">{error}</div>
          <a href="/dashboard/monitors/new" className="btn btn-primary">Try Again</a>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-content" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Monitor created!</h3>
        <p style={{ color: '#94a3b8', marginBottom: 20 }}>Your monitor is now active and will start checking shortly.</p>
        <a href="/dashboard/monitors" className="btn btn-primary">View Monitors</a>
      </div>
    </div>
  )
}
