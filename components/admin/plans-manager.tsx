'use client'

import { useState, useCallback } from 'react'
import type { Plan, CreditRule } from '@/lib/types'
import type { CompetePlan } from '@/lib/db/compete-plans'
import {
  updatePlanAction,
  togglePlanVisibilityAction,
  updateCreditRuleAction,
  toggleCreditRuleActiveAction,
} from '@/app/(admin)/admin/plans/actions'

interface PlansManagerProps {
  plans: Plan[]
  creditRules: CreditRule[]
  subscriberCounts: Record<string, number>
  competePlans: CompetePlan[]
}

type EditingPlan = Plan | null
type EditingCreditRule = CreditRule | null

function formatCurrency(pence: number | null | undefined, symbol: string): string {
  if (pence === null || pence === undefined) return '—'
  if (pence === 0) return 'Free'
  return `${symbol}${(pence / 100).toFixed(2)}`
}

export function PlansManager({ plans, creditRules, subscriberCounts, competePlans }: PlansManagerProps): React.ReactElement {
  const [tab, setTab] = useState<'plans' | 'compete' | 'credits'>('plans')
  const [editingPlan, setEditingPlan] = useState<EditingPlan>(null)
  const [editingRule, setEditingRule] = useState<EditingCreditRule>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearMessages = useCallback((): void => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleTogglePlanVisibility = useCallback(async (id: string, currentVisible: boolean): Promise<void> => {
    clearMessages()
    const result = await togglePlanVisibilityAction(id, !currentVisible)
    if (!result.success) {
      setError(result.error ?? 'Failed to toggle plan')
    } else {
      setSuccess('Plan visibility updated')
    }
  }, [clearMessages])

  const handleSavePlan = useCallback(async (formData: FormData): Promise<void> => {
    clearMessages()
    setSaving(true)
    const result = await updatePlanAction(formData)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save plan')
    } else {
      setSuccess('Plan updated successfully')
      setEditingPlan(null)
    }
  }, [clearMessages])

  const handleToggleCreditRule = useCallback(async (id: string, currentActive: boolean): Promise<void> => {
    clearMessages()
    const result = await toggleCreditRuleActiveAction(id, !currentActive)
    if (!result.success) {
      setError(result.error ?? 'Failed to toggle credit rule')
    } else {
      setSuccess('Credit rule updated')
    }
  }, [clearMessages])

  const handleSaveCreditRule = useCallback(async (formData: FormData): Promise<void> => {
    clearMessages()
    setSaving(true)
    const result = await updateCreditRuleAction(formData)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save credit rule')
    } else {
      setSuccess('Credit rule updated successfully')
      setEditingRule(null)
    }
  }, [clearMessages])

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="tabs-list">
        <button
          className={`tab-trigger${tab === 'plans' ? ' active' : ''}`}
          onClick={() => { setTab('plans'); clearMessages() }}
        >
          Plans ({plans.length})
        </button>
        <button
          className={`tab-trigger${tab === 'compete' ? ' active' : ''}`}
          onClick={() => { setTab('compete'); clearMessages() }}
        >
          Compete Add-on ({competePlans.length})
        </button>
        <button
          className={`tab-trigger${tab === 'credits' ? ' active' : ''}`}
          onClick={() => { setTab('credits'); clearMessages() }}
        >
          Credit Rules ({creditRules.length})
        </button>
      </div>

      {tab === 'plans' && (
        <div>
          <div className="plans-table-wrapper">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>GBP/mo</th>
                  <th>GBP/yr</th>
                  <th>USD/mo</th>
                  <th>USD/yr</th>
                  <th>INR/mo</th>
                  <th>INR/yr</th>
                  <th>Monitors</th>
                  <th>Interval</th>
                  <th>Workspaces</th>
                  <th>Team</th>
                  <th>Subs</th>
                  <th>Visible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td><span style={{ fontWeight: 600 }}>{plan.name}</span><br /><span className="plans-slug">{plan.slug}</span></td>
                    <td><span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{plan.type}</span></td>
                    <td>{formatCurrency(plan.price_monthly_gbp, '\u00A3')}</td>
                    <td>{formatCurrency(plan.price_annual_gbp, '\u00A3')}</td>
                    <td>{formatCurrency(plan.price_monthly_usd, '$')}</td>
                    <td>{formatCurrency(plan.price_annual_usd, '$')}</td>
                    <td>{formatCurrency(plan.price_monthly_inr, '\u20B9')}</td>
                    <td>{formatCurrency(plan.price_annual_inr, '\u20B9')}</td>
                    <td>{plan.monitor_limit ?? 'Unlimited'}</td>
                    <td>{plan.check_interval_seconds}s</td>
                    <td>{plan.client_workspace_limit ?? 'Unlimited'}</td>
                    <td>{plan.max_team_members}</td>
                    <td><span className="badge badge-muted">{subscriberCounts[plan.id] ?? 0}</span></td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={plan.is_visible}
                          onChange={() => handleTogglePlanVisibility(plan.id, plan.is_visible)}
                        />
                        <span className="switch-slider" />
                      </label>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditingPlan(plan); clearMessages() }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="plans-features-section">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>FEATURE FLAGS PER PLAN</h3>
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>API Access</th>
                    <th>AI Predictive</th>
                    <th>Custom Domain</th>
                    <th>White Label</th>
                    <th>Voice Calls</th>
                    <th>Voice Limit</th>
                    <th>Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td style={{ fontWeight: 600 }}>{plan.name}</td>
                      <td>{plan.has_api_access ? <span className="badge badge-success">Yes</span> : <span className="badge badge-outline">No</span>}</td>
                      <td>{plan.has_ai_predictive ? <span className="badge badge-success">Yes</span> : <span className="badge badge-outline">No</span>}</td>
                      <td>{plan.has_status_page_custom_domain ? <span className="badge badge-success">Yes</span> : <span className="badge badge-outline">No</span>}</td>
                      <td>{plan.has_white_label ? <span className="badge badge-success">Yes</span> : <span className="badge badge-outline">No</span>}</td>
                      <td>{plan.has_voice_calls ? <span className="badge badge-success">Yes</span> : <span className="badge badge-outline">No</span>}</td>
                      <td>{plan.voice_call_monthly_limit}</td>
                      <td>{plan.data_retention_days ? `${plan.data_retention_days}d` : 'Unlimited'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'compete' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Compete is a separate add-on. Users purchase it alongside their base monitoring plan.
          </p>
          <div className="plans-table-wrapper">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Slug</th>
                  <th>Monthly</th>
                  <th>Yearly</th>
                  <th>Products</th>
                  <th>Max Extra</th>
                  <th>Extra Price</th>
                  <th>Nudge To</th>
                  <th>Stripe Product</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {competePlans.map((cp) => (
                  <tr key={cp.id}>
                    <td style={{ fontWeight: 600 }}>{cp.name}</td>
                    <td><code style={{ fontSize: 11 }}>{cp.slug}</code></td>
                    <td>{formatCurrency(cp.price_monthly_pence, '\u00A3')}</td>
                    <td>{cp.has_yearly_discount ? formatCurrency(cp.price_yearly_pence, '\u00A3') : '\u2014'}</td>
                    <td>{cp.product_limit.toLocaleString()}</td>
                    <td>{cp.max_extra_products}</td>
                    <td>{formatCurrency(cp.extra_product_price_pence, '\u00A3')}/ea</td>
                    <td>{cp.nudge_to_slug ?? '\u2014'}</td>
                    <td>
                      {cp.stripe_product_id ? (
                        <span className="badge badge-success" title={cp.stripe_product_id}>Connected</span>
                      ) : (
                        <span className="badge badge-danger">Not Set</span>
                      )}
                    </td>
                    <td>
                      {cp.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-outline">Hidden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            To edit Compete plans, update the <code>compete_plans</code> table in Supabase directly.
            Admin editing UI coming soon.
          </p>
        </div>
      )}

      {tab === 'credits' && (
        <div>
          <div className="plans-table-wrapper">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Rule Key</th>
                  <th>Display Name</th>
                  <th>Credit</th>
                  <th>Type</th>
                  <th>Max/User</th>
                  <th>Cap/Month</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditRules.map((rule) => (
                  <tr key={rule.id}>
                    <td><code className="plans-code">{rule.rule_key}</code></td>
                    <td style={{ fontWeight: 500 }}>{rule.display_name}</td>
                    <td>{formatCurrency(rule.credit_amount_pence, '\u00A3')}</td>
                    <td><span className={`badge ${rule.credit_type === 'recurring' ? 'badge-success' : 'badge-outline'}`}>{rule.credit_type}</span></td>
                    <td>{rule.max_per_user}</td>
                    <td>{formatCurrency(rule.max_credit_per_month_pence, '\u00A3')}</td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={() => handleToggleCreditRule(rule.id, rule.is_active)}
                        />
                        <span className="switch-slider" />
                      </label>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditingRule(rule); clearMessages() }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Edit Modal */}
      {editingPlan && (
        <div className="plans-modal-overlay" onClick={() => setEditingPlan(null)}>
          <div className="plans-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plans-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Plan: {editingPlan.name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingPlan(null)}>Close</button>
            </div>
            <form action={handleSavePlan} className="plans-modal-body">
              <input type="hidden" name="id" value={editingPlan.id} />

              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" name="name" defaultValue={editingPlan.name} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input className="form-input" name="slug" defaultValue={editingPlan.slug} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" name="type" defaultValue={editingPlan.type}>
                    <option value="direct">Direct</option>
                    <option value="agency">Agency</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>

              <h3 className="plans-section-title">Pricing (GBP - pence)</h3>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Monthly (pence)</label>
                  <input className="form-input" name="price_monthly_gbp" type="number" defaultValue={editingPlan.price_monthly_gbp} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual (pence)</label>
                  <input className="form-input" name="price_annual_gbp" type="number" defaultValue={editingPlan.price_annual_gbp ?? ''} placeholder="null = no annual" />
                </div>
                <div className="form-group">
                  <label className="form-label">Onboarding Fee (pence)</label>
                  <input className="form-input" name="onboarding_fee_gbp" type="number" defaultValue={editingPlan.onboarding_fee_gbp} min={0} />
                </div>
              </div>

              <h3 className="plans-section-title">Pricing (USD - cents)</h3>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Monthly (cents)</label>
                  <input className="form-input" name="price_monthly_usd" type="number" defaultValue={editingPlan.price_monthly_usd} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual (cents)</label>
                  <input className="form-input" name="price_annual_usd" type="number" defaultValue={editingPlan.price_annual_usd ?? ''} placeholder="null = no annual" />
                </div>
              </div>

              <h3 className="plans-section-title">Pricing (INR - paise)</h3>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Monthly (paise)</label>
                  <input className="form-input" name="price_monthly_inr" type="number" defaultValue={editingPlan.price_monthly_inr} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual (paise)</label>
                  <input className="form-input" name="price_annual_inr" type="number" defaultValue={editingPlan.price_annual_inr ?? ''} placeholder="null = no annual" />
                </div>
              </div>

              <h3 className="plans-section-title">Limits</h3>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Monitor Limit</label>
                  <input className="form-input" name="monitor_limit" type="number" defaultValue={editingPlan.monitor_limit ?? ''} placeholder="empty = unlimited" />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Interval (seconds)</label>
                  <input className="form-input" name="check_interval_seconds" type="number" defaultValue={editingPlan.check_interval_seconds} min={10} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Workspaces</label>
                  <input className="form-input" name="client_workspace_limit" type="number" defaultValue={editingPlan.client_workspace_limit ?? ''} placeholder="empty = unlimited" />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Team Members</label>
                  <input className="form-input" name="max_team_members" type="number" defaultValue={editingPlan.max_team_members} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data Retention (days)</label>
                  <input className="form-input" name="data_retention_days" type="number" defaultValue={editingPlan.data_retention_days ?? ''} placeholder="empty = unlimited" />
                </div>
                <div className="form-group">
                  <label className="form-label">Voice Call Limit/Month</label>
                  <input className="form-input" name="voice_call_monthly_limit" type="number" defaultValue={editingPlan.voice_call_monthly_limit} min={0} />
                </div>
              </div>

              <h3 className="plans-section-title">Features</h3>
              <div className="plans-features-grid">
                <label className="plans-checkbox-label">
                  <input type="hidden" name="has_api_access" value="false" />
                  <input type="checkbox" name="has_api_access" value="true" defaultChecked={editingPlan.has_api_access} />
                  <span>API Access</span>
                </label>
                <label className="plans-checkbox-label">
                  <input type="hidden" name="has_ai_predictive" value="false" />
                  <input type="checkbox" name="has_ai_predictive" value="true" defaultChecked={editingPlan.has_ai_predictive} />
                  <span>AI Predictive</span>
                </label>
                <label className="plans-checkbox-label">
                  <input type="hidden" name="has_status_page_custom_domain" value="false" />
                  <input type="checkbox" name="has_status_page_custom_domain" value="true" defaultChecked={editingPlan.has_status_page_custom_domain} />
                  <span>Custom Domain Status Pages</span>
                </label>
                <label className="plans-checkbox-label">
                  <input type="hidden" name="has_white_label" value="false" />
                  <input type="checkbox" name="has_white_label" value="true" defaultChecked={editingPlan.has_white_label} />
                  <span>White Label</span>
                </label>
                <label className="plans-checkbox-label">
                  <input type="hidden" name="has_voice_calls" value="false" />
                  <input type="checkbox" name="has_voice_calls" value="true" defaultChecked={editingPlan.has_voice_calls} />
                  <span>Voice Calls</span>
                </label>
                <label className="plans-checkbox-label">
                  <input type="hidden" name="is_visible" value="false" />
                  <input type="checkbox" name="is_visible" value="true" defaultChecked={editingPlan.is_visible} />
                  <span>Visible to Users</span>
                </label>
              </div>

              <h3 className="plans-section-title">Stripe</h3>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Stripe Price ID (Monthly)</label>
                  <input className="form-input" name="stripe_price_id_monthly" defaultValue={editingPlan.stripe_price_id_monthly ?? ''} placeholder="price_..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Stripe Price ID (Annual)</label>
                  <input className="form-input" name="stripe_price_id_annual" defaultValue={editingPlan.stripe_price_id_annual ?? ''} placeholder="price_..." />
                </div>
              </div>

              <div className="plans-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPlan(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Rule Edit Modal */}
      {editingRule && (
        <div className="plans-modal-overlay" onClick={() => setEditingRule(null)}>
          <div className="plans-modal plans-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="plans-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Credit Rule: {editingRule.display_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingRule(null)}>Close</button>
            </div>
            <form action={handleSaveCreditRule} className="plans-modal-body">
              <input type="hidden" name="id" value={editingRule.id} />

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" name="display_name" defaultValue={editingRule.display_name} required />
              </div>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Credit Amount (pence)</label>
                  <input className="form-input" name="credit_amount_pence" type="number" defaultValue={editingRule.credit_amount_pence} min={0} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Type</label>
                  <select className="form-select" name="credit_type" defaultValue={editingRule.credit_type}>
                    <option value="recurring">Recurring</option>
                    <option value="one_time">One-Time</option>
                  </select>
                </div>
              </div>
              <div className="plans-form-grid">
                <div className="form-group">
                  <label className="form-label">Max Per User</label>
                  <input className="form-input" name="max_per_user" type="number" defaultValue={editingRule.max_per_user} min={1} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Cap (pence)</label>
                  <input className="form-input" name="max_credit_per_month_pence" type="number" defaultValue={editingRule.max_credit_per_month_pence ?? ''} />
                </div>
              </div>

              <div className="plans-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRule(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
