import { getAllUsers, getAllOrganisations, getPlans } from '@/lib/db/admin'
import { AdminUsersContent } from '@/components/admin/admin-users-content'

export default async function AdminUsersPage(): Promise<React.ReactElement> {
  const [users, organisations, plans] = await Promise.all([
    getAllUsers(),
    getAllOrganisations(),
    getPlans(),
  ])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">
            Manage all users. Delete, deactivate, change plans, or impersonate for debugging.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{users.length}</span>
          <span className="admin-page-header-stat-label">total users</span>
        </div>
      </div>
      <AdminUsersContent users={users} organisations={organisations} plans={plans} />
    </div>
  )
}
