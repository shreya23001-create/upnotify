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

interface RdapData {
  registrar: string | null
  createdAt: string | null
  expiresAt: string | null
  updatedAt: string | null
  status: string[]
  nameservers: string[]
}

interface DnsData {
  nsname: string
  hostmaster: string
  nameservers: string[]
}

interface WhoisResult {
  domain: string
  responseTimeMs: number
  rdap: RdapData | null
  dns: DnsData | null
  rdapAvailable: boolean
  error?: string
}

// RDAP event action types
interface RdapEvent {
  eventAction: string
  eventDate: string
}

// RDAP nameserver type
interface RdapNameserver {
  ldhName?: string
}

// RDAP response shape (partial, for what we use)
interface RdapResponse {
  entities?: Array<{
    roles?: string[]
    vcardArray?: unknown[]
  }>
  events?: RdapEvent[]
  status?: string[]
  nameservers?: RdapNameserver[]
}

function extractRegistrar(rdapJson: RdapResponse): string | null {
  const entities = rdapJson.entities || []
  for (const entity of entities) {
    if (Array.isArray(entity.roles) && entity.roles.includes('registrar')) {
      const vcard = entity.vcardArray
      if (Array.isArray(vcard) && vcard.length > 1) {
        const fields = vcard[1]
        if (Array.isArray(fields)) {
          for (const field of fields) {
            if (Array.isArray(field) && field[0] === 'fn') {
              return String(field[3] ?? '')
            }
          }
        }
      }
    }
  }
  return null
}

function extractEventDate(rdapJson: RdapResponse, action: string): string | null {
  const events = rdapJson.events || []
  const ev = events.find((e) => e.eventAction === action)
  return ev ? ev.eventDate : null
}

async function fetchRdap(domain: string): Promise<{ data: RdapData | null; available: boolean }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json, application/json' },
    })
    clearTimeout(timeoutId)

    if (res.status === 404) {
      return { data: null, available: false }
    }

    if (!res.ok) {
      return { data: null, available: false }
    }

    const json = (await res.json()) as RdapResponse

    const nameservers = (json.nameservers || [])
      .map((ns) => (ns.ldhName ? ns.ldhName.toLowerCase() : ''))
      .filter(Boolean)

    const data: RdapData = {
      registrar: extractRegistrar(json),
      createdAt: extractEventDate(json, 'registration'),
      expiresAt: extractEventDate(json, 'expiration'),
      updatedAt: extractEventDate(json, 'last changed'),
      status: json.status || [],
      nameservers,
    }

    return { data, available: true }
  } catch {
    return { data: null, available: false }
  }
}

async function lookupWhois(domain: string): Promise<WhoisResult> {
  const start = Date.now()

  const [rdapResult, soaResult, nsResult] = await Promise.allSettled([
    fetchRdap(domain),
    dns.resolveSoa(domain),
    dns.resolveNs(domain),
  ])

  const rdapOutcome = rdapResult.status === 'fulfilled' ? rdapResult.value : { data: null, available: false }

  let dnsData: DnsData | null = null
  if (soaResult.status === 'fulfilled') {
    const ns = nsResult.status === 'fulfilled' ? nsResult.value : []
    dnsData = {
      nsname: soaResult.value.nsname,
      hostmaster: soaResult.value.hostmaster,
      nameservers: ns,
    }
  } else if (nsResult.status === 'fulfilled') {
    dnsData = {
      nsname: '',
      hostmaster: '',
      nameservers: nsResult.value,
    }
  }

  return {
    domain,
    responseTimeMs: Date.now() - start,
    rdap: rdapOutcome.data,
    dns: dnsData,
    rdapAvailable: rdapOutcome.available,
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

    const result = await lookupWhois(cleaned)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    logger.error('WHOIS lookup API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
