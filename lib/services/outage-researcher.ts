import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceArticle {
  title: string
  url: string
  source: string       // e.g. "Reddit", "Google News", "X (Twitter)", "Official Status Page"
  snippet: string      // Short excerpt or tweet text
  publishedAt?: string
}

export interface OutageResearch {
  officialStatus: string | null       // Text from official status page
  officialStatusUrl: string | null    // URL of status page
  articles: SourceArticle[]           // News + Reddit + X mentions
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

async function fetchOfficialStatus(domain: string): Promise<{ text: string; url: string } | null> {
  const urls = guessStatusUrls(domain)

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
// Main researcher — runs all sources in parallel
// ---------------------------------------------------------------------------

/**
 * Gathers outage intelligence from 4 free sources in parallel.
 * Designed to complete within 10 seconds — all fetches have 8s timeouts.
 * Never throws — always returns a result even if all sources fail.
 */
export async function researchOutage(siteName: string, domain: string): Promise<OutageResearch> {
  logger.info('Starting outage research', { siteName, domain })

  const [officialResult, newsArticles, redditPosts, xMentions] = await Promise.allSettled([
    fetchOfficialStatus(domain),
    fetchGoogleNews(siteName),
    fetchReddit(siteName, domain),
    fetchXMentions(siteName),
  ])

  const official = officialResult.status === 'fulfilled' ? officialResult.value : null
  const news = newsArticles.status === 'fulfilled' ? newsArticles.value : []
  const reddit = redditPosts.status === 'fulfilled' ? redditPosts.value : []
  const xPosts = xMentions.status === 'fulfilled' ? xMentions.value : []

  const articles = [...news, ...reddit, ...xPosts]

  logger.info('Outage research complete', {
    siteName,
    officialStatus: !!official,
    newsCount: news.length,
    redditCount: reddit.length,
    xCount: xPosts.length,
  })

  return {
    officialStatus: official?.text ?? null,
    officialStatusUrl: official?.url ?? null,
    articles,
    hasRealData: !!official || articles.length > 0,
  }
}
