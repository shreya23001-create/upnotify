'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  // Supabase's password-recovery link lands here with a `code` param that
  // needs exchanging for a session before updateUser({ password }) can work.
  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setSessionError(true)
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setSessionError(true)
      } else {
        setSessionReady(true)
      }
    })
  }, [])

  function handleSubmit(formData: FormData): void {
    setError(null)
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    })
  }

  if (sessionError) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <h2 className="auth-form-heading">Link expired</h2>
        <p className="auth-form-sub">This password reset link is invalid or has expired.</p>
        <p className="auth-switch" style={{ marginTop: 16 }}>
          <a href="/forgot-password">Request a new link</a>
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="auth-form-heading">Set a new password</div>
      <p className="auth-form-sub">Choose a new password for your account.</p>

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
          <label className="auth-label" htmlFor="password">New password</label>
          <input
            className="auth-input"
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            autoComplete="new-password"
            disabled={isPending || !sessionReady}
          />
        </div>
        <button type="submit" className="auth-submit" disabled={isPending || !sessionReady}>
          {isPending ? 'Updating…' : sessionReady ? 'Update Password →' : 'Verifying link…'}
        </button>
      </form>
    </>
  )
}
