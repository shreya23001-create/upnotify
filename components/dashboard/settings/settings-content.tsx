'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Organisation, User, Subscription, Invoice, ApiKey, Plan, UserCredit, CreditRule, Referral } from '@/lib/types'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { CurrentPlan } from '@/components/billing/current-plan'
import { PricingTable } from '@/components/billing/pricing-table'
import { InvoiceList } from '@/components/billing/invoice-list'
import { CreditsSection } from '@/components/billing/credits-section'
import { ReferralSection } from '@/components/billing/referral-section'
import { CompanyDetailsForm } from '@/components/dashboard/settings/company-details-form'
import { OrgSettingsForm } from '@/components/dashboard/settings/org-settings-form'
import { LogoUpload } from '@/components/ui/logo-upload'
import { TeamInviteForm } from '@/components/dashboard/settings/team-invite-form'

interface SettingsContentProps {
  organisation: Organisation
  members: User[]
  currentUserId: string
  currentUserRole: string
  subscription: Subscription | null
  invoices: Invoice[]
  apiKeys: ApiKey[]
  plans: Plan[]
  currentPlan: Plan | null
  teamMemberLimit: number
  teamMemberCount: number
  canInvite: boolean
  credits: UserCredit[]
  creditBalance: number
  creditRules: CreditRule[]
  referralCode: string | null
  referrals: Referral[]
  defaultCurrency: SupportedCurrency
}

export function SettingsContent({
  organisation,
  members,
  currentUserId,
  currentUserRole,
  subscription,
  invoices,
  apiKeys,
  plans,
  currentPlan,
  teamMemberLimit,
  teamMemberCount,
  canInvite,
  credits,
  creditBalance,
  creditRules,
  referralCode,
  referrals,
  defaultCurrency,
}: SettingsContentProps): React.ReactElement {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'organisation'
  const [tab, setTab] = useState(initialTab)
  const billingResult = searchParams.get('billing') // 'success' | 'canceled' | null
  const [revokeIds, setRevokeIds] = useState<string[]>([])
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [apiKeyList, setApiKeyList] = useState<ApiKey[]>(apiKeys)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newKeyResult, setNewKeyResult] = useState<{ rawKey: string; name: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [teamMembers, setTeamMembers] = useState<User[]>(members)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const executeRevoke = useCallback(async (): Promise<void> => {
    setRevokeError(null)
    try {
      const res = await fetch('/api/v1/api-keys/revoke', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: revokeIds }),
      })
      const data: Record<string, unknown> = await res.json()
      if (!res.ok) {
        setRevokeError((data.error as string) || 'Failed to revoke API key(s).')
        return
      }
      setApiKeyList((prev) => prev.filter((k) => !revokeIds.includes(k.id)))
      setRevokeIds([])
    } catch {
      setRevokeError('Network error. Please try again.')
    }
  }, [revokeIds])

  const handleCreateKey = useCallback(async (): Promise<void> => {
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setCreateError((data.error as string) || 'Failed to create key.')
        return
      }
      setApiKeyList(prev => [data.key as ApiKey, ...prev])
      setNewKeyResult({ rawKey: data.rawKey as string, name: newKeyName.trim() })
      setNewKeyName('')
      setShowCreateForm(false)
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreatingKey(false)
    }
  }, [newKeyName])

  const handleCopyKey = useCallback((): void => {
    if (!newKeyResult?.rawKey) return
    void navigator.clipboard.writeText(newKeyResult.rawKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }, [newKeyResult])

  const handleInviteSent = useCallback((): void => {
    // Invites are managed separately — no need to update team members list here.
    // The team-invite-form component fetches its own invites list.
  }, [])

  const executeRemoveMember = useCallback(async (): Promise<void> => {
    if (!removeTarget) return
    setRemoveError(null)

    try {
      const res = await fetch('/api/v1/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: removeTarget }),
      })
      const data: Record<string, unknown> = await res.json()
      if (!res.ok) {
        setRemoveError((data.error as string) || 'Failed to remove member.')
        return
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== removeTarget))
      setRemoveTarget(null)
    } catch {
      setRemoveError('Network error. Please try again.')
    }
  }, [removeTarget])

  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin'

  const memberColumns: Column<User>[] = [
    { key: 'full_name', label: 'Name', render: (m) => (
      <span style={{ fontWeight: 500 }}>
        {m.full_name ?? '\u2014'}
        {m.id === currentUserId && <span style={{ marginLeft: 8, fontSize: 12, color: '#a1a1aa' }}>(you)</span>}
      </span>
    )},
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (m) => <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{m.role}</span> },
    ...(canManageTeam ? [{
      key: 'actions' as keyof User,
      label: '',
      render: (m: User) => (
        m.id !== currentUserId && m.role !== 'owner' ? (
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#ef4444', fontSize: 13 }}
            onClick={() => setRemoveTarget(m.id)}
          >
            Remove
          </button>
        ) : null
      ),
    }] : []),
  ]

  const apiKeyColumns: Column<ApiKey>[] = [
    { key: 'name', label: 'Name', render: (k) => <span style={{ fontWeight: 500 }}>{k.name}</span> },
    { key: 'key_prefix', label: 'Prefix', render: (k) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{k.key_prefix}...</span> },
    { key: 'created_at', label: 'Created', render: (k) => <span className="table-muted">{new Date(k.created_at).toLocaleDateString()}</span> },
    { key: 'last_used_at', label: 'Last Used', render: (k) => <span className="table-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</span> },
  ]

  const apiKeyBulkActions: BulkAction[] = [
    { label: 'Revoke', onClick: (ids: string[]) => { setRevokeIds(ids) }, variant: 'danger' },
  ]

  async function uploadLogo(base64Data: string): Promise<{ error?: string }> {
    const res = await fetch('/api/v1/organisation/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: base64Data }),
    })
    const data: Record<string, unknown> = await res.json()
    if (!res.ok) return { error: (data.error as string) || 'Failed to upload logo.' }
    return {}
  }

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
    <>
    <div>
      {/* Billing return banner */}
      {billingResult === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <strong>Plan activated.</strong> Your subscription is now live. It may take a moment to reflect across all features.
        </div>
      )}
      {billingResult === 'canceled' && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <strong>Payment canceled.</strong> No charge was made. Your current plan remains unchanged.
        </div>
      )}
      {billingResult === 'portal_return' && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <strong>Changes saved.</strong> Your subscription changes are being processed by Stripe. This page may take a moment to reflect the latest status.
        </div>
      )}

      <div className="tabs-list">
        {['organisation', 'billing', 'credits', 'referrals', 'company', 'api-keys'].map((t) => (
          <button key={t} className={`tab-trigger${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'api-keys' ? 'API Keys' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'organisation' && (
        <OrgSettingsForm organisation={organisation} />
      )}

      {tab === 'billing' && (
        <div className="space-y">
          <CurrentPlan plan={currentPlan} subscription={subscription} />
          <PricingTable plans={plans} currentPlanSlug={currentPlan?.slug} creditBalancePence={creditBalance} defaultCurrency={defaultCurrency} />

          <InvoiceList invoices={invoices} />
        </div>
      )}

      {tab === 'credits' && (
        <CreditsSection credits={credits} creditRules={creditRules} balancePence={creditBalance} />
      )}

      {tab === 'referrals' && (
        <ReferralSection referralCode={referralCode} referrals={referrals} />
      )}

      {tab === 'company' && (
        <div className="space-y">
          <div className="card">
            <div className="card-header"><div className="card-title">Organisation Logo</div></div>
            <div className="card-content">
              <LogoUpload
                currentLogoUrl={organisation.logo_url}
                orgName={organisation.name}
                onUpload={uploadLogo}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Company Details</div></div>
            <div className="card-content">
              <CompanyDetailsForm organisation={organisation} onSave={saveCompanyDetails} />
            </div>
          </div>
        </div>
      )}

      {tab === 'api-keys' && (
        <div>
          {/* Show-once new key modal */}
          {newKeyResult && (
            <div className="api-key-reveal-overlay">
              <div className="api-key-reveal-card">
                <div className="api-key-reveal-icon">🔑</div>
                <h3 className="api-key-reveal-title">Your new API key — copy it now</h3>
                <p className="api-key-reveal-sub">
                  This is the <strong>only time</strong> you will see the full key. Store it somewhere safe.
                </p>
                <div className="api-key-reveal-name">Key name: <strong>{newKeyResult.name}</strong></div>
                <div className="api-key-raw-row">
                  <code className="api-key-raw">{newKeyResult.rawKey}</code>
                  <button
                    className={`btn btn-sm ${copiedKey ? 'btn-success' : 'btn-secondary'}`}
                    onClick={handleCopyKey}
                    style={{ flexShrink: 0 }}
                  >
                    {copiedKey ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 16 }}
                  onClick={() => { setNewKeyResult(null); setCopiedKey(false) }}
                >
                  I&apos;ve saved it — close
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header card-header-row">
              <div>
                <div className="card-title">API Keys</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Used to authenticate with the Uptrue API and Compete webhooks. Keys are only shown once.
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setShowCreateForm(f => !f); setCreateError(null) }}
              >
                {showCreateForm ? 'Cancel' : '+ Create Key'}
              </button>
            </div>
            <div className="card-content">
              {showCreateForm && (
                <div className="api-key-create-form">
                  <input
                    className="form-input"
                    placeholder="Key name (e.g. WooCommerce store, Zapier)"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    maxLength={64}
                    disabled={creatingKey}
                    onKeyDown={e => { if (e.key === 'Enter') void handleCreateKey() }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => void handleCreateKey()}
                    disabled={creatingKey || !newKeyName.trim()}
                  >
                    {creatingKey ? 'Creating...' : 'Create Key'}
                  </button>
                  {createError && (
                    <div className="alert alert-error" style={{ marginTop: 8 }}>{createError}</div>
                  )}
                </div>
              )}
              {revokeError && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>{revokeError}</div>
              )}
              <DataTable
                columns={apiKeyColumns}
                data={apiKeyList}
                searchPlaceholder="Search API keys..."
                bulkActions={apiKeyBulkActions}
                emptyMessage="No API keys yet. Create one above to get started."
              />
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmDialog
        isOpen={revokeIds.length > 0}
        onConfirm={() => { void executeRevoke() }}
        onCancel={() => { setRevokeIds([]); setRevokeError(null) }}
        title={revokeIds.length === 1 ? 'Revoke API Key' : `Revoke ${revokeIds.length} API Key(s)`}
        message={revokeIds.length === 1
          ? 'This API key will be permanently revoked. Any integrations using it will stop working immediately. This action cannot be undone.'
          : `${revokeIds.length} API key(s) will be permanently revoked. Any integrations using them will stop working immediately. This action cannot be undone.`}
        confirmText={revokeIds.length === 1 ? 'Revoke' : 'Revoke All'}
        variant="danger"
      />
      <ConfirmDialog
        isOpen={removeTarget !== null}
        onConfirm={() => { void executeRemoveMember() }}
        onCancel={() => { setRemoveTarget(null); setRemoveError(null) }}
        title="Remove Team Member"
        message={removeError || 'This person will immediately lose access to all monitors, alerts, and settings. This action cannot be undone.'}
        confirmText="Remove"
        variant="danger"
      />
    </>
  )
}
