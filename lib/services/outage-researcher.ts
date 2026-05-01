import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { getOutageRssFeedsForCategory } from '@/lib/db/outage-blog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceArticle {
  title: string
  url: string
  source: string       // e.g. "Reddit", "Google News", "X (Twitter)", "HackerNews", "RSS Feed Name"
  snippet: string      // Short excerpt or tweet text
  publishedAt?: string
}

export interface OutageResearch {
  officialStatus: string | null       // Text from official status page
  officialStatusUrl: string | null    // URL of status page
  articles: SourceArticle[]           // News + Reddit + X + HN + RSS mentions
  hasRealData: boolean                // False if all sources failed
}

// ---------------------------------------------------------------------------
// 1. Official status page
// ---------------------------------------------------------------------------

// Common status page patterns — try in order
function guessStatusUrls(domain: string): string[] {
  const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  return [
    `https://status.${clean}`,
    `https://${clean}/status`,
    `https://www.${clean}/status`,
  ]
}

async function fetchOfficialStatus(domain: string, statusPageUrl?: string): Promise<{ text: string; url: string } | null> {
  // Use stored URL first (authoritative source), then fall back to pattern guessing
  const urls = statusPageUrl
    ? [statusPageUrl, ...guessStatusUrls(domain)]
    : guessStatusUrls(domain)

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Uptrue/1.0 (uptime monitor; contact@uptrue.io)' },
      })
      clearTimeout(timeout)

      if (!res.ok) continue

      const html = await res.text()

      // Extract readable text — strip HTML tags, collapse whitespace
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000) // Cap at 2000 chars for prompt

      if (text.length > 100) {
        logger.info('Official status page fetched', { url })
        return { text, url }
      }
    } catch {
      // Try next URL
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// 2. Google News RSS (free, no API key)
// ---------------------------------------------------------------------------

async function fetchGoogleNews(siteName: string): Promise<SourceArticle[]> {
  // Include month+year in query — tbs=qdr:d is ignored by Google News RSS
  const now = new Date()
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const query = encodeURIComponent(`${siteName} down outage ${monthYear}`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`

  const cutoff = Date.now() - 48 * 60 * 60 * 1000 // discard anything older than 48 hours

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Uptrue/1.0 (uptime monitor; contact@uptrue.io)' },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const xml = await res.text()

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 10).map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? item.match(/<title>(.*?)<\/title>/)?.[1]
        ?? 'Untitled'
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]
        ?? item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]
        ?? ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        ?? item.match(/<description>(.*?)<\/description>/)?.[1]
        ?? ''

      return {
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        url: link,
        source: 'Google News',
        snippet: description.replace(/<[^>]+>/g, '').slice(0, 300),
        publishedAt: pubDate,
      }
    })
    .filter(a => a.title && a.url)
    .filter(a => {
      if (!a.publishedAt) return false
      const published = new Date(a.publishedAt).getTime()
      return !isNaN(published) && published >= cutoff
    })
    .slice(0, 5)
  } catch (error) {
    logger.warn('Google News fetch failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return []
  }
}

// ---------------------------------------------------------------------------
// 3. Reddit r/outages search (free public API)
// ---------------------------------------------------------------------------

async function fetchReddit(siteName: string, domain: string): Promise<SourceArticle[]> {
  const query = encodeURIComponent(`${siteName} down OR outage OR not working`)
  // t=hour restricts results to the last hour only — most relevant for live outages
  const url = `https://www.reddit.com/r/outages+sysadmin+webdev/search.json?q=${query}&sort=new&limit=10&restrict_sr=false&t=hour`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Uptrue/1.0 uptime monitor bot' },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const json = await res.json() as {
      data?: {
        children?: Array<{
          data: {
            title: string
            url: string
            permalink: string
            selftext: string
            created_utc: number
            score: number
          }
        }>
      }
    }

    const posts = json.data?.children ?? []

    return posts
      .filter(p => {
        const text = (p.data.title + p.data.selftext).toLowerCase()
        return text.includes(domain.replace(/^www\./, '').split('/')[0].split('.')[0].toLowerCase())
          || text.includes(siteName.toLowerCase())
      })
      .slice(0, 4)
      .map(p => ({
        title: p.data.title,
        url: `https://reddit.com${p.data.permalink}`,
        source: 'Reddit',
        snippet: p.data.selftext.slice(0, 300) || p.data.title,
        publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
      }))
  } catch (error) {
    logger.warn('Reddit fetch failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return []
  }
}

// ---------------------------------------------------------------------------
// 4. X (Twitter) recent search (Bearer token, free tier)
// ---------------------------------------------------------------------------

async function fetchXMentions(siteName: string): Promise<SourceArticle[]> {
  const config = getServerConfig()
  const bearerToken = config.twitter.bearerToken

  if (!bearerToken) {
    logger.warn('X bearer token not configured — skipping X research')
    return []
  }

  const query = encodeURIComponent(`"${siteName}" (down OR outage OR "not working") -is:retweet lang:en`)
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,public_metrics&expansions=author_id&user.fields=name,username`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${bearerToken}` },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      logger.warn('X search failed', { status: res.status })
      return []
    }

    const json = await res.json() as {
      data?: Array<{
        id: string
        text: string
        created_at?: string
        public_metrics?: { like_count: number; retweet_count: number }
        author_id?: string
      }>
      includes?: {
        users?: Array<{ id: string; username: string; name: string }>
      }
    }

    const tweets = json.data ?? []
    const users = json.includes?.users ?? []

    // Pick tweets with most engagement or just most recent
    return tweets
      .sort((a, b) => ((b.public_metrics?.like_count ?? 0) + (b.public_metrics?.retweet_count ?? 0))
        - ((a.public_metrics?.like_count ?? 0) + (a.public_metrics?.retweet_count ?? 0)))
      .slice(0, 4)
      .map(t => {
        const user = users.find(u => u.id === t.author_id)
        return {
          title: t.text.slice(0, 100),
          url: `https://x.com/${user?.username ?? 'twitter'}/status/${t.id}`,
          source: 'X (Twitter)',
          snippet: t.text,
          publishedAt: t.created_at,
        }
      })
  } catch (error) {
    logger.warn('X search fetch failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return []
  }
}

// ---------------------------------------------------------------------------
// 5. HackerNews (Algolia API, free, no auth)
// ---------------------------------------------------------------------------

async function fetchHackerNews(siteName: string): Promise<SourceArticle[]> {
  const query = encodeURIComponent(`${siteName} down`)
  const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=20&numericFilters=created_at_i>=${Math.floor(Date.now() / 1000) - 86400}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Uptrue/1.0 (uptime monitor; contact@uptrue.io)' },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const json = await res.json() as {
      hits?: Array<{
        title: string
        url?: string
        objectID: string
        points: number
        created_at: string
      }>
    }

    const hits = json.hits ?? []

    return hits
      .filter(h => h.url && h.points > 2)
      .slice(0, 5)
      .map(h => ({
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: 'HackerNews',
        snippet: h.title,
        publishedAt: h.created_at,
      }))
  } catch (error) {
    logger.warn('HackerNews fetch failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return []
  }
}

// ---------------------------------------------------------------------------
// 6. Category-specific RSS feeds (admin-configurable)
// ---------------------------------------------------------------------------

async function fetchCategoryRssFeeds(siteName: string, domain: string, categorySlug?: string): Promise<SourceArticle[]> {
  if (!categorySlug) return []

  try {
    const feeds = await getOutageRssFeedsForCategory(categorySlug)
    if (feeds.length === 0) return []

    const articles: SourceArticle[] = []
    const cutoff = Date.now() - 48 * 60 * 60 * 1000 // 48 hours

    for (const feed of feeds) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(feed.feed_url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Uptrue/1.0 (uptime monitor; contact@uptrue.io)' },
        })
        clearTimeout(timeout)

        if (!res.ok) continue

        const xml = await res.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

        items.slice(0, 10).forEach(item => {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
            ?? item.match(/<title>(.*?)<\/title>/)?.[1]
          const link = item.match(/<link>(.*?)<\/link>/)?.[1]
            ?? item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
          const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
            ?? item.match(/<description>(.*?)<\/description>/)?.[1]

          if (!title || !link) return

          const text = (title + (desc || '')).toLowerCase()
          const domainClean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

          if (!text.includes(domainClean.toLowerCase()) && !text.includes(siteName.toLowerCase())) return

          if (pubDate) {
            const published = new Date(pubDate).getTime()
            if (isNaN(published) || published < cutoff) return
          }

          articles.push({
            title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
            url: link,
            source: feed.source_name,
            snippet: (desc || title).replace(/<[^>]+>/g, '').slice(0, 300),
            publishedAt: pubDate,
          })
        })
      } catch {
        continue
      }
    }

    return articles.slice(0, 5)
  } catch (error) {
    logger.warn('Category RSS fetch failed', { categorySlug, error: error instanceof Error ? error.message : 'Unknown' })
    return []
  }
}

// ---------------------------------------------------------------------------
// Main researcher — runs all sources in parallel
// ---------------------------------------------------------------------------

/**
 * Gathers outage intelligence from 6 free sources in parallel.
 * Designed to complete within 10 seconds — all fetches have 5-8s timeouts.
 * Never throws — always returns a result even if all sources fail.
 */
export async function researchOutage(siteName: string, domain: string, statusPageUrl?: string, categorySlug?: string): Promise<OutageResearch> {
  logger.info('Starting outage research', { siteName, domain, hasStoredStatusPage: !!statusPageUrl, categorySlug })

  const [officialResult, newsArticles, redditPosts, xMentions, hnResults, rssResults] = await Promise.allSettled([
    fetchOfficialStatus(domain, statusPageUrl),
    fetchGoogleNews(siteName),
    fetchReddit(siteName, domain),
    fetchXMentions(siteName),
    fetchHackerNews(siteName),
    fetchCategoryRssFeeds(siteName, domain, categorySlug),
  ])

  const official = officialResult.status === 'fulfilled' ? officialResult.value : null
  const news = newsArticles.status === 'fulfilled' ? newsArticles.value : []
  const reddit = redditPosts.status === 'fulfilled' ? redditPosts.value : []
  const xPosts = xMentions.status === 'fulfilled' ? xMentions.value : []
  const hn = hnResults.status === 'fulfilled' ? hnResults.value : []
  const rss = rssResults.status === 'fulfilled' ? rssResults.value : []

  const articles = [...news, ...reddit, ...xPosts, ...hn, ...rss]

  logger.info('Outage research complete', {
    siteName,
    officialStatus: !!official,
    newsCount: news.length,
    redditCount: reddit.length,
    xCount: xPosts.length,
    hnCount: hn.length,
    rssCount: rss.length,
  })

  return {
    officialStatus: official?.text ?? null,
    officialStatusUrl: official?.url ?? null,
    articles,
    hasRealData: !!official || articles.length > 0,
  }
}
