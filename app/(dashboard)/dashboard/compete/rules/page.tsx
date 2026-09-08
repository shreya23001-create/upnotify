'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Rule {
  id: string
  rule_name: string
  trigger_type: string
  trigger_threshold_pct: number
  response_action: string
  response_adjust_pct: number
  response_adjust_direction: string
  safety_min_price_pence: number | null
  safety_max_price_pence: number | null
  safety_max_change_pct: number
  safety_max_changes_per_day: number
  auto_update_enabled: boolean
  webhook_url: string | null
  is_active: boolean
  trigger_count: number
  last_triggered_at: string | null
  created_at: string
}

interface Execution {
  id: string
  action_taken: string
  old_price_pence: number | null
  new_price_pence: number | null
  competitor_price_pence: number | null
  created_at: string
}

function formatPence(pence: number | null): string {
  if (pence === null) return '\u2014'
  return `\u00A3${(pence / 100).toFixed(2)}`
}

function AutoUpdateConfirm({ ruleId, onConfirm, onCancel }: { ruleId: string; onConfirm: () => void; onCancel: () => void }): React.ReactElement {
  const [countdown, setCountdown] = useState(10)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 12, padding: 24, marginTop: 16 }}>
      <h3 style={{ color: '#dc2626', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        {'\u26A0\uFE0F'} Enable Automatic Price Updates?
      </h3>
      <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.7, marginBottom: 16 }}>
        <strong>This will automatically change your product prices</strong> based on competitor price movements.
        Incorrect competitor data, scraping errors, or temporary price glitches could cause your prices to
        change unexpectedly. This could result in selling products below cost or at prices that damage your margins.
      </p>
      <ul style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.8, marginBottom: 16, paddingLeft: 20 }}>
        <li>Safety limits will be enforced (min/max price, max % change per day)</li>
        <li>Every execution is logged and visible in your rule history</li>
        <li>You can disable auto-update at any time</li>
        <li>Upnotify accepts no responsibility for pricing decisions made by automated rules</li>
      </ul>
      <p style={{ fontSize: 12, color: '#991b1b', marginBottom: 16 }}>
        By enabling this, you agree to our{' '}
        <Link href="/automated-pricing-policy" target="_blank" style={{ textDecoration: 'underline' }}>
          Automated Pricing Policy
        </Link>.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-danger"
          disabled={countdown > 0}
          onClick={() => { setConfirmed(true); onConfirm() }}
          style={{ minWidth: 200 }}
        >
          {countdown > 0
            ? `Wait ${countdown} seconds...`
            : confirmed
              ? 'Enabling...'
              : 'I understand the risks \u2014 Enable Auto-Update'
          }
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function PricingRulesPage(): React.ReactElement {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router]) // Hidden until v1.5 launch
  const [rules, setRules] = useState<Rule[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showAutoConfirm, setShowAutoConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formTriggerType, setFormTriggerType] = useState('price_drop')
  const [formThreshold, setFormThreshold] = useState('5')
  const [formAction, setFormAction] = useState('alert')
  const [formAdjustPct, setFormAdjustPct] = useState('0')
  const [formAdjustDir, setFormAdjustDir] = useState('match')
  const [formMinPrice, setFormMinPrice] = useState('')
  const [formMaxPrice, setFormMaxPrice] = useState('')
  const [formMaxChangePct, setFormMaxChangePct] = useState('20')
  const [formMaxPerDay, setFormMaxPerDay] = useState('3')
  const [formWebhookUrl, setFormWebhookUrl] = useState('')

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [rulesRes, execRes] = await Promise.all([
        fetch('/api/v1/compete/rules'),
        fetch('/api/v1/compete/rules/history'),
      ])
      if (rulesRes.ok) {
        const d = await rulesRes.json() as { success: boolean; rules: Rule[] }
        if (d.success) setRules(d.rules)
      }
      if (execRes.ok) {
        const d = await execRes.json() as { success: boolean; executions: Execution[] }
        if (d.success) setExecutions(d.executions)
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (): Promise<void> => {
    if (!formName.trim()) { setMessage({ type: 'error', text: 'Rule name is required' }); return }
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/v1/compete/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ruleName: formName.trim(),
        triggerType: formTriggerType,
        triggerThresholdPct: Number(formThreshold),
        responseAction: formAction,
        responseAdjustPct: Number(formAdjustPct),
        responseAdjustDirection: formAdjustDir,
        safetyMinPricePence: formMinPrice ? Math.round(Number(formMinPrice) * 100) : undefined,
        safetyMaxPricePence: formMaxPrice ? Math.round(Number(formMaxPrice) * 100) : undefined,
        safetyMaxChangePct: Number(formMaxChangePct),
        safetyMaxChangesPerDay: Number(formMaxPerDay),
        webhookUrl: formWebhookUrl || undefined,
      }),
    })
    const data = await res.json() as { success: boolean; error?: string }
    setSaving(false)

    if (data.success) {
      setMessage({ type: 'success', text: 'Rule created' })
      setShowCreate(false)
      fetchData()
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Failed to create rule' })
    }
  }

  const handleToggle = async (ruleId: string, active: boolean): Promise<void> => {
    await fetch('/api/v1/compete/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, updates: { is_active: !active } }),
    })
    fetchData()
  }

  const handleEnableAutoUpdate = async (ruleId: string): Promise<void> => {
    await fetch('/api/v1/compete/rules/auto-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    })
    setShowAutoConfirm(null)
    fetchData()
  }

  const handleDisableAutoUpdate = async (ruleId: string): Promise<void> => {
    await fetch('/api/v1/compete/rules/auto-update', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    })
    fetchData()
  }

  const handleDelete = async (ruleId: string): Promise<void> => {
    if (!confirm('Delete this rule? This cannot be undone.')) return
    await fetch('/api/v1/compete/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    })
    fetchData()
  }

  if (loading) {
    return (
      <div className="db-content">
        <div className="db-page-title">Pricing Rules</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Pricing Rules</div>
          <div className="db-page-sub">Set rules to get alerts or automatically update your prices when competitors change theirs.</div>
        </div>
        <div className="db-page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Create Rule</button>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'form-success' : 'form-error'} style={{ marginBottom: 16 }}>{message.text}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>New Pricing Rule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Rule Name</label>
              <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Undercut Amazon by 5%" />
            </div>
            <div className="form-group">
              <label className="form-label">Trigger When</label>
              <select className="form-select" value={formTriggerType} onChange={e => setFormTriggerType(e.target.value)}>
                <option value="price_drop">Competitor price drops</option>
                <option value="price_increase">Competitor price increases</option>
                <option value="price_change">Any price change</option>
                <option value="stock_out">Competitor goes out of stock</option>
                <option value="stock_back">Competitor back in stock</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Threshold (%)</label>
              <input className="form-input" type="number" value={formThreshold} onChange={e => setFormThreshold(e.target.value)} min="0" step="0.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Action</label>
              <select className="form-select" value={formAction} onChange={e => setFormAction(e.target.value)}>
                <option value="alert">Alert me only</option>
                <option value="auto_update">Auto-update my price (requires webhook)</option>
              </select>
            </div>
            {formAction === 'auto_update' && (
              <>
                <div className="form-group">
                  <label className="form-label">Price Response</label>
                  <select className="form-select" value={formAdjustDir} onChange={e => setFormAdjustDir(e.target.value)}>
                    <option value="match">Match competitor price</option>
                    <option value="undercut">Undercut by %</option>
                    <option value="above">Stay above by %</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Adjust by (%)</label>
                  <input className="form-input" type="number" value={formAdjustPct} onChange={e => setFormAdjustPct(e.target.value)} min="0" step="0.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Webhook URL (your store)</label>
                  <input className="form-input" value={formWebhookUrl} onChange={e => setFormWebhookUrl(e.target.value)} placeholder="https://yourstore.com/api/update-price" />
                </div>
              </>
            )}
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 10 }}>Safety Limits</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Min Price ({'\u00A3'})</label>
              <input className="form-input" type="number" value={formMinPrice} onChange={e => setFormMinPrice(e.target.value)} placeholder="No minimum" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Price ({'\u00A3'})</label>
              <input className="form-input" type="number" value={formMaxPrice} onChange={e => setFormMaxPrice(e.target.value)} placeholder="No maximum" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Change (%/update)</label>
              <input className="form-input" type="number" value={formMaxChangePct} onChange={e => setFormMaxChangePct(e.target.value)} min="1" max="100" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Updates/Day</label>
              <input className="form-input" type="number" value={formMaxPerDay} onChange={e => setFormMaxPerDay(e.target.value)} min="1" max="50" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Rule'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No pricing rules yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {rules.map(rule => (
            <div key={rule.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{rule.rule_name}</span>
                    {rule.auto_update_enabled && (
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>AUTO-UPDATE</span>
                    )}
                    <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-outline'}`}>
                      {rule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    When {rule.trigger_type.replace(/_/g, ' ')} by {rule.trigger_threshold_pct}% {'\u2192'}{' '}
                    {rule.auto_update_enabled
                      ? `auto-update (${rule.response_adjust_direction} ${rule.response_adjust_pct}%)`
                      : 'send alert'
                    }
                    {rule.safety_min_price_pence !== null && ` | Min: ${formatPence(rule.safety_min_price_pence)}`}
                    {rule.safety_max_price_pence !== null && ` | Max: ${formatPence(rule.safety_max_price_pence)}`}
                    {' | '}Max {rule.safety_max_change_pct}%/update, {rule.safety_max_changes_per_day}/day
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Triggered {rule.trigger_count} times
                    {rule.last_triggered_at && ` | Last: ${new Date(rule.last_triggered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(rule.id, rule.is_active)}>
                    {rule.is_active ? 'Pause' : 'Resume'}
                  </button>
                  {!rule.auto_update_enabled ? (
                    <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => setShowAutoConfirm(rule.id)}>
                      Enable Auto-Update
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDisableAutoUpdate(rule.id)}>
                      Disable Auto-Update
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(rule.id)}>Delete</button>
                </div>
              </div>

              {showAutoConfirm === rule.id && (
                <AutoUpdateConfirm
                  ruleId={rule.id}
                  onConfirm={() => handleEnableAutoUpdate(rule.id)}
                  onCancel={() => setShowAutoConfirm(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Execution history */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Rule Execution History</div>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          {executions.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No executions yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Competitor Price</th>
                    <th>Your Old Price</th>
                    <th>New Price</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.slice(0, 20).map(ex => (
                    <tr key={ex.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ex.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${ex.action_taken === 'auto_updated' ? 'badge-success' : ex.action_taken.includes('blocked') ? 'badge-danger' : ex.action_taken === 'webhook_failed' ? 'badge-danger' : 'badge-outline'}`}>
                          {ex.action_taken.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{formatPence(ex.competitor_price_pence)}</td>
                      <td>{formatPence(ex.old_price_pence)}</td>
                      <td style={{ fontWeight: 600 }}>{formatPence(ex.new_price_pence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
