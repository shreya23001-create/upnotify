import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getAllBlogPostsAdmin } from '@/lib/db/blog-posts'
import { AdminBlogContent } from '@/components/admin/admin-blog-content'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'blog')) redirect('/admin')

  const posts = await getAllBlogPostsAdmin()

  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length
  const archivedCount = posts.filter(p => p.status === 'archived').length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog</h1>
          <p className="admin-page-subtitle">
            Create and manage blog posts. Published posts appear on the public blog for SEO and content marketing.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{posts.length}</span>
          <span className="admin-page-header-stat-label">total posts</span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Published</div>
            <div className="stat-value">{publishedCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Drafts</div>
            <div className="stat-value">{draftCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Archived</div>
            <div className="stat-value">{archivedCount}</div>
          </div>
        </div>
      </div>

      <AdminBlogContent posts={posts} />
    </div>
  )
}
