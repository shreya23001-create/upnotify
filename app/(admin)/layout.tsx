export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAdminRoleByEmail } from '@/lib/db/admin-roles'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Allow super admins (from users table) or anyone with an active admin_role
  const adminRole = await getAdminRoleByEmail(user.email)
  const hasAdminAccess = user.is_super_admin || (adminRole !== null && adminRole.is_active)

  if (!hasAdminAccess) redirect('/dashboard')

  return (
    <AdminShell userEmail={user.email}>
      {children}
    </AdminShell>
  )
}
