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

/** Get all published blog posts for public display — ordered by published_at descending.
 *
 * Excludes noindex=true posts (Tier 3 permutation posts flagged by migration
 * 00096) so the public /blog index doesn't list them. The post itself remains
 * reachable at /blog/<slug> so inbound links don't break, but the rendered
 * page emits robots:noindex,nofollow.
 */
export async function getPublishedBlogPosts(): Promise<PublishedBlogPostSummary[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, tags, published_at, created_at')
    .eq('status', 'published')
    .or('noindex.is.null,noindex.eq.false')
    .order('published_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch published blog posts', { error: error.message })
    return []
  }

  return (data ?? []) as PublishedBlogPostSummary[]
}

/**
 * Find the most recent published outage blog post for a specific site.
 * Matches on tags (display name lowercased) — the blog generator always adds this.
 * Returns null if no published post exists (drafts and pending_approval are excluded).
 */
export async function getPublishedOutageBlogForSite(
  displayName: string
): Promise<Pick<PublishedBlogPostSummary, 'id' | 'title' | 'slug' | 'excerpt' | 'published_at'> | null> {
  const supabase = createAdminClient()
  const tag = displayName.toLowerCase()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at')
    .eq('status', 'published')
    .contains('tags', [tag])
    .contains('tags', ['outage'])
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Failed to fetch outage blog for site', { displayName, error: error.message })
    return null
  }

  return data as Pick<PublishedBlogPostSummary, 'id' | 'title' | 'slug' | 'excerpt' | 'published_at'> | null
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

/** Bulk delete blog posts by ID list */
export async function bulkDeleteBlogPosts(ids: string[]): Promise<{ deleted: number; failed: number }> {
  if (ids.length === 0) return { deleted: 0, failed: 0 }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .in('id', ids)

  if (error) {
    logger.error('Bulk delete blog posts failed', { error: error.message, count: ids.length })
    return { deleted: 0, failed: ids.length }
  }

  return { deleted: ids.length, failed: 0 }
}

/** Bulk update status for a list of blog post IDs */
export async function bulkUpdateBlogPostStatus(ids: string[], status: string): Promise<{ updated: number; failed: number }> {
  if (ids.length === 0) return { updated: 0, failed: 0 }
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'published') updateData.published_at = new Date().toISOString()
  if (status === 'draft') updateData.published_at = null

  const { error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .in('id', ids)

  if (error) {
    logger.error('Bulk update blog post status failed', { error: error.message, count: ids.length, status })
    return { updated: 0, failed: ids.length }
  }

  return { updated: ids.length, failed: 0 }
}
