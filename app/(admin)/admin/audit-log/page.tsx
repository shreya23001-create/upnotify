import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { AdminAuditLogClientPage } from './audit-log-client'

export const dynamic = 'force-dynamic'

export default async function AdminAuditLogPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'audit_log')) redirect('/admin')

  return <AdminAuditLogClientPage />
}
