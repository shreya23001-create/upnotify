import { createAdminClient } from '@/lib/supabase/admin'
import { sendBossDigestEmail } from '@/lib/services/email'
import { getConfig, getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReviewOutput } from './blog-reviewer'

// blog_posts has new columns + boss_digest_runs is a new table — both
// added in migration 00085. Until that migration applies and
// database.types.ts is regenerated, use the base SupabaseClient.
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingDigestPost {
  id: string
  title: string
  slug: string
  excerpt: string
  postType: string
  primaryKeyword: string
  author: string
  wordCount: number
  faqCount: number
  internalLinkCount: number
  review: ReviewOutput | null
  dodPass: boolean
  approveToken: string
  rejectToken: string
}

export interface DigestResult {
  ok: boolean
  draftCount: number
  blogPostIds: string[]
  recipients: string[]
  errorMessage?: string
  resendMessageId?: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function buildAndSendBossDigest(): Promise<DigestResult> {
  const pending = await fetchPendingDigestPosts()

  if (pending.length === 0) {
    logger.info('boss-digest: no pending posts, skipping email')
    await recordDigestRun({
      ok: true,
      draftCount: 0,
      blogPostIds: [],
      recipients: [],
    })
    return { ok: true, draftCount: 0, blogPostIds: [], recipients: [] }
  }

  // Build email
  const { admin } = getServerConfig()
  const recipients = admin.emails

  if (recipients.length === 0) {
    const msg = 'boss-digest: no admin recipients configured (ADMIN_EMAILS empty)'
    logger.error(msg)
    await recordDigestRun({
      ok: false,
      draftCount: pending.length,
      blogPostIds: pending.map(p => p.id),
      recipients: [],
      errorMessage: msg,
    })
    return { ok: false, draftCount: pending.length, blogPostIds: pending.map(p => p.id), recipients: [], errorMessage: msg }
  }

  const sendResult = await sendBossDigestEmail({
    to: recipients,
    posts: pending,
  })

  if (!sendResult.success) {
    await recordDigestRun({
      ok: false,
      draftCount: pending.length,
      blogPostIds: pending.map(p => p.id),
      recipients,
      errorMessage: sendResult.error ?? 'Send failed',
    })
    return {
      ok: false,
      draftCount: pending.length,
      blogPostIds: pending.map(p => p.id),
      recipients,
      errorMessage: sendResult.error ?? 'Send failed',
    }
  }

  // Mark posts as in_digest
  const ids = pending.map(p => p.id)
  await markPostsAsInDigest(ids)

  // Audit log
  await recordDigestRun({
    ok: true,
    draftCount: pending.length,
    blogPostIds: ids,
    recipients,
    resendMessageId: sendResult.messageId,
  })

  logger.info('boss-digest sent', {
    draftCount: pending.length,
    recipients: recipients.length,
    messageId: sendResult.messageId,
  })

  return {
    ok: true,
    draftCount: pending.length,
    blogPostIds: ids,
    recipients,
    resendMessageId: sendResult.messageId,
  }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchPendingDigestPosts(): Promise<PendingDigestPost[]> {
  const supabase = getRawClient()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, post_type, primary_keyword, author, faq_jsonb, review_jsonb')
    .eq('delivery_method', 'digest')
    .eq('digest_status', 'pending')
    .neq('post_type', 'commercial')
    .order('created_at', { ascending: true })

  if (error || !posts) {
    logger.error('boss-digest: fetch pending posts failed', { error: error?.message })
    return []
  }

  if (posts.length === 0) return []

  // Fetch tokens for these posts
  const blogPostIds = posts.map(p => p.id as string)
  const { data: tokens, error: tokenError } = await supabase
    .from('blog_approval_tokens')
    .select('blog_post_id, token, action, used_at, expires_at')
    .in('blog_post_id', blogPostIds)

  if (tokenError || !tokens) {
    logger.error('boss-digest: fetch tokens failed', { error: tokenError?.message })
    return []
  }

  return posts
    .map(p => mapToPendingPost(p, tokens))
    .filter((p): p is PendingDigestPost => p !== null)
}

interface RawPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  post_type: string | null
  primary_keyword: string | null
  author: string | null
  faq_jsonb: unknown
  review_jsonb: unknown
}

interface RawToken {
  blog_post_id: string
  token: string
  action: string
  used_at: string | null
  expires_at: string
}

function mapToPendingPost(raw: unknown, tokens: unknown[]): PendingDigestPost | null {
  const post = raw as RawPost
  const postTokens = (tokens as RawToken[]).filter(t => t.blog_post_id === post.id && !t.used_at)
  const approve = postTokens.find(t => t.action === 'approve')
  const reject = postTokens.find(t => t.action === 'reject')
  if (!approve || !reject) return null

  const content = post.content ?? ''
  const review = (post.review_jsonb as ReviewOutput | null) ?? null
  const faq = post.faq_jsonb as { mainEntity?: unknown[] } | null
  const faqCount = faq && Array.isArray(faq.mainEntity) ? faq.mainEntity.length : 0

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    postType: post.post_type ?? 'unknown',
    primaryKeyword: post.primary_keyword ?? '',
    author: post.author ?? 'Uptrue Team',
    wordCount: countWords(content),
    faqCount,
    internalLinkCount: countInternalLinks(content),
    review,
    dodPass: review !== null && Boolean((review as ReviewOutput & { dodPass?: boolean }).dodPass),
    approveToken: approve.token,
    rejectToken: reject.token,
  }
}

// ---------------------------------------------------------------------------
// Mark + audit
// ---------------------------------------------------------------------------

async function markPostsAsInDigest(blogPostIds: string[]): Promise<void> {
  if (blogPostIds.length === 0) return
  const supabase = getRawClient()
  const { error } = await supabase
    .from('blog_posts')
    .update({ digest_status: 'in_digest', digested_at: new Date().toISOString() })
    .in('id', blogPostIds)

  if (error) {
    logger.error('boss-digest: mark in_digest failed', { error: error.message, blogPostIds })
  }
}

async function recordDigestRun(input: {
  ok: boolean
  draftCount: number
  blogPostIds: string[]
  recipients: string[]
  errorMessage?: string
  resendMessageId?: string
}): Promise<void> {
  const supabase = getRawClient()
  const { error } = await supabase
    .from('boss_digest_runs')
    .insert({
      draft_count: input.draftCount,
      blog_post_ids: input.blogPostIds,
      email_sent_to: input.recipients,
      status: input.ok ? 'ok' : 'failed',
      error_message: input.errorMessage ?? null,
      resend_message_id: input.resendMessageId ?? null,
    })

  if (error) {
    logger.error('boss-digest: audit insert failed', { error: error.message })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_>`-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function countInternalLinks(content: string): number {
  let count = 0
  const re = /\[[^\]]+\]\(([^)]+)\)/g
  for (const match of content.matchAll(re)) {
    const url = match[1]
    if (url.startsWith('/') || /^https?:\/\/(www\.)?uptrue\.io/i.test(url)) count++
  }
  return count
}

// Re-export getConfig consumers may need (avoids import cycles in cron handler)
export { getConfig }