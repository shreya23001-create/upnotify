import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { AdminSystemClientPage } from './system-client'

export const dynamic = 'force-dynamic'

export default async function AdminSystemPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'system'),
    canWriteAdminModule(user.email, isSuperAdmin, 'system'),
  ])
  if (!canRead) redirect('/admin')

  return <AdminSystemClientPage canWrite={canWrite} />
}
