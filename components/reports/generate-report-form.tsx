'use client'

import { useState, useTransition } from 'react'
import { generateReportAction } from '@/app/(dashboard)/dashboard/reports/actions'

export function GenerateReportForm(): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Default to last month
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

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
        <div style={{ padding: 16, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 20, fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>
          Generating report with AI summary... This may take 15-30 seconds.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Schedule Type</label>
          <select className="form-select" name="type" disabled={isPending}>
            <option value="on_demand">On Demand</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Report Type</label>
          <select className="form-select" name="report_type" disabled={isPending}>
            <optgroup label="Monitoring Reports">
              <option value="uptime">Uptime Report</option>
              <option value="performance">Performance Report</option>
              <option value="incident">Incident Report</option>
              <option value="sla">SLA Compliance Report</option>
            </optgroup>
            <optgroup label="Advanced Reports">
              <option value="site-health">Site Health Report</option>
              <option value="security-audit">Security Audit Report</option>
              <option value="availability-summary">Availability Summary</option>
              <option value="change-digest">Change Detection Digest</option>
              <option value="response-trend">Response Time Trends</option>
            </optgroup>
          </select>
          <span className="form-hint">
            Site Health: all checks per domain in one card. Security Audit: posture score + risk analysis. Availability: uptime per domain. Change Digest: all changes detected. Response Trend: daily performance charts.
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Quick Select</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => {
            const startInput = document.getElementById('period_start') as HTMLInputElement
            const endInput = document.getElementById('period_end') as HTMLInputElement
            if (startInput && endInput) {
              startInput.value = lastMonthStart.toISOString().split('T')[0]
              endInput.value = lastMonthEnd.toISOString().split('T')[0]
            }
          }}>Last Month</button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => {
            const startInput = document.getElementById('period_start') as HTMLInputElement
            const endInput = document.getElementById('period_end') as HTMLInputElement
            if (startInput && endInput) {
              startInput.value = thisMonthStart.toISOString().split('T')[0]
              endInput.value = now.toISOString().split('T')[0]
            }
          }}>This Month</button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => {
            const startInput = document.getElementById('period_start') as HTMLInputElement
            const endInput = document.getElementById('period_end') as HTMLInputElement
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            if (startInput && endInput) {
              startInput.value = sevenDaysAgo.toISOString().split('T')[0]
              endInput.value = now.toISOString().split('T')[0]
            }
          }}>Last 7 Days</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Period Start</label>
          <input className="form-input" id="period_start" name="period_start" type="date" required defaultValue={lastMonthStart.toISOString().split('T')[0]} disabled={isPending} />
        </div>
        <div className="form-group">
          <label className="form-label">Period End</label>
          <input className="form-input" id="period_end" name="period_end" type="date" required defaultValue={lastMonthEnd.toISOString().split('T')[0]} disabled={isPending} />
        </div>
      </div>

      {/* Delivery Options */}
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Deliver Report</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name="delivery" value="dashboard" defaultChecked disabled={isPending} />
            <span>View in dashboard only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name="delivery" value="email" disabled={isPending} />
            <span>Send to email</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name="delivery" value="webhook" disabled={isPending} />
            <span>Send via webhook</span>
          </label>
        </div>
      </div>

      {/* Email recipients (shown when email delivery selected) */}
      <div className="form-group" id="email-delivery-fields" style={{ marginTop: 8 }}>
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

      {/* Webhook URL (shown when webhook delivery selected) */}
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Webhook URL</label>
        <input
          className="form-input"
          name="delivery_webhook"
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          disabled={isPending}
        />
        <span className="form-hint">Report will be sent as JSON POST with HMAC signature. Works with Slack, Teams, or any webhook receiver.</span>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 12 }}>
        {isPending ? 'Generating Report...' : 'Generate Report'}
      </button>
    </form>
  )
}
