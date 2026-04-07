import { getAllOrganisations, getAllUsers, getFeatureFlags, getPlans } from '@/lib/db/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSubmissionStats } from '@/lib/db/credit-submissions'
import { MonitoringOverview } from '@/components/admin/monitoring-overview'
import Link from 'next/link'

async function getAdminMetrics(): Promise<{
  totalMonitors: number
  activeSubscriptions: number
  mrrPence: number
  recentSignups: number
  openIncidents: number
  trackedSites: number
  pendingCredits: number
}> {
  const supabase = createAdminClient()

  const [monitors, subs, recentUsers, incidents, trackedSites, creditStats] = await Promise.all([
    supabase.from('monitors').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id, plans!inner(price_monthly_gbp)').eq('status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('public_monitors').select('id', { count: 'exact', head: true }).eq('is_active', true),
    getSubmissionStats(),
  ])

  const mrrPence = (subs.data ?? []).reduce((sum, s) => {
    const plan = s as unknown as { plans: { price_monthly_gbp: number } }
    return sum + (plan.plans?.price_monthly_gbp ?? 0)
  }, 0)

  return {
    totalMonitors: monitors.count ?? 0,
    activeSubscriptions: subs.data?.length ?? 0,
    mrrPence,
    recentSignups: recentUsers.count ?? 0,
    openIncidents: incidents.count ?? 0,
    trackedSites: trackedSites.count ?? 0,
    pendingCredits: creditStats.pending,
  }
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [organisations, users, featureFlags, plans, metrics] = await Promise.all([
    getAllOrganisations(), getAllUsers(), getFeatureFlags(), getPlans(), getAdminMetrics(),
  ])

  const activePlans = plans.filter((p) => p.is_visible).length

  return (
    <div>
      <h1 className="admin-page-title">Overview</h1>
      <p className="admin-page-subtitle">Platform snapshot as of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>

      {/* Primary metrics */}
      <div className="admin-stats-grid">
        <Link href="/admin/users" className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{users.length}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
        </Link>

        <Link href="/admin/organisations" className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{organisations.length}</span>
            <span className="admin-stat-label">Organisations</span>
          </div>
        </Link>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{'\u00A3'}{(metrics.mrrPence / 100).toFixed(0)}</span>
            <span className="admin-stat-label">MRR</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{metrics.totalMonitors}</span>
            <span className="admin-stat-label">Active Monitors</span>
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="admin-stats-grid" style={{ marginTop: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-number">{metrics.activeSubscriptions}</span>
            <span className="admin-stat-label">Paid Subscriptions</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-number">{metrics.recentSignups}</span>
            <span className="admin-stat-label">Signups (7 days)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-number" style={{ color: metrics.openIncidents > 0 ? '#ef4444' : undefined }}>{metrics.openIncidents}</span>
            <span className="admin-stat-label">Open Incidents</span>
          </div>
        </div>
        <Link href="/admin/tracker" className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-number">{metrics.trackedSites}</span>
            <span className="admin-stat-label">Tracked Sites</span>
          </div>
        </Link>
      </div>

      {/* Pending actions */}
      {metrics.pendingCredits > 0 && (
        <Link href="/admin/credits" className="admin-stat-card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #f59e0b' }}>
          <div className="admin-stat-info">
            <span className="admin-stat-number" style={{ color: '#f59e0b' }}>{metrics.pendingCredits}</span>
            <span className="admin-stat-label">Pending credit approvals — review now</span>
          </div>
        </Link>
      )}

      <div className="admin-quick-links">
        <h2 className="admin-section-title">Quick Links</h2>
        <div className="admin-quick-links-grid">
          <Link href="/admin/users" className="admin-quick-link">
            <span className="admin-quick-link-label">Manage Users</span>
            <span className="admin-quick-link-desc">View all users, impersonate, manage roles</span>
          </Link>
          <Link href="/admin/organisations" className="admin-quick-link">
            <span className="admin-quick-link-label">Manage Organisations</span>
            <span className="admin-quick-link-desc">View all organisations and their details</span>
          </Link>
          <Link href="/admin/plans" className="admin-quick-link">
            <span className="admin-quick-link-label">Plans & Pricing</span>
            <span className="admin-quick-link-desc">Edit plans, pricing, Compete add-on, credit rules</span>
          </Link>
          <Link href="/admin/tracker" className="admin-quick-link">
            <span className="admin-quick-link-label">Public Tracker</span>
            <span className="admin-quick-link-desc">{metrics.trackedSites} sites tracked for SEO</span>
          </Link>
          <Link href="/admin/messages" className="admin-quick-link">
            <span className="admin-quick-link-label">Messages & Broadcasts</span>
            <span className="admin-quick-link-desc">Send announcements to users by plan type</span>
          </Link>
          <Link href="/admin/credits" className="admin-quick-link">
            <span className="admin-quick-link-label">Credit Approvals</span>
            <span className="admin-quick-link-desc">Review submissions, approve or reject</span>
          </Link>
          <Link href="/admin/support" className="admin-quick-link">
            <span className="admin-quick-link-label">Support Tickets</span>
            <span className="admin-quick-link-desc">View and respond to customer support requests</span>
          </Link>
          <Link href="/admin/settings" className="admin-quick-link">
            <span className="admin-quick-link-label">Settings</span>
            <span className="admin-quick-link-desc">Trusted logos, landing page content</span>
          </Link>
        </div>
      </div>

      {/* Monitoring Overview — all monitors across all orgs */}
      <MonitoringOverview />
    </div>
  )
}
