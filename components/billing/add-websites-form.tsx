'use client'

import { useState, useTransition } from 'react'
import { addWebsitesAction } from '@/app/(dashboard)/dashboard/websites/actions'

interface ExistingWebsite {
  domain: string
  status: string
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'incomplete': return { text: 'Awaiting payment', className: 'plans-badge-warn' }
    case 'active': return { text: 'Active', className: 'plans-badge-active' }
    case 'cancelling': return { text: 'Cancels at period end', className: 'plans-badge-warn' }
    case 'past_due': return { text: 'Payment failed', className: 'plans-badge-danger' }
    default: return { text: status, className: 'plans-badge-muted' }
  }
}

export function AddWebsitesForm({ existingWebsites = [] }: { existingWebsites?: ExistingWebsite[] }): React.ReactElement {
  const [targets, setTargets] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateTarget(index: number, value: string): void {
    setTargets(prev => prev.map((t, i) => (i === index ? value : t)))
  }

  function addRow(): void {
    setTargets(prev => [...prev, ''])
  }

  function removeRow(index: number): void {
    setTargets(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== index))
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    startTransition(async () => {
      const result = await addWebsitesAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  const form = (
    <form action={handleSubmit} className="ac-form websites-add-card">
      <div className="pro-plan-section-header">
        <div>
          <div className="pro-plan-section-title">Add website(s)</div>
          <div className="pro-plan-section-sub">You&apos;ll choose which ones to subscribe to next</div>
        </div>
      </div>

      {error && (
        <div className="ac-form-error">
          {error}
        </div>
      )}

      <div className="ac-form-section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {targets.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                name="target"
                placeholder="example.com"
                value={t}
                onChange={e => updateTarget(i, e.target.value)}
                disabled={isPending}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeRow(i)}
                disabled={isPending}
                aria-label="Remove website"
                style={{ padding: '0 12px' }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={addRow}
          disabled={isPending}
          style={{ marginBottom: 16, fontSize: 13, padding: '6px 10px' }}
        >
          + Add another website
        </button>
      </div>

      <div className="ac-form-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add & Continue to Plans'}
        </button>
      </div>
    </form>
  )

  if (existingWebsites.length === 0) {
    return <div className="websites-columns websites-columns-solo">{form}</div>
  }

  return (
    <div className="websites-columns">
      <div className="pro-plan-card websites-existing-card">
        <div className="pro-plan-section-header">
          <div>
            <div className="pro-plan-section-title">Your websites</div>
            <div className="pro-plan-section-sub">{existingWebsites.length} website{existingWebsites.length === 1 ? '' : 's'} added</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {existingWebsites.map(w => {
            const status = statusLabel(w.status)
            return (
              <div key={w.domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{w.domain}</span>
                <span className={`plans-badge ${status.className}`}>{status.text}</span>
              </div>
            )
          })}
        </div>
      </div>

      {form}
    </div>
  )
}
