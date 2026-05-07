'use client'

import { useState, useTransition } from 'react'
import { generateReportAction } from '@/app/(dashboard)/dashboard/reports/actions'
import { CustomSelect } from '@/components/ui/custom-select'

const SCHEDULE_OPTIONS = [
  { value: 'on_demand', label: 'On Demand', icon: '⚡' },
  { value: 'monthly',   label: 'Monthly',   icon: '📅' },
  { value: 'custom',    label: 'Custom',     icon: '✏️' },
]

const REPORT_TYPE_OPTIONS = [
  { value: 'uptime',                label: 'Uptime Report',           icon: '📊', group: 'Monitoring Reports' },
  { value: 'performance',           label: 'Performance Report',      icon: '⚡', group: 'Monitoring Reports' },
  { value: 'incident',              label: 'Incident Report',         icon: '🚨', group: 'Monitoring Reports' },
  { value: 'sla',                   label: 'SLA Compliance Report',   icon: '✅', group: 'Monitoring Reports' },
  { value: 'site-health',           label: 'Site Health Report',      icon: '🏥', group: 'Advanced Reports' },
  { value: 'security-audit',        label: 'Security Audit Report',   icon: '🛡️', group: 'Advanced Reports' },
  { value: 'availability-summary',  label: 'Availability Summary',    icon: '🗓️', group: 'Advanced Reports' },
  { value: 'change-digest',         label: 'Change Detection Digest', icon: '🔍', group: 'Advanced Reports' },
  { value: 'response-trend',        label: 'Response Time Trends',    icon: '📈', group: 'Advanced Reports' },
]

const DELIVERY_OPTIONS = [
  { value: 'dashboard', label: 'View in dashboard only', icon: '🖥️' },
  { value: 'email',     label: 'Send to email',           icon: '📧' },
  { value: 'webhook',   label: 'Send via webhook',        icon: '🔗' },
]

export function GenerateReportForm(): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [scheduleType, setScheduleType] = useState('on_demand')
  const [reportType, setReportType] = useState('uptime')
  const [delivery, setDelivery] = useState('dashboard')

  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  function setDates(start: Date, end: Date) {
    const s = document.getElementById('period_start') as HTMLInputElement | null
    const e = document.getElementById('period_end') as HTMLInputElement | null
    if (s) s.value = start.toISOString().split('T')[0]
    if (e) e.value = end.toISOString().split('T')[0]
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    startTransition(async () => {
      const result = await generateReportAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      {isPending && (
        <div className="report-generating-banner">
          <span className="report-generating-icon">✨</span>
          Generating report with AI summary… This may take 15–30 seconds.
        </div>
      )}

      <div className="report-form-grid">
        <div className="form-group">
          <label className="form-label">Schedule Type</label>
          <CustomSelect
            name="type"
            options={SCHEDULE_OPTIONS}
            value={scheduleType}
            onChange={setScheduleType}
            disabled={isPending}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Report Type</label>
          <CustomSelect
            name="report_type"
            options={REPORT_TYPE_OPTIONS}
            value={reportType}
            onChange={setReportType}
            disabled={isPending}
          />
          <span className="form-hint">
            Site Health: all checks per domain. Security Audit: posture score + risk analysis. Availability: uptime per domain. Change Digest: all changes detected. Response Trend: daily performance charts.
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Quick Select</label>
        <div className="report-quick-dates">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDates(lastMonthStart, lastMonthEnd)}>Last Month</button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDates(thisMonthStart, now)}>This Month</button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDates(new Date(Date.now() - 7 * 86400_000), now)}>Last 7 Days</button>
        </div>
      </div>

      <div className="report-form-grid">
        <div className="form-group">
          <label className="form-label">Period Start</label>
          <input className="form-input" id="period_start" name="period_start" type="date" required defaultValue={lastMonthStart.toISOString().split('T')[0]} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Period End</label>
          <input className="form-input" id="period_end" name="period_end" type="date" required defaultValue={lastMonthEnd.toISOString().split('T')[0]} disabled={isPending} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Deliver Report</label>
        <CustomSelect
          name="delivery"
          options={DELIVERY_OPTIONS}
          value={delivery}
          onChange={setDelivery}
          disabled={isPending}
        />
      </div>

      {delivery === 'email' && (
        <div className="form-group">
          <label className="form-label">Email Recipients</label>
          <input
            className="form-input"
            name="delivery_emails"
            type="text"
            placeholder="email1@example.com, email2@example.com"
            disabled={isPending}
          />
          <span className="form-hint">Comma-separated email addresses. Leave blank to send to your own email.</span>
        </div>
      )}

      {delivery === 'webhook' && (
        <div className="form-group">
          <label className="form-label">Webhook URL</label>
          <input
            className="form-input"
            name="delivery_webhook"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            disabled={isPending}
          />
          <span className="form-hint">Report sent as JSON POST with HMAC signature. Works with Slack, Teams, or any webhook receiver.</span>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Generating Report…' : 'Generate Report'}
        </button>
      </div>
    </form>
  )
}
