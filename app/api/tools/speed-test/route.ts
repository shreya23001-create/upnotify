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

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

function getGrade(ttfbMs: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (ttfbMs < 200) return 'A'
  if (ttfbMs < 500) return 'B'
  if (ttfbMs < 800) return 'C'
  if (ttfbMs < 1500) return 'D'
  return 'F'
}

function buildTips(
  ttfbMs: number,
  isCompressed: boolean,
  cacheStatus: string | null,
  contentLengthBytes: number
): string[] {
  const tips: string[] = []

  if (ttfbMs > 500) {
    tips.push('Slow TTFB detected. Consider using a CDN (e.g., Cloudflare) to reduce server response time.')
  }

  if (ttfbMs > 800) {
    tips.push('High TTFB may indicate slow server-side processing. Review database queries and use caching layers like Redis.')
  }

  if (!isCompressed) {
    tips.push('Response is not compressed. Enable gzip or Brotli compression on your server to reduce transfer size.')
  }

  if (!cacheStatus || cacheStatus.toLowerCase().includes('miss') || cacheStatus.toLowerCase().includes('none')) {
    tips.push('No CDN cache hit detected. Ensure static assets and pages are cached at the edge for faster delivery.')
  }

  if (contentLengthBytes > 500_000) {
    tips.push('Large response body detected. Optimise images, minify HTML/CSS/JS, and lazy-load non-critical resources.')
  }

  if (ttfbMs < 200 && isCompressed && tips.length === 0) {
    tips.push('Excellent performance! Your server responds very quickly. Keep monitoring to maintain this speed.')
  }

  return tips
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

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are supported' }, { status: 400 })
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Private or localhost addresses are not allowed' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const startTotal = Date.now()
    let ttfbMs = 0
    let statusCode = 0
    let finalUrl = normalised
    let contentType = ''
    let server: string | null = null
    let isCompressed = false
    let cacheStatus: string | null = null
    let contentLengthBytes = 0

    try {
      const res = await fetch(normalised, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Uptrue-SpeedTest/1.0 (+https://upnotify-monitoring.vercel.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      })

      // TTFB — headers are now available
      ttfbMs = Date.now() - startTotal

      clearTimeout(timeout)

      statusCode = res.status
      finalUrl = res.url || normalised
      contentType = res.headers.get('content-type') ?? ''
      server = res.headers.get('server')
      const contentEncoding = res.headers.get('content-encoding') ?? ''
      isCompressed = /gzip|br|deflate/.test(contentEncoding)
      cacheStatus =
        res.headers.get('cf-cache-status') ||
        res.headers.get('x-cache') ||
        res.headers.get('x-cache-status') ||
        res.headers.get('age')
          ? (res.headers.get('cf-cache-status') || res.headers.get('x-cache') || res.headers.get('x-cache-status') || `age:${res.headers.get('age')}`)
          : null

      // Read body to get content length
      const body = await res.arrayBuffer()
      contentLengthBytes = body.byteLength
    } catch (fetchErr) {
      clearTimeout(timeout)
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out after 15 seconds' }, { status: 504 })
      }
      throw fetchErr
    }

    const totalMs = Date.now() - startTotal
    const grade = getGrade(ttfbMs)
    const tips = buildTips(ttfbMs, isCompressed, cacheStatus, contentLengthBytes)

    const result: SpeedTestResult = {
      url: normalised,
      finalUrl,
      statusCode,
      ttfbMs,
      totalMs,
      contentLengthBytes,
      contentType: contentType.split(';')[0].trim() || 'unknown',
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
    logger.error('Speed test API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
