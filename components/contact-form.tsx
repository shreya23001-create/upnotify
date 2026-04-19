'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type State = 'idle' | 'submitting' | 'sent' | 'error'

const SUBJECTS = [
  'General Enquiry',
  'Agency Enquiry',
  'Partnership',
  'Billing',
  'Feature Request',
]

export function ContactForm(): React.ReactElement {
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [verifiedStatus, setVerifiedStatus] = useState<'true' | 'already' | 'expired' | 'invalid' | null>(null)

  useEffect(() => {
    const v = searchParams.get('verified') as 'true' | 'already' | null
    const e = searchParams.get('error') as 'expired' | 'invalid' | null
    if (v) setVerifiedStatus(v)
    if (e) setVerifiedStatus(e)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const payload = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        setState('sent')
      } else {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
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
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <label htmlFor="contact-name" className="contact-label">Your Name</label>
        <input type="text" id="contact-name" name="name" required className="contact-input" placeholder="Jane Smith" />
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-email" className="contact-label">Email Address</label>
        <input type="email" id="contact-email" name="email" required className="contact-input" placeholder="jane@company.com" />
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-subject" className="contact-label">Subject</label>
        <select id="contact-subject" name="subject" required className="contact-input" defaultValue="">
          <option value="" disabled>Select a subject</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-message" className="contact-label">Message</label>
        <textarea id="contact-message" name="message" required className="contact-input contact-textarea"
          placeholder="Tell us how we can help..." rows={6} maxLength={5000} />
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
