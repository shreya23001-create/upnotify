'use client'

import { useState, useTransition } from 'react'

export function StatusSubscribeForm({ statusPageId }: { statusPageId: string }): React.ReactElement {
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
          setMessage('Subscribed! You will receive status updates via email.')
          setEmail('')
        } else {
          setError(data.error || 'Failed to subscribe')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="status-subscribe-form">
      {message && <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: 14, marginBottom: 12 }}>{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isPending}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
    </form>
  )
}
