'use client'

import { useState, useCallback } from 'react'

interface TrackerSubscribeFormProps {
  monitorId: string
}

export function TrackerSubscribeForm({ monitorId }: TrackerSubscribeFormProps): React.ReactElement {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/v1/tracker/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId, email: trimmed }),
      })

      const data = await response.json() as { success: boolean; error?: string }

      if (data.success) {
        setStatus('success')
        setMessage('Subscribed. You will be notified when this site goes down.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }, [email, monitorId])

  return (
    <form onSubmit={handleSubmit} className="tracker-subscribe-form">
      <div className="tracker-subscribe-row">
        <input
          type="email"
          className="form-input tracker-subscribe-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
          required
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
      {status === 'success' && <p className="form-success">{message}</p>}
      {status === 'error' && <p className="form-error">{message}</p>}
    </form>
  )
}
