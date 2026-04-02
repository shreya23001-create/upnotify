import { getAllUsers, getAllOrganisations } from '@/lib/db/admin'
import { AdminUsersContent } from '@/components/admin/admin-users-content'

export default async function AdminUsersPage(): Promise<React.ReactElement> {
  const [users, organisations] = await Promise.all([
    getAllUsers(),
    getAllOrganisations(),
  ])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">
            Manage all platform users. View details, manage roles, and impersonate users for debugging.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{users.length}</span>
          <span className="admin-page-header-stat-label">total users</span>
        </div>
      </div>
      <AdminUsersContent users={users} organisations={organisations} />
    </div>
  )
}
