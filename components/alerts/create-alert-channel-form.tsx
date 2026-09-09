'use client'

import { useState, useTransition } from 'react'
import { Mail, Hash, Users, Webhook, Phone, MessageSquare, Send, AlertTriangle, Info } from 'lucide-react'
import { createAlertChannelAction } from '@/app/(dashboard)/dashboard/alerts/actions'
import { MonitorScopeSelect, type MonitorOption } from './monitor-scope-select'
import { MultiEmailInput } from './multi-email-input'

const CHANNEL_TYPES = [
  { value: 'email',    label: 'Email',           desc: 'Send alerts to an email address',           icon: <Mail size={18} />,          color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { value: 'slack',    label: 'Slack',            desc: 'Post to a Slack channel via webhook',        icon: <Hash size={18} />,          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'teams',    label: 'Microsoft Teams',  desc: 'Send alerts to a Teams channel',             icon: <Users size={18} />,         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', disabled: true },
  { value: 'webhook',  label: 'Webhook',          desc: 'POST to any URL with HMAC signing',          icon: <Webhook size={18} />,       color: '#0068DB', bg: 'rgba(0, 104, 219,0.12)' },
  { value: 'telegram', label: 'Telegram',         desc: 'Instant alerts via Telegram — all plans',   icon: <Send size={18} />,          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
]

const SEVERITIES = [
  { value: 'P1', label: 'P1', desc: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { value: 'P2', label: 'P2', desc: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { value: 'P3', label: 'P3', desc: 'Medium',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { value: 'P4', label: 'P4', desc: 'Low',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
]

export function CreateAlertChannelForm({ monitors = [] }: { monitors?: MonitorOption[] }) {
  const [type, setType] = useState('email')
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['P1', 'P2', 'P3', 'P4'])
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([])
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
    formData.set('monitor_ids', selectedMonitorIds.join(','))
    startTransition(async () => {
      const result = await createAlertChannelAction(formData)
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

      {/* Channel Name */}
      <div className="ac-form-section">
        <label className="ac-form-label">Channel Name</label>
        <input
          className="form-input"
          name="name"
          required
          placeholder="e.g. Ops Team Email"
          disabled={isPending}
        />
      </div>

      {/* Channel Type picker */}
      <div className="ac-form-section">
        <label className="ac-form-label">Channel Type</label>
        <div className="ac-type-grid">
          {CHANNEL_TYPES.map(ct => (
            <label
              key={ct.value}
              className={`ac-type-card${type === ct.value ? ' ac-type-card--active' : ''}${ct.disabled ? ' ac-type-card--disabled' : ''}`}
              style={type === ct.value ? { borderColor: ct.color, background: ct.bg + '60' } : {}}
              title={ct.disabled ? 'Currently unavailable' : undefined}
            >
              <input
                type="radio"
                name="type"
                value={ct.value}
                checked={type === ct.value}
                onChange={() => { if (!ct.disabled) setType(ct.value) }}
                disabled={ct.disabled}
                style={{ display: 'none' }}
              />
              <div
                className="ac-type-card-icon"
                style={{ background: ct.bg, color: ct.color }}
              >
                {ct.icon}
              </div>
              <div className="ac-type-card-info">
                <span className="ac-type-card-label">{ct.label}</span>
                <span className="ac-type-card-desc">{ct.disabled ? 'Currently unavailable' : ct.desc}</span>
              </div>
              {type === ct.value && (
                <div className="ac-type-card-check" style={{ background: ct.color }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Email */}
      {type === 'email' && (
        <MultiEmailInput disabled={isPending} />
      )}

      {/* Slack */}
      {type === 'slack' && (
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
              placeholder="https://hooks.slack.com/services/..."
              disabled={isPending}
            />
          </div>
          <div className="ac-form-section">
            <label className="ac-form-label">Channel <span className="ac-form-optional">optional</span></label>
            <input
              className="form-input"
              name="slackChannel"
              placeholder="#alerts"
              disabled={isPending}
            />
            <p className="ac-form-hint">Leave blank to use the default channel set in the webhook.</p>
          </div>
        </>
      )}

      {/* Teams */}
      {type === 'teams' && (
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
              <p className="ac-form-note">URL starts with <code>https://prod-*.westus.logic.azure.com/...</code></p>
            </div>
          </div>
          <label className="ac-form-label">Teams Webhook URL</label>
          <input
            className="form-input"
            name="teamsWebhookUrl"
            required
            placeholder="https://prod-xx.westus.logic.azure.com/workflows/..."
            disabled={isPending}
          />
        </div>
      )}

      {/* Telegram */}
      {type === 'telegram' && (
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
            placeholder="e.g. 123456789"
            disabled={isPending}
          />
          <p className="ac-form-hint">This is your numeric Chat ID, not your username.</p>
        </div>
      )}

      {/* Webhook */}
      {type === 'webhook' && (
        <>
          <div className="ac-form-section">
            <label className="ac-form-label">Webhook URL</label>
            <input
              className="form-input"
              name="webhookUrl"
              required
              placeholder="https://your-api.com/webhook"
              disabled={isPending}
            />
          </div>
          <div className="ac-form-section">
            <label className="ac-form-label">Signing Secret <span className="ac-form-optional">optional</span></label>
            <input
              className="form-input"
              name="webhookSecret"
              placeholder="your-secret-key"
              disabled={isPending}
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
          {isPending ? 'Creating…' : 'Create Channel'}
        </button>
        <a href="/dashboard/alerts" className="btn btn-secondary">Cancel</a>
      </div>
    </form>
  )
}
