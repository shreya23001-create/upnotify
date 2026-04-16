import { logger } from '@/lib/utils/logger'

const SCRAPE_TIMEOUT_MS = 8000
const MAX_CONTENT_CHARS = 3000

// Tags whose entire content block is noise — strip before extracting text
const NOISE_TAG_RE = /<(script|style|nav|header|footer|aside|noscript|iframe|form|button|svg)[^>]*>[\s\S]*?<\/\1>/gi

/**
 * Fetches a URL and extracts the readable article text.
 * Returns null on any error, timeout, paywall, or non-HTML response.
 * Safe to call on redirecting URLs (e.g. Google Alerts) — fetch follows redirects.
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

    if (!res.ok) return null

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

    if (text.length < 150) return null

    return text.slice(0, MAX_CONTENT_CHARS)
  } catch {
    return null
  }
}

/**
 * Scrapes multiple URLs in parallel with a concurrency cap of 4.
 * Returns a map of url → extracted text (only successful scrapes included).
 */
export async function scrapeArticles(
  urls: string[],
  concurrency = 4
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const unique = [...new Set(urls)].slice(0, 15) // cap at 15 URLs per run

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency)
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
    scraped: result.size,
  })

  return result
}
