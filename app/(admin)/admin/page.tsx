import { getAllOrganisations, getAllUsers, getFeatureFlags, getPlans } from '@/lib/db/admin'
import { AdminContent } from '@/components/admin/admin-content'
import Link from 'next/link'

export default async function AdminPage(): Promise<React.ReactElement> {
  const [organisations, users, featureFlags, plans] = await Promise.all([
    getAllOrganisations(), getAllUsers(), getFeatureFlags(), getPlans(),
  ])

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Super Admin Panel</h1>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div></div></div>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Organisations</div><div className="stat-value">{organisations.length}</div></div></div>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Feature Flags</div><div className="stat-value">{featureFlags.length}</div></div></div>
      </div>
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/admin/plans" className="btn btn-secondary">Plans &amp; Pricing</Link>
        <Link href="/admin/tracker" className="btn btn-secondary">Public Tracker</Link>
      </div>
      <AdminContent users={users} organisations={organisations} featureFlags={featureFlags} plans={plans} />
    </div>
  )
}
