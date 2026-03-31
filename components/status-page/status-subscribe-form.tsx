'use client'

import { useState, useTransition } from 'react'

export function StatusSubscribeForm({ statusPageId }: { statusPageId: string }) {
  const [mode, setMode] = useState<'email' | 'webhook'>('email')
  const [value, setValue] = useState('')
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
          body: JSON.stringify({
            statusPageId,
            ...(mode === 'email' ? { email: value } : { webhookUrl: value }),
          }),
        })
        const data = await res.json()
        if (data.success) {
          setMessage(mode === 'email' ? 'Subscribed! You will receive status updates via email.' : 'Webhook registered! You will receive status updates via POST requests.')
          setValue('')
        } else {
          setError(data.error || 'Failed to subscribe')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div>
      <div className="status-subscribe-tabs">
        <button className={`status-subscribe-tab ${mode === 'email' ? 'active' : ''}`} onClick={() => setMode('email')}>📧 Email</button>
        <button className={`status-subscribe-tab ${mode === 'webhook' ? 'active' : ''}`} onClick={() => setMode('webhook')}>🔗 Webhook</button>
      </div>

      <form onSubmit={handleSubmit} className="status-subscribe-form">
        {message && <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: 14, marginBottom: 12 }}>{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            type={mode === 'email' ? 'email' : 'url'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={mode === 'email' ? 'your@email.com' : 'https://your-api.com/webhook'}
            required
            disabled={isPending}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
        {mode === 'webhook' && (
          <div className="status-webhook-info">
            <p><strong>Webhook Payload Format:</strong></p>
            <pre>{`POST your-url
Content-Type: application/json
X-Uptrue-Signature: sha256=<hmac>

{
  "event": "incident.created",
  "incident": {
    "id": "uuid",
    "title": "Monitor is down",
    "status": "investigating",
    "severity": "P1",
    "started_at": "2026-03-31T..."
  },
  "monitor": {
    "id": "uuid",
    "name": "My Website",
    "type": "http",
    "target": "https://example.com"
  },
  "timestamp": "2026-03-31T..."
}`}</pre>
          </div>
        )}
      </form>
    </div>
  )
}
