'use client'

import { useState, useTransition } from 'react'

type SubscribeMode = 'email' | 'slack' | 'teams' | 'webhook'

function ExpandableHelp({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <div className="status-webhook-info" style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          fontWeight: 600, fontSize: 13, color: 'var(--text-primary)',
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>
          {'\u25B6'}
        </span>
        {title}
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  )
}

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
          <ExpandableHelp title="How to get your Slack webhook URL">
            <ol style={{ paddingLeft: 20, lineHeight: 2, fontSize: 13 }}>
              <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>api.slack.com/apps</a> and click <strong>Create New App</strong></li>
              <li>Choose <strong>From scratch</strong>, name it (e.g. &quot;Uptrue Status&quot;), and select your workspace</li>
              <li>In the left sidebar, click <strong>Incoming Webhooks</strong></li>
              <li>Toggle <strong>Activate Incoming Webhooks</strong> to On</li>
              <li>Click <strong>Add New Webhook to Workspace</strong> at the bottom</li>
              <li>Select the channel where you want status updates posted</li>
              <li>Copy the webhook URL (starts with <code>https://hooks.slack.com/services/...</code>)</li>
              <li>Paste it into the field above</li>
            </ol>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Official docs:{' '}
              <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                api.slack.com/messaging/webhooks
              </a>
            </p>
          </ExpandableHelp>
        )}

        {mode === 'teams' && (
          <ExpandableHelp title="How to get your Microsoft Teams webhook URL">
            <ol style={{ paddingLeft: 20, lineHeight: 2, fontSize: 13 }}>
              <li>Open <strong>Microsoft Teams</strong> and go to the channel where you want status updates</li>
              <li>Click the <strong>...</strong> (more options) next to the channel name</li>
              <li>Select <strong>Connectors</strong> (or <strong>Workflows</strong> in newer versions)</li>
              <li>Search for <strong>Incoming Webhook</strong> and click <strong>Configure</strong></li>
              <li>Give it a name (e.g. &quot;Uptrue Status&quot;) and optionally upload an icon</li>
              <li>Click <strong>Create</strong></li>
              <li>Copy the webhook URL that is generated</li>
              <li>Paste it into the field above</li>
            </ol>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Official docs:{' '}
              <a href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                Microsoft Teams Incoming Webhook guide
              </a>
            </p>
          </ExpandableHelp>
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
