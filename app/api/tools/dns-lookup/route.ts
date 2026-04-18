import { NextResponse, type NextRequest } from 'next/server'
import { promises as dns } from 'dns'
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

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 300_000)

interface DnsRecords {
  A: string[]
  AAAA: string[]
  MX: { exchange: string; priority: number }[]
  NS: string[]
  TXT: string[][]
  CNAME: string | null
  SOA: { nsname: string; hostmaster: string; serial: number } | null
}

interface DnsLookupResult {
  domain: string
  responseTimeMs: number
  records: DnsRecords
  error?: string
}

async function lookupDns(domain: string): Promise<DnsLookupResult> {
  const start = Date.now()

  const [aRes, aaaaRes, mxRes, nsRes, txtRes, cnameRes, soaRes] = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain),
    dns.resolveMx(domain),
    dns.resolveNs(domain),
    dns.resolveTxt(domain),
    dns.resolveCname(domain),
    dns.resolveSoa(domain),
  ])

  const records: DnsRecords = {
    A: aRes.status === 'fulfilled' ? aRes.value : [],
    AAAA: aaaaRes.status === 'fulfilled' ? aaaaRes.value : [],
    MX: mxRes.status === 'fulfilled'
      ? mxRes.value.map((r) => ({ exchange: r.exchange, priority: r.priority }))
      : [],
    NS: nsRes.status === 'fulfilled' ? nsRes.value : [],
    TXT: txtRes.status === 'fulfilled' ? txtRes.value : [],
    CNAME: cnameRes.status === 'fulfilled' ? cnameRes.value[0] ?? null : null,
    SOA: soaRes.status === 'fulfilled'
      ? {
          nsname: soaRes.value.nsname,
          hostmaster: soaRes.value.hostmaster,
          serial: soaRes.value.serial,
        }
      : null,
  }

  return {
    domain,
    responseTimeMs: Date.now() - start,
    records,
  }
}

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
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    const cleaned = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
      .toLowerCase()
      .trim()

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}[a-zA-Z0-9]$/
    if (!domainRegex.test(cleaned) || cleaned.includes('..')) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const result = await lookupDns(cleaned)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    logger.error('DNS lookup API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
