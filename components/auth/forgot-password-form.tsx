'use client'

import { useState, useTransition } from 'react'
import { requestPasswordReset } from '@/lib/auth/actions'

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('origin', window.location.origin)
    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (result?.error) setError(result.error)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h2 className="auth-form-heading">Check your email</h2>
        <p className="auth-form-sub">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <p className="auth-switch" style={{ marginTop: 16 }}>
          <a href="/login">Back to login</a>
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="auth-form-heading">Reset your password</div>
      <p className="auth-form-sub">Enter your email and we&apos;ll send you a reset link.</p>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 9, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      <form action={handleSubmit} autoComplete="on">
        <div className="auth-input-wrap">
          <label className="auth-label" htmlFor="email">Email address</label>
          <input
            className="auth-input"
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            maxLength={254}
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>
        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send Reset Link →'}
        </button>
      </form>

      <p className="auth-switch">
        <a href="/login">Back to login</a>
      </p>
    </>
  )
}
