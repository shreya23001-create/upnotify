'use client'

import { useState } from 'react'
import type { User, Organisation, FeatureFlag, Plan } from '@/lib/types'

interface AdminContentProps { users: User[]; organisations: Organisation[]; featureFlags: FeatureFlag[]; plans: Plan[] }

export function AdminContent({ users, organisations, featureFlags, plans }: AdminContentProps) {
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')

  const orgMap = new Map(organisations.map((o) => [o.id, o.name]))
  const filtered = search ? users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())) : users

  return (
    <div>
      <div className="tabs-list">
        {['users', 'flags', 'plans'].map((t) => (
          <button key={t} className={`tab-trigger${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'flags' ? 'Feature Flags' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <input className="form-input" placeholder="Search users by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Organisation</th><th>Role</th></tr></thead>
            <tbody>
              {filtered.slice(0, 50).map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.full_name ?? '—'}</td>
                  <td>{u.email}</td>
                  <td>{orgMap.get(u.org_id) ?? '—'}</td>
                  <td>
                    <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                    {u.is_super_admin && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Admin</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && <p style={{ fontSize: 14, color: '#71717a', marginTop: 8 }}>Showing 50 of {filtered.length} results.</p>}
        </div>
      )}

      {tab === 'flags' && (
        <div>
          {featureFlags.length === 0 ? <div className="empty-state"><p>No feature flags configured.</p></div> : (
            <div className="space-y-sm">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="card">
                  <div className="card-content-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, fontFamily: 'monospace' }}>{flag.key}</div>
                      {flag.description && <div style={{ fontSize: 12, color: '#71717a' }}>{flag.description}</div>}
                    </div>
                    <label className="switch"><input type="checkbox" checked={flag.is_enabled} disabled /><span className="switch-slider" /></label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <table className="table">
          <thead><tr><th>Plan</th><th>Type</th><th>Monthly</th><th>Monitors</th><th>Interval</th><th>API</th><th>AI</th><th>Visible</th></tr></thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td style={{ fontWeight: 500 }}>{plan.name}</td>
                <td><span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{plan.type}</span></td>
                <td>{plan.price_monthly_gbp > 0 ? `\u00A3${(plan.price_monthly_gbp / 100).toFixed(2)}` : plan.onboarding_fee_gbp > 0 ? `\u00A3${(plan.onboarding_fee_gbp / 100).toFixed(2)} one-time` : 'Free'}</td>
                <td>{plan.monitor_limit ?? 'Unlimited'}</td>
                <td>{plan.check_interval_seconds}s</td>
                <td>{plan.has_api_access ? 'Yes' : 'No'}</td>
                <td>{plan.has_ai_predictive ? 'Yes' : 'No'}</td>
                <td><span className={`badge ${plan.is_visible ? 'badge-success' : 'badge-outline'}`}>{plan.is_visible ? 'Yes' : 'Hidden'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
