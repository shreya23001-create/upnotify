'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface InviteDetails {
  id: string
  email: string
  role: string
  org_name?: string
  expires_at: string
}

type PageStatus = 'loading' | 'found' | 'not-found' | 'accepting' | 'accepted' | 'error' | 'not-authenticated'

export default function AcceptInvitePage(): React.ReactElement {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<PageStatus>('loading')
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setStatus('not-found'))
      return
    }

    async function loadInvite(): Promise<void> {
      try {
        const res = await fetch(`/api/v1/team/invite-details?token=${encodeURIComponent(token ?? '')}`)
        if (res.status === 401) {
          // User not logged in — store token and redirect to signup
          if (typeof window !== 'undefined') {
            localStorage.setItem('uptrue_invite_token', token ?? '')
          }
          setStatus('not-authenticated')
          return
        }
        if (!res.ok) {
          setStatus('not-found')
          return
        }
        const data = (await res.json()) as { invite: InviteDetails }
        setInvite(data.invite)
        setStatus('found')
      } catch {
        setStatus('not-found')
      }
    }

    void loadInvite()
  }, [token])

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!token) return
    setStatus('accepting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/v1/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error ?? 'Failed to accept invite.')
        setStatus('error')
        return
      }

      // Clear stored token if any
      if (typeof window !== 'undefined') {
        localStorage.removeItem('uptrue_invite_token')
      }

      setStatus('accepted')
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('error')
    }
  }, [token, router])

  const handleDecline = useCallback((): void => {
    router.push('/')
  }, [router])

  const handleSignup = useCallback((): void => {
    router.push(`/signup?next=${encodeURIComponent(`/invite/accept?token=${token ?? ''}`)}`)
  }, [router, token])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary, #f4f4f7)',
      padding: '24px 16px',
    }}>
      <div style={{
        maxWidth: 460,
        width: '100%',
        background: 'var(--bg-primary, #ffffff)',
        borderRadius: 12,
        padding: '40px 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary, #111827)',
          marginBottom: 8,
          letterSpacing: '-0.3px',
        }}>
          Upnotify
        </div>

        {status === 'loading' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14 }}>
              Loading invite details...
            </p>
          </div>
        )}

        {status === 'not-found' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary, #111827)',
              marginBottom: 8,
            }}>
              Invite Not Found
            </p>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14, lineHeight: 1.6 }}>
              This invite link is invalid, has expired, or has already been used.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push('/login')}
              style={{ marginTop: 20 }}
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'not-authenticated' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary, #111827)',
              marginBottom: 8,
            }}>
              Sign Up to Accept
            </p>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              You need an Upnotify account to accept this invite.
              Sign up or log in, and we will automatically accept the invite.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleSignup}
              style={{ marginRight: 12 }}
            >
              Sign Up
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => router.push(`/login?next=${encodeURIComponent(`/invite/accept?token=${token ?? ''}`)}`)}
            >
              Log In
            </button>
          </div>
        )}

        {status === 'found' && invite && (
          <div style={{ padding: '24px 0' }}>
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary, #111827)',
              marginBottom: 16,
            }}>
              You have been invited!
            </p>
            <div style={{
              background: 'var(--bg-muted, #f9fafb)',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>Organisation</span>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary, #111827)' }}>
                  {invite.org_name ?? 'Unknown'}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>Role</span>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary, #111827)', textTransform: 'capitalize' }}>
                  {invite.role}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>Expires</span>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary, #111827)' }}>
                  {new Date(invite.expires_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => { void handleAccept() }}
              >
                Accept Invite
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleDecline}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {status === 'accepting' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14 }}>
              Accepting invite...
            </p>
          </div>
        )}

        {status === 'accepted' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#059669',
              marginBottom: 8,
            }}>
              Invite Accepted
            </p>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14 }}>
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '32px 0' }}>
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: 8,
            }}>
              Something went wrong
            </p>
            <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 14, marginBottom: 20 }}>
              {errorMessage}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => { void handleAccept() }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
