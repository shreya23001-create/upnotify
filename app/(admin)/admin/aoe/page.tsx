import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { AdminAoeClientPage } from './aoe-client'

export const dynamic = 'force-dynamic'

export default async function AdminAoePage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'aoe'),
    canWriteAdminModule(user.email, isSuperAdmin, 'aoe'),
  ])
  if (!canRead) redirect('/admin')

  return <AdminAoeClientPage canWrite={canWrite} />
}
