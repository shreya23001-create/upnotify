/**
 * Blog reviewer — second Claude call that produces the Boss Digest summary.
 *
 * Takes a draft + the deterministic DoD result, asks Claude for:
 *   - Highlights (what's good — for the digest's "✅" section)
 *   - Worries (what to watch — for the digest's "⚠️" section)
 *   - Tone score
 *   - Factual claims that need source-checking
 *   - Legal/brand sensitivities
 *
 * The output is stored in blog_posts.review_jsonb and rendered in the
 * Boss Digest email.
 *
 * The deterministic DoD validator catches structural issues (slug, FAQ,
 * brand guard) — this Claude pass catches subjective / tone / fact issues.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { DoDResult } from '@/lib/utils/dod-validator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewInput {
  title: string
  bodyMarkdown: string
  primaryKeyword: string
  secondaryKeywords: string[]
  postType: string
  author: string
  dod: DoDResult
}

export interface ReviewOutput {
  highlights: string[]
  worries: string[]
  toneScore: number              // 0–10
  factsToVerify: string[]
  legalSensitivities: string[]
  recommendedAction: 'approve' | 'edit' | 'reject'
  recommendedActionReason: string
  generatedAt: string            // ISO timestamp
  // Also include the deterministic DoD summary for digest rendering
  dodSummary: {
    pass: boolean
    hardFailCount: number
    softFailCount: number
    hardFailIds: string[]
    softFailIds: string[]
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function reviewDraft(input: ReviewInput): Promise<ReviewOutput> {
  const { anthropic } = getServerConfig()

  if (!anthropic.apiKey) {
    logger.warn('blog-reviewer: ANTHROPIC_API_KEY missing — returning empty review')
    return emptyReview(input.dod)
  }

  const client = new Anthropic({ apiKey: anthropic.apiKey })
  const prompt = buildPrompt(input)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find(b => b.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Reviewer returned no text content')
    }

    const parsed = parseReviewResponse(textContent.text)
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      dodSummary: buildDoDSummary(input.dod),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown reviewer error'
    logger.error('blog-reviewer failed', { error: msg, title: input.title })
    return emptyReview(input.dod)
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(input: ReviewInput): string {
  const dodNotes = describeDoD(input.dod)
  return `You are reviewing a draft Uptrue blog post before it reaches the Boss Digest email at 07:00.

The post is destined for uptrue.io/blog. The Boss reads ~4 mini-cards per day and 1-click approves drafts. Your job is to surface what they need to know in <30 seconds per card.

## Draft metadata
- Title: ${input.title}
- Author byline: ${input.author}
- Post type: ${input.postType}
- Primary keyword: "${input.primaryKeyword}"
- Secondary keywords: ${input.secondaryKeywords.map(k => `"${k}"`).join(', ')}

## Deterministic DoD checks already run
${dodNotes}

## Brand rules already verified deterministically
- Slug rule (Rule A): ${input.dod.hardFails.find(c => c.id.startsWith('slug')) ? 'FAILED' : 'OK'}
- Brand-prefix + AI Visibility CTA guard (Rule B): ${input.dod.hardFails.find(c => c.id === 'brand_guard') ? 'FAILED' : 'OK'}

## Draft body (markdown)
\`\`\`markdown
${input.bodyMarkdown.slice(0, 8000)}
${input.bodyMarkdown.length > 8000 ? '\n[... truncated ...]' : ''}
\`\`\`

## Your task
Return a JSON object with these EXACT keys (no extra prose, no preamble, just the JSON):

{
  "highlights": [
    "2-4 bullet points about what's good — concrete, not generic",
    "Mention specific phrases or sections that work"
  ],
  "worries": [
    "2-5 bullet points about what to watch — be specific",
    "Examples: 'Claims X stat — needs source', 'Mentions competitor Y pricing — verify accuracy', 'Tone too marketing-y in section Z'",
    "If draft is clean, return ['No major concerns'] (still array of 1)"
  ],
  "toneScore": 0-10 integer,
  "factsToVerify": [
    "Specific claims that need source/verification",
    "Statistics, version numbers, pricing claims, rate limits, dates"
  ],
  "legalSensitivities": [
    "Anything Harvey would flag — competitor names, legal claims, customer quotes, etc.",
    "Empty array if nothing applies"
  ],
  "recommendedAction": "approve" | "edit" | "reject",
  "recommendedActionReason": "One sentence why"
}

Be honest. The Boss prefers a 'edit' verdict with specific changes over 'approve' on a marginal draft. Return only valid JSON, no markdown wrapper.`
}

function describeDoD(dod: DoDResult): string {
  const lines: string[] = []
  lines.push(`Hard fails: ${dod.hardFails.length}`)
  for (const c of dod.hardFails) {
    lines.push(`  - [HARD] ${c.label}${c.detail ? ` — ${c.detail}` : ''}`)
  }
  lines.push(`Soft fails: ${dod.softFails.length}`)
  for (const c of dod.softFails) {
    lines.push(`  - [soft] ${c.label}${c.detail ? ` — ${c.detail}` : ''}`)
  }
  lines.push(`Passes: ${dod.passes.length}`)
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

interface RawReviewResponse {
  highlights?: unknown
  worries?: unknown
  toneScore?: unknown
  factsToVerify?: unknown
  legalSensitivities?: unknown
  recommendedAction?: unknown
  recommendedActionReason?: unknown
}

function parseReviewResponse(text: string): Omit<ReviewOutput, 'generatedAt' | 'dodSummary'> {
  // Extract JSON from response. Claude may return:
  //   - Pure JSON
  //   - ```json ... ``` fenced block
  //   - Prose preamble then JSON
  let jsonText = text.trim()
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    jsonText = fenced[1].trim()
  } else {
    // Fall back to first { ... last } if no fence
    const first = jsonText.indexOf('{')
    const last = jsonText.lastIndexOf('}')
    if (first !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1)
    }
  }

  let parsed: RawReviewResponse
  try {
    parsed = JSON.parse(jsonText) as RawReviewResponse
  } catch {
    logger.warn('blog-reviewer: response not valid JSON, returning conservative defaults')
    return {
      highlights: [],
      worries: ['Reviewer response could not be parsed — manual review recommended'],
      toneScore: 5,
      factsToVerify: [],
      legalSensitivities: [],
      recommendedAction: 'edit',
      recommendedActionReason: 'Reviewer JSON parse failed',
    }
  }

  const action = String(parsed.recommendedAction ?? 'edit')
  const validAction: ReviewOutput['recommendedAction'] =
    action === 'approve' || action === 'reject' ? action : 'edit'

  return {
    highlights: asStringArray(parsed.highlights),
    worries: asStringArray(parsed.worries),
    toneScore: clampNumber(parsed.toneScore, 0, 10, 5),
    factsToVerify: asStringArray(parsed.factsToVerify),
    legalSensitivities: asStringArray(parsed.legalSensitivities),
    recommendedAction: validAction,
    recommendedActionReason: String(parsed.recommendedActionReason ?? ''),
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').slice(0, 10)
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyReview(dod: DoDResult): ReviewOutput {
  return {
    highlights: [],
    worries: ['Reviewer pass did not run — manual review required'],
    toneScore: 5,
    factsToVerify: [],
    legalSensitivities: [],
    recommendedAction: 'edit',
    recommendedActionReason: 'Reviewer not available',
    generatedAt: new Date().toISOString(),
    dodSummary: buildDoDSummary(dod),
  }
}

function buildDoDSummary(dod: DoDResult): ReviewOutput['dodSummary'] {
  return {
    pass: dod.pass,
    hardFailCount: dod.hardFails.length,
    softFailCount: dod.softFails.length,
    hardFailIds: dod.hardFails.map(c => c.id),
    softFailIds: dod.softFails.map(c => c.id),
  }
}
