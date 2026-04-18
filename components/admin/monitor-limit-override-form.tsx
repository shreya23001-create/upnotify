'use client'

import { useState, useTransition } from 'react'
import { setMonitorLimitOverrideAction } from '@/app/(admin)/admin/user360/actions'

interface Props {
  orgId: string
  currentOverride: number | null
  planLimit: number | null
}

export function MonitorLimitOverrideForm({ orgId, currentOverride, planLimit }: Props): React.ReactElement {
  const [value, setValue] = useState(currentOverride !== null ? String(currentOverride) : '')
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  function handleSave(): void {
    const override = value.trim() === '' ? null : parseInt(value, 10)
    if (value.trim() !== '' && (isNaN(override!) || override! < 1)) {
      setStatus('error')
      return
    }
    startTransition(async () => {
      const result = await setMonitorLimitOverrideAction(orgId, override)
      setStatus(result.error ? 'error' : 'saved')
      setTimeout(() => setStatus('idle'), 3000)
    })
  }

  function handleClear(): void {
    setValue('')
    startTransition(async () => {
      const result = await setMonitorLimitOverrideAction(orgId, null)
      setStatus(result.error ? 'error' : 'saved')
      setTimeout(() => setStatus('idle'), 3000)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={planLimit !== null ? `Plan default: ${planLimit}` : 'e.g. 100'}
        disabled={isPending}
        style={{
          width: 140, padding: '4px 8px', fontSize: 13, borderRadius: 6,
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
      />
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={isPending}
        style={{ fontSize: 12, padding: '4px 12px' }}
      >
        {isPending ? 'Saving…' : 'Set'}
      </button>
      {currentOverride !== null && (
        <button
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isPending}
          style={{ fontSize: 12, padding: '4px 12px' }}
        >
          Clear override
        </button>
      )}
      {status === 'saved' && <span style={{ fontSize: 12, color: '#10b981' }}>Saved</span>}
      {status === 'error' && <span style={{ fontSize: 12, color: '#ef4444' }}>Error</span>}
      {currentOverride !== null && (
        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
          ⚠ Override active
        </span>
      )}
    </div>
  )
}
