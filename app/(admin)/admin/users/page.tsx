import { AdminUsersContent } from '@/components/admin/admin-users-content'

export default function AdminUsersPage(): React.ReactElement {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">
            Every user scored by spend, monitors, plan tier, and tenure. Mimic, change plan, deactivate, or delete — all from one place.
          </p>
        </div>
      </div>
      <AdminUsersContent />
    </div>
  )
}
