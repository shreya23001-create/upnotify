/**
 * Blog slug rules (locked May 2026 — see knowledge-base/marketing/content_strategy_v1.md §4)
 *
 * Slugs at uptrue.io/blog/* are auto-generated from the primary keyword,
 * deterministically and dedupe-safe. The Boss Digest reviewer rejects any
 * draft whose slug breaks these rules.
 *
 * Rule A (slug):
 *   1. Source is the primary keyword (NOT the title)
 *   2. Lowercase
 *   3. Special chars and whitespace replaced with single hyphen
 *   4. Strip leading articles (a-, an-, the-)
 *   5. Strip leading/trailing hyphens
 *   6. Max 60 characters (trim at word boundary)
 *   7. Dedupe-checked against /blog/*, /monitoring/*, /tools/*
 *      (collision = append disambiguator: -2026, -guide, -explained)
 *
 * This module is a pure function — no DB, no SDK, no logger. Safe to import
 * anywhere and easy to unit-test.
 */

const LEADING_ARTICLES = /^(a|an|the)-/i

/**
 * Reserved URL paths. Any slug colliding with one of these is treated as
 * a duplicate and gets a disambiguator appended.
 */
const RESERVED_PATHS = new Set<string>([
  // Top-level routes that must never be shadowed by a blog slug
  'about', 'admin', 'api', 'auth', 'blog', 'changelog', 'compete',
  'contact', 'credits', 'dashboard', 'deactivated', 'invite',
  'leaderboard', 'monitoring', 'r', 'referrals', 'score',
  'signup', 'login', 'logout', 'status', 'styles', 'tools',
  'tracker', 'wordpress-monitor',
])

/**
 * Normalise a primary keyword into a slug per Rule A.
 * Pure function. Deterministic.
 */
export function slugifyPrimaryKeyword(primaryKeyword: string): string {
  if (!primaryKeyword || typeof primaryKeyword !== 'string') {
    throw new Error('primaryKeyword must be a non-empty string')
  }

  let slug = primaryKeyword
    .toLowerCase()
    .normalize('NFKD')
    // Strip diacritics
    .replace(/[̀-ͯ]/g, '')
    // Anything that isn't alphanumeric or whitespace becomes a space
    .replace(/[^a-z0-9\s-]/g, ' ')
    // Collapse whitespace + hyphens to single hyphen
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Strip leading article (one pass — "the-best-x" → "best-x", not deeper)
  slug = slug.replace(LEADING_ARTICLES, '')

  // Trim to 60 chars at word boundary if possible
  if (slug.length > 60) {
    const trimmed = slug.slice(0, 60)
    const lastHyphen = trimmed.lastIndexOf('-')
    slug = lastHyphen > 30 ? trimmed.slice(0, lastHyphen) : trimmed
  }

  if (!slug) {
    throw new Error(
      `primaryKeyword "${primaryKeyword}" produced an empty slug after normalisation`
    )
  }

  return slug
}

/**
 * Check whether a candidate slug collides with reserved top-level paths
 * or an existing slug from the same URL space.
 *
 * Caller passes existing slugs (read from DB) — this function does not query.
 */
export function isSlugCollision(
  candidate: string,
  existingSlugs: readonly string[]
): boolean {
  if (RESERVED_PATHS.has(candidate)) return true
  return existingSlugs.includes(candidate)
}

/**
 * Generate a unique slug from a primary keyword, given the existing slug set.
 * If the base slug collides, try disambiguators in order:
 *   1. -guide
 *   2. -explained
 *   3. -<currentYear>
 *   4. -<currentYear>-<n>  (n incrementing until unique)
 *
 * Throws if it can't find a unique slug after 100 attempts (degenerate case).
 */
export function generateUniqueSlug(
  primaryKeyword: string,
  existingSlugs: readonly string[]
): string {
  const base = slugifyPrimaryKeyword(primaryKeyword)
  if (!base) {
    throw new Error('primaryKeyword produced an empty slug after normalisation')
  }

  if (!isSlugCollision(base, existingSlugs)) return base

  const year = new Date().getUTCFullYear()
  const disambiguators = ['guide', 'explained', String(year)]

  for (const suffix of disambiguators) {
    const candidate = trimToSixty(`${base}-${suffix}`)
    if (!isSlugCollision(candidate, existingSlugs)) return candidate
  }

  // Last resort: append a numeric counter
  for (let n = 2; n < 100; n++) {
    const candidate = trimToSixty(`${base}-${year}-${n}`)
    if (!isSlugCollision(candidate, existingSlugs)) return candidate
  }

  throw new Error(`Could not produce a unique slug for "${primaryKeyword}" after 100 attempts`)
}

function trimToSixty(slug: string): string {
  if (slug.length <= 60) return slug
  const trimmed = slug.slice(0, 60)
  const lastHyphen = trimmed.lastIndexOf('-')
  return lastHyphen > 30 ? trimmed.slice(0, lastHyphen) : trimmed
}

/**
 * Validate an existing slug against the rules. Returns null if valid,
 * or a string describing the violation if invalid.
 *
 * Used by the Boss Digest reviewer to flag stale/drifting slugs.
 */
export function validateSlug(slug: string): string | null {
  if (!slug) return 'Slug is empty'
  if (slug.length > 60) return `Slug exceeds 60 characters (${slug.length})`
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug contains invalid characters'
  if (slug.startsWith('-') || slug.endsWith('-')) return 'Slug has leading or trailing hyphen'
  if (/--/.test(slug)) return 'Slug contains double hyphens'
  if (LEADING_ARTICLES.test(slug)) return `Slug starts with article: "${slug.slice(0, 4)}"`
  if (RESERVED_PATHS.has(slug)) return `Slug collides with reserved path "${slug}"`
  return null
}
