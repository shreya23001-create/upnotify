'use client'

import { useState } from 'react'
import type { Organisation, User, Subscription, Invoice, ApiKey } from '@/lib/types'

interface SettingsContentProps {
  organisation: Organisation
  members: User[]
  currentUserId: string
  subscription: Subscription | null
  invoices: Invoice[]
  apiKeys: ApiKey[]
}

export function SettingsContent({ organisation, members, currentUserId, subscription, invoices, apiKeys }: SettingsContentProps) {
  const [tab, setTab] = useState('organisation')

  return (
    <div>
      <div className="tabs-list">
        {['organisation', 'team', 'billing', 'api-keys'].map((t) => (
          <button key={t} className={`tab-trigger${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'api-keys' ? 'API Keys' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'organisation' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Organisation Details</div></div>
          <div className="card-content">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" defaultValue={organisation.name} disabled /></div>
            <div className="form-group"><label className="form-label">Slug</label><input className="form-input" defaultValue={organisation.slug} disabled /></div>
            <div className="form-group"><label className="form-label">Type</label><input className="form-input" defaultValue={organisation.type} disabled style={{ textTransform: 'capitalize' }} /></div>
            <div className="form-group"><label className="form-label">Timezone</label><input className="form-input" defaultValue={organisation.timezone} disabled /></div>
            <button className="btn btn-primary" disabled>Save Changes</button>
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 8 }}>Settings editing will be enabled in a future update.</p>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="card">
          <div className="card-header card-header-row"><div className="card-title">Team Members</div><button className="btn btn-primary btn-sm" disabled>+ Invite</button></div>
          <div className="card-content">
            {members.length === 0 ? <p style={{ fontSize: 14, color: '#71717a' }}>No team members.</p> : (
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.full_name ?? '—'}{m.id === currentUserId && <span style={{ marginLeft: 8, fontSize: 12, color: '#a1a1aa' }}>(you)</span>}</td>
                      <td>{m.email}</td>
                      <td><span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{m.role}</span></td>
                      <td>{m.id !== currentUserId && <button className="btn btn-ghost btn-sm" disabled>Remove</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y">
          <div className="card">
            <div className="card-header"><div className="card-title">Current Plan</div></div>
            <div className="card-content">
              {subscription ? (
                <div>
                  <span className={`badge ${subscription.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{subscription.status}</span>
                  <span style={{ marginLeft: 8, fontSize: 14, textTransform: 'capitalize' }}>{subscription.billing_cycle}</span>
                  {subscription.current_period_end && <p style={{ fontSize: 14, color: '#71717a', marginTop: 8 }}>Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</p>}
                </div>
              ) : <p style={{ fontSize: 14, color: '#71717a' }}>No active subscription.</p>}
              <button className="btn btn-primary" disabled style={{ marginTop: 16 }}>Manage Subscription</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Invoices</div></div>
            <div className="card-content">
              {invoices.length === 0 ? <p style={{ fontSize: 14, color: '#71717a' }}>No invoices yet.</p> : (
                <div className="space-y-sm">
                  {invoices.map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{'\u00A3'}{(inv.amount_gbp / 100).toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-outline'}`}>{inv.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'api-keys' && (
        <div className="card">
          <div className="card-header card-header-row"><div className="card-title">API Keys</div><button className="btn btn-primary btn-sm" disabled>+ Create Key</button></div>
          <div className="card-content">
            {apiKeys.length === 0 ? <p style={{ fontSize: 14, color: '#71717a' }}>No API keys created yet.</p> : (
              <table className="table">
                <thead><tr><th>Name</th><th>Prefix</th><th>Created</th><th>Last Used</th><th></th></tr></thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id}>
                      <td style={{ fontWeight: 500 }}>{key.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{key.key_prefix}...</td>
                      <td className="table-muted">{new Date(key.created_at).toLocaleDateString()}</td>
                      <td className="table-muted">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</td>
                      <td><button className="btn btn-ghost btn-sm" disabled>Revoke</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
