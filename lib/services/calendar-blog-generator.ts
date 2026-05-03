import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createApprovalTokens, type ApprovalTokenPair } from '@/lib/db/blog-approval-tokens'

// New blog_posts columns (delivery_method, digest_status, post_type, etc.)
// land in migration 00085. Until applied + types regenerated, use base client.
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}
import {
  type CalendarRow,
  updateCalendarRowResult,
} from '@/lib/db/content-calendar'
import { getAllReservedSlugs } from '@/lib/db/content-calendar'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { generateUniqueSlug } from '@/lib/utils/blog-slug'
import { validateDoD, type PostType } from '@/lib/utils/dod-validator'
import { reviewDraft, type ReviewOutput } from './blog-reviewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarDraftResult {
  blogPostId: string
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  approveToken: string
  rejectToken: string
  review: ReviewOutput
}

// Structured result so the cron route can surface the real reason in
// its JSON response — no DB round-trip needed to debug a failure.
export type CalendarGenerationResult =
  | { ok: true; result: CalendarDraftResult }
  | { ok: false; reason: string }

interface ClaudeDraft {
  title: string
  excerpt: string
  bodyMarkdown: string
  faqJsonb: {
    '@type': 'FAQPage'
    mainEntity: Array<{
      '@type': 'Question'
      name: string
      acceptedAnswer: { '@type': 'Answer'; text: string }
    }>
  }
}

// Structured result so the caller can persist *why* a generation failed.
type ClaudeResult =
  | { ok: true; draft: ClaudeDraft }
  | { ok: false; reason: string }

// Errors worth retrying with backoff (Anthropic transient).
function isTransientAnthropicError(err: unknown): boolean {
  if (!err) return false
  const e = err as { status?: number; name?: string; message?: string }
  if (typeof e.status === 'number' && [429, 500, 502, 503, 504, 529].includes(e.status)) return true
  const msg = (e.message ?? '').toLowerCase()
  return /\b(429|500|502|503|504|529|overloaded|rate[- ]?limit|timeout|timed out|temporarily unavailable|connection reset|socket hang up)\b/.test(msg)
}

const MAX_CLAUDE_ATTEMPTS = 3
const CLAUDE_BACKOFF_MS = [500, 2000, 8000] as const // pre-attempt sleep for attempt N

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateCalendarBlogPost(row: CalendarRow): Promise<CalendarGenerationResult> {
  logger.info('calendar-blog-generator: starting', {
    rowId: row.id,
    postType: row.post_type,
    primaryKeyword: row.primary_keyword,
  })

  // Helper to fail consistently — persist reason to row and return structured result.
  const fail = async (reason: string): Promise<CalendarGenerationResult> => {
    await updateCalendarRowResult(row.id, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: reason,
    })
    return { ok: false, reason }
  }

  // 0. Idempotency check — if a previous run created a blog_post for this
  //    calendar row but crashed before linking it (e.g., Vercel cron retry,
  //    stuck-row reset), recover instead of regenerating. Without this, a
  //    re-run would hit a slug collision at step 2 and mark the row
  //    'failed' even though the work was already done.
  const orphan = await findExistingBlogPostForCalendarRow(row.id)
  if (orphan) {
    logger.warn('calendar-blog-generator: detected orphan blog_post from prior run, recovering', {
      rowId: row.id,
      blogPostId: orphan.id,
    })

    // Ensure approval tokens exist; create them if the prior run crashed
    // before that step.
    const tokens = await ensureApprovalTokens(orphan.id)
    if (!tokens) return fail('Recovery failed: could not create approval tokens for orphan post')

    await updateCalendarRowResult(row.id, {
      status: 'drafted',
      blog_post_id: orphan.id,
      generated_at: new Date().toISOString(),
    })

    return {
      ok: true,
      result: {
        blogPostId: orphan.id,
        title: orphan.title,
        slug: orphan.slug,
        excerpt: orphan.excerpt ?? '',
        bodyMarkdown: orphan.bodyMarkdown,
        approveToken: tokens.approveToken,
        rejectToken: tokens.rejectToken,
        review: orphan.review,
      },
    }
  }

  // 1. Generate draft via Claude
  const claudeResult = await generateDraftViaClaude(row)
  if (!claudeResult.ok) return fail(claudeResult.reason)
  const draft = claudeResult.draft

  // 2. Slug — deterministic from primary keyword, dedupe-checked
  const reservedSlugs = await getAllReservedSlugs()
  let slug: string
  try {
    slug = generateUniqueSlug(row.primary_keyword, reservedSlugs)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Slug generation failed'
    logger.error('calendar-blog-generator: slug generation failed', { rowId: row.id, error: msg })
    return fail(`Slug generation failed: ${msg}`)
  }

  // 3. DoD validation (informational — flags soft/hard issues for digest review;
  //    does NOT block save. Boss reviews flagged drafts in digest and rejects if needed.)
  const dod = validateDoD({
    slug,
    title: draft.title,
    bodyMarkdown: draft.bodyMarkdown,
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: row.secondary_keywords,
    postType: row.post_type as PostType,
    faqJsonb: draft.faqJsonb,
    brandPrefixRequired: row.brand_prefix_required,
    existingSlugs: reservedSlugs,
  })

  // 4. Reviewer pass — produces highlights + worries for the digest. Reviewer
  //    has graceful degradation (returns emptyReview on any failure) so it
  //    never blocks the pipeline.
  const review = await reviewDraft({
    title: draft.title,
    bodyMarkdown: draft.bodyMarkdown,
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: row.secondary_keywords,
    postType: row.post_type,
    author: row.author,
    dod,
  })

  // 5. Save to blog_posts
  const blogPostId = await saveBlogPost(row, draft, slug, review, dod.pass)
  if (!blogPostId) return fail('blog_posts insert failed (see Vercel logs for DB error)')

  // 6. Approval tokens (reuses existing infrastructure)
  // If token creation fails, delete the orphan blog post so the row can be
  // retried cleanly — otherwise the post sits in DB with no way to approve.
  const tokens: ApprovalTokenPair | null = await createApprovalTokens(blogPostId)
  if (!tokens) {
    logger.error('calendar-blog-generator: token creation failed — cleaning up orphan blog post', { blogPostId })
    await deleteOrphanBlogPost(blogPostId)
    return fail('Token creation failed after blog post save; orphan removed')
  }

  // 7. Mark calendar row drafted
  await updateCalendarRowResult(row.id, {
    status: 'drafted',
    blog_post_id: blogPostId,
    generated_at: new Date().toISOString(),
  })

  return {
    ok: true,
    result: {
      blogPostId,
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      bodyMarkdown: draft.bodyMarkdown,
      approveToken: tokens.approveToken,
      rejectToken: tokens.rejectToken,
      review,
    },
  }
}

// ---------------------------------------------------------------------------
// Claude generation
// ---------------------------------------------------------------------------

// Tool schema for Claude's structured output.
// Using tool_use guarantees valid JSON — the SDK handles string escaping,
// so markdown bodies with literal newlines/quotes can't break the parser.
//
// Required = title + bodyMarkdown only. excerpt and faqJsonb are recoverable
// (we derive excerpt from body if missing; we use empty FAQ if missing — DoD
// flags it as a soft/hard fail but the row still ships to the digest, where
// Boss reviews and rejects if needed).
//
// Schemas WITHOUT enum constraints — strict enums on '@type' caused Claude
// to omit faqJsonb entirely rather than risk a schema violation.
const SUBMIT_DRAFT_TOOL = {
  name: 'submit_blog_draft',
  description: 'Submit the generated blog post draft. Call this tool exactly once. title and bodyMarkdown are required; excerpt and faqJsonb are strongly preferred for SEO but optional if you cannot produce them well.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: '60 characters max. Must include the primary keyword.',
      },
      bodyMarkdown: {
        type: 'string',
        description: 'Full markdown body — H1, intro hook, H2 sections, body paragraphs, mid-page CTA, conclusion. British English. Include at least one image placeholder using ![alt](image-placeholder.svg). Include the required internal links.',
      },
      excerpt: {
        type: 'string',
        description: '150 characters max. Compelling summary used as meta description.',
      },
      faqJsonb: {
        type: 'object',
        description: 'JSON-LD FAQPage schema. Set @type to "FAQPage" and provide a mainEntity array of 4-6 question/answer objects. Each question object should have @type "Question", a name (the question), and acceptedAnswer with @type "Answer" and text (the answer).',
      },
    },
    required: ['title', 'bodyMarkdown'],
  },
}

async function generateDraftViaClaude(row: CalendarRow): Promise<ClaudeResult> {
  const { anthropic } = getServerConfig()
  if (!anthropic.apiKey) {
    logger.error('calendar-blog-generator: ANTHROPIC_API_KEY not set')
    return { ok: false, reason: 'ANTHROPIC_API_KEY not set' }
  }

  const client = new Anthropic({ apiKey: anthropic.apiKey })
  const prompt = buildPrompt(row)

  let lastReason = 'Unknown failure'

  for (let attempt = 1; attempt <= MAX_CLAUDE_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      const backoff = CLAUDE_BACKOFF_MS[Math.min(attempt - 1, CLAUDE_BACKOFF_MS.length - 1)]
      logger.warn('calendar-blog-generator: retrying Claude call', { rowId: row.id, attempt, backoffMs: backoff })
      await sleep(backoff)
    }

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000, // generous headroom — hub_foundational targets 1500-2000 words
        tools: [SUBMIT_DRAFT_TOOL],
        tool_choice: { type: 'tool', name: SUBMIT_DRAFT_TOOL.name },
        messages: [{ role: 'user', content: prompt }],
      })

      const stopReason = message.stop_reason
      if (stopReason === 'max_tokens') {
        lastReason = `Claude response truncated at max_tokens (response cut off before tool call completed)`
        logger.error('calendar-blog-generator: Claude truncated', { rowId: row.id, stopReason })
        return { ok: false, reason: lastReason }
      }

      const toolUse = message.content.find(b => b.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        lastReason = `Claude returned no tool_use block (stop_reason=${stopReason})`
        logger.error('calendar-blog-generator: Claude no tool_use block', { rowId: row.id, stopReason, contentTypes: message.content.map(b => b.type) })
        return { ok: false, reason: lastReason }
      }

      const validated = validateDraftShape(toolUse.input)
      if (validated.ok) return validated
      lastReason = validated.reason
      return { ok: false, reason: lastReason }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      lastReason = `Claude API error: ${msg}`
      logger.error('calendar-blog-generator: Claude call failed', {
        rowId: row.id,
        attempt,
        transient: isTransientAnthropicError(error),
        error: msg,
      })
      if (!isTransientAnthropicError(error)) {
        return { ok: false, reason: lastReason }
      }
      // else: loop and retry
    }
  }

  return { ok: false, reason: `${lastReason} (after ${MAX_CLAUDE_ATTEMPTS} attempts)` }
}

function buildPrompt(row: CalendarRow): string {
  const wordCountTarget: Record<string, string> = {
    hub_foundational: '1,500–2,000',
    troubleshooting: '800–1,200',
    informational: '1,200–1,800',
    commercial: '1,800–2,500',
    combined_intent: '1,000–1,500',
  }

  return `You are writing a blog post for Uptrue (uptrue.io) — a website monitoring suite covering uptime, SSL, DNS, security headers, WordPress health, and more.

# Post specification

- **Type:** ${row.post_type}
- **Primary keyword:** "${row.primary_keyword}"  ← embed in title, H1, intro, ≥1 H2, and naturally throughout body
- **Secondary keywords (use 3+ of these naturally):** ${row.secondary_keywords.map(k => `"${k}"`).join(', ') || 'none specified'}
- **Working title:** "${row.title_draft}"  ← refine if a better one fits the keyword
- **Hub:** ${row.hub ?? 'general'}
- **Author byline:** ${row.author}
- **Word count target:** ${wordCountTarget[row.post_type] ?? '1,200–1,500'} words

# Hard rules

1. **British English** spelling throughout (organisation, colour, monitoring)
2. **Voice:** direct, pragmatic, engineer-friendly. NOT salesy.
3. **Forbidden phrases (auto-rejected):** "delve into", "in today's digital landscape", "navigate the complexities of", "unleash the power of", "revolutionary", "game-changing", "next-generation", "in this article we will explore"
4. **Internal links — minimum:**
   - 2 links to /monitoring/* (hub pages)
   - 1 link to /tools/* (free tool)
   - 1 link to /signup or /pricing (product CTA)
5. **Mid-page CTA:** ONE natural Uptrue upsell, not a stack of 5 buttons.
6. **Brand rule for AI Visibility:** if you mention the AI Visibility product, write "Uptrue AI Visibility™" (with ™) and link to https://aivisibility.uptrue.io — NEVER to a /ai-visibility path on uptrue.io.
7. **No competitor pricing without dating** — if mentioned, add "as of May 2026".
8. **Author byline:** include "By ${row.author}" near the top of the body.

# Output

Submit the draft via the \`submit_blog_draft\` tool with title, excerpt, bodyMarkdown, and faqJsonb fields.

- **bodyMarkdown:** Full markdown — H1, intro hook, H2 sections, body, mid-page CTA, conclusion. British spelling. Include at least one \`![alt text](image-placeholder.svg)\` placeholder.
- **faqJsonb:** 4–6 FAQs. Source from real "how to / can I / why does" search variants of the primary keyword. Use the FAQPage JSON-LD schema.

Call the tool exactly once with all four fields populated.`
}

// Validate the tool_use input — the schema enforces shape, but defensive
// validation catches edge cases (empty strings, missing FAQ entries) the
// schema can't express.
// Hard-fail only when content is fundamentally unusable (no title, no body).
// Soft-fallback for excerpt and faqJsonb — DoD validator catches these as
// hard/soft fails and surfaces them to Boss in the digest, but the row still
// ships rather than being a generation dead-end.
function validateDraftShape(input: unknown): ClaudeResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, reason: 'Tool input was not an object' }
  }
  const obj = input as Record<string, unknown>
  const keysPresent = Object.keys(obj).join(',') || '(none)'

  // Hard requirements
  const hardFails: string[] = []
  if (typeof obj.title !== 'string' || !obj.title.trim()) hardFails.push('title missing/empty')
  if (typeof obj.bodyMarkdown !== 'string' || !obj.bodyMarkdown.trim()) hardFails.push('bodyMarkdown missing/empty')

  if (hardFails.length > 0) {
    const reason = `Tool input invalid: ${hardFails.join('; ')}. Keys present: [${keysPresent}]`
    logger.warn('calendar-blog-generator: draft validation failed', { errors: hardFails, keysPresent })
    return { ok: false, reason }
  }

  const title = (obj.title as string).trim()
  const bodyMarkdown = (obj.bodyMarkdown as string).trim()

  // Soft fallbacks
  let excerpt = typeof obj.excerpt === 'string' ? obj.excerpt.trim() : ''
  if (!excerpt) {
    excerpt = deriveExcerpt(bodyMarkdown)
    logger.info('calendar-blog-generator: excerpt missing, derived from body', { excerptLen: excerpt.length })
  }

  const faqJsonb = normaliseFaqJsonb(obj.faqJsonb)
  if (faqJsonb.mainEntity.length === 0) {
    logger.warn('calendar-blog-generator: faqJsonb missing/empty — using empty FAQ; DoD will flag', { faqJsonbType: typeof obj.faqJsonb })
  }

  return {
    ok: true,
    draft: { title, excerpt, bodyMarkdown, faqJsonb },
  }
}

// Derive a 150-char excerpt from the first paragraph of body (skip H1).
function deriveExcerpt(body: string): string {
  const lines = body.split('\n')
  const firstParaLines: string[] = []
  let started = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (started) break
      continue
    }
    if (trimmed.startsWith('#')) continue // skip H1/H2
    started = true
    firstParaLines.push(trimmed)
  }
  const text = firstParaLines.join(' ').replace(/\s+/g, ' ')
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}...` : text
}

// Coerce whatever Claude returned for faqJsonb into a valid FAQPage shape.
// Accepts: object with mainEntity array, missing/null, or shape variations.
function normaliseFaqJsonb(raw: unknown): ClaudeDraft['faqJsonb'] {
  const empty: ClaudeDraft['faqJsonb'] = { '@type': 'FAQPage', mainEntity: [] }
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Record<string, unknown>
  const mainEntity = Array.isArray(r.mainEntity) ? r.mainEntity : []
  const validQs = mainEntity
    .map(q => {
      if (!q || typeof q !== 'object') return null
      const qo = q as Record<string, unknown>
      const name = typeof qo.name === 'string' ? qo.name.trim() : ''
      const ans = qo.acceptedAnswer as Record<string, unknown> | undefined
      const text = ans && typeof ans.text === 'string' ? ans.text.trim() : ''
      if (!name || !text) return null
      return {
        '@type': 'Question' as const,
        name,
        acceptedAnswer: { '@type': 'Answer' as const, text },
      }
    })
    .filter((q): q is ClaudeDraft['faqJsonb']['mainEntity'][number] => q !== null)
  return { '@type': 'FAQPage', mainEntity: validQs }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function saveBlogPost(
  row: CalendarRow,
  draft: ClaudeDraft,
  slug: string,
  review: ReviewOutput,
  dodPass: boolean
): Promise<string | null> {
  const supabase = getRawClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.bodyMarkdown,
      status: 'draft',
      auto_generated: true,
      post_type: row.post_type,
      primary_keyword: row.primary_keyword,
      secondary_keywords: row.secondary_keywords,
      faq_jsonb: draft.faqJsonb,
      target_hub: row.hub,
      author: row.author,
      delivery_method: 'digest',
      digest_status: 'pending',
      review_jsonb: { ...review, dodPass },
      // Two-way link back to the source calendar row — used by the
      // generator's idempotency check to detect orphans from a crashed
      // prior run instead of regenerating + colliding on slug.
      source_calendar_row_id: row.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    logger.error('calendar-blog-generator: blog_posts insert failed', { error: error?.message })
    return null
  }
  return data.id as string
}

// ---------------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------------

interface OrphanBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  bodyMarkdown: string
  review: ReviewOutput
}

/**
 * Look for a blog_post that was created by a previous (crashed) run of the
 * generator for this calendar row. Returns the orphan if found, so the
 * caller can recover from it instead of regenerating.
 *
 * Only returns drafts (status='draft') — if the row is already published
 * or pending_approval, the caller should respect that and not re-run.
 *
 * Uses .limit(1) + array index instead of .maybeSingle() so a pathological
 * "two drafts for same row" state doesn't error out the lookup — we
 * recover the most-recent orphan and let downstream cleanup deal with
 * the older one.
 */
async function findExistingBlogPostForCalendarRow(
  calendarRowId: string
): Promise<OrphanBlogPost | null> {
  const supabase = getRawClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, review_jsonb')
    .eq('source_calendar_row_id', calendarRowId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    logger.error('calendar-blog-generator: orphan lookup failed', {
      calendarRowId,
      error: error.message,
    })
    return null
  }

  if (!data || data.length === 0) return null

  const row = data[0]
  const reviewJsonb = row.review_jsonb as ReviewOutput | null
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: row.excerpt as string | null,
    bodyMarkdown: row.content as string,
    review: reviewJsonb ?? {
      headline: '',
      highlights: [],
      worries: [],
      dodSummary: { pass: false, hardFailCount: 0 },
    } as unknown as ReviewOutput,
  }
}

/**
 * Ensure approval tokens exist for the given blog post — if they were never
 * created (recovery from a crash mid-pipeline) create them now; if they
 * already exist, return the existing pair.
 */
async function ensureApprovalTokens(blogPostId: string): Promise<ApprovalTokenPair | null> {
  const supabase = getRawClient()
  const { data: existing } = await supabase
    .from('blog_approval_tokens')
    .select('action, token')
    .eq('blog_post_id', blogPostId)

  if (existing && existing.length >= 2) {
    const approve = existing.find((t) => (t as { action: string }).action === 'approve')
    const reject = existing.find((t) => (t as { action: string }).action === 'reject')
    if (approve && reject) {
      return {
        approveToken: (approve as { token: string }).token,
        rejectToken: (reject as { token: string }).token,
      }
    }
  }

  // Tokens don't exist — create them via the canonical helper.
  return createApprovalTokens(blogPostId)
}

/**
 * Delete a blog post that was saved but failed to get approval tokens.
 * Cascade deletes any partial tokens via FK constraints.
 */
async function deleteOrphanBlogPost(blogPostId: string): Promise<void> {
  const supabase = getRawClient()
  const { error } = await supabase.from('blog_posts').delete().eq('id', blogPostId)
  if (error) {
    logger.error('calendar-blog-generator: orphan cleanup failed — manual delete required', {
      blogPostId,
      error: error.message,
    })
  }
}