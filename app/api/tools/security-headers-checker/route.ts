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

  // Check for raw IPv4 that falls in private ranges
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

interface HeaderDefinition {
  name: string
  description: string
  importance: 'critical' | 'important' | 'recommended'
  points: number
}

interface SecurityHeaderEntry {
  name: string
  present: boolean
  value: string | null
  description: string
  importance: 'critical' | 'important' | 'recommended'
}

interface SecurityHeadersResult {
  url: string
  responseTimeMs: number
  statusCode: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  headers: SecurityHeaderEntry[]
  fetchError?: string
}

const HEADER_DEFINITIONS: HeaderDefinition[] = [
  {
    name: 'strict-transport-security',
    description: 'Forces browsers to only connect via HTTPS, preventing downgrade attacks and cookie hijacking.',
    importance: 'critical',
    points: 20,
  },
  {
    name: 'content-security-policy',
    description: 'Restricts which resources (scripts, styles, images) can be loaded, protecting against XSS attacks.',
    importance: 'critical',
    points: 20,
  },
  {
    name: 'x-frame-options',
    description: 'Prevents your page from being embedded in iframes, protecting against clickjacking attacks.',
    importance: 'important',
    points: 15,
  },
  {
    name: 'x-content-type-options',
    description: 'Stops browsers from MIME-sniffing a response away from the declared content type, preventing certain attacks.',
    importance: 'important',
    points: 15,
  },
  {
    name: 'referrer-policy',
    description: 'Controls how much referrer information is sent with requests, protecting user privacy.',
    importance: 'recommended',
    points: 10,
  },
  {
    name: 'permissions-policy',
    description: 'Controls which browser features and APIs can be used (camera, microphone, geolocation, etc.).',
    importance: 'recommended',
    points: 10,
  },
  {
    name: 'cross-origin-opener-policy',
    description: 'Isolates your browsing context from cross-origin documents, preventing cross-origin attacks.',
    importance: 'recommended',
    points: 5,
  },
  {
    name: 'cross-origin-embedder-policy',
    description: 'Requires all subresources to be loaded with CORS or CORP, enabling powerful browser features safely.',
    importance: 'recommended',
    points: 5,
  },
]

function calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
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

    const start = Date.now()

    let response: Response
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      response = await fetch(trimmed, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Upnotify-SecurityHeadersChecker/1.0' },
      })
      clearTimeout(timeout)
    } catch (err) {
      const fetchError =
        err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out after 10 seconds'
          : `Could not reach ${parsed.hostname}: ${err instanceof Error ? err.message : String(err)}`

      const emptyResult: SecurityHeadersResult = {
        url: trimmed,
        responseTimeMs: Date.now() - start,
        statusCode: 0,
        grade: 'F',
        score: 0,
        headers: HEADER_DEFINITIONS.map((def) => ({
          name: def.name,
          present: false,
          value: null,
          description: def.description,
          importance: def.importance,
        })),
        fetchError,
      }
      return NextResponse.json(emptyResult, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    const responseTimeMs = Date.now() - start

    let score = 0
    const headers: SecurityHeaderEntry[] = HEADER_DEFINITIONS.map((def) => {
      const value = response.headers.get(def.name)
      const present = value !== null
      if (present) score += def.points
      return {
        name: def.name,
        present,
        value,
        description: def.description,
        importance: def.importance,
      }
    })

    const result: SecurityHeadersResult = {
      url: response.url || trimmed,
      responseTimeMs,
      statusCode: response.status,
      grade: calculateGrade(score),
      score,
      headers,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (err) {
    logger.error('Security headers check API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
