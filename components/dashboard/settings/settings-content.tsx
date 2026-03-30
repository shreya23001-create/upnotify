'use client'

import { useState } from 'react'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
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

  const memberColumns: Column<User>[] = [
    { key: 'full_name', label: 'Name', render: (m) => (
      <span style={{ fontWeight: 500 }}>
        {m.full_name ?? '—'}
        {m.id === currentUserId && <span style={{ marginLeft: 8, fontSize: 12, color: '#a1a1aa' }}>(you)</span>}
      </span>
    )},
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (m) => <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{m.role}</span> },
  ]

  const apiKeyColumns: Column<ApiKey>[] = [
    { key: 'name', label: 'Name', render: (k) => <span style={{ fontWeight: 500 }}>{k.name}</span> },
    { key: 'key_prefix', label: 'Prefix', render: (k) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{k.key_prefix}...</span> },
    { key: 'created_at', label: 'Created', render: (k) => <span className="table-muted">{new Date(k.created_at).toLocaleDateString()}</span> },
    { key: 'last_used_at', label: 'Last Used', render: (k) => <span className="table-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</span> },
  ]

  const apiKeyBulkActions: BulkAction[] = [
    { label: 'Revoke', onClick: (ids) => { /* TODO: implement bulk revoke */ }, variant: 'danger' },
  ]

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
            <DataTable
              columns={memberColumns}
              data={members}
              searchPlaceholder="Search members..."
              emptyMessage="No team members."
            />
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
            <DataTable
              columns={apiKeyColumns}
              data={apiKeys}
              searchPlaceholder="Search API keys..."
              bulkActions={apiKeyBulkActions}
              emptyMessage="No API keys created yet."
            />
          </div>
        </div>
      )}
    </div>
  )
}
