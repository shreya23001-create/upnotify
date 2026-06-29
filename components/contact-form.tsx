'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type State = 'idle' | 'submitting' | 'sent' | 'error'

interface FieldErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const SUBJECTS = [
  'General Enquiry',
  'Agency Enquiry',
  'Partnership',
  'Billing',
  'Feature Request',
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(name: string, email: string, subject: string, message: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'Name is required.'
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'
  if (!email.trim()) errors.email = 'Email address is required.'
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!subject) errors.subject = 'Please select a subject.'
  if (!message.trim()) errors.message = 'Message is required.'
  else if (message.trim().length < 10) errors.message = 'Message must be at least 10 characters.'
  return errors
}

export function ContactForm(): React.ReactElement {
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [verifiedStatus, setVerifiedStatus] = useState<'true' | 'already' | 'expired' | 'invalid' | null>(null)

  useEffect(() => {
    const v = searchParams.get('verified') as 'true' | 'already' | null
    const e = searchParams.get('error') as 'expired' | 'invalid' | null
    if (v) setVerifiedStatus(v)
    if (e) setVerifiedStatus(e)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    const form = e.currentTarget
    const nameVal    = (form.elements.namedItem('name')    as HTMLInputElement).value
    const emailVal   = (form.elements.namedItem('email')   as HTMLInputElement).value
    const subjectVal = (form.elements.namedItem('subject') as HTMLSelectElement).value
    const messageVal = (form.elements.namedItem('message') as HTMLTextAreaElement).value

    const errors = validate(nameVal, emailVal, subjectVal, messageVal)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setState('submitting')

    const payload = {
      name:    nameVal,
      email:   emailVal,
      subject: subjectVal,
      message: messageVal,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      let data: { success?: boolean; error?: string } = {}
      try { data = await res.json() as typeof data } catch { /* non-JSON response (e.g. 504 HTML) */ }
      if (data.success) {
        setState('sent')
      } else {
        setErrorMsg(data.error ?? (res.ok ? 'Something went wrong. Please try again.' : `Server error (${res.status}). Please try again.`))
        setState('error')
      }
    } catch {
      setErrorMsg('Unable to reach the server. Please check your connection and try again.')
      setState('error')
    }
  }

  // Post-verification redirect states
  if (verifiedStatus === 'true') {
    return (
      <div className="contact-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Message sent!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Your message has been confirmed and delivered to our team. We&apos;ll get back to you soon.
        </p>
      </div>
    )
  }

  if (verifiedStatus === 'already') {
    return (
      <div className="contact-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>ℹ️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Already confirmed</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>This message was already verified and sent to our team.</p>
      </div>
    )
  }

  if (verifiedStatus === 'expired') {
    return (
      <div className="contact-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirmation link expired</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>
          The confirmation link expired after 24 hours. Please submit your message again.
        </p>
        <button onClick={() => setVerifiedStatus(null)} className="btn btn-primary">Try Again</button>
      </div>
    )
  }

  if (state === 'sent') {
    return (
      <div className="contact-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your inbox</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          We&apos;ve sent a confirmation link to your email. Click it to send your message to our team.
          The link expires in 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form-row">
        <label htmlFor="contact-name" className="contact-label">Your Name</label>
        <input
          type="text" id="contact-name" name="name"
          className={`contact-input${fieldErrors.name ? ' input-error' : ''}`}
          placeholder="Jane Smith" minLength={2} maxLength={100}
          onChange={() => fieldErrors.name && setFieldErrors(p => ({ ...p, name: undefined }))}
        />
        {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-email" className="contact-label">Email Address</label>
        <input
          type="email" id="contact-email" name="email"
          className={`contact-input${fieldErrors.email ? ' input-error' : ''}`}
          placeholder="jane@company.com"
          onChange={() => fieldErrors.email && setFieldErrors(p => ({ ...p, email: undefined }))}
        />
        {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-subject" className="contact-label">Subject</label>
        <select
          id="contact-subject" name="subject"
          className={`contact-input${fieldErrors.subject ? ' input-error' : ''}`}
          defaultValue=""
          onChange={() => fieldErrors.subject && setFieldErrors(p => ({ ...p, subject: undefined }))}
        >
          <option value="" disabled>Select a subject</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {fieldErrors.subject && <p className="field-error">{fieldErrors.subject}</p>}
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-message" className="contact-label">Message</label>
        <textarea
          id="contact-message" name="message"
          className={`contact-input contact-textarea${fieldErrors.message ? ' input-error' : ''}`}
          placeholder="Tell us how we can help..." rows={6} minLength={10} maxLength={5000}
          onChange={() => fieldErrors.message && setFieldErrors(p => ({ ...p, message: undefined }))}
        />
        {fieldErrors.message && <p className="field-error">{fieldErrors.message}</p>}
      </div>

      {state === 'error' && (
        <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{errorMsg}</p>
      )}

      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}
        disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
        You&apos;ll receive a confirmation email before your message is delivered.
      </p>
    </form>
  )
}
