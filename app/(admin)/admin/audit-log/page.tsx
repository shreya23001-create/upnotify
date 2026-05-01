import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { AdminAuditLogClientPage } from './audit-log-client'

export const dynamic = 'force-dynamic'

export default async function AdminAuditLogPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'audit_log'),
    canWriteAdminModule(user.email, isSuperAdmin, 'audit_log'),
  ])
  if (!canRead) redirect('/admin')

  return <AdminAuditLogClientPage canWrite={canWrite} />
}
