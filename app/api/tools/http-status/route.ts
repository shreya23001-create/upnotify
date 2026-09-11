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

interface Hop {
  url: string
  status: number
  statusText: string
  location: string | null
  responseTimeMs: number
}

interface HttpStatusResult {
  originalUrl: string
  finalUrl: string
  finalStatus: number
  finalStatusText: string
  totalResponseTimeMs: number
  hops: Hop[]
  finalHeaders: Record<string, string>
  isRedirect: boolean
  redirectCount: number
}

const FINAL_HEADERS_TO_CAPTURE = [
  'content-type',
  'server',
  'x-powered-by',
  'cache-control',
  'content-length',
  'etag',
  'last-modified',
  'x-cache',
  'cf-ray',
]

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
    const hops: Hop[] = []
    const MAX_HOPS = 10
    let currentUrl = trimmed

    // Manually follow redirects step by step
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

      const hopStart = Date.now()
      let response: Response

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10_000)
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': 'Upnotify-HttpStatusChecker/1.0' },
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

      hops.push({
        url: currentUrl,
        status: response.status,
        statusText: response.statusText || statusTextForCode(response.status),
        location,
        responseTimeMs: hopTimeMs,
      })

      // Not a redirect — done
      if (response.status < 300 || response.status >= 400) {
        const finalHeaders: Record<string, string> = {}
        for (const headerName of FINAL_HEADERS_TO_CAPTURE) {
          const val = response.headers.get(headerName)
          if (val !== null) {
            finalHeaders[headerName] = val
          }
        }

        const redirectCount = hops.length - 1
        const result: HttpStatusResult = {
          originalUrl: trimmed,
          finalUrl: currentUrl,
          finalStatus: response.status,
          finalStatusText: response.statusText || statusTextForCode(response.status),
          totalResponseTimeMs: Date.now() - totalStart,
          hops,
          finalHeaders,
          isRedirect: redirectCount > 0,
          redirectCount,
        }

        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, max-age=60' },
        })
      }

      // Is a redirect — follow the location header
      if (!location) {
        // Redirect with no location — treat as final
        const finalHeaders: Record<string, string> = {}
        for (const headerName of FINAL_HEADERS_TO_CAPTURE) {
          const val = response.headers.get(headerName)
          if (val !== null) {
            finalHeaders[headerName] = val
          }
        }
        const redirectCount = hops.length - 1
        const result: HttpStatusResult = {
          originalUrl: trimmed,
          finalUrl: currentUrl,
          finalStatus: response.status,
          finalStatusText: response.statusText || statusTextForCode(response.status),
          totalResponseTimeMs: Date.now() - totalStart,
          hops,
          finalHeaders,
          isRedirect: redirectCount > 0,
          redirectCount,
        }
        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, max-age=60' },
        })
      }

      // Resolve relative redirect URLs
      try {
        currentUrl = new URL(location, currentUrl).toString()
      } catch {
        break
      }
    }

    // Hit max hops
    return NextResponse.json(
      { error: `Too many redirects — stopped after ${MAX_HOPS} hops` },
      { status: 400 }
    )
  } catch (err) {
    logger.error('HTTP status check API error', {
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
