import { NextResponse, type NextRequest } from 'next/server'
import * as dns from 'dns'
import * as net from 'net'
import { promisify } from 'util'
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
// DNS promisified
// ---------------------------------------------------------------------------

const resolve4 = promisify(dns.resolve4)
const resolve = promisify(dns.resolve)

// ---------------------------------------------------------------------------
// DNSBL list definitions
// ---------------------------------------------------------------------------

interface DnsblEntry {
  host: string
  displayName: string
  details: string
}

const DNSBL_LISTS: DnsblEntry[] = [
  { host: 'zen.spamhaus.org', displayName: 'Spamhaus ZEN', details: 'Comprehensive blocklist combining SBL, XBL and PBL' },
  { host: 'bl.spamcop.net', displayName: 'SpamCop', details: 'Reports-based spam source list' },
  { host: 'b.barracudacentral.org', displayName: 'Barracuda', details: 'Barracuda Networks reputation system' },
  { host: 'dnsbl.sorbs.net', displayName: 'SORBS', details: 'Spam and Open Relay Blocking System' },
  { host: 'spam.dnsbl.sorbs.net', displayName: 'SORBS Spam', details: 'SORBS spam-specific list' },
  { host: 'dnsbl-1.uceprotect.net', displayName: 'UCEPROTECT L1', details: 'UCEPROTECT individual IP list' },
  { host: 'ix.dnsbl.manitu.net', displayName: 'Manitu', details: 'German spam database' },
  { host: 'bl.mailspike.net', displayName: 'Mailspike', details: 'Real-time spam reputation' },
  { host: 'psbl.surriel.com', displayName: 'PSBL', details: 'Passive Spam Block List' },
  { host: 'db.wpbl.info', displayName: 'WPBL', details: 'Weighted Private Block List' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlacklistEntry {
  list: string
  displayName: string
  listed: boolean
  details: string
}

export interface BlacklistResult {
  domain: string
  ip: string | null
  responseTimeMs: number
  totalLists: number
  listedCount: number
  cleanCount: number
  results: BlacklistEntry[]
  overallStatus: 'clean' | 'listed' | 'error'
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reverseIp(ip: string): string {
  return ip.split('.').reverse().join('.')
}

async function checkDnsbl(reversedIp: string, dnsbl: DnsblEntry): Promise<BlacklistEntry> {
  const lookup = `${reversedIp}.${dnsbl.host}`

  try {
    const addresses = await resolve(lookup, 'A') as string[]
    // A result that starts with 127. means listed
    const listed = addresses.some((addr) => addr.startsWith('127.'))
    return {
      list: dnsbl.host,
      displayName: dnsbl.displayName,
      listed,
      details: dnsbl.details,
    }
  } catch (err: unknown) {
    // ENOTFOUND / NXDOMAIN means not listed — that is the normal "clean" state
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL') {
      return {
        list: dnsbl.host,
        displayName: dnsbl.displayName,
        listed: false,
        details: dnsbl.details,
      }
    }
    // Any other error — treat as unlisted but note it
    return {
      list: dnsbl.host,
      displayName: dnsbl.displayName,
      listed: false,
      details: dnsbl.details,
    }
  }
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
    const domainParam = searchParams.get('domain')

    if (!domainParam || typeof domainParam !== 'string') {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    const domain = domainParam
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')

    if (!domain) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}[a-zA-Z0-9]$/
    if (!domainRegex.test(domain) || domain.includes('..')) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const start = Date.now()

    // Resolve domain to IP
    let ip: string | null = null

    // Check if it's already an IP
    if (net.isIPv4(domain)) {
      ip = domain
    } else {
      try {
        const addresses = await resolve4(domain)
        ip = addresses[0] ?? null
      } catch {
        const responseTimeMs = Date.now() - start
        const result: BlacklistResult = {
          domain,
          ip: null,
          responseTimeMs,
          totalLists: DNSBL_LISTS.length,
          listedCount: 0,
          cleanCount: 0,
          results: [],
          overallStatus: 'error',
          error: `Could not resolve domain to an IP address. Check that ${domain} has a valid A record.`,
        }
        return NextResponse.json(result)
      }
    }

    if (!ip) {
      return NextResponse.json(
        { error: 'Could not resolve domain to an IP address' },
        { status: 400 }
      )
    }

    const reversedIp = reverseIp(ip)

    // Check all DNSBLs in parallel
    const checkResults = await Promise.all(
      DNSBL_LISTS.map((list) => checkDnsbl(reversedIp, list))
    )

    const responseTimeMs = Date.now() - start
    const listedCount = checkResults.filter((r) => r.listed).length
    const cleanCount = checkResults.filter((r) => !r.listed).length

    const result: BlacklistResult = {
      domain,
      ip,
      responseTimeMs,
      totalLists: DNSBL_LISTS.length,
      listedCount,
      cleanCount,
      results: checkResults,
      overallStatus: listedCount > 0 ? 'listed' : 'clean',
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch (err) {
    logger.error('Blacklist checker API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
