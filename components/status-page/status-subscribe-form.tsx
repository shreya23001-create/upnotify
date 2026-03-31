'use client'

import { useState, useTransition } from 'react'

type SubscribeMode = 'email' | 'slack' | 'teams' | 'webhook'

const modes: { key: SubscribeMode; label: string; placeholder: string; inputType: string }[] = [
  { key: 'email', label: '📧 Email', placeholder: 'your@email.com', inputType: 'email' },
  { key: 'slack', label: '💬 Slack', placeholder: 'https://hooks.slack.com/services/...', inputType: 'url' },
  { key: 'teams', label: '👥 Teams', placeholder: 'https://outlook.office.com/webhook/...', inputType: 'url' },
  { key: 'webhook', label: '🔗 Webhook', placeholder: 'https://your-api.com/webhook', inputType: 'url' },
]

const webhookPayloadExample = `POST your-url
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
}`

export function StatusSubscribeForm({ statusPageId }: { statusPageId: string }) {
  const [mode, setMode] = useState<SubscribeMode>('email')
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentMode = modes.find(m => m.key === mode)!

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    setMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        const body: Record<string, string> = { statusPageId }
        if (mode === 'email') body.email = value
        else body.webhookUrl = value
        if (mode === 'slack') body.type = 'slack'
        if (mode === 'teams') body.type = 'teams'

        const res = await fetch('/api/v1/status-pages/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.success) {
          const messages: Record<SubscribeMode, string> = {
            email: 'Subscribed! You will receive status updates via email.',
            slack: 'Slack webhook registered! Status updates will be posted to your channel.',
            teams: 'Teams webhook registered! Status updates will be posted to your channel.',
            webhook: 'Webhook registered! You will receive POST requests on status changes.',
          }
          setMessage(messages[mode])
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
        {modes.map(m => (
          <button
            key={m.key}
            className={`status-subscribe-tab ${mode === m.key ? 'active' : ''}`}
            onClick={() => { setMode(m.key); setValue(''); setMessage(null); setError(null) }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="status-subscribe-form">
        {message && <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: 14, marginBottom: 12 }}>{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            type={currentMode.inputType}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={currentMode.placeholder}
            required
            disabled={isPending}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>

        {mode === 'slack' && (
          <div className="status-webhook-info">
            <p><strong>How to get your Slack webhook URL:</strong></p>
            <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>api.slack.com/apps</a> → Create New App</li>
              <li>Enable <strong>Incoming Webhooks</strong></li>
              <li>Add webhook to your channel and copy the URL</li>
            </ol>
          </div>
        )}

        {mode === 'teams' && (
          <div className="status-webhook-info">
            <p><strong>How to get your Teams webhook URL:</strong></p>
            <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>In Teams, go to your channel → <strong>Workflows</strong></li>
              <li>Search for &quot;Post to a channel when a webhook request is received&quot;</li>
              <li>Complete the setup and copy the URL</li>
            </ol>
          </div>
        )}

        {mode === 'webhook' && (
          <div className="status-webhook-info">
            <p><strong>Webhook Payload Format:</strong></p>
            <pre>{webhookPayloadExample}</pre>
          </div>
        )}
      </form>
    </div>
  )
}
