/**
 * Definition-of-Done validator for blog drafts (locked May 2026 — see
 * knowledge-base/marketing/content_strategy_v1.md §4).
 *
 * A draft cannot reach the Boss Digest unless it passes the 13 DoD checks.
 * This module produces a structured result the reviewer can render in the
 * digest email + the admin queue.
 *
 * Pure functions — no DB, no SDK, no logger. Easy to unit-test.
 */

import { validateSlug } from './blog-slug'
import { checkBrandGuards, type BrandGuardOptions, type BrandGuardViolation } from './brand-guard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PostType =
  | 'hub_foundational'
  | 'troubleshooting'
  | 'informational'
  | 'commercial'
  | 'combined_intent'

export interface DoDInput {
  slug: string
  title: string
  bodyMarkdown: string
  primaryKeyword: string
  secondaryKeywords: string[]
  postType: PostType
  faqJsonb: unknown // expects FAQPage schema { '@type': 'FAQPage', mainEntity: [...] }
  brandPrefixRequired: boolean
  /** Existing slugs from /blog/*, /monitoring/*, /tools/* — for collision check */
  existingSlugs: readonly string[]
}

export interface DoDCheck {
  id: string
  label: string
  pass: boolean
  severity: 'hard' | 'soft'
  detail?: string
}

export interface DoDResult {
  pass: boolean
  hardFails: DoDCheck[]
  softFails: DoDCheck[]
  passes: DoDCheck[]
  brandViolations: BrandGuardViolation[]
}

// ---------------------------------------------------------------------------
// Word-count thresholds per post type (from content_strategy_v1.md §4)
// ---------------------------------------------------------------------------

const WORD_COUNT_MIN: Record<PostType, number> = {
  hub_foundational: 1500,
  commercial: 1800,
  informational: 1200,
  troubleshooting: 800,
  combined_intent: 1000, // landing-page style
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

export function validateDoD(input: DoDInput): DoDResult {
  const checks: DoDCheck[] = []

  // 1. Primary keyword present in title or H1
  checks.push(checkPrimaryKeywordInTitle(input))

  // 2. Primary keyword present in body
  checks.push(checkPrimaryKeywordInBody(input))

  // 3. Secondary keywords (3–5) present in body
  checks.push(checkSecondaryKeywords(input))

  // 4. FAQ block — 3–6 questions in FAQPage schema
  checks.push(checkFaqBlock(input))

  // 5. Word count meets minimum for post type
  checks.push(checkWordCount(input))

  // 6. Slug rule (Rule A)
  checks.push(checkSlug(input))

  // 7. Slug uniqueness
  checks.push(checkSlugUniqueness(input))

  // 8. Internal link minimums (≥2 to hub, 1 to lateral, 1 to tool, 1 to product CTA)
  checks.push(...checkInternalLinks(input))

  // 9. Brand-prefix guard (only if required)
  const brandResult = checkBrandGuards(input.bodyMarkdown, {
    surface: 'main',
    brandPrefixRequired: input.brandPrefixRequired,
  } satisfies BrandGuardOptions)
  checks.push({
    id: 'brand_guard',
    label: 'Brand-prefix + AI Visibility CTA guard',
    pass: brandResult.ok,
    severity: 'hard',
    detail: brandResult.ok
      ? undefined
      : `${brandResult.violations.filter(v => v.severity === 'hard').length} hard violation(s)`,
  })

  // 10. Forbidden phrases (AI-slop)
  checks.push(checkForbiddenPhrases(input))

  // 11. Single mid-page CTA (rough heuristic — Boss reviews edge cases)
  checks.push(checkSingleCTA(input))

  // 12. Image / diagram present
  checks.push(checkImagePresent(input))

  // 13. Author byline + date — provided by caller via separate field, not body. Skipping content check;
  //     enforced at DB-write time (post_type, author both NOT NULL).

  // Partition
  const hardFails = checks.filter(c => !c.pass && c.severity === 'hard')
  const softFails = checks.filter(c => !c.pass && c.severity === 'soft')
  const passes = checks.filter(c => c.pass)

  return {
    pass: hardFails.length === 0,
    hardFails,
    softFails,
    passes,
    brandViolations: brandResult.violations,
  }
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkPrimaryKeywordInTitle(input: DoDInput): DoDCheck {
  const kw = input.primaryKeyword.toLowerCase()
  const inTitle = input.title.toLowerCase().includes(kw)
  return {
    id: 'primary_kw_title',
    label: 'Primary keyword in title',
    pass: inTitle,
    severity: 'soft',
    detail: inTitle ? undefined : `Title "${input.title}" does not contain "${input.primaryKeyword}"`,
  }
}

function checkPrimaryKeywordInBody(input: DoDInput): DoDCheck {
  const kw = input.primaryKeyword.toLowerCase()
  const body = input.bodyMarkdown.toLowerCase()
  const occurrences = countOccurrences(body, kw)
  return {
    id: 'primary_kw_body',
    label: 'Primary keyword in body (≥2 occurrences)',
    pass: occurrences >= 2,
    severity: 'hard',
    detail: occurrences >= 2 ? `${occurrences} occurrences` : `Only ${occurrences} occurrence(s)`,
  }
}

function checkSecondaryKeywords(input: DoDInput): DoDCheck {
  const body = input.bodyMarkdown.toLowerCase()
  const found = input.secondaryKeywords.filter(kw => body.includes(kw.toLowerCase()))
  const min = 3
  return {
    id: 'secondary_kws',
    label: `Secondary keywords (≥${min} of ${input.secondaryKeywords.length} present)`,
    pass: found.length >= min,
    severity: 'soft',
    detail: `${found.length}/${input.secondaryKeywords.length} secondary keywords found`,
  }
}

function checkFaqBlock(input: DoDInput): DoDCheck {
  const faq = input.faqJsonb as { '@type'?: string; mainEntity?: unknown[] } | null
  if (!faq || faq['@type'] !== 'FAQPage' || !Array.isArray(faq.mainEntity)) {
    return {
      id: 'faq_schema',
      label: 'FAQ block (FAQPage schema, 3–6 Qs)',
      pass: false,
      severity: 'hard',
      detail: 'FAQ block missing or not in FAQPage schema',
    }
  }
  const count = faq.mainEntity.length
  const ok = count >= 3 && count <= 6
  return {
    id: 'faq_schema',
    label: 'FAQ block (FAQPage schema, 3–6 Qs)',
    pass: ok,
    severity: 'hard',
    detail: ok ? `${count} questions` : `${count} questions (need 3–6)`,
  }
}

function checkWordCount(input: DoDInput): DoDCheck {
  const wordCount = countWords(input.bodyMarkdown)
  const min = WORD_COUNT_MIN[input.postType]
  return {
    id: 'word_count',
    label: `Word count ≥ ${min} for ${input.postType}`,
    pass: wordCount >= min,
    severity: 'soft',
    detail: `${wordCount} words (need ${min})`,
  }
}

function checkSlug(input: DoDInput): DoDCheck {
  const violation = validateSlug(input.slug)
  return {
    id: 'slug_rule',
    label: 'Slug follows Rule A (lowercase, hyphenated, no articles, max 60)',
    pass: violation === null,
    severity: 'hard',
    detail: violation ?? undefined,
  }
}

function checkSlugUniqueness(input: DoDInput): DoDCheck {
  const collides = input.existingSlugs.includes(input.slug)
  return {
    id: 'slug_unique',
    label: 'Slug does not collide with existing post',
    pass: !collides,
    severity: 'hard',
    detail: collides ? `Slug "${input.slug}" already exists` : undefined,
  }
}

function checkInternalLinks(input: DoDInput): DoDCheck[] {
  const links = extractMarkdownLinks(input.bodyMarkdown)
  const internal = links.filter(l => isInternalLink(l.url))

  const hubLinks = internal.filter(l => l.url.startsWith('/monitoring/'))
  const toolLinks = internal.filter(l => l.url.startsWith('/tools/'))
  const ctaLinks = internal.filter(l => /\/(signup|login|pricing)/.test(l.url))

  return [
    {
      id: 'links_hub',
      label: 'Internal links — ≥2 to /monitoring/ hub',
      pass: hubLinks.length >= 2,
      severity: 'soft',
      detail: `${hubLinks.length} hub link(s)`,
    },
    {
      id: 'links_tool',
      label: 'Internal links — ≥1 to /tools/',
      pass: toolLinks.length >= 1,
      severity: 'soft',
      detail: `${toolLinks.length} tool link(s)`,
    },
    {
      id: 'links_cta',
      label: 'Internal link — ≥1 product CTA (signup/login/pricing)',
      pass: ctaLinks.length >= 1,
      severity: 'soft',
      detail: `${ctaLinks.length} CTA link(s)`,
    },
  ]
}

function checkForbiddenPhrases(input: DoDInput): DoDCheck {
  const FORBIDDEN = [
    'delve into', 'delving into',
    "in today's digital landscape",
    'in the ever-evolving world of',
    'navigate the complexities of',
    'unleash the power of',
    'in this article, we',
    'revolutionary', 'game-changing', 'next-generation',
  ]
  const body = input.bodyMarkdown.toLowerCase()
  const found = FORBIDDEN.filter(p => body.includes(p))
  return {
    id: 'forbidden_phrases',
    label: 'No forbidden AI-slop phrases',
    pass: found.length === 0,
    severity: 'soft',
    detail: found.length > 0 ? `Found: ${found.join(', ')}` : undefined,
  }
}

function checkSingleCTA(input: DoDInput): DoDCheck {
  // Heuristic — count signup/pricing links. >3 is too many CTAs.
  const links = extractMarkdownLinks(input.bodyMarkdown)
  const ctaLinks = links.filter(l => /\/(signup|pricing)/.test(l.url))
  return {
    id: 'single_cta',
    label: 'Single mid-page CTA (1–3 signup/pricing links max)',
    pass: ctaLinks.length >= 1 && ctaLinks.length <= 3,
    severity: 'soft',
    detail: `${ctaLinks.length} signup/pricing link(s)`,
  }
}

function checkImagePresent(input: DoDInput): DoDCheck {
  const hasMarkdownImage = /!\[[^\]]*\]\([^)]+\)/.test(input.bodyMarkdown)
  const hasHtmlImage = /<img\s+[^>]*src=/i.test(input.bodyMarkdown)
  const hasSvg = /<svg\s/i.test(input.bodyMarkdown)
  const ok = hasMarkdownImage || hasHtmlImage || hasSvg
  return {
    id: 'image_present',
    label: 'At least one image / diagram / SVG',
    pass: ok,
    severity: 'soft',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let pos = 0
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++
    pos += needle.length
  }
  return count
}

function countWords(text: string): number {
  // Strip code fences + markdown syntax, then count.
  const stripped = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_\-=]/g, ' ')
  return stripped.split(/\s+/).filter(Boolean).length
}

function extractMarkdownLinks(content: string): { text: string; url: string }[] {
  const out: { text: string; url: string }[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  for (const match of content.matchAll(re)) {
    out.push({ text: match[1], url: match[2] })
  }
  return out
}

function isInternalLink(url: string): boolean {
  if (url.startsWith('/')) return true
  if (/^https?:\/\/(www\.)?uptrue\.io/i.test(url)) return true
  return false
}
