'use client'

import { useState, useCallback, Fragment } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CreditRule } from '@/lib/types'
import type { CompetePlan } from '@/lib/db/compete-plans'
import type { AdminWebsitePlanRow } from '@/lib/db/admin'
import {
  updateCreditRuleAction,
  toggleCreditRuleActiveAction,
  updateCompetePlanAction,
} from '@/app/(admin)/admin/plans/actions'

interface PlansManagerProps {
  websitePlanRows: AdminWebsitePlanRow[]
  creditRules: CreditRule[]
  competePlans: CompetePlan[]
}

type EditingCreditRule = CreditRule | null
type EditingCompetePlan = CompetePlan | null

function formatCurrency(pence: number | null | undefined, symbol: string): string {
  if (pence === null || pence === undefined) return '—'
  if (pence === 0) return 'Free'
  return `${symbol}${(pence / 100).toFixed(2)}`
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'badge-success'
    case 'cancelling': return 'badge-outline'
    case 'past_due': return 'badge-danger'
    case 'canceled': return 'badge-muted'
    case 'incomplete': return 'badge-outline'
    default: return 'badge-muted'
  }
}

interface OrgGroup {
  orgId: string
  orgName: string
  rows: AdminWebsitePlanRow[]
  totalPurchased: number
  totalClaimed: number
  totalPaidPaise: number
  hasActive: boolean
  latestPeriodEnd: string | null
}

function groupByOrg(rows: AdminWebsitePlanRow[]): OrgGroup[] {
  const groups = new Map<string, OrgGroup>()
  for (const row of rows) {
    let group = groups.get(row.orgId)
    if (!group) {
      group = {
        orgId: row.orgId,
        orgName: row.orgName,
        rows: [],
        totalPurchased: 0,
        totalClaimed: 0,
        totalPaidPaise: 0,
        hasActive: false,
        latestPeriodEnd: null,
      }
      groups.set(row.orgId, group)
    }
    group.rows.push(row)
    group.totalPurchased += row.purchasedQuantity
    group.totalClaimed += row.domainsClaimed
    group.totalPaidPaise += row.totalPaidPaise
    if (['active', 'cancelling', 'past_due'].includes(row.status)) group.hasActive = true
    if (row.currentPeriodEnd && (!group.latestPeriodEnd || row.currentPeriodEnd > group.latestPeriodEnd)) {
      group.latestPeriodEnd = row.currentPeriodEnd
    }
  }
  // Rows already arrive newest-first — keep groups in that same order
  // (by their first-seen/most recent purchase) rather than re-sorting.
  return Array.from(groups.values())
}

export function PlansManager({ websitePlanRows, creditRules, competePlans }: PlansManagerProps): React.ReactElement {
  const [tab, setTab] = useState<'website' | 'compete' | 'credits'>('website')
  const [editingRule, setEditingRule] = useState<EditingCreditRule>(null)
  const [editingCompetePlan, setEditingCompetePlan] = useState<EditingCompetePlan>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())

  const toggleOrgExpanded = useCallback((orgId: string): void => {
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(orgId)) next.delete(orgId); else next.add(orgId)
      return next
    })
  }, [])

  const clearMessages = useCallback((): void => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleRazorpaySync = useCallback(async (): Promise<void> => {
    clearMessages()
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/razorpay/sync-plans', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Razorpay sync failed')
      } else {
        setSuccess(`Razorpay sync complete — ${data.results?.length ?? 0} plans processed`)
      }
    } catch {
      setError('Razorpay sync failed — check console')
    } finally {
      setSyncing(false)
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

  const handleSaveCompetePlan = useCallback(async (formData: FormData): Promise<void> => {
    clearMessages()
    setSaving(true)
    const result = await updateCompetePlanAction(formData)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save compete plan')
    } else {
      setSuccess('Compete plan updated successfully')
      setEditingCompetePlan(null)
    }
  }, [clearMessages])

  const totalWebsitesPurchased = websitePlanRows.reduce((sum, r) => sum + r.purchasedQuantity, 0)
  const totalDomainsClaimed = websitePlanRows.reduce((sum, r) => sum + r.domainsClaimed, 0)
  const totalRevenuePaise = websitePlanRows.reduce((sum, r) => sum + r.totalPaidPaise, 0)
  const activeOrgCount = new Set(websitePlanRows.filter(r => ['active', 'cancelling', 'past_due'].includes(r.status)).map(r => r.orgId)).size
  const orgGroups = groupByOrg(websitePlanRows)

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="tabs-list">
        <button
          className={`tab-trigger${tab === 'website' ? ' active' : ''}`}
          onClick={() => { setTab('website'); clearMessages() }}
        >
          Pro Plan ({websitePlanRows.length})
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

      {tab === 'website' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            The current Pro Plan — ₹999/website/year, quantity-first purchase. Each row is one purchase
            (a top-up via &quot;Add More&quot; creates its own row for the same org). Grandfathered legacy-plan orgs
            are not shown here — they&apos;re unaffected by this billing model.
          </p>

          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <span className="admin-stat-number">{activeOrgCount}</span>
                <span className="admin-stat-label">Orgs on Pro Plan</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <span className="admin-stat-number">{totalWebsitesPurchased}</span>
                <span className="admin-stat-label">Websites Purchased</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <span className="admin-stat-number">{totalDomainsClaimed}</span>
                <span className="admin-stat-label">Domains Claimed</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <span className="admin-stat-number">{'₹'}{(totalRevenuePaise / 100).toLocaleString('en-IN')}</span>
                <span className="admin-stat-label">Total Revenue</span>
              </div>
            </div>
          </div>

          <div className="plans-table-wrapper">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Status</th>
                  <th>Purchased</th>
                  <th>Claimed</th>
                  <th>Unused</th>
                  <th>Paid</th>
                  <th>Purchased On</th>
                  <th>Renews / Ended</th>
                </tr>
              </thead>
              <tbody>
                {orgGroups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                      No one has purchased the Pro Plan yet.
                    </td>
                  </tr>
                ) : (
                  orgGroups.map((group) => {
                    const isExpanded = expandedOrgs.has(group.orgId)
                    const hasMultiple = group.rows.length > 1
                    return (
                      <Fragment key={group.orgId}>
                        <tr
                          className={hasMultiple ? 'plans-table-group-row' : undefined}
                          style={hasMultiple ? { cursor: 'pointer' } : undefined}
                          onClick={hasMultiple ? () => toggleOrgExpanded(group.orgId) : undefined}
                        >
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {hasMultiple ? (
                                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                              ) : (
                                <span style={{ width: 14, display: 'inline-block' }} />
                              )}
                              {group.orgName}
                              {hasMultiple && (
                                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                                  ({group.rows.length} purchases)
                                </span>
                              )}
                            </span>
                          </td>
                          <td><span className={`badge ${statusBadgeClass(group.hasActive ? 'active' : group.rows[0].status)}`}>{group.hasActive ? 'active' : group.rows[0].status}</span></td>
                          <td>{group.totalPurchased}</td>
                          <td>{group.totalClaimed}</td>
                          <td>{Math.max(0, group.totalPurchased - group.totalClaimed)}</td>
                          <td>{formatCurrency(group.totalPaidPaise, '₹')}</td>
                          <td>—</td>
                          <td>{group.latestPeriodEnd ? new Date(group.latestPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                        </tr>
                        {hasMultiple && isExpanded && group.rows.map(row => (
                          <tr key={row.id} className="plans-table-subrow">
                            <td style={{ paddingLeft: 32, color: 'var(--text-muted)', fontSize: 13 }}>Purchase</td>
                            <td><span className={`badge ${statusBadgeClass(row.status)}`}>{row.status}</span></td>
                            <td>{row.purchasedQuantity}</td>
                            <td>{row.domainsClaimed}</td>
                            <td>{Math.max(0, row.purchasedQuantity - row.domainsClaimed)}</td>
                            <td>{formatCurrency(row.totalPaidPaise, '₹')}</td>
                            <td>{new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td>{row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
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
                  <th>Stripe Prices</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competePlans.map((cp) => (
                  <Fragment key={cp.id}>
                    <tr>
                      <td style={{ fontWeight: 600 }}>{cp.name}</td>
                      <td><code style={{ fontSize: 11 }}>{cp.slug}</code></td>
                      <td>{formatCurrency(cp.price_monthly_pence, '£')}</td>
                      <td>{cp.has_yearly_discount ? formatCurrency(cp.price_yearly_pence, '£') : '—'}</td>
                      <td>{cp.product_limit.toLocaleString()}</td>
                      <td>{cp.max_extra_products}</td>
                      <td>{formatCurrency(cp.extra_product_price_pence, '£')}/ea</td>
                      <td>{cp.nudge_to_slug ?? '—'}</td>
                      <td>
                        {cp.stripe_monthly_price_id ? (
                          <span className="badge badge-success" title={cp.stripe_monthly_price_id}>Connected</span>
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
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setEditingCompetePlan(editingCompetePlan?.id === cp.id ? null : cp); clearMessages() }}
                        >
                          {editingCompetePlan?.id === cp.id ? 'Cancel' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                    {editingCompetePlan?.id === cp.id && (
                      <tr>
                        <td colSpan={11} style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                          <form action={handleSaveCompetePlan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <input type="hidden" name="id" value={cp.id} />
                            <div>
                              <label className="form-label" style={{ fontSize: 12 }}>Stripe Product ID</label>
                              <input
                                name="stripe_product_id"
                                className="form-input"
                                defaultValue={cp.stripe_product_id ?? ''}
                                placeholder="prod_xxx"
                                style={{ fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 12 }}>Stripe Monthly Price ID</label>
                              <input
                                name="stripe_monthly_price_id"
                                className="form-input"
                                defaultValue={cp.stripe_monthly_price_id ?? ''}
                                placeholder="price_xxx"
                                style={{ fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 12 }}>Stripe Yearly Price ID</label>
                              <input
                                name="stripe_yearly_price_id"
                                className="form-input"
                                defaultValue={cp.stripe_yearly_price_id ?? ''}
                                placeholder="price_xxx (optional)"
                                style={{ fontSize: 12 }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                <input type="hidden" name="is_active" value="false" />
                                <input
                                  type="checkbox"
                                  name="is_active"
                                  value="true"
                                  defaultChecked={cp.is_active}
                                />
                                Active
                              </label>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingCompetePlan(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            Click <strong>Edit</strong> on any plan to set its Stripe price IDs. Checkout will not work until prices are configured.
          </p>
          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-muted)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Razorpay Plan Sync</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Creates INR plans in Razorpay for all paid plans and saves the plan IDs back to the database. Safe to re-run — skips plans already configured.
            </p>
            <button className="btn btn-primary btn-sm" onClick={handleRazorpaySync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync Razorpay Plans'}
            </button>
          </div>
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
                    <td>{formatCurrency(rule.credit_amount_pence, '£')}</td>
                    <td><span className={`badge ${rule.credit_type === 'recurring' ? 'badge-success' : 'badge-outline'}`}>{rule.credit_type}</span></td>
                    <td>{rule.max_per_user}</td>
                    <td>{formatCurrency(rule.max_credit_per_month_pence, '£')}</td>
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
