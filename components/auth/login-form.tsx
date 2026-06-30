'use client'

import { useState, useEffect, useTransition } from 'react'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth/actions'

const HINT_COOKIE = 'uptrue_user_hint'

function readEmailHint(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${HINT_COOKIE}=([^;]*)`))
  if (!match) return ''
  try { return decodeURIComponent(atob(match[1])) } catch { return '' }
}

function setEmailHint(email: string): void {
  const encoded = btoa(encodeURIComponent(email))
  document.cookie = `${HINT_COOKIE}=${encoded}; max-age=31536000; path=/; SameSite=Lax`
}

export function LoginForm({ mode = 'login', next }: { mode?: 'login' | 'signup'; next?: string }) {
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hintEmail, setHintEmail] = useState('')

  useEffect(() => {
    if (mode === 'login') setHintEmail(readEmailHint())
  }, [mode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError === 'auth_error') {
      setError('This magic link has expired or is invalid. Please request a new one below.')
    } else if (urlError === 'no_code') {
      setError('Invalid sign-in link. Please request a new magic link below.')
    }
  }, [])

  function getRefCode(): string | null {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('ref')
  }

  function handleEmailSubmit(formData: FormData): void {
    setError(null)
    formData.set('origin', window.location.origin)
    const ref = getRefCode()
    if (ref) formData.set('ref', ref)
    if (next) formData.set('next', next)
    const email = formData.get('email') as string
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (result.error) setError(result.error)
      else {
        if (email) setEmailHint(email)
        setEmailSent(true)
      }
    })
  }

  function handleGoogleClick(): void {
    setError(null)
    const ref = getRefCode()
    startTransition(async () => {
      const result = await signInWithGoogle(window.location.origin, ref ?? undefined, next ?? undefined)
      if (result.error) setError(result.error)
      else if (result.url) window.location.href = result.url
    })
  }

  if (emailSent) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h2 className="auth-form-heading">Check your email</h2>
        <p className="auth-form-sub">We sent you a magic link. Click it to sign in.</p>
        <button className="auth-submit" onClick={() => setEmailSent(false)} style={{ marginTop: 16 }}>
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Returning user banner — login only */}
      {mode === 'login' && (
        <div className="auth-returning-banner show">
          <div className="auth-returning-dot" />
          <div className="auth-returning-text">Welcome back — your monitors are running</div>
        </div>
      )}

      <div className="auth-form-heading">
        {mode === 'login' ? 'Welcome back' : 'Start monitoring free'}
      </div>
      <p className="auth-form-sub">
        {mode === 'login' ? 'Sign in to your Uptrue account' : 'No credit card. 3 monitors free forever.'}
      </p>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 9, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      {/* Google */}
      <button className="auth-google-btn" onClick={handleGoogleClick} disabled={isPending} type="button">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
      </button>

      {/* Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">
          {mode === 'login' ? 'or continue with email' : 'or use your email'}
        </span>
        <div className="auth-divider-line" />
      </div>

      {/* Email form */}
      <form action={handleEmailSubmit} autoComplete="on">
        {mode === 'signup' && (
          <div className="auth-input-wrap">
            <label className="auth-label" htmlFor="fullname">Full name</label>
            <input
              className="auth-input"
              id="fullname"
              name="fullname"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              maxLength={100}
              required
              disabled={isPending}
            />
          </div>
        )}
        <div className="auth-input-wrap">
          <label className="auth-label" htmlFor="email">
            {mode === 'signup' ? 'Work email' : 'Email address'}
          </label>
          <input
            key={hintEmail}
            className="auth-input"
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            defaultValue={hintEmail}
            maxLength={254}
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>
        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? 'Sending…' : mode === 'login' ? 'Send Magic Link →' : 'Create Free Account →'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login'
          ? <><a href="/signup">Don&apos;t have an account? Sign up free</a></>
          : <><a href="/login">Already have an account? Sign in</a></>}
      </p>
      <p className="auth-terms">
        By {mode === 'login' ? 'continuing' : 'signing up'} you agree to our{' '}
        <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </>
  )
}
