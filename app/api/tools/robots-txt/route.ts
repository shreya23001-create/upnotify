import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (15 req/min per IP)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 15

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) {
    return true
  }
  return false
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 300_000)

// ---------------------------------------------------------------------------
// SSRF protection
// ---------------------------------------------------------------------------

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (ipv4) {
    const [, a, b, c] = ipv4.map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 0) return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RobotsRule {
  userAgent: string
  disallowed: string[]
  allowed: string[]
  crawlDelay: number | null
}

export interface RobotsTxtResult {
  url: string
  found: boolean
  statusCode: number
  responseTimeMs: number
  contentLength: number
  content: string
  rules: RobotsRule[]
  sitemaps: string[]
  issues: string[]
  blocksGooglebot: boolean
  blocksBingbot: boolean
  disallowsAll: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function parseRobotsTxt(content: string): {
  rules: RobotsRule[]
  sitemaps: string[]
} {
  const lines = content.split(/\r?\n/)
  const rules: RobotsRule[] = []
  const sitemaps: string[] = []

  let currentAgents: string[] = []
  let current: RobotsRule | null = null

  function flushCurrentGroup(): void {
    if (currentAgents.length > 0 && current) {
      for (const agent of currentAgents) {
        const existing = rules.find((r) => r.userAgent.toLowerCase() === agent.toLowerCase())
        if (existing) {
          existing.disallowed.push(...current.disallowed)
          existing.allowed.push(...current.allowed)
          if (current.crawlDelay !== null) existing.crawlDelay = current.crawlDelay
        } else {
          rules.push({ ...current, userAgent: agent })
        }
      }
    }
    currentAgents = []
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const directive = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()

    if (directive === 'sitemap') {
      if (value) sitemaps.push(value)
      continue
    }

    if (directive === 'user-agent') {
      if (current && current.disallowed.length === 0 && current.allowed.length === 0 && current.crawlDelay === null) {
        // Continue accumulating user-agents for this block
        currentAgents.push(value)
      } else {
        flushCurrentGroup()
        currentAgents = [value]
        current = { userAgent: value, disallowed: [], allowed: [], crawlDelay: null }
      }
      continue
    }

    if (!current) {
      current = { userAgent: '*', disallowed: [], allowed: [], crawlDelay: null }
      if (currentAgents.length === 0) currentAgents = ['*']
    }

    if (directive === 'disallow') {
      if (value) current.disallowed.push(value)
    } else if (directive === 'allow') {
      if (value) current.allowed.push(value)
    } else if (directive === 'crawl-delay') {
      const delay = parseFloat(value)
      if (!isNaN(delay)) current.crawlDelay = delay
    }
  }

  flushCurrentGroup()

  return { rules, sitemaps }
}

function detectIssues(
  rules: RobotsRule[],
  sitemaps: string[],
  blocksGooglebot: boolean,
  blocksBingbot: boolean,
  disallowsAll: boolean
): string[] {
  const issues: string[] = []

  if (disallowsAll) issues.push('Disallows all crawling (Disallow: / for *)')
  if (blocksGooglebot) issues.push('Blocks Googlebot')
  if (blocksBingbot) issues.push('Blocks Bingbot')
  if (sitemaps.length === 0) issues.push('No sitemap declared')

  for (const rule of rules) {
    if (rule.crawlDelay !== null && rule.crawlDelay > 10) {
      issues.push(`High crawl delay (${rule.crawlDelay}s) for ${rule.userAgent} may slow indexing`)
    }
  }

  return issues
}

function agentBlocked(rules: RobotsRule[], agentName: string): boolean {
  const lower = agentName.toLowerCase()
  const matching = rules.filter(
    (r) => r.userAgent.toLowerCase() === lower || r.userAgent === '*'
  )
  for (const rule of matching) {
    if (rule.disallowed.includes('/')) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const searchParams = new URL(request.url).searchParams
    const urlParam = searchParams.get('url')

    if (!urlParam || typeof urlParam !== 'string') {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    // Normalize to https://domain/robots.txt
    let normalised = urlParam.trim()
    if (!normalised.startsWith('http://') && !normalised.startsWith('https://')) {
      normalised = `https://${normalised}`
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(normalised)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Private or localhost addresses are not allowed' },
        { status: 400 }
      )
    }

    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`
    const start = Date.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    let statusCode = 0
    let content = ''
    let contentLength = 0

    try {
      const res = await fetch(robotsUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Uptrue/1.0 (+https://upnotify-monitoring.vercel.app)' },
        redirect: 'follow',
      })
      clearTimeout(timeout)
      statusCode = res.status
      const rawText = await res.text()
      contentLength = Buffer.byteLength(rawText, 'utf8')
      content = contentLength > 50 * 1024 ? rawText.slice(0, 50 * 1024) : rawText
    } catch (fetchErr) {
      clearTimeout(timeout)
      const responseTimeMs = Date.now() - start
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        const result: RobotsTxtResult = {
          url: robotsUrl,
          found: false,
          statusCode: 0,
          responseTimeMs,
          contentLength: 0,
          content: '',
          rules: [],
          sitemaps: [],
          issues: ['Request timed out'],
          blocksGooglebot: false,
          blocksBingbot: false,
          disallowsAll: false,
          error: 'Request timed out after 10 seconds',
        }
        return NextResponse.json(result)
      }
      throw fetchErr
    }

    const responseTimeMs = Date.now() - start

    if (statusCode === 404 || statusCode === 0) {
      const result: RobotsTxtResult = {
        url: robotsUrl,
        found: false,
        statusCode,
        responseTimeMs,
        contentLength: 0,
        content: '',
        rules: [],
        sitemaps: [],
        issues: ['No robots.txt file found (404)'],
        blocksGooglebot: false,
        blocksBingbot: false,
        disallowsAll: false,
      }
      return NextResponse.json(result)
    }

    const { rules, sitemaps } = parseRobotsTxt(content)

    const wildcardRule = rules.find((r) => r.userAgent === '*')
    const disallowsAll = wildcardRule?.disallowed.includes('/') ?? false
    const blocksGooglebot = agentBlocked(rules, 'Googlebot')
    const blocksBingbot = agentBlocked(rules, 'Bingbot')

    const issues = detectIssues(rules, sitemaps, blocksGooglebot, blocksBingbot, disallowsAll)

    const result: RobotsTxtResult = {
      url: robotsUrl,
      found: true,
      statusCode,
      responseTimeMs,
      contentLength,
      content,
      rules,
      sitemaps,
      issues,
      blocksGooglebot,
      blocksBingbot,
      disallowsAll,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch (err) {
    logger.error('robots.txt checker API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
