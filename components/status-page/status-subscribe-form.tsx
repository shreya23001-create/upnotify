'use client'

import { useState, useTransition } from 'react'

export function StatusSubscribeForm({ statusPageId }: { statusPageId: string }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    setMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/status-pages/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusPageId, email }),
        })
        const data = await res.json()
        if (data.success) {
          setMessage('Subscribed! You will receive email notifications for incidents on this page.')
          setEmail('')
        } else {
          setError(data.error || 'Failed to subscribe. Please try again.')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="sp-subscribe">
      <div className="sp-subscribe-icon">
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h3>Get incident notifications</h3>
      <p>We&apos;ll notify you by email whenever there&apos;s an outage or incident on this status page.</p>
      {message && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-up-bg)', color: 'var(--color-up)', fontSize: 14, marginBottom: 'var(--space-3)' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-down-bg)', color: 'var(--color-down)', fontSize: 14, marginBottom: 'var(--space-3)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="sp-subscribe-row">
        <input
          className="sp-subscribe-input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isPending}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
          {isPending ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
    </div>
  )
}
