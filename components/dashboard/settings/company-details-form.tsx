'use client'

import { useState, useTransition } from 'react'
import type { Organisation } from '@/lib/types'

interface Props {
  organisation: Organisation
  onSave: (formData: FormData) => Promise<{ error?: string }>
}

export function CompanyDetailsForm({ organisation, onSave }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData): void {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await onSave(formData)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  const org = organisation as Record<string, unknown>

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      {success && (
        <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: 14, marginBottom: 16 }}>
          Company details saved!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="form-input" name="company_name" defaultValue={(org.company_name as string) || ''} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Billing Email</label>
          <input className="form-input" name="billing_email" type="email" defaultValue={(org.billing_email as string) || ''} disabled={isPending} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address Line 1</label>
        <input className="form-input" name="company_address_line1" defaultValue={(org.company_address_line1 as string) || ''} disabled={isPending} />
      </div>
      <div className="form-group">
        <label className="form-label">Address Line 2</label>
        <input className="form-input" name="company_address_line2" defaultValue={(org.company_address_line2 as string) || ''} disabled={isPending} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" name="company_city" defaultValue={(org.company_city as string) || ''} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Postcode</label>
          <input className="form-input" name="company_postcode" defaultValue={(org.company_postcode as string) || ''} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-input" name="company_country" defaultValue={(org.company_country as string) || 'GB'} disabled={isPending} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Registration Number</label>
          <input className="form-input" name="company_registration_number" defaultValue={(org.company_registration_number as string) || ''} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">VAT Number</label>
          <input className="form-input" name="company_vat_number" defaultValue={(org.company_vat_number as string) || ''} disabled={isPending} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Saving...' : 'Save Company Details'}
      </button>
    </form>
  )
}
