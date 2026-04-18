import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { MonitorTypeHealthDashboard } from '@/components/admin/monitor-type-health'

export const dynamic = 'force-dynamic'

export default async function MonitorHealthPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) redirect('/admin')

  return <MonitorTypeHealthDashboard />
}
