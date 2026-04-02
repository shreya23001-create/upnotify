'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { User, Organisation, FeatureFlag, Plan } from '@/lib/types'

interface AdminContentProps { users: User[]; organisations: Organisation[]; featureFlags: FeatureFlag[]; plans: Plan[] }

export function AdminContent({ users, organisations, featureFlags, plans }: AdminContentProps) {
  const [tab, setTab] = useState('users')
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const router = useRouter()

  const orgMap = useMemo(() => new Map(organisations.map((o) => [o.id, o.name])), [organisations])

  const handleImpersonate = useCallback(async (userId: string): Promise<void> => {
    setImpersonatingId(userId)
    try {
      const response = await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch {
      setImpersonatingId(null)
    }
  }, [router])

  const userColumns: Column<User>[] = [
    { key: 'full_name', label: 'Name', render: (u) => <span style={{ fontWeight: 500 }}>{u.full_name ?? '—'}</span> },
    { key: 'email', label: 'Email' },
    { key: 'org_id', label: 'Organisation', searchable: false, render: (u) => <span>{orgMap.get(u.org_id) ?? '—'}</span> },
    { key: 'role', label: 'Role', render: (u) => (
      <span>
        <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{u.role}</span>
        {u.is_super_admin && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Admin</span>}
      </span>
    )},
    { key: 'actions', label: '', searchable: false, sortable: false, render: (u) => (
      u.is_super_admin ? null : (
        <button
          className="btn btn-sm btn-outline"
          onClick={() => handleImpersonate(u.id)}
          disabled={impersonatingId === u.id}
          style={{ fontSize: 12, padding: '4px 10px' }}
        >
          {impersonatingId === u.id ? 'Loading...' : 'Impersonate'}
        </button>
      )
    )},
  ]

  const userFilters = [
    { key: 'role', label: 'All Roles', options: [
      { label: 'Owner', value: 'owner' },
      { label: 'Admin', value: 'admin' },
      { label: 'Member', value: 'member' },
      { label: 'Viewer', value: 'viewer' },
    ]},
  ]

  const planColumns: Column<Plan>[] = [
    { key: 'name', label: 'Plan', render: (p) => <span style={{ fontWeight: 500 }}>{p.name}</span> },
    { key: 'type', label: 'Type', render: (p) => <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{p.type}</span> },
    { key: 'price_monthly_gbp', label: 'Monthly', render: (p) => p.price_monthly_gbp > 0 ? `\u00A3${(p.price_monthly_gbp / 100).toFixed(2)}` : p.onboarding_fee_gbp > 0 ? `\u00A3${(p.onboarding_fee_gbp / 100).toFixed(2)} one-time` : 'Free' },
    { key: 'monitor_limit', label: 'Monitors', render: (p) => <span>{p.monitor_limit ?? 'Unlimited'}</span> },
    { key: 'check_interval_seconds', label: 'Interval', render: (p) => `${p.check_interval_seconds}s` },
    { key: 'has_api_access', label: 'API', render: (p) => p.has_api_access ? 'Yes' : 'No' },
    { key: 'has_ai_predictive', label: 'AI', render: (p) => p.has_ai_predictive ? 'Yes' : 'No' },
    { key: 'is_visible', label: 'Visible', render: (p) => <span className={`badge ${p.is_visible ? 'badge-success' : 'badge-outline'}`}>{p.is_visible ? 'Yes' : 'Hidden'}</span> },
  ]

  const planFilters = [
    { key: 'type', label: 'All Types', options: [
      { label: 'Direct', value: 'direct' },
      { label: 'Agency', value: 'agency' },
      { label: 'Free', value: 'free' },
    ]},
  ]

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
        <DataTable
          columns={userColumns}
          data={users}
          searchPlaceholder="Search users by email or name..."
          filters={userFilters}
          pageSize={50}
          emptyMessage="No users found."
        />
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
        <DataTable
          columns={planColumns}
          data={plans}
          searchPlaceholder="Search plans..."
          filters={planFilters}
          emptyMessage="No plans configured."
        />
      )}
    </div>
  )
}
