import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export interface BlogApprovalToken {
  id: string
  blog_post_id: string
  token: string
  action: 'approve' | 'reject'
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface ApprovalTokenPair {
  approveToken: string
  rejectToken: string
}

/**
 * Creates one approve token and one reject token for a blog post.
 * Called immediately after an auto-generated draft is saved.
 */
export async function createApprovalTokens(blogPostId: string): Promise<ApprovalTokenPair | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('blog_approval_tokens')
    .insert([
      { blog_post_id: blogPostId, action: 'approve' },
      { blog_post_id: blogPostId, action: 'reject' },
    ])
    .select('token, action')

  if (error || !data || data.length < 2) {
    logger.error('Failed to create blog approval tokens', { blogPostId, error: error?.message })
    return null
  }

  const approveRow = data.find(r => r.action === 'approve')
  const rejectRow = data.find(r => r.action === 'reject')

  if (!approveRow || !rejectRow) return null

  return { approveToken: approveRow.token, rejectToken: rejectRow.token }
}

/**
 * Validates a token and marks it as used.
 * Returns null if the token is invalid, expired, or already used.
 */
export async function validateAndUseToken(
  token: string
): Promise<{ action: 'approve' | 'reject'; blogPostId: string } | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('blog_approval_tokens')
    .select('id, blog_post_id, action, expires_at, used_at')
    .eq('token', token)
    .single()

  if (error || !data) {
    logger.warn('Blog approval token not found', { token })
    return null
  }

  if (data.used_at) {
    logger.warn('Blog approval token already used', { token, usedAt: data.used_at })
    return null
  }

  if (new Date(data.expires_at) < new Date()) {
    logger.warn('Blog approval token expired', { token, expiresAt: data.expires_at })
    return null
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('blog_approval_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)

  if (updateError) {
    logger.error('Failed to mark approval token as used', { token, error: updateError.message })
    return null
  }

  return { action: data.action as 'approve' | 'reject', blogPostId: data.blog_post_id }
}

/**
 * Checks whether a blog post already has approval tokens (to avoid duplicates).
 */
export async function hasApprovalTokens(blogPostId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blog_approval_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('blog_post_id', blogPostId)

  return (count ?? 0) > 0
}
