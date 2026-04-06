'use client'

import { useState, useTransition } from 'react'
import { updateAlertChannelAction } from '@/app/(dashboard)/dashboard/alerts/actions'
import type { AlertChannel } from '@/lib/types'

const severities = [
  { value: 'P1', label: 'P1 — Critical' },
  { value: 'P2', label: 'P2 — High' },
  { value: 'P3', label: 'P3 — Medium' },
  { value: 'P4', label: 'P4 — Low' },
]

const typeLabels: Record<string, string> = {
  email: '📧 Email',
  slack: '💬 Slack',
  teams: '👥 Microsoft Teams',
  webhook: '🔗 Webhook',
  telegram: '📱 Telegram',
  whatsapp: '📱 WhatsApp',
  voice: '📞 Voice',
}

interface ChannelConfig {
  email?: string
  slackWebhookUrl?: string
  slackChannel?: string
  teamsWebhookUrl?: string
  webhookUrl?: string
  webhookSecret?: string
  telegramChatId?: string
}

export function EditAlertChannelForm({ channel }: { channel: AlertChannel }) {
  const config = channel.config as ChannelConfig
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(
    (channel.severity_filter as string[]) || ['P1', 'P2', 'P3', 'P4']
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleSeverity(sev: string): void {
    setSelectedSeverities(prev =>
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    )
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('type', channel.type)
    formData.set('severity_filter', selectedSeverities.join(','))
    startTransition(async () => {
      const result = await updateAlertChannelAction(channel.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Channel Type</label>
        <div style={{ padding: '12px 16px', background: '#f8f9fc', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#64748b' }}>
          {typeLabels[channel.type] || channel.type}
          <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, color: '#94a3b8' }}>(cannot be changed)</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Channel Name</label>
        <input className="form-input" name="name" required defaultValue={channel.name} disabled={isPending} />
      </div>

      {channel.type === 'email' && (
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" name="email" type="email" required defaultValue={config.email || ''} disabled={isPending} />
        </div>
      )}

      {channel.type === 'slack' && (
        <>
          <div className="form-group">
            <label className="form-label">Slack Webhook URL</label>
            <input className="form-input" name="slackWebhookUrl" required defaultValue={config.slackWebhookUrl || ''} disabled={isPending} />
          </div>
          <div className="form-group">
            <label className="form-label">Channel (optional)</label>
            <input className="form-input" name="slackChannel" defaultValue={config.slackChannel || ''} disabled={isPending} />
          </div>
        </>
      )}

      {channel.type === 'teams' && (
        <div className="form-group">
          <label className="form-label">Teams Webhook URL</label>
          <input className="form-input" name="teamsWebhookUrl" required defaultValue={config.teamsWebhookUrl || ''} disabled={isPending} />
        </div>
      )}

      {channel.type === 'telegram' && (
        <div className="form-group">
          <label className="form-label">Your Telegram Chat ID</label>
          <input className="form-input" name="telegramChatId" required defaultValue={config.telegramChatId || ''} disabled={isPending} placeholder="e.g. 123456789" />
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Get your Chat ID from @userinfobot on Telegram.</p>
        </div>
      )}

      {channel.type === 'webhook' && (
        <>
          <div className="form-group">
            <label className="form-label">Webhook URL</label>
            <input className="form-input" name="webhookUrl" required defaultValue={config.webhookUrl || ''} disabled={isPending} />
          </div>
          <div className="form-group">
            <label className="form-label">Secret (for HMAC signing, optional)</label>
            <input className="form-input" name="webhookSecret" defaultValue={config.webhookSecret || ''} disabled={isPending} />
          </div>
        </>
      )}

      <div className="form-group">
        <label className="form-label">Severity Filter</label>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>Select which severities trigger this channel</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {severities.map(sev => (
            <button
              key={sev.value}
              type="button"
              onClick={() => toggleSeverity(sev.value)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: selectedSeverities.includes(sev.value) ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                background: selectedSeverities.includes(sev.value) ? '#f0f4ff' : '#fff',
                color: selectedSeverities.includes(sev.value) ? '#667eea' : '#94a3b8',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {sev.label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
