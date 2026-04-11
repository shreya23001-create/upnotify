export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAdminRoleByEmail } from '@/lib/db/admin-roles'
import { AdminShell } from '@/components/admin/admin-shell'
import { createAdminClient } from '@/lib/supabase/admin'

async function getPendingBlogCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_approval')
  return count ?? 0
}

export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Allow super admins (from users table) or anyone with an active admin_role
  const adminRole = await getAdminRoleByEmail(user.email)
  const hasAdminAccess = user.is_super_admin || (adminRole !== null && adminRole.is_active)

  if (!hasAdminAccess) redirect('/dashboard')

  const pendingBlogCount = await getPendingBlogCount()

  return (
    <AdminShell userEmail={user.email} pendingBlogCount={pendingBlogCount}>
      {children}
    </AdminShell>
  )
}
