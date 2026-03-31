'use client'

import { useState } from 'react'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import type { Organisation, User, Subscription, Invoice, ApiKey, Plan } from '@/lib/types'
import { CurrentPlan } from '@/components/billing/current-plan'
import { PricingTable } from '@/components/billing/pricing-table'
import { InvoiceList } from '@/components/billing/invoice-list'
import { CompanyDetailsForm } from '@/components/dashboard/settings/company-details-form'
import { OrgSettingsForm } from '@/components/dashboard/settings/org-settings-form'

interface SettingsContentProps {
  organisation: Organisation
  members: User[]
  currentUserId: string
  subscription: Subscription | null
  invoices: Invoice[]
  apiKeys: ApiKey[]
  plans: Plan[]
  currentPlan: Plan | null
}

export function SettingsContent({ organisation, members, currentUserId, subscription, invoices, apiKeys, plans, currentPlan }: SettingsContentProps) {
  const [tab, setTab] = useState('organisation')

  const memberColumns: Column<User>[] = [
    { key: 'full_name', label: 'Name', render: (m) => (
      <span style={{ fontWeight: 500 }}>
        {m.full_name ?? '\u2014'}
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

  async function saveCompanyDetails(formData: FormData): Promise<{ error?: string }> {
    const res = await fetch('/api/v1/organisation/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: formData.get('company_name'),
        billing_email: formData.get('billing_email'),
        company_address_line1: formData.get('company_address_line1'),
        company_address_line2: formData.get('company_address_line2'),
        company_city: formData.get('company_city'),
        company_postcode: formData.get('company_postcode'),
        company_country: formData.get('company_country'),
        company_registration_number: formData.get('company_registration_number'),
        company_vat_number: formData.get('company_vat_number'),
      }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Failed to save company details.' }
    return {}
  }

  return (
    <div>
      <div className="tabs-list">
        {['organisation', 'team', 'billing', 'company', 'api-keys'].map((t) => (
          <button key={t} className={`tab-trigger${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'api-keys' ? 'API Keys' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'organisation' && (
        <OrgSettingsForm organisation={organisation} />
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
          <CurrentPlan plan={currentPlan} subscription={subscription} />
          <PricingTable plans={plans} currentPlanSlug={currentPlan?.slug} />
          <InvoiceList invoices={invoices} />
        </div>
      )}

      {tab === 'company' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Company Details</div></div>
          <div className="card-content">
            <CompanyDetailsForm organisation={organisation} onSave={saveCompanyDetails} />
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
