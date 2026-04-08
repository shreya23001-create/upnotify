import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { AdminAoeClientPage } from './aoe-client'

export const dynamic = 'force-dynamic'

export default async function AdminAoePage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'aoe')) redirect('/admin')

  return <AdminAoeClientPage />
}
