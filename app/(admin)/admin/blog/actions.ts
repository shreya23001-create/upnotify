'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/lib/db/blog-posts'
import { logger } from '@/lib/utils/logger'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Create a new blog post */
export async function createBlogPostAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const title = (formData.get('title') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim() || slugify(title)
  const excerpt = (formData.get('excerpt') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim() || ''
  const category = (formData.get('category') as string)?.trim() || null
  const status = (formData.get('status') as string) || 'draft'
  const seoTitle = (formData.get('seo_title') as string)?.trim() || null
  const seoDescription = (formData.get('seo_description') as string)?.trim() || null
  const publishedAt = (formData.get('published_at') as string)?.trim() || null

  if (!title) return { success: false, error: 'Title is required' }
  if (!slug) return { success: false, error: 'Slug is required' }

  const post = await createBlogPost({
    title,
    slug,
    excerpt,
    content: { body: content },
    category,
    status,
    seo_title: seoTitle,
    seo_description: seoDescription,
    published_at: status === 'published' && !publishedAt
      ? new Date().toISOString()
      : publishedAt,
    author_id: user.id,
  })

  if (!post) {
    return { success: false, error: 'Failed to create post. The slug may already exist.' }
  }

  logger.info('Admin: Blog post created', { slug, title })
  revalidatePath('/admin/blog')
  return { success: true, id: post.id }
}

/** Update an existing blog post */
export async function updateBlogPostAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'Post ID is required' }

  const title = (formData.get('title') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const excerpt = (formData.get('excerpt') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim() || ''
  const category = (formData.get('category') as string)?.trim() || null
  const status = (formData.get('status') as string) || 'draft'
  const seoTitle = (formData.get('seo_title') as string)?.trim() || null
  const seoDescription = (formData.get('seo_description') as string)?.trim() || null
  const publishedAt = (formData.get('published_at') as string)?.trim() || null

  if (!title) return { success: false, error: 'Title is required' }
  if (!slug) return { success: false, error: 'Slug is required' }

  const post = await updateBlogPost(id, {
    title,
    slug,
    excerpt,
    content: { body: content },
    category,
    status,
    seo_title: seoTitle,
    seo_description: seoDescription,
    published_at: status === 'published' && !publishedAt
      ? new Date().toISOString()
      : publishedAt,
  })

  if (!post) {
    return { success: false, error: 'Failed to update post. The slug may already exist.' }
  }

  logger.info('Admin: Blog post updated', { id, slug, title })
  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${id}`)
  return { success: true, id: post.id }
}

/** Delete a blog post */
export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  if (!id) return { success: false, error: 'Post ID is required' }

  const deleted = await deleteBlogPost(id)
  if (!deleted) {
    return { success: false, error: 'Failed to delete post' }
  }

  logger.info('Admin: Blog post deleted', { id })
  revalidatePath('/admin/blog')
  return { success: true }
}
