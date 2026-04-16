import { logger } from '@/lib/utils/logger'
import { getPaywalledDomains, addPaywalledDomain } from '@/lib/db/paywalled-domains'

const SCRAPE_TIMEOUT_MS = 8000
const MAX_CONTENT_CHARS = 3000

// Tags whose entire content block is noise — strip before extracting text
const NOISE_TAG_RE = /<(script|style|nav|header|footer|aside|noscript|iframe|form|button|svg)[^>]*>[\s\S]*?<\/\1>/gi

// Phrases that strongly indicate a paywall intercept page
const PAYWALL_PHRASES = [
  'subscribe to read',
  'subscribe to continue',
  'sign in to read',
  'create an account to read',
  'this article is for subscribers',
  'unlock this article',
  'premium content',
  'paid subscribers only',
  'already a subscriber',
  'start your free trial',
  'get full access',
]

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function looksLikePaywall(statusCode: number, text: string): boolean {
  if (statusCode === 401 || statusCode === 403) return true
  const lower = text.toLowerCase()
  return PAYWALL_PHRASES.some(phrase => lower.includes(phrase))
}

/**
 * Fetches a URL and extracts the readable article text.
 * Returns null on any error, timeout, paywall, or non-HTML response.
 * Safe to call on redirecting URLs (e.g. Google Alerts) — fetch follows redirects.
 * Auto-records newly detected paywalled domains to the DB for future skipping.
 */
export async function scrapeArticle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UptruePulse/1.0 (+https://uptrue.io/about)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      // Auto-detect paywalls from HTTP status
      if (res.status === 401 || res.status === 403) {
        const domain = extractDomain(url)
        if (domain) await addPaywalledDomain(domain)
      }
      return null
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null

    const html = await res.text()

    const text = html
      .replace(NOISE_TAG_RE, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()

    // Auto-detect paywall from content — short text with paywall phrases
    if (text.length < 150 || looksLikePaywall(res.status, text.slice(0, 1000))) {
      if (looksLikePaywall(res.status, text.slice(0, 1000))) {
        const domain = extractDomain(url)
        if (domain) await addPaywalledDomain(domain)
      }
      return null
    }

    return text.slice(0, MAX_CONTENT_CHARS)
  } catch {
    return null
  }
}

/**
 * Scrapes multiple URLs in parallel with a concurrency cap of 4.
 * Loads the paywalled domain list once and skips known paywalls before fetching.
 * Returns a map of url → extracted text (only successful scrapes included).
 */
export async function scrapeArticles(
  urls: string[],
  concurrency = 4
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const unique = [...new Set(urls)].slice(0, 15) // cap at 15 URLs per run

  // Load blocklist once for the whole batch
  const blocked = await getPaywalledDomains()

  const filtered = unique.filter(url => {
    const domain = extractDomain(url)
    if (domain && blocked.has(domain)) {
      logger.info('Skipping paywalled domain', { domain, url })
      return false
    }
    return true
  })

  for (let i = 0; i < filtered.length; i += concurrency) {
    const batch = filtered.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      batch.map(async url => {
        const content = await scrapeArticle(url)
        return { url, content }
      })
    )
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.content) {
        result.set(r.value.url, r.value.content)
      }
    }
  }

  logger.info('Article scraping complete', {
    requested: unique.length,
    blocked: unique.length - filtered.length,
    scraped: result.size,
  })

  return result
}
