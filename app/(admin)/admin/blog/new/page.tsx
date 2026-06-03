import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { AdminBlogEditor } from '@/components/admin/admin-blog-editor'

export default async function AdminBlogNewPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'blog'),
    canWriteAdminModule(user.email, isSuperAdmin, 'blog'),
  ])
  if (!canRead || !canWrite) redirect('/admin')

  return <AdminBlogEditor />
}
