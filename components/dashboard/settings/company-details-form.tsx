'use client'

import { useState, useTransition, useCallback } from 'react'
import type { Organisation } from '@/lib/types'

interface Props {
  organisation: Organisation
  onSave: (formData: FormData) => Promise<{ error?: string }>
}

type OrgRecord = Record<string, unknown>

interface FieldDef {
  key: string
  label: string
  type?: string
}

const FIELDS: FieldDef[] = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'billing_email', label: 'Billing Email', type: 'email' },
  { key: 'company_address_line1', label: 'Address Line 1' },
  { key: 'company_address_line2', label: 'Address Line 2' },
  { key: 'company_city', label: 'City' },
  { key: 'company_postcode', label: 'Postcode' },
  { key: 'company_country', label: 'Country' },
  { key: 'company_registration_number', label: 'Registration Number' },
  { key: 'company_vat_number', label: 'VAT Number' },
]

function getFieldValue(org: OrgRecord, key: string): string {
  return (org[key] as string) || ''
}

function hasAnyData(org: OrgRecord): boolean {
  return FIELDS.some(f => {
    const val = getFieldValue(org, f.key)
    return val.length > 0 && (f.key !== 'company_country' || val !== 'GB')
  })
}

export function CompanyDetailsForm({ organisation, onSave }: Props): React.ReactElement {
  const org = organisation as OrgRecord
  const [isEditing, setIsEditing] = useState(!hasAnyData(org))
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [savedOrg, setSavedOrg] = useState<OrgRecord>(org)

  const handleSubmit = useCallback((formData: FormData): void => {
    setError(null)
    setSuccessMessage(null)
    startTransition(async () => {
      const result = await onSave(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        // Update local state with saved values
        const updated: OrgRecord = { ...savedOrg }
        FIELDS.forEach(f => {
          updated[f.key] = formData.get(f.key) as string || ''
        })
        setSavedOrg(updated)
        setSuccessMessage('Company details saved successfully.')
        setIsEditing(false)
        // Auto-clear success message after 4 seconds
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    })
  }, [onSave, savedOrg])

  if (!isEditing) {
    return (
      <div>
        {successMessage && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--success-bg, #ecfdf5)', color: 'var(--success-text, #059669)', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{'\u2713'}</span> {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {FIELDS.map(f => {
            const val = getFieldValue(savedOrg, f.key)
            return (
              <div key={f.key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: val ? 'var(--text-primary, #e2e8f0)' : 'var(--text-secondary, #64748b)' }}>
                  {val || '\u2014'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Company Name <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
          <input className="form-input" name="company_name" required minLength={2} maxLength={100} defaultValue={getFieldValue(savedOrg, 'company_name')} disabled={isPending} placeholder="e.g. Acme Ltd" />
        </div>
        <div className="form-group">
          <label className="form-label">Billing Email</label>
          <input className="form-input" name="billing_email" type="email" maxLength={254} defaultValue={getFieldValue(savedOrg, 'billing_email')} disabled={isPending} placeholder="e.g. billing@acme.com" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address Line 1</label>
        <input className="form-input" name="company_address_line1" defaultValue={getFieldValue(savedOrg, 'company_address_line1')} disabled={isPending} />
      </div>
      <div className="form-group">
        <label className="form-label">Address Line 2</label>
        <input className="form-input" name="company_address_line2" defaultValue={getFieldValue(savedOrg, 'company_address_line2')} disabled={isPending} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" name="company_city" defaultValue={getFieldValue(savedOrg, 'company_city')} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Postcode</label>
          <input className="form-input" name="company_postcode" defaultValue={getFieldValue(savedOrg, 'company_postcode')} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-input" name="company_country" defaultValue={getFieldValue(savedOrg, 'company_country') || 'GB'} disabled={isPending} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Registration Number</label>
          <input className="form-input" name="company_registration_number" defaultValue={getFieldValue(savedOrg, 'company_registration_number')} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">VAT Number</label>
          <input className="form-input" name="company_vat_number" defaultValue={getFieldValue(savedOrg, 'company_vat_number')} disabled={isPending} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Company Details'}
        </button>
        {hasAnyData(savedOrg) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setIsEditing(false); setError(null) }}
            disabled={isPending}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
