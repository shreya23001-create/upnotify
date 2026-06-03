import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import {
  getAllBlogPostsAdmin,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/lib/db/blog-posts'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

async function getBlogAccess(): Promise<{ canRead: boolean; canWrite: boolean; userId: string }> {
  const user = await getCurrentUser()
  if (!user?.email) return { canRead: false, canWrite: false, userId: '' }
  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'blog'),
    canWriteAdminModule(user.email, isSuperAdmin, 'blog'),
  ])
  return { canRead, canWrite, userId: user.id }
}

/** GET — List all blog posts (admin only) */
export async function GET(): Promise<NextResponse> {
  const { canRead } = await getBlogAccess()
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const posts = await getAllBlogPostsAdmin()
  return NextResponse.json({ success: true, posts })
}

/** POST — Create a new blog post */
export async function POST(request: Request): Promise<NextResponse> {
  const { canWrite, userId } = await getBlogAccess()
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    title: string
    slug: string
    excerpt?: string
    content?: Record<string, unknown>
    category?: string
    status?: string
    seo_title?: string
    seo_description?: string
    published_at?: string
  }

  if (!body.title || !body.slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  const post = await createBlogPost({
    ...body,
    author_id: userId,
  })

  if (!post) {
    return NextResponse.json({ error: 'Failed to create post. Slug may already exist.' }, { status: 500 })
  }

  logger.info('Admin API: Blog post created', { id: post.id, slug: post.slug })
  return NextResponse.json({ success: true, post }, { status: 201 })
}

/** PATCH — Update an existing blog post */
export async function PATCH(request: Request): Promise<NextResponse> {
  const { canWrite } = await getBlogAccess()
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    id: string
    title?: string
    slug?: string
    excerpt?: string
    content?: Record<string, unknown>
    category?: string
    status?: string
    seo_title?: string
    seo_description?: string
    published_at?: string
  }

  if (!body.id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }

  const existing = await getBlogPostById(body.id)
  if (!existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const { id, ...updates } = body
  const post = await updateBlogPost(id, updates)

  if (!post) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }

  logger.info('Admin API: Blog post updated', { id: post.id, slug: post.slug })
  return NextResponse.json({ success: true, post })
}

/** DELETE — Delete a blog post */
export async function DELETE(request: Request): Promise<NextResponse> {
  const { canWrite } = await getBlogAccess()
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }

  const existing = await getBlogPostById(id)
  if (!existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const deleted = await deleteBlogPost(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }

  logger.info('Admin API: Blog post deleted', { id, slug: existing.slug })
  return NextResponse.json({ success: true })
}
