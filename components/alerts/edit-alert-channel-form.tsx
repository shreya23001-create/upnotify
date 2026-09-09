'use client'

import { useState, useTransition } from 'react'
import { Mail, Hash, Users, Webhook, Phone, MessageSquare, Send, AlertTriangle, Info } from 'lucide-react'
import { updateAlertChannelAction } from '@/app/(dashboard)/dashboard/alerts/actions'
import type { AlertChannel } from '@/lib/types'
import { MonitorScopeSelect, type MonitorOption } from './monitor-scope-select'
import { MultiEmailInput } from './multi-email-input'

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  email:    { label: 'Email',             icon: <Mail size={18} />,          color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  slack:    { label: 'Slack',             icon: <Hash size={18} />,          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  teams:    { label: 'Microsoft Teams',   icon: <Users size={18} />,         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  webhook:  { label: 'Webhook',           icon: <Webhook size={18} />,       color: '#0068DB', bg: 'rgba(0, 104, 219,0.12)' },
  telegram: { label: 'Telegram',          icon: <Send size={18} />,          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  whatsapp: { label: 'WhatsApp',          icon: <MessageSquare size={18} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  voice:    { label: 'Voice',             icon: <Phone size={18} />,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
}

const DEFAULT_META = { label: 'Channel', icon: <AlertTriangle size={18} />, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }

const SEVERITIES = [
  { value: 'P1', label: 'P1', desc: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { value: 'P2', label: 'P2', desc: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { value: 'P3', label: 'P3', desc: 'Medium',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { value: 'P4', label: 'P4', desc: 'Low',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
]

interface ChannelConfig {
  email?: string
  emails?: string[]
  slackWebhookUrl?: string
  slackChannel?: string
  teamsWebhookUrl?: string
  webhookUrl?: string
  webhookSecret?: string
  telegramChatId?: string
}

export function EditAlertChannelForm({ channel, monitors = [] }: { channel: AlertChannel; monitors?: MonitorOption[] }) {
  const config = channel.config as ChannelConfig
  const meta = TYPE_META[channel.type] ?? DEFAULT_META
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(
    (channel.severity_filter as string[]) || ['P1', 'P2', 'P3', 'P4']
  )
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>(
    (channel.monitor_ids as string[] | null) || []
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
    formData.set('monitor_ids', selectedMonitorIds.join(','))
    startTransition(async () => {
      const result = await updateAlertChannelAction(channel.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form className="ac-form" action={handleSubmit}>
      {error && (
        <div className="ac-form-error">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* Channel type pill — read-only */}
      <div className="ac-form-section">
        <div className="ac-form-type-pill" style={{ borderColor: meta.color + '40' }}>
          <div className="ac-form-type-icon" style={{ background: meta.bg, color: meta.color }}>
            {meta.icon}
          </div>
          <div className="ac-form-type-info">
            <span className="ac-form-type-label">{meta.label}</span>
            <span className="ac-form-type-hint">Channel type cannot be changed</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="ac-form-section">
        <label className="ac-form-label">Channel Name</label>
        <input
          className="form-input"
          name="name"
          required
          defaultValue={channel.name}
          disabled={isPending}
          placeholder="e.g. Ops Team Email"
        />
      </div>

      {/* Type-specific fields */}
      {channel.type === 'email' && (
        <MultiEmailInput
          primaryDefault={config.email || ''}
          extraDefaults={config.emails ?? []}
          disabled={isPending}
        />
      )}

      {channel.type === 'slack' && (
        <>
          <div className="ac-form-section">
            <div className="ac-form-info-box">
              <Info size={14} />
              <div>
                <strong>How to get your Slack Webhook URL</strong>
                <ol>
                  <li>Go to <strong>api.slack.com/apps</strong> → Create New App → From scratch</li>
                  <li>Enable <strong>Incoming Webhooks</strong> and add a webhook to your workspace</li>
                  <li>Copy the URL starting with <code>https://hooks.slack.com/services/</code></li>
                </ol>
              </div>
            </div>
            <label className="ac-form-label">Slack Webhook URL</label>
            <input
              className="form-input"
              name="slackWebhookUrl"
              required
              defaultValue={config.slackWebhookUrl || ''}
              disabled={isPending}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
          <div className="ac-form-section">
            <label className="ac-form-label">Channel <span className="ac-form-optional">optional</span></label>
            <input
              className="form-input"
              name="slackChannel"
              defaultValue={config.slackChannel || ''}
              disabled={isPending}
              placeholder="#alerts"
            />
            <p className="ac-form-hint">Leave blank to use the default channel set in the webhook.</p>
          </div>
        </>
      )}

      {channel.type === 'teams' && (
        <div className="ac-form-section">
          <div className="ac-form-info-box">
            <Info size={14} />
            <div>
              <strong>How to get your Teams Webhook URL</strong>
              <ol>
                <li>Open the Teams channel → <strong>… More options</strong> → <strong>Workflows</strong></li>
                <li>Search for <em>"Post to a channel when a webhook request is received"</em></li>
                <li>Complete the setup and copy the generated URL</li>
              </ol>
              <p className="ac-form-note">The URL starts with <code>https://prod-*.westus.logic.azure.com/...</code></p>
            </div>
          </div>
          <label className="ac-form-label">Teams Webhook URL</label>
          <input
            className="form-input"
            name="teamsWebhookUrl"
            required
            defaultValue={config.teamsWebhookUrl || ''}
            disabled={isPending}
            placeholder="https://prod-xx.westus.logic.azure.com/workflows/..."
          />
        </div>
      )}

      {channel.type === 'telegram' && (
        <div className="ac-form-section">
          <div className="ac-form-info-box">
            <Info size={14} />
            <div>
              <strong>How to set up Telegram alerts</strong>
              <ol>
                <li>Search for <strong>@upnotify_alerts_bot</strong> on Telegram and send any message</li>
                <li>Open <strong>@userinfobot</strong> and send <strong>/start</strong> to get your Chat ID</li>
                <li>Paste your Chat ID below</li>
              </ol>
            </div>
          </div>
          <label className="ac-form-label">Telegram Chat ID</label>
          <input
            className="form-input"
            name="telegramChatId"
            required
            defaultValue={config.telegramChatId || ''}
            disabled={isPending}
            placeholder="e.g. 123456789"
          />
          <p className="ac-form-hint">This is your numeric Chat ID, not your username.</p>
        </div>
      )}

      {channel.type === 'webhook' && (
        <>
          <div className="ac-form-section">
            <label className="ac-form-label">Webhook URL</label>
            <input
              className="form-input"
              name="webhookUrl"
              required
              defaultValue={config.webhookUrl || ''}
              disabled={isPending}
              placeholder="https://your-api.com/webhook"
            />
          </div>
          <div className="ac-form-section">
            <label className="ac-form-label">Signing Secret <span className="ac-form-optional">optional</span></label>
            <input
              className="form-input"
              name="webhookSecret"
              defaultValue={config.webhookSecret || ''}
              disabled={isPending}
              placeholder="your-secret-key"
            />
            <p className="ac-form-hint">Used for HMAC-SHA256 signature verification on your endpoint.</p>
          </div>
        </>
      )}

      {/* Monitor scope */}
      <div className="ac-form-section">
        <label className="ac-form-label">Monitor <span className="ac-form-optional">optional</span></label>
        <p className="ac-form-sublabel">Choose which monitor sends alerts to this channel. Leave as &quot;All monitors&quot; to apply to everything.</p>
        <MonitorScopeSelect
          monitors={monitors}
          selected={selectedMonitorIds}
          onChange={setSelectedMonitorIds}
          disabled={isPending}
        />
      </div>

      {/* Severity filter */}
      <div className="ac-form-section">
        <label className="ac-form-label">Severity Filter</label>
        <p className="ac-form-sublabel">Select which alert severities trigger this channel</p>
        <div className="ac-sev-grid">
          {SEVERITIES.map(sev => {
            const active = selectedSeverities.includes(sev.value)
            return (
              <button
                key={sev.value}
                type="button"
                onClick={() => toggleSeverity(sev.value)}
                className={`ac-sev-btn${active ? ' ac-sev-btn--active' : ''}`}
                style={active ? { borderColor: sev.color, background: sev.bg, color: sev.color } : {}}
              >
                <span className="ac-sev-badge" style={{ background: active ? sev.color : 'var(--border-primary)', color: '#fff' }}>
                  {sev.label}
                </span>
                <span className="ac-sev-desc">{sev.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="ac-form-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <a href="/dashboard/alerts" className="btn btn-secondary">Cancel</a>
      </div>
    </form>
  )
}
