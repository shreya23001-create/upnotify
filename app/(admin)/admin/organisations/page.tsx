import { getAllOrganisations } from '@/lib/db/admin'
import { AdminOrgsContent } from '@/components/admin/admin-orgs-content'
export const dynamic = 'force-dynamic'

export default async function AdminOrganisationsPage(): Promise<React.ReactElement> {
  const organisations = await getAllOrganisations()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Organisations</h1>
          <p className="admin-page-subtitle">
            View and manage all organisations on the platform.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{organisations.length}</span>
          <span className="admin-page-header-stat-label">total orgs</span>
        </div>
      </div>
      <AdminOrgsContent organisations={organisations} />
    </div>
  )
}
