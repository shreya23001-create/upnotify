import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getBlogPostById } from '@/lib/db/blog-posts'
import { AdminBlogEditor } from '@/components/admin/admin-blog-editor'

interface BlogEditPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBlogEditPage({ params }: BlogEditPageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const canRead = await canAccessAdminModule(user.email, isSuperAdmin, 'blog')
  if (!canRead) redirect('/admin')

  const { id } = await params
  const post = await getBlogPostById(id)
  if (!post) notFound()

  return <AdminBlogEditor post={post} />
}
