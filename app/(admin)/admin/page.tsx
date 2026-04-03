import { getAllOrganisations, getAllUsers, getFeatureFlags, getPlans } from '@/lib/db/admin'
import Link from 'next/link'

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [organisations, users, featureFlags, plans] = await Promise.all([
    getAllOrganisations(), getAllUsers(), getFeatureFlags(), getPlans(),
  ])

  const activePlans = plans.filter((p) => p.is_visible).length

  return (
    <div>
      <h1 className="admin-page-title">Overview</h1>
      <p className="admin-page-subtitle">Welcome to the Uptrue admin panel. Here is a snapshot of your platform.</p>

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

        <Link href="/admin/feature-flags" className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{featureFlags.length}</span>
            <span className="admin-stat-label">Feature Flags</span>
          </div>
        </Link>

        <Link href="/admin/plans" className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{activePlans}</span>
            <span className="admin-stat-label">Active Plans</span>
          </div>
        </Link>
      </div>

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
            <span className="admin-quick-link-desc">Edit plans, pricing, credit rules</span>
          </Link>
          <Link href="/admin/tracker" className="admin-quick-link">
            <span className="admin-quick-link-label">Public Tracker</span>
            <span className="admin-quick-link-desc">Manage publicly tracked sites for SEO</span>
          </Link>
          <Link href="/admin/settings" className="admin-quick-link">
            <span className="admin-quick-link-label">Settings</span>
            <span className="admin-quick-link-desc">Trusted logos, landing page content</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
