import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { AdminSystemClientPage } from './system-client'

export const dynamic = 'force-dynamic'

export default async function AdminSystemPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) redirect('/admin')

  return <AdminSystemClientPage />
}
