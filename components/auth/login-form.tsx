'use client'

import { useState, useEffect, useTransition } from 'react'
import { signInWithPassword, signUpWithPassword } from '@/lib/auth/actions'
import { PasswordInput } from './password-input'

const HINT_COOKIE = 'Upnotify_user_hint'

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
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hintEmail, setHintEmail] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    if (mode === 'login') setHintEmail(readEmailHint())
  }, [mode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError === 'auth_error') {
      setError('That link has expired or is invalid. Please sign in below.')
    } else if (urlError === 'no_code') {
      setError('Invalid link. Please sign in below.')
    }
  }, [])

  function getRefCode(): string | null {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('ref')
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('origin', window.location.origin)
    const ref = getRefCode()
    if (ref) formData.set('ref', ref)
    if (next) formData.set('next', next)
    const email = formData.get('email') as string

    startTransition(async () => {
      const result = mode === 'signup'
        ? await signUpWithPassword(formData)
        : await signInWithPassword(formData)
      if (result?.error) {
        setError(result.error)
      } else if (email) {
        setEmailHint(email)
      }
    })
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
        {mode === 'login' ? 'Sign in to your Upnotify account' : 'No credit card. 3 monitors free forever.'}
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

      <form action={handleSubmit} autoComplete="on">
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
        <div className="auth-input-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="auth-label" htmlFor="password">Password</label>
            {mode === 'login' && (
              <a href="/forgot-password" style={{ fontSize: 12 }}>Forgot password?</a>
            )}
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            disabled={isPending}
          />
        </div>
        {mode === 'signup' && (
          <label className="auth-terms-checkbox">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              required
              disabled={isPending}
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </span>
          </label>
        )}
        <button type="submit" className="auth-submit" disabled={isPending || (mode === 'signup' && !agreedToTerms)}>
          {isPending
            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
            : (mode === 'login' ? 'Log In →' : 'Create Free Account →')}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login'
          ? <><a href="/signup">Don&apos;t have an account? Sign up free</a></>
          : <><a href="/login">Already have an account? Sign in</a></>}
      </p>
      {mode === 'login' && (
        <p className="auth-terms">
          By continuing you agree to our{' '}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      )}
    </>
  )
}
