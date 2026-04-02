import { getAllAdminRoles } from '@/lib/db/admin-roles'
import { getCurrentUser } from '@/lib/db/users'
import { redirect } from 'next/navigation'
import { AdminTeamContent } from '@/components/admin/admin-team-content'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) redirect('/admin')

  const adminRoles = await getAllAdminRoles()

  return (
    <div>
      <h1 className="admin-page-title">Admin Team</h1>
      <p className="admin-page-subtitle">
        Manage admin users who can access the admin panel. All admins must log in with Google OAuth.
      </p>
      <AdminTeamContent
        adminRoles={adminRoles}
        currentUserEmail={user.email}
      />
    </div>
  )
}
