'use client'

import { useState, useRef } from 'react'

const COUNTRY_CODES = [
  { code: '+44', country: 'UK' },
  { code: '+1', country: 'US/CA' },
  { code: '+91', country: 'IN' },
  { code: '+92', country: 'PK' },
  { code: '+880', country: 'BD' },
  { code: '+84', country: 'VN' },
  { code: '+62', country: 'ID' },
  { code: '+63', country: 'PH' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'SA' },
  { code: '+65', country: 'SG' },
  { code: '+60', country: 'MY' },
  { code: '+234', country: 'NG' },
  { code: '+27', country: 'ZA' },
  { code: '+55', country: 'BR' },
  { code: '+52', country: 'MX' },
]

interface AgencyWaitlistPopupProps {
  isOpen: boolean
  onClose: () => void
}

interface FieldErrors {
  name?: string
  email?: string
  businessName?: string
  website?: string
  phone?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateFields(
  name: string, email: string, businessName: string,
  website: string, phoneNumber: string
): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'Name is required.'
  if (!email.trim()) errors.email = 'Email address is required.'
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!businessName.trim()) errors.businessName = 'Business name is required.'
  if (website.trim()) {
    try {
      const parsed = new URL(website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch {
      errors.website = 'Please enter a valid website URL (e.g. https://agency.com).'
    }
  }
  if (phoneNumber.trim() && !/^\d[\d\s\-]{5,14}$/.test(phoneNumber.trim())) {
    errors.phone = 'Please enter a valid phone number (digits only).'
  }
  return errors
}

export function AgencyWaitlistPopup({ isOpen, onClose }: AgencyWaitlistPopupProps): React.ReactElement | null {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCode, setPhoneCode] = useState('+44')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [website, setWebsite] = useState('')
  const [numClients, setNumClients] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  // Synchronous guard: state updates are async, so `disabled={submitting}` alone
  // does not stop a second submit fired before the re-render (#146 double submission).
  const inFlightRef = useRef(false)

  if (!isOpen) return null

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setResult(null)

    const errors = validateFields(name, email, businessName, website, phoneNumber)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    try {
      const res = await fetch('/api/v1/agency-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phoneNumber ? `${phoneCode}${phoneNumber}` : undefined,
          country: country.trim() || undefined,
          city: city.trim() || undefined,
          businessName: businessName.trim(),
          website: website.trim() || undefined,
          numClients: numClients ? Number(numClients) : undefined,
        }),
      })

      const data = await res.json() as { success?: boolean; message?: string; error?: string }

      if (data.success) {
        setResult({ type: 'success', text: data.message ?? 'You are on the list!' })
      } else {
        setResult({ type: 'error', text: data.error ?? 'Something went wrong.' })
      }
    } catch {
      setResult({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content popup-content-lg" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose} aria-label="Close">&times;</button>

        {result?.type === 'success' ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u2705'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You are on the list!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              Thank you for your interest in Uptrue Agency. We will review your application
              and be in touch within 48 hours.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 20 }}>Close</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Join the Agency Waitlist</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Uptrue Agency is coming soon. White-label monitoring, custom branding,
              and revenue sharing for agencies managing multiple client sites.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-name">Your Name *</label>
                  <input
                    id="aw-name" name="aw-name"
                    className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                    value={name}
                    onChange={e => { setName(e.target.value); clearFieldError('name') }}
                    placeholder="John Smith" disabled={submitting}
                  />
                  {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-email">Email *</label>
                  <input
                    id="aw-email" name="aw-email"
                    className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                    placeholder="john@agency.com" disabled={submitting}
                  />
                  {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select id="aw-phone-code" name="aw-phone-code" className="form-select" value={phoneCode} onChange={e => setPhoneCode(e.target.value)} style={{ width: 100, flexShrink: 0 }} disabled={submitting}>
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                      ))}
                    </select>
                    <input
                      id="aw-phone-number" name="aw-phone-number"
                      className={`form-input${fieldErrors.phone ? ' input-error' : ''}`}
                      value={phoneNumber}
                      onChange={e => { setPhoneNumber(e.target.value); clearFieldError('phone') }}
                      placeholder="7911123456" disabled={submitting}
                    />
                  </div>
                  {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-business-name">Business Name *</label>
                  <input
                    id="aw-business-name" name="aw-business-name"
                    className={`form-input${fieldErrors.businessName ? ' input-error' : ''}`}
                    value={businessName}
                    onChange={e => { setBusinessName(e.target.value); clearFieldError('businessName') }}
                    placeholder="Acme Digital Agency" disabled={submitting}
                  />
                  {fieldErrors.businessName && <p className="field-error">{fieldErrors.businessName}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-website">Website</label>
                  <input
                    id="aw-website" name="aw-website"
                    className={`form-input${fieldErrors.website ? ' input-error' : ''}`}
                    value={website}
                    onChange={e => { setWebsite(e.target.value); clearFieldError('website') }}
                    placeholder="https://agency.com" disabled={submitting}
                  />
                  {fieldErrors.website && <p className="field-error">{fieldErrors.website}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-num-clients">Number of Clients</label>
                  <input id="aw-num-clients" name="aw-num-clients" className="form-input" type="number" value={numClients} onChange={e => setNumClients(e.target.value)} placeholder="e.g. 50" min="1" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-country">Country</label>
                  <input id="aw-country" name="aw-country" className="form-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="United Kingdom" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aw-city">City</label>
                  <input id="aw-city" name="aw-city" className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="London" disabled={submitting} />
                </div>
              </div>

              {result?.type === 'error' && (
                <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{result.text}</p>
              )}

              <button className="btn btn-primary btn-full" type="submit" disabled={submitting} style={{ marginTop: 16 }}>
                {submitting ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
