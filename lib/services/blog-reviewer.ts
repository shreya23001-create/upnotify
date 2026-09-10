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

// Tool schema for guaranteed-valid JSON output (same approach as the
// generator). Reviewer text is structured but short, so JSON.parse rarely
// breaks — but tool_use removes the entire class of risk.
const SUBMIT_REVIEW_TOOL = {
  name: 'submit_blog_review',
  description: 'Submit your review of the draft. Call exactly once with all fields.',
  input_schema: {
    type: 'object' as const,
    properties: {
      highlights: {
        type: 'array',
        items: { type: 'string' },
        description: '2-4 bullets about what is good — specific, not generic.',
      },
      worries: {
        type: 'array',
        items: { type: 'string' },
        description: '2-5 bullets about what to watch. If draft is clean, return ["No major concerns"].',
      },
      toneScore: {
        type: 'integer',
        minimum: 0,
        maximum: 10,
        description: '0-10 integer rating of how on-brand the tone is.',
      },
      factsToVerify: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific claims that need source/verification. Empty array if none.',
      },
      legalSensitivities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Anything Harvey would flag. Empty array if nothing applies.',
      },
      recommendedAction: {
        type: 'string',
        description: 'One of: approve, edit, reject',
      },
      recommendedActionReason: {
        type: 'string',
        description: 'One sentence explaining the recommendation.',
      },
    },
    required: ['highlights', 'worries', 'toneScore', 'recommendedAction', 'recommendedActionReason'],
  },
}

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
      // Haiku 4.5 — short structured summary, ~5x cheaper than Sonnet.
      // Generator (long-form post) stays on Sonnet where quality matters more.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      tools: [SUBMIT_REVIEW_TOOL],
      tool_choice: { type: 'tool', name: SUBMIT_REVIEW_TOOL.name },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      logger.warn('blog-reviewer: no tool_use block returned', { stopReason: message.stop_reason })
      return emptyReview(input.dod)
    }

    const parsed = normaliseReviewInput(toolUse.input)
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

The post is destined for upnotify-monitoring.vercel.app/blog. The Boss reads ~4 mini-cards per day and 1-click approves drafts. Your job is to surface what they need to know in <30 seconds per card.

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
Submit your review via the \`submit_blog_review\` tool. Be honest — the Boss prefers an 'edit' verdict with specific changes over 'approve' on a marginal draft. Mention specific phrases or sections (not generic comments). For factsToVerify list specific claims (statistics, version numbers, pricing, rate limits, dates). For legalSensitivities flag competitor names, legal claims, customer quotes.`
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

function normaliseReviewInput(input: unknown): Omit<ReviewOutput, 'generatedAt' | 'dodSummary'> {
  const obj = (input && typeof input === 'object' ? input : {}) as RawReviewResponse
  const action = String(obj.recommendedAction ?? 'edit')
  const validAction: ReviewOutput['recommendedAction'] =
    action === 'approve' || action === 'reject' ? action : 'edit'

  return {
    highlights: asStringArray(obj.highlights),
    worries: asStringArray(obj.worries),
    toneScore: clampNumber(obj.toneScore, 0, 10, 5),
    factsToVerify: asStringArray(obj.factsToVerify),
    legalSensitivities: asStringArray(obj.legalSensitivities),
    recommendedAction: validAction,
    recommendedActionReason: String(obj.recommendedActionReason ?? ''),
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
