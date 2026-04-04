import { notFound } from 'next/navigation'
import { getBlogPostById } from '@/lib/db/blog-posts'
import { AdminBlogEditor } from '@/components/admin/admin-blog-editor'

interface BlogEditPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBlogEditPage({ params }: BlogEditPageProps): Promise<React.ReactElement> {
  const { id } = await params
  const post = await getBlogPostById(id)

  if (!post) {
    notFound()
  }

  return <AdminBlogEditor post={post} />
}
