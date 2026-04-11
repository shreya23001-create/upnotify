import { logger } from '@/lib/utils/logger'

// =============================================================================
// Types
// =============================================================================

export interface FeedItem {
  title: string
  url: string
  summary: string | null
  publishedAt: string | null
  sourceName: string
}

// =============================================================================
// XML helpers - no external dependencies, handles RSS 2.0 + Atom
// =============================================================================

function extractTag(xml: string, tag: string): string | null {
  // CDATA
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const cdataMatch = xml.match(cdata)
  if (cdataMatch) return cdataMatch[1].trim()

  // Normal tag
  const normal = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const normalMatch = xml.match(normal)
  if (normalMatch) {
    return normalMatch[1]
      .replace(/<[^>]+>/g, '') // strip inner tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
  }
  return null
}

function extractLink(xml: string): string | null {
  // Atom <link href="URL" .../>  or  <link href="URL">
  const atomHref = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i)
  if (atomHref) return atomHref[1].trim()

  // RSS <link>URL</link>
  const rssLink = extractTag(xml, 'link')
  if (rssLink && (rssLink.startsWith('http://') || rssLink.startsWith('https://'))) {
    return rssLink
  }

  return null
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

function truncate(str: string | null, maxLen = 500): string | null {
  if (!str) return null
  const clean = str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean
}

function parseItems(xml: string, sourceName: string): FeedItem[] {
  const items: FeedItem[] = []

  // Match <item> (RSS) or <entry> (Atom) blocks
  const blockRe = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi
  let match: RegExpExecArray | null

  while ((match = blockRe.exec(xml)) !== null) {
    const block = match[1]

    const title = extractTag(block, 'title')
    const url   = extractLink(block)
      ?? extractTag(block, 'guid')
      ?? extractTag(block, 'id')
    const rawSummary = extractTag(block, 'description')
      ?? extractTag(block, 'summary')
      ?? extractTag(block, 'content')
    const rawDate = extractTag(block, 'pubDate')
      ?? extractTag(block, 'updated')
      ?? extractTag(block, 'published')
      ?? extractTag(block, 'dc:date')

    if (!title || !url) continue
    if (!url.startsWith('http')) continue

    items.push({
      title: title.slice(0, 300),
      url,
      summary: truncate(rawSummary, 500),
      publishedAt: parseDate(rawDate),
      sourceName,
    })
  }

  return items
}

// =============================================================================
// Fetch a single RSS/Atom feed
// =============================================================================

export async function fetchFeed(url: string, sourceName: string): Promise<FeedItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UptruePulse/1.0 (+https://uptrue.io/about)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 0 },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      logger.warn('Feed fetch non-ok', { url, status: res.status })
      return []
    }

    const text = await res.text()
    const items = parseItems(text, sourceName)

    logger.info('Feed fetched', { url, itemCount: items.length })
    return items
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    if (!msg.includes('abort')) {
      logger.warn('Feed fetch failed', { url, error: msg })
    }
    return []
  }
}

// =============================================================================
// Fetch multiple feeds concurrently with concurrency limit
// =============================================================================

export async function fetchFeeds(
  sources: Array<{ id: string; url: string; name: string }>,
  concurrency = 5
): Promise<Array<{ sourceId: string; items: FeedItem[] }>> {
  const results: Array<{ sourceId: string; items: FeedItem[] }> = []

  // Process in batches
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      batch.map(s => fetchFeed(s.url, s.name).then(items => ({ sourceId: s.id, items })))
    )
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }
  }

  return results
}
