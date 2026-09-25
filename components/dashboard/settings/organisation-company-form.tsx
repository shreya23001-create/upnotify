'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Building2, Globe, MapPin, FileText } from 'lucide-react'
import { LogoUpload } from '@/components/ui/logo-upload'
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

type OrgRecord = Record<string, unknown>

interface Props {
  organisation: Organisation
  onUploadLogo: (base64Data: string) => Promise<{ error?: string }>
  onRemoveLogo: () => Promise<{ error?: string }>
  onSaveCompanyDetails: (formData: FormData) => Promise<{ error?: string }>
  canEdit: boolean
}

function getFieldValue(org: OrgRecord, key: string): string {
  return (org[key] as string) || ''
}

export function OrganisationCompanyForm({ organisation, onUploadLogo, onRemoveLogo, onSaveCompanyDetails, canEdit }: Props): React.ReactElement {
  const org = organisation as OrgRecord
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState(organisation.name)
  const [timezone, setTimezone] = useState(organisation.timezone)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const fieldsDisabled = isPending || !canEdit

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (!canEdit) return
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const [orgRes, companyResult] = await Promise.all([
          fetch('/api/v1/organisation', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.get('name'),
              timezone: formData.get('timezone'),
            }),
          }).then(async (res) => ({ ok: res.ok, data: await res.json() })),
          onSaveCompanyDetails(formData),
        ])

        if (!orgRes.ok) {
          setError(orgRes.data.error || 'Failed to save organisation details.')
          return
        }
        if (companyResult?.error) {
          setError(companyResult.error)
          return
        }

        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 4000)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }, [onSaveCompanyDetails, router, canEdit])

  return (
    <div className="stt-form-card stt-merged-card">
      <div className="stt-form-card-header">
        <div className="stt-form-card-title">
          <Building2 size={13} strokeWidth={2} />
          Company Details
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="stt-form-card-body stt-merged-body">
          {/* ── Logo sidebar (sticky within the panel) ── */}
          {canEdit && (
            <div className="stt-merged-sidebar">
              <LogoUpload currentLogoUrl={organisation.logo_url} orgName={organisation.name} onUpload={onUploadLogo} onRemove={onRemoveLogo} />
            </div>
          )}

          {/* ── Fields ── */}
          <div className="stt-merged-fields">
            {error && <div className="form-error">{error}</div>}

            {/* Basic Info */}
            <div className="stt-subsection">
              <div className="stt-subsection-label"><Building2 size={12} strokeWidth={2.25} /> Basic Info</div>
              <div className="stt-field-grid stt-field-grid--2">
                <div className="form-group">
                  <label className="form-label">Company Name <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                  <input className="form-input" name="name" required minLength={2} value={name} onChange={e => setName(e.target.value)} disabled={fieldsDisabled} placeholder="e.g. Acme Ltd" />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug (URL identifier)</label>
                  <input className="form-input" defaultValue={organisation.slug} disabled style={{ fontFamily: 'monospace', background: 'var(--bg-muted)' }} />
                  <p className="osf-hint">Contact support to change your workspace slug.</p>
                </div>
              </div>
              {canEdit && (
                <>
                  <div className="stt-field-grid stt-field-grid--2">
                    <div className="form-group">
                      <label className="form-label">Billing Email</label>
                      <input className="form-input" name="billing_email" type="email" maxLength={254} defaultValue={getFieldValue(org, 'billing_email')} disabled={fieldsDisabled} placeholder="e.g. billing@acme.com" autoComplete="off" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Type</label>
                      <input className="form-input" defaultValue={organisation.type} disabled style={{ textTransform: 'capitalize', background: 'var(--bg-muted)' }} />
                    </div>
                  </div>
                  <div className="stt-field-grid stt-field-grid--2">
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="form-select" name="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} disabled={fieldsDisabled}>
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                      <p className="osf-hint">Used for all timestamps and reports.</p>
                    </div>
                    <div />
                  </div>
                </>
              )}
            </div>

            {canEdit && (
              <>
                {/* Business Address */}
                <div className="stt-subsection">
                  <div className="stt-subsection-label"><MapPin size={12} strokeWidth={2.25} /> Business Address</div>
                  <div className="stt-field-grid stt-field-grid--2">
                    <div className="form-group">
                      <label className="form-label">Address Line 1</label>
                      <input className="form-input" name="company_address_line1" defaultValue={getFieldValue(org, 'company_address_line1')} disabled={fieldsDisabled} autoComplete="address-line1" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address Line 2</label>
                      <input className="form-input" name="company_address_line2" defaultValue={getFieldValue(org, 'company_address_line2')} disabled={fieldsDisabled} autoComplete="address-line2" />
                    </div>
                  </div>
                  <div className="stt-field-grid stt-field-grid--3">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="form-input" name="company_city" defaultValue={getFieldValue(org, 'company_city')} disabled={fieldsDisabled} autoComplete="address-level2" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Postcode</label>
                      <input className="form-input" name="company_postcode" defaultValue={getFieldValue(org, 'company_postcode')} disabled={fieldsDisabled} autoComplete="postal-code" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <div className="stt-input-icon-wrap">
                        <Globe size={13} strokeWidth={2} className="stt-input-icon" />
                        <input className="form-input stt-input-with-icon" name="company_country" defaultValue={getFieldValue(org, 'company_country') || 'GB'} disabled={fieldsDisabled} autoComplete="country" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Registration */}
                <div className="stt-subsection">
                  <div className="stt-subsection-label"><FileText size={12} strokeWidth={2.25} /> Business Registration</div>
                  <div className="stt-field-grid stt-field-grid--2">
                    <div className="form-group">
                      <label className="form-label">Registration Number</label>
                      <input className="form-input" name="company_registration_number" defaultValue={getFieldValue(org, 'company_registration_number')} disabled={fieldsDisabled} autoComplete="off" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">VAT Number</label>
                      <input className="form-input" name="company_vat_number" defaultValue={getFieldValue(org, 'company_vat_number')} disabled={fieldsDisabled} autoComplete="off" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {canEdit ? (
          <div className="stt-form-actions">
            {success && (
              <span className="stt-identity-badge" style={{ width: 'auto' }}>
                <CheckCircle2 size={12} strokeWidth={2.5} /> Saved
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.refresh()} disabled={fieldsDisabled}>
              Cancel
            </button>
            <button type="submit" className="stt-save-btn" disabled={fieldsDisabled}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <p className="osf-hint" style={{ padding: '0 16px 14px' }}>Only admins can edit company details.</p>
        )}
      </form>
    </div>
  )
}
