import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { BlogPost } from '@/lib/types'

export interface BlogPostInput {
  title: string
  slug: string
  excerpt?: string | null
  content?: Record<string, unknown> | string | null
  category?: string | null
  status?: string
  seo_title?: string | null
  seo_description?: string | null
  og_image_url?: string | null
  tags?: string[] | null
  published_at?: string | null
  author_id?: string | null
}

export interface PublishedBlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  tags: string[] | null
  published_at: string | null
  created_at: string
}

/** Get all published blog posts for public display — ordered by published_at descending */
export async function getPublishedBlogPosts(): Promise<PublishedBlogPostSummary[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, tags, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch published blog posts', { error: error.message })
    return []
  }

  return (data ?? []) as PublishedBlogPostSummary[]
}

/** Get all blog posts for admin — no RLS filtering, ordered by newest first */
export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch blog posts', { error: error.message })
    return []
  }

  return data ?? []
}

/** Get a single blog post by ID */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to fetch blog post', { id, error: error.message })
    return null
  }

  return data
}

/** Create a new blog post */
export async function createBlogPost(input: BlogPostInput): Promise<BlogPost | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: (input.content ?? {}) as unknown as Record<string, never>,
      category: input.category ?? null,
      status: input.status ?? 'draft',
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
      og_image_url: input.og_image_url ?? null,
      tags: input.tags ?? null,
      published_at: input.published_at ?? null,
      author_id: input.author_id ?? null,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create blog post', { slug: input.slug, error: error.message })
    return null
  }

  return data
}

/** Update an existing blog post */
export async function updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost | null> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.slug !== undefined) updateData.slug = input.slug
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt
  if (input.content !== undefined) updateData.content = input.content as unknown as Record<string, never>
  if (input.category !== undefined) updateData.category = input.category
  if (input.status !== undefined) updateData.status = input.status
  if (input.seo_title !== undefined) updateData.seo_title = input.seo_title
  if (input.seo_description !== undefined) updateData.seo_description = input.seo_description
  if (input.og_image_url !== undefined) updateData.og_image_url = input.og_image_url
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.published_at !== undefined) updateData.published_at = input.published_at
  if (input.author_id !== undefined) updateData.author_id = input.author_id

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update blog post', { id, error: error.message })
    return null
  }

  return data
}

/** Delete a blog post */
export async function deleteBlogPost(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete blog post', { id, error: error.message })
    return false
  }

  return true
}
