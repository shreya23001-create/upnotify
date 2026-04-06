'use client'

import { useState, useTransition } from 'react'
import { createAlertChannelAction } from '@/app/(dashboard)/dashboard/alerts/actions'

const channelTypes = [
  { value: 'email', label: '\u{1F4E7} Email', description: 'Send alerts to an email address' },
  { value: 'slack', label: '\u{1F4AC} Slack', description: 'Send alerts to a Slack channel via webhook' },
  { value: 'teams', label: '\u{1F465} Microsoft Teams', description: 'Send alerts to a Teams channel' },
  { value: 'webhook', label: '\u{1F517} Webhook', description: 'Send alerts to a custom URL with HMAC signing' },
  { value: 'telegram', label: '\u{1F4F1} Telegram', description: 'Instant alerts via Telegram — free on all plans' },
]

const severities = [
  { value: 'P1', label: 'P1 \u2014 Critical' },
  { value: 'P2', label: 'P2 \u2014 High' },
  { value: 'P3', label: 'P3 \u2014 Medium' },
  { value: 'P4', label: 'P4 \u2014 Low' },
]

export function CreateAlertChannelForm() {
  const [type, setType] = useState('email')
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['P1', 'P2', 'P3', 'P4'])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleSeverity(sev: string): void {
    setSelectedSeverities(prev =>
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    )
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('severity_filter', selectedSeverities.join(','))
    startTransition(async () => {
      const result = await createAlertChannelAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Channel Name</label>
        <input
          className="form-input"
          name="name"
          required
          placeholder="e.g. Ops Team Email"
          disabled={isPending}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Channel Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {channelTypes.map(ct => (
            <label
              key={ct.value}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '14px 16px',
                border: type === ct.value ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: type === ct.value ? '#f0f4ff' : '#fff',
              }}
            >
              <input
                type="radio"
                name="type"
                value={ct.value}
                checked={type === ct.value}
                onChange={() => setType(ct.value)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{ct.label}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{ct.description}</span>
            </label>
          ))}
        </div>
      </div>

      {type === 'email' && (
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            name="email"
            type="email"
            required
            placeholder="alerts@example.com"
            disabled={isPending}
          />
        </div>
      )}

      {type === 'slack' && (
        <>
          <div className="form-group">
            <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0369a1' }}>How to get your Slack Webhook URL</p>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                <li>Go to <strong>api.slack.com/apps</strong> and click <strong>Create New App</strong></li>
                <li>Choose <strong>From scratch</strong>, name it (e.g. &ldquo;Uptrue Alerts&rdquo;), select your workspace</li>
                <li>In the left menu, click <strong>Incoming Webhooks</strong> and toggle it <strong>On</strong></li>
                <li>Click <strong>Add New Webhook to Workspace</strong> and choose the channel to post to</li>
                <li>Copy the <strong>Webhook URL</strong> (starts with <code>https://hooks.slack.com/services/</code>) and paste it below</li>
              </ol>
            </div>
            <label className="form-label">Slack Webhook URL</label>
            <input
              className="form-input"
              name="slackWebhookUrl"
              required
              placeholder="https://hooks.slack.com/services/..."
              disabled={isPending}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Channel (optional)</label>
            <input
              className="form-input"
              name="slackChannel"
              placeholder="#alerts"
              disabled={isPending}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              Override the default channel. Leave blank to use the channel you selected when creating the webhook.
            </p>
          </div>
        </>
      )}

      {type === 'teams' && (
        <div className="form-group">
          <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0369a1' }}>How to get your Microsoft Teams Webhook URL</p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <li>Open Microsoft Teams and go to the <strong>channel</strong> where you want alerts</li>
              <li>Click the <strong>&hellip; (More options)</strong> menu next to the channel name</li>
              <li>Select <strong>Connectors</strong> (or <strong>Edit</strong> &rarr; <strong>Connectors</strong>)</li>
              <li>Search for <strong>Incoming Webhook</strong> and click <strong>Add</strong> then <strong>Configure</strong></li>
              <li>Give it a name (e.g. &ldquo;Uptrue&rdquo;), optionally upload an icon, then click <strong>Create</strong></li>
              <li>Copy the <strong>Webhook URL</strong> shown and paste it below</li>
            </ol>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#0369a1' }}>
              <strong>Note:</strong> If you don&apos;t see Connectors, ask your Teams admin to enable the Incoming Webhook connector for your organisation.
            </p>
          </div>
          <label className="form-label">Teams Webhook URL</label>
          <input
            className="form-input"
            name="teamsWebhookUrl"
            required
            placeholder="https://outlook.office.com/webhook/..."
            disabled={isPending}
          />
        </div>
      )}

      {type === 'telegram' && (
        <div className="form-group">
          <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0369a1' }}>How to set up Telegram alerts</p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <li>Open Telegram and search for <strong>@uptrue_alerts_bot</strong></li>
              <li>Send it any message (e.g. <em>&quot;hello&quot;</em>) to start the chat</li>
              <li>Open <strong>@userinfobot</strong> in Telegram and send <strong>/start</strong></li>
              <li>It will reply with your <strong>Chat ID</strong> (a number like <code>123456789</code>)</li>
              <li>Paste your Chat ID below and save</li>
            </ol>
          </div>
          <label className="form-label">Your Telegram Chat ID</label>
          <input
            className="form-input"
            name="telegramChatId"
            required
            placeholder="e.g. 123456789"
            disabled={isPending}
          />
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            This is your personal Chat ID — not your username. Get it from @userinfobot.
          </p>
        </div>
      )}

      {type === 'webhook' && (
        <>
          <div className="form-group">
            <label className="form-label">Webhook URL</label>
            <input
              className="form-input"
              name="webhookUrl"
              required
              placeholder="https://your-api.com/webhook"
              disabled={isPending}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Secret (for HMAC signing, optional)</label>
            <input
              className="form-input"
              name="webhookSecret"
              placeholder="your-secret-key"
              disabled={isPending}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label className="form-label">Severity Filter</label>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
          Select which severities trigger this channel
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {severities.map(sev => (
            <button
              key={sev.value}
              type="button"
              onClick={() => toggleSeverity(sev.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: selectedSeverities.includes(sev.value)
                  ? '2px solid #667eea'
                  : '1.5px solid #e2e8f0',
                background: selectedSeverities.includes(sev.value) ? '#f0f4ff' : '#fff',
                color: selectedSeverities.includes(sev.value) ? '#667eea' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {sev.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isPending}
        style={{ marginTop: 8 }}
      >
        {isPending ? 'Creating...' : 'Create Channel'}
      </button>
    </form>
  )
}
