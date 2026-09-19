'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, KeyRound } from 'lucide-react'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Organisation, User, Subscription, Invoice, ApiKey, Plan, UserCredit, CreditRule, Referral } from '@/lib/types'
import type { AddonSubscription } from '@/lib/db/subscriptions'
import type { SupportedCurrency } from '@/lib/utils/currency'
import type { PageSection, CmsTheme } from '@/lib/types/cms'
import { CurrentPlan } from '@/components/billing/current-plan'
import { PricingTable } from '@/components/billing/pricing-table'
import { InvoiceList } from '@/components/billing/invoice-list'
import { CreditsSection } from '@/components/billing/credits-section'
import { ReferralSection } from '@/components/billing/referral-section'
import { CompanyDetailsForm } from '@/components/dashboard/settings/company-details-form'
import { OrgSettingsForm } from '@/components/dashboard/settings/org-settings-form'
import { LogoUpload } from '@/components/ui/logo-upload'
import { TeamInviteForm } from '@/components/dashboard/settings/team-invite-form'
import { CmsManager } from '@/components/admin/cms-manager'

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
  addonSubscriptions?: AddonSubscription[]
  teamMemberLimit: number
  teamMemberCount: number
  canInvite: boolean
  credits: UserCredit[]
  creditBalance: number
  creditRules: CreditRule[]
  referralCode: string | null
  referrals: Referral[]
  defaultCurrency: SupportedCurrency
  isSuperAdmin?: boolean
  cmsSections?: PageSection[]
  cmsTheme?: CmsTheme | null
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
  addonSubscriptions = [],
  teamMemberLimit,
  teamMemberCount,
  canInvite,
  credits,
  creditBalance,
  creditRules,
  referralCode,
  referrals,
  defaultCurrency,
  isSuperAdmin = false,
  cmsSections = [],
  cmsTheme = null,
}: SettingsContentProps): React.ReactElement {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab') || 'organisation'
  const [tab, setTab] = useState(initialTab)
  const billingResult = searchParams.get('billing') // 'success' | 'canceled' | null

  // After a successful checkout, the webhook may not have fired yet — auto-refresh
  // after 4s so the billing tab reflects the new plan without manual reload
  useEffect(() => {
    if (billingResult !== 'success') return
    const t = setTimeout(() => router.refresh(), 4000)
    return () => clearTimeout(t)
  }, [billingResult, router])

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
    { key: 'created_at', label: 'Created', render: (k) => <span className="table-muted">{new Date(k.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
    { key: 'last_used_at', label: 'Last Used', render: (k) => <span className="table-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</span> },
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

  type NavItem = { id: string; label: string; short: string; icon: React.ReactElement; adminOnly?: boolean }
  const navItems: NavItem[] = [
    { id: 'organisation', label: 'Organisation', short: 'Org',      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'company',      label: 'Company',      short: 'Company',  icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { id: 'team',         label: 'Team',         short: 'Team',     icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'billing',      label: 'Billing',      short: 'Billing',  icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { id: 'landing',      label: 'CMS',          short: 'CMS',      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, adminOnly: true },
  ]

  const visibleNav = navItems.filter(n => !n.adminOnly || isSuperAdmin)

  return (
    <>
      <div className="stt-root">

        {/* ── Sidebar ── */}
        <nav className="stt-sidebar">
          <div className="stt-nav-group">
            {visibleNav.map(n => (
              <button
                key={n.id}
                className={`stt-nav-item${tab === n.id ? ' stt-nav-active' : ''}`}
                onClick={() => setTab(n.id)}
              >
                <span className="stt-nav-icon">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Main panel ── */}
        <div className="stt-panel">

          {/* Billing return banners */}
          {billingResult === 'success' && (
            <div className="alert alert-success stt-banner">
              <strong>Plan activated.</strong> Your subscription is now live. It may take a moment to reflect across all features.
            </div>
          )}
          {billingResult === 'canceled' && (
            <div className="alert alert-warning stt-banner">
              <strong>Payment canceled.</strong> No charge was made. Your current plan remains unchanged.
            </div>
          )}
          {billingResult === 'cancelled' && (
            <div className="alert alert-warning stt-banner">
              <strong>Subscription cancelled.</strong> You keep full access until the end of your billing period. After that, monitoring stops and your monitors are deactivated until you resubscribe.
            </div>
          )}
          {billingResult === 'portal_return' && (
            <div className="alert alert-success stt-banner">
              <strong>Changes saved.</strong> Your subscription changes are being processed by Stripe. This page may take a moment to reflect the latest status.
            </div>
          )}

          {/* Mobile tab bar */}
          <div className="stt-mobile-tabs">
            {visibleNav.map(n => (
              <button
                key={n.id}
                className={`stt-mobile-tab${tab === n.id ? ' stt-mobile-tab-active' : ''}`}
                onClick={() => setTab(n.id)}
              >
                {n.icon}
                <span>{n.short}</span>
              </button>
            ))}
          </div>

          {/* ── Tab: Organisation ── */}
          {tab === 'organisation' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Organisation</div>
                  <div className="stt-section-sub">Your workspace name and primary settings.</div>
                </div>
              </div>
              <OrgSettingsForm organisation={organisation} />
            </div>
          )}

          {/* ── Tab: Company ── */}
          {tab === 'company' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Company</div>
                  <div className="stt-section-sub">Logo and billing address for invoices.</div>
                </div>
              </div>
              <div className="space-y">
                <div className="card">
                  <div className="card-header"><div className="card-title">Organisation Logo</div></div>
                  <div className="card-content">
                    <LogoUpload currentLogoUrl={organisation.logo_url} orgName={organisation.name} onUpload={uploadLogo} />
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Company Details</div></div>
                  <div className="card-content">
                    <CompanyDetailsForm organisation={organisation} onSave={saveCompanyDetails} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Team ── */}
          {tab === 'team' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Team</div>
                  <div className="stt-section-sub">Manage members and send invites.</div>
                </div>
              </div>
              <div className="space-y">
                <div className="card">
                  <div className="card-header"><div className="card-title">Team Members</div></div>
                  <div className="card-content">
                    <DataTable columns={memberColumns} data={teamMembers} searchPlaceholder="Search members..." emptyMessage="No team members yet." />
                  </div>
                </div>
                {canManageTeam && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Invite Team Member</div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {canInvite
                          ? `${teamMemberCount} of ${teamMemberLimit === 0 ? '∞' : teamMemberLimit} seats used`
                          : 'Team member limit reached. Upgrade your plan to invite more.'}
                      </p>
                    </div>
                    <div className="card-content">
                      {canInvite
                        ? <TeamInviteForm canInvite={canInvite} teamMemberLimit={teamMemberLimit} teamMemberCount={teamMemberCount} onInviteSent={handleInviteSent} />
                        : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Team invites are not available on your current plan. Upgrade to invite team members.</p>
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Billing ── */}
          {tab === 'billing' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Billing</div>
                  <div className="stt-section-sub">Your plan, invoices and payment details.</div>
                </div>
              </div>
              <div className="space-y">
                <CurrentPlan plan={currentPlan} subscription={subscription} />
                {/* Pre Plan/Pro Plan picker only makes sense for orgs that
                    already have one of those org-level plans (grandfathered
                    subscribers). Everyone else uses the new per-website
                    ₹149/year model — see the "Plans" sidebar tab instead. */}
                {currentPlan && (
                  <PricingTable plans={plans} currentPlanSlug={currentPlan?.slug} subscription={subscription} creditBalancePence={creditBalance} defaultCurrency={defaultCurrency} addonSubscriptions={addonSubscriptions} />
                )}
                <InvoiceList invoices={invoices} />
              </div>
            </div>
          )}

          {/* ── Tab: Credits ── */}
          {tab === 'credits' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Credits</div>
                  <div className="stt-section-sub">Earn and spend credits across Upnotify features.</div>
                </div>
              </div>
              <CreditsSection credits={credits} creditRules={creditRules} balancePence={creditBalance} currency={defaultCurrency} />
            </div>
          )}

          {/* ── Tab: Referrals ── */}
          {tab === 'referrals' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">Referrals</div>
                  <div className="stt-section-sub">Share your link and earn credits for every sign-up.</div>
                </div>
              </div>
              <ReferralSection referralCode={referralCode} referrals={referrals} />
            </div>
          )}

          {/* ── Tab: API Keys ── */}
          {tab === 'api-keys' && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">API Keys</div>
                  <div className="stt-section-sub">Authenticate with the Upnotify API. Keys are shown once.</div>
                </div>
              </div>

              {!currentPlan?.has_api_access && (
                <div className="card stt-upgrade-gate">
                  <div className="stt-gate-icon"><Lock size={32} /></div>
                  <div className="stt-gate-title">API access requires a paid plan</div>
                  <p className="stt-gate-sub">Upgrade to create API keys and integrate Upnotify with your tools and workflows.</p>
                  <a href="/dashboard/settings?tab=billing" className="btn btn-primary btn-sm">Upgrade plan</a>
                </div>
              )}

              {newKeyResult && (
                <div className="api-key-reveal-overlay">
                  <div className="api-key-reveal-card">
                    <div className="api-key-reveal-icon"><KeyRound size={28} /></div>
                    <h3 className="api-key-reveal-title">Your new API key — copy it now</h3>
                    <p className="api-key-reveal-sub">This is the <strong>only time</strong> you will see the full key. Store it somewhere safe.</p>
                    <div className="api-key-reveal-name">Key name: <strong>{newKeyResult.name}</strong></div>
                    <div className="api-key-raw-row">
                      <code className="api-key-raw">{newKeyResult.rawKey}</code>
                      <button className={`btn btn-sm ${copiedKey ? 'btn-success' : 'btn-secondary'}`} onClick={handleCopyKey} style={{ flexShrink: 0 }}>
                        {copiedKey ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => { setNewKeyResult(null); setCopiedKey(false) }}>
                      I&apos;ve saved it — close
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header card-header-row">
                  <div>
                    <div className="card-title">API Keys</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Used to authenticate with the Upnotify API and Compete webhooks.</p>
                  </div>
                  {currentPlan?.has_api_access && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setShowCreateForm(f => !f); setCreateError(null) }}>
                      {showCreateForm ? 'Cancel' : '+ Create Key'}
                    </button>
                  )}
                </div>
                <div className="card-content">
                  {showCreateForm && (
                    <div className="api-key-create-form">
                      <input className="form-input" placeholder="Key name (e.g. WooCommerce store, Zapier)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} maxLength={64} disabled={creatingKey} onKeyDown={e => { if (e.key === 'Enter') void handleCreateKey() }} autoFocus />
                      <button className="btn btn-primary" onClick={() => void handleCreateKey()} disabled={creatingKey || !newKeyName.trim()}>
                        {creatingKey ? 'Creating...' : 'Create Key'}
                      </button>
                      {createError && <div className="alert alert-error" style={{ marginTop: 8 }}>{createError}</div>}
                    </div>
                  )}
                  {revokeError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{revokeError}</div>}
                  <DataTable columns={apiKeyColumns} data={apiKeyList} searchPlaceholder="Search API keys..." bulkActions={apiKeyBulkActions} emptyMessage="No API keys yet. Create one above to get started." />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: CMS (super-admin) ── */}
          {tab === 'landing' && isSuperAdmin && (
            <div className="stt-section">
              <div className="stt-section-header">
                <div className="stt-section-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <div>
                  <div className="stt-section-title">CMS</div>
                  <div className="stt-section-sub">Manage landing page content and theme.</div>
                </div>
              </div>
              <CmsManager initialSections={cmsSections} initialTheme={cmsTheme} />
            </div>
          )}

        </div>{/* end stt-panel */}
      </div>{/* end stt-root */}

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
