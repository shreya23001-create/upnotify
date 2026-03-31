'use client'

import { useState, useTransition } from 'react'
import type { Organisation } from '@/lib/types'

const timezones = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'UTC', label: 'UTC' },
]

export function OrgSettingsForm({ organisation }: { organisation: Organisation }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/organisation', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('name'),
            slug: formData.get('slug'),
            timezone: formData.get('timezone'),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to save')
        } else {
          setSuccess(true)
        }
      } catch {
        setError('Something went wrong')
      }
    })
  }

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Organisation Details</div></div>
      <div className="card-content">
        {error && <div className="form-error">{error}</div>}
        {success && <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: 14, marginBottom: 16 }}>Organisation updated!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="org-name">Organisation Name</label>
            <input className="form-input" id="org-name" name="name" defaultValue={organisation.name} required disabled={isPending} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-slug">Slug (URL identifier)</label>
            <input className="form-input" id="org-slug" name="slug" defaultValue={organisation.slug} required disabled={isPending} style={{ fontFamily: 'monospace' }} />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Used in URLs. Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-type">Account Type</label>
            <input className="form-input" id="org-type" defaultValue={organisation.type} disabled style={{ textTransform: 'capitalize', background: '#f8f9fc' }} />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Contact support to change account type.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-timezone">Timezone</label>
            <select className="form-select" id="org-timezone" name="timezone" defaultValue={organisation.timezone} disabled={isPending}>
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>All timestamps and reports will use this timezone.</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
