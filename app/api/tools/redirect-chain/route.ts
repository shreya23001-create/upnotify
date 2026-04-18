import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

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
// SSRF protection — block private/loopback IPs
// ---------------------------------------------------------------------------

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (lower === 'localhost' || lower === '0.0.0.0') return true

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

interface ChainStep {
  step: number
  url: string
  status: number
  statusText: string
  redirectsTo: string | null
  responseTimeMs: number
  isHttpToHttps: boolean
  isWwwChange: boolean
}

interface RedirectChainResult {
  originalUrl: string
  finalUrl: string
  totalHops: number
  totalTimeMs: number
  hasLoop: boolean
  chain: ChainStep[]
  issues: string[]
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

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
    const reqUrl = new URL(request.url)
    const rawUrl = reqUrl.searchParams.get('url')

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    const trimmed = rawUrl.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL must start with http:// or https://' },
        { status: 400 }
      )
    }

    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (isBlockedHostname(parsed.hostname)) {
      return NextResponse.json({ error: 'Private or reserved addresses are not allowed' }, { status: 400 })
    }

    const totalStart = Date.now()
    const chain: ChainStep[] = []
    const visitedUrls = new Set<string>()
    const MAX_HOPS = 15
    let currentUrl = trimmed
    let hasLoop = false

    for (let i = 0; i < MAX_HOPS; i++) {
      let hopParsed: URL
      try {
        hopParsed = new URL(currentUrl)
      } catch {
        break
      }

      if (isBlockedHostname(hopParsed.hostname)) {
        return NextResponse.json({ error: 'Redirect leads to a private or reserved address' }, { status: 400 })
      }

      // Detect loop before fetching
      const normalised = currentUrl.toLowerCase()
      if (visitedUrls.has(normalised)) {
        hasLoop = true
        break
      }
      visitedUrls.add(normalised)

      const hopStart = Date.now()
      let response: Response

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10_000)
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': 'Uptrue-RedirectChainChecker/1.0' },
        })
        clearTimeout(timeout)
      } catch (err) {
        const errMsg =
          err instanceof Error && err.name === 'AbortError'
            ? 'Request timed out'
            : err instanceof Error
              ? err.message
              : String(err)
        return NextResponse.json({ error: `Failed to fetch ${currentUrl}: ${errMsg}` }, { status: 502 })
      }

      const hopTimeMs = Date.now() - hopStart
      const location = response.headers.get('location')
      const isRedirectStatus = response.status >= 300 && response.status < 400

      // Determine if this hop is HTTP→HTTPS or www change
      let nextUrl: string | null = null
      let isHttpToHttps = false
      let isWwwChange = false

      if (isRedirectStatus && location) {
        try {
          nextUrl = new URL(location, currentUrl).toString()
          const currentParsed = new URL(currentUrl)
          const nextParsed = new URL(nextUrl)
          isHttpToHttps =
            currentParsed.protocol === 'http:' && nextParsed.protocol === 'https:'
          const currentWww = currentParsed.hostname.startsWith('www.')
          const nextWww = nextParsed.hostname.startsWith('www.')
          isWwwChange = currentWww !== nextWww
        } catch {
          // ignore URL parse errors
        }
      }

      chain.push({
        step: i + 1,
        url: currentUrl,
        status: response.status,
        statusText: response.statusText || statusTextForCode(response.status),
        redirectsTo: nextUrl,
        responseTimeMs: hopTimeMs,
        isHttpToHttps,
        isWwwChange,
      })

      if (!isRedirectStatus || !nextUrl) {
        break
      }

      currentUrl = nextUrl
    }

    const totalTimeMs = Date.now() - totalStart
    const finalStep = chain[chain.length - 1]
    const finalUrl = finalStep?.redirectsTo ?? finalStep?.url ?? trimmed
    const totalHops = chain.length

    // Build issues list
    const issues: string[] = []

    if (hasLoop) {
      issues.push('Redirect loop detected — this URL will never resolve')
    }

    if (totalHops > 10) {
      issues.push(`Too many redirects (${totalHops}) — this slows page load and wastes crawl budget`)
    } else if (totalHops > 4) {
      issues.push(`Long redirect chain (${totalHops} hops) — consider consolidating to a single redirect`)
    }

    // Check if HTTP redirects to HTTPS (good) vs missing that redirect
    const hasHttpToHttps = chain.some((step) => step.isHttpToHttps)
    const startsWithHttp = trimmed.startsWith('http://')
    if (startsWithHttp && !hasHttpToHttps) {
      issues.push('No HTTP to HTTPS redirect — users on HTTP are not being redirected to the secure version')
    }

    // Check for mixed www/non-www across the chain
    const wwwChanges = chain.filter((step) => step.isWwwChange)
    if (wwwChanges.length > 1) {
      issues.push('Multiple www/non-www redirects in chain — consolidate to a single canonical domain')
    }

    // Check for 302 being used instead of 301 for permanent redirects
    const temporaryRedirects = chain.filter(
      (step) => step.status === 302 && step.redirectsTo !== null
    )
    if (temporaryRedirects.length > 0) {
      issues.push(
        `${temporaryRedirects.length} temporary redirect(s) (302) found — use 301 for permanent redirects to pass SEO value`
      )
    }

    const result: RedirectChainResult = {
      originalUrl: trimmed,
      finalUrl,
      totalHops,
      totalTimeMs,
      hasLoop,
      chain,
      issues,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (err) {
    logger.error('Redirect chain check API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function statusTextForCode(code: number): string {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 303: 'See Other',
    304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 410: 'Gone',
    429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  return map[code] || ''
}
