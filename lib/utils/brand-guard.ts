export interface BrandGuardViolation {
  rule: 'name_guard' | 'cta_url' | 'forbidden_score'
  severity: 'hard' | 'soft'
  message: string
  context: string
}

export interface BrandGuardResult {
  ok: boolean
  violations: BrandGuardViolation[]
}

// ---------------------------------------------------------------------------
// Rule 1 — name guard
// ---------------------------------------------------------------------------

// "AI Visibility" not preceded by "Uptrue " — forbidden in body copy on
// aivisibility.uptrue.io content. Allowed in body copy on uptrue.io blog
// IF preceded by "Uptrue " — guard catches the missing-prefix case.
const BARE_AI_VISIBILITY = /(?<!Uptrue\s)AI\s+Visibility/g

// "Uptrue AI" not followed by " Visibility" — forbidden anywhere in customer-
// facing copy.
const UPTRUE_AI_NO_VISIBILITY = /Uptrue\s+AI(?!\s+Visibility)/g

// "Uptrue AI Visibility Score" — forbidden (drop the Score).
const FORBIDDEN_SCORE = /Uptrue\s+AI\s+Visibility\s+Score/gi

// First-mention TM check — "Uptrue AI Visibility" must include ™ on first mention
const NAME_WITH_TM = /Uptrue\s+AI\s+Visibility\s*™/
const NAME_WITHOUT_TM = /Uptrue\s+AI\s+Visibility(?!\s*™)/

// ---------------------------------------------------------------------------
// Rule 2 — CTA URL guard
// ---------------------------------------------------------------------------

// Markdown link: [text](url)
const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

// HTML link
const HTML_LINK = /<a\s+[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g

// Anchor text mentioning AI Visibility (must link to subdomain)
const AI_VISIBILITY_TEXT = /\b(uptrue\s+ai\s+visibility|ai\s+visibility)\b/i

// Subdomain URL pattern
const AIVISIBILITY_SUBDOMAIN = /^https?:\/\/aivisibility\.uptrue\.io(\/|$)/i
const MAIN_DOMAIN_AI_PATH = /^https?:\/\/(www\.)?uptrue\.io\/(ai-visibility|ai-vis|aivisibility|ai-check)/i

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BrandGuardOptions {
  /** Where this content lives — affects name-guard strictness */
  surface: 'main' | 'aivisibility-subdomain'
  /** Whether brand-prefix is required (typically true for AI Visibility wiki) */
  brandPrefixRequired: boolean
}

/**
 * Run all brand guards on a body of markdown/HTML content.
 * Returns ok=true with no violations, or ok=false with a list.
 */
export function checkBrandGuards(
  content: string,
  options: BrandGuardOptions
): BrandGuardResult {
  const violations: BrandGuardViolation[] = []

  // Hard fail — "Score" appended
  for (const match of content.matchAll(FORBIDDEN_SCORE)) {
    violations.push({
      rule: 'forbidden_score',
      severity: 'hard',
      message: '"Uptrue AI Visibility Score" is forbidden — drop the "Score"',
      context: snippetAround(content, match.index ?? 0, match[0].length),
    })
  }

  // Hard fail — "Uptrue AI" without Visibility
  for (const match of content.matchAll(UPTRUE_AI_NO_VISIBILITY)) {
    violations.push({
      rule: 'name_guard',
      severity: 'hard',
      message: '"Uptrue AI" must be followed by "Visibility" — do not abbreviate the brand',
      context: snippetAround(content, match.index ?? 0, match[0].length),
    })
  }

  // Hard fail on subdomain — bare "AI Visibility" without "Uptrue " prefix
  if (options.brandPrefixRequired || options.surface === 'aivisibility-subdomain') {
    for (const match of content.matchAll(BARE_AI_VISIBILITY)) {
      violations.push({
        rule: 'name_guard',
        severity: 'hard',
        message: 'Bare "AI Visibility" forbidden — must read "Uptrue AI Visibility"',
        context: snippetAround(content, match.index ?? 0, match[0].length),
      })
    }
  }

  // First-mention TM check (only if name appears at all)
  if (NAME_WITHOUT_TM.test(content) && !NAME_WITH_TM.test(content)) {
    violations.push({
      rule: 'name_guard',
      severity: 'soft',
      message: 'First mention of "Uptrue AI Visibility" must include the ™ symbol',
      context: 'Check first occurrence of the brand name in the document',
    })
  }

  // Rule 2 — CTA URL guard
  violations.push(...checkLinkUrls(content))

  return { ok: violations.filter(v => v.severity === 'hard').length === 0, violations }
}

/**
 * Extract all links from content and check whether any AI Visibility-related
 * links go to the wrong domain.
 */
function checkLinkUrls(content: string): BrandGuardViolation[] {
  const violations: BrandGuardViolation[] = []
  const links = extractLinks(content)

  for (const link of links) {
    const mentionsAiVisibility = AI_VISIBILITY_TEXT.test(link.text)
    const goesToMainAiPath = MAIN_DOMAIN_AI_PATH.test(link.url)
    const goesToSubdomain = AIVISIBILITY_SUBDOMAIN.test(link.url)

    // Hard fail: link mentions AI Visibility AND goes to main domain AI path
    if (mentionsAiVisibility && goesToMainAiPath) {
      violations.push({
        rule: 'cta_url',
        severity: 'hard',
        message: `AI Visibility link must point to https://aivisibility.uptrue.io — got "${link.url}"`,
        context: `[${link.text}](${link.url})`,
      })
      continue
    }

    // Soft warn: anchor text mentions AI Visibility and link is to main domain (not the AI path, but still wrong)
    if (mentionsAiVisibility && !goesToSubdomain && !link.url.startsWith('#')) {
      const isMainDomain = /^https?:\/\/(www\.)?uptrue\.io/i.test(link.url)
      if (isMainDomain) {
        violations.push({
          rule: 'cta_url',
          severity: 'soft',
          message: `Link with AI Visibility anchor text should likely go to aivisibility.uptrue.io — currently "${link.url}"`,
          context: `[${link.text}](${link.url})`,
        })
      }
    }
  }

  return violations
}

interface ExtractedLink {
  text: string
  url: string
  source: 'markdown' | 'html'
}

function extractLinks(content: string): ExtractedLink[] {
  const links: ExtractedLink[] = []

  for (const match of content.matchAll(MD_LINK)) {
    links.push({ text: match[1], url: match[2], source: 'markdown' })
  }

  for (const match of content.matchAll(HTML_LINK)) {
    links.push({ text: match[2], url: match[1], source: 'html' })
  }

  return links
}

function snippetAround(content: string, index: number, length: number): string {
  const start = Math.max(0, index - 30)
  const end = Math.min(content.length, index + length + 30)
  const snippet = content.slice(start, end).replace(/\n/g, ' ')
  return (start > 0 ? '…' : '') + snippet + (end < content.length ? '…' : '')
}

// ---------------------------------------------------------------------------
// Convenience — quick boolean check for slug-time validation
// ---------------------------------------------------------------------------

export function hasHardBrandViolations(
  content: string,
  options: BrandGuardOptions
): boolean {
  const result = checkBrandGuards(content, options)
  return !result.ok
}