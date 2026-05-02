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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateCalendarBlogPost(row: CalendarRow): Promise<CalendarDraftResult | null> {
  logger.info('calendar-blog-generator: starting', {
    rowId: row.id,
    postType: row.post_type,
    primaryKeyword: row.primary_keyword,
  })

  // 1. Generate draft via Claude
  const draft = await generateDraftViaClaude(row)
  if (!draft) {
    await updateCalendarRowResult(row.id, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: 'Claude generation returned null',
    })
    return null
  }

  // 2. Slug — deterministic from primary keyword, dedupe-checked
  const reservedSlugs = await getAllReservedSlugs()
  let slug: string
  try {
    slug = generateUniqueSlug(row.primary_keyword, reservedSlugs)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Slug generation failed'
    logger.error('calendar-blog-generator: slug generation failed', { rowId: row.id, error: msg })
    await updateCalendarRowResult(row.id, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: msg,
    })
    return null
  }

  // 3. DoD validation
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

  // 4. Reviewer pass — produces highlights + worries for the digest
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
  if (!blogPostId) return null

  // 6. Approval tokens (reuses existing infrastructure)
  // If token creation fails, delete the orphan blog post so the row can be
  // retried cleanly — otherwise the post sits in DB with no way to approve.
  const tokens: ApprovalTokenPair | null = await createApprovalTokens(blogPostId)
  if (!tokens) {
    logger.error('calendar-blog-generator: token creation failed — cleaning up orphan blog post', { blogPostId })
    await deleteOrphanBlogPost(blogPostId)
    await updateCalendarRowResult(row.id, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: 'Token creation failed after blog post save; orphan removed',
    })
    return null
  }

  // 7. Mark calendar row drafted
  await updateCalendarRowResult(row.id, {
    status: 'drafted',
    blog_post_id: blogPostId,
    generated_at: new Date().toISOString(),
  })

  return {
    blogPostId,
    title: draft.title,
    slug,
    excerpt: draft.excerpt,
    bodyMarkdown: draft.bodyMarkdown,
    approveToken: tokens.approveToken,
    rejectToken: tokens.rejectToken,
    review,
  }
}

// ---------------------------------------------------------------------------
// Claude generation
// ---------------------------------------------------------------------------

async function generateDraftViaClaude(row: CalendarRow): Promise<ClaudeDraft | null> {
  const { anthropic } = getServerConfig()
  if (!anthropic.apiKey) {
    logger.error('calendar-blog-generator: ANTHROPIC_API_KEY not set')
    return null
  }

  const client = new Anthropic({ apiKey: anthropic.apiKey })
  const prompt = buildPrompt(row)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000, // generous headroom — hub_foundational targets 1500-2000 words
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find(b => b.type === 'text')
    if (!textContent || textContent.type !== 'text') return null

    return parseDraft(textContent.text)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown Claude error'
    logger.error('calendar-blog-generator: Claude call failed', { rowId: row.id, error: msg })
    return null
  }
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

# Output format

Return a single JSON object (no markdown wrapper, no preamble):

{
  "title": "60-char-max title with primary keyword",
  "excerpt": "150-char-max compelling summary",
  "bodyMarkdown": "Full markdown body — H1, intro hook, H2 sections, body, mid-page CTA, conclusion. Include British spelling.",
  "faqJsonb": {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Question 1?", "acceptedAnswer": { "@type": "Answer", "text": "Answer 1" } },
      { "@type": "Question", "name": "Question 2?", "acceptedAnswer": { "@type": "Answer", "text": "Answer 2" } },
      { "@type": "Question", "name": "Question 3?", "acceptedAnswer": { "@type": "Answer", "text": "Answer 3" } },
      { "@type": "Question", "name": "Question 4?", "acceptedAnswer": { "@type": "Answer", "text": "Answer 4" } }
    ]
  }
}

Use 4–6 FAQ questions. Source FAQs from real "how to / can I / why does" search variants of the primary keyword.

Body must include at least one image placeholder using markdown syntax: \`![alt text](image-placeholder.svg)\`.

Return only the JSON. No commentary.`
}

function parseDraft(text: string): ClaudeDraft | null {
  // Extract JSON robustly — Claude may return:
  //   - Pure JSON
  //   - ```json ... ``` fenced block
  //   - Prose preamble (e.g. "Here is the JSON:") then JSON
  //   - JSON followed by trailing prose
  let jsonText = text.trim()
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    jsonText = fenced[1].trim()
  } else {
    // Fallback: extract from first { to last } if no fence
    const first = jsonText.indexOf('{')
    const last = jsonText.lastIndexOf('}')
    if (first !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1)
    }
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<ClaudeDraft>
    const validations: string[] = []
    if (typeof parsed.title !== 'string' || !parsed.title.trim()) validations.push('title missing/empty')
    if (typeof parsed.bodyMarkdown !== 'string' || !parsed.bodyMarkdown.trim()) validations.push('bodyMarkdown missing/empty')
    if (typeof parsed.excerpt !== 'string') validations.push('excerpt not a string')
    if (!parsed.faqJsonb || typeof parsed.faqJsonb !== 'object') validations.push('faqJsonb missing/invalid')

    if (validations.length > 0) {
      logger.warn('calendar-blog-generator: draft validation failed', {
        errors: validations,
        responsePreview: text.slice(0, 300),
      })
      return null
    }

    return {
      title: parsed.title as string,
      excerpt: parsed.excerpt as string,
      bodyMarkdown: parsed.bodyMarkdown as string,
      faqJsonb: parsed.faqJsonb as ClaudeDraft['faqJsonb'],
    }
  } catch (error) {
    logger.warn('calendar-blog-generator: draft JSON parse failed', {
      error: error instanceof Error ? error.message : String(error),
      responsePreview: text.slice(0, 500),
      jsonTextPreview: jsonText.slice(0, 300),
    })
    return null
  }
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
    })
    .select('id')
    .single()

  if (error || !data) {
    logger.error('calendar-blog-generator: blog_posts insert failed', { error: error?.message })
    return null
  }
  return data.id as string
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