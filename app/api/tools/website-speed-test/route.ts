import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// In-memory rate limiter (15 req/min per IP)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count += 1
  return entry.count > 15
}

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k)
  }
}, 300_000)

// ---------------------------------------------------------------------------
// SSRF guard
// ---------------------------------------------------------------------------

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (lower === 'localhost' || lower === '0.0.0.0' || lower.endsWith('.local') || lower.endsWith('.internal')) return true
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (ipv4) {
    const [, a, b, c] = ipv4.map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Grade logic
// ---------------------------------------------------------------------------

function computeGrade(ttfbMs: number, totalMs: number, isCompressed: boolean): 'A' | 'B' | 'C' | 'D' | 'F' {
  let score = 100
  if (ttfbMs > 800) score -= 40
  else if (ttfbMs > 400) score -= 20
  else if (ttfbMs > 200) score -= 10
  if (totalMs > 3000) score -= 30
  else if (totalMs > 1500) score -= 15
  else if (totalMs > 800) score -= 5
  if (!isCompressed) score -= 10
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function buildTips(ttfbMs: number, totalMs: number, isCompressed: boolean, server: string | null, cacheStatus: string | null): string[] {
  const tips: string[] = []
  if (ttfbMs > 800) tips.push('Slow TTFB (>800ms) — consider a CDN or server-side caching')
  else if (ttfbMs > 400) tips.push('TTFB could be improved — use a CDN closer to your users')
  if (!isCompressed) tips.push('Response is not gzip/brotli compressed — enable compression in your server config')
  if (totalMs > 2000) tips.push('Slow total load time — check large page resources, images, or blocking scripts')
  if (!cacheStatus || cacheStatus === 'MISS') tips.push('No CDN cache hit detected — consider a CDN or set aggressive Cache-Control headers')
  if (tips.length === 0) tips.push('Looking good! TTFB is fast and compression is enabled.')
  return tips
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export interface SpeedTestResult {
  url: string
  finalUrl: string
  statusCode: number
  ttfbMs: number
  totalMs: number
  contentLengthBytes: number
  contentType: string
  server: string | null
  isCompressed: boolean
  cacheStatus: string | null
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  tips: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again in a minute.' }, { status: 429 })
  }

  try {
    const searchParams = new URL(request.url).searchParams
    let rawUrl = searchParams.get('url')

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    rawUrl = rawUrl.trim()
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`
    }

    let parsed: URL
    try {
      parsed = new URL(rawUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ error: 'Private or reserved addresses are not allowed' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const fetchStart = Date.now()
    let response: Response
    let ttfbMs = 0

    try {
      response = await fetch(rawUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Upnotify-SpeedTest/1.0' },
      })
      ttfbMs = Date.now() - fetchStart
    } catch (err) {
      clearTimeout(timeout)
      const msg = err instanceof Error && err.name === 'AbortError' ? 'Request timed out after 15 seconds' : err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Failed to fetch URL: ${msg}` }, { status: 502 })
    }

    // Read body to measure total download time
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch {
      // ignore body read errors
    }
    clearTimeout(timeout)

    const totalMs = Date.now() - fetchStart
    const contentEncoding = response.headers.get('content-encoding') ?? ''
    const isCompressed = contentEncoding.includes('gzip') || contentEncoding.includes('br') || contentEncoding.includes('deflate')
    const server = response.headers.get('server')
    const cacheStatus = response.headers.get('x-cache') ?? response.headers.get('cf-cache-status') ?? response.headers.get('x-cache-status')

    const contentLengthHeader = response.headers.get('content-length')
    const contentLengthBytes = contentLengthHeader
      ? parseInt(contentLengthHeader, 10)
      : Buffer.byteLength(bodyText, 'utf8')

    const grade = computeGrade(ttfbMs, totalMs, isCompressed)
    const tips = buildTips(ttfbMs, totalMs, isCompressed, server, cacheStatus)

    const result: SpeedTestResult = {
      url: rawUrl,
      finalUrl: response.url || rawUrl,
      statusCode: response.status,
      ttfbMs,
      totalMs,
      contentLengthBytes,
      contentType: response.headers.get('content-type') ?? '',
      server,
      isCompressed,
      cacheStatus,
      grade,
      tips,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    logger.error('Website speed test API error', { error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
