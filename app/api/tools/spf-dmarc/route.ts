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

type SpfGrade = 'pass' | 'warn' | 'fail'
type DmarcGrade = 'pass' | 'warn' | 'fail'
type OverallGrade = 'A' | 'B' | 'C' | 'D' | 'F'

interface SpfData {
  found: boolean
  record: string | null
  mechanisms: string[]
  hasAll: boolean
  allMechanism: string | null
  issues: string[]
  grade: SpfGrade
}

interface DmarcData {
  found: boolean
  record: string | null
  policy: string | null
  pct: number | null
  rua: string | null
  issues: string[]
  grade: DmarcGrade
}

interface SpfDmarcResult {
  domain: string
  responseTimeMs: number
  spf: SpfData
  dmarc: DmarcData
  overallGrade: OverallGrade
}

function parseSPF(txtRecords: string[][]): SpfData {
  const flat = txtRecords.map((chunks) => chunks.join('')).join(' ')
  const spfRecord = flat
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.toLowerCase().startsWith('v=spf1'))

  if (!spfRecord) {
    return {
      found: false,
      record: null,
      mechanisms: [],
      hasAll: false,
      allMechanism: null,
      issues: ['No SPF record found. Without SPF, anyone can send email claiming to be from your domain.'],
      grade: 'fail',
    }
  }

  const parts = spfRecord.split(/\s+/)
  const mechanisms = parts.slice(1)
  const allPart = mechanisms.find((m) => /^[+~?-]?all$/i.test(m)) ?? null
  const hasAll = allPart !== null
  const issues: string[] = []

  if (!hasAll) {
    issues.push('SPF record has no "all" mechanism. Add "-all" to reject unauthorised senders.')
  }

  if (allPart === '+all') {
    issues.push('"+ all" allows any server to send email as your domain. Change to "-all" or "~all" immediately.')
  }

  if (mechanisms.filter((m) => m.toLowerCase().startsWith('include:')).length > 10) {
    issues.push('SPF record has more than 10 include mechanisms. This may exceed the DNS lookup limit.')
  }

  let grade: SpfGrade = 'pass'
  if (!hasAll || allPart === '+all') {
    grade = 'fail'
  } else if (allPart === '?all') {
    grade = 'warn'
  }

  return {
    found: true,
    record: spfRecord,
    mechanisms,
    hasAll,
    allMechanism: allPart,
    issues,
    grade,
  }
}

function parseDMARC(txtRecords: string[][]): DmarcData {
  const flat = txtRecords.map((chunks) => chunks.join('')).join(' ')
  const dmarcRecord = flat
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.toLowerCase().startsWith('v=dmarc1'))

  if (!dmarcRecord) {
    return {
      found: false,
      record: null,
      policy: null,
      pct: null,
      rua: null,
      issues: ['No DMARC record found. Without DMARC, your domain has no email authentication policy.'],
      grade: 'fail',
    }
  }

  const tags: Record<string, string> = {}
  for (const part of dmarcRecord.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k && v.length > 0) {
      tags[k.trim().toLowerCase()] = v.join('=').trim()
    }
  }

  const policy = tags['p'] ?? null
  const pct = tags['pct'] ? parseInt(tags['pct'], 10) : 100
  const rua = tags['rua'] ?? null
  const issues: string[] = []

  if (policy === 'none') {
    issues.push('DMARC policy is "none". This monitors but does not protect. Upgrade to "quarantine" or "reject".')
  }

  if (pct !== null && pct < 100) {
    issues.push(`DMARC is only applied to ${pct}% of messages. Consider setting pct=100 for full protection.`)
  }

  if (!rua) {
    issues.push('No reporting URI (rua) set. Add rua=mailto:your@email.com to receive DMARC reports.')
  }

  let grade: DmarcGrade = 'pass'
  if (policy === 'none') {
    grade = 'warn'
  } else if (!policy) {
    grade = 'fail'
  }

  return {
    found: true,
    record: dmarcRecord,
    policy,
    pct,
    rua,
    issues,
    grade,
  }
}

function calculateOverallGrade(spf: SpfData, dmarc: DmarcData): OverallGrade {
  if (!spf.found) return 'F'
  if (spf.grade === 'fail') return 'D'
  if (!dmarc.found) return 'D'
  if (dmarc.policy === 'reject' && spf.grade === 'pass') return 'A'
  if (dmarc.policy === 'quarantine' && spf.grade === 'pass') return 'B'
  if (dmarc.policy === 'none') return 'C'
  if (spf.grade === 'warn') return 'C'
  return 'D'
}

async function checkSpfDmarc(domain: string): Promise<SpfDmarcResult> {
  const start = Date.now()

  const [spfTxtRes, dmarcTxtRes] = await Promise.allSettled([
    dns.resolveTxt(domain),
    dns.resolveTxt(`_dmarc.${domain}`),
  ])

  const spfTxt = spfTxtRes.status === 'fulfilled' ? spfTxtRes.value : []
  const dmarcTxt = dmarcTxtRes.status === 'fulfilled' ? dmarcTxtRes.value : []

  const spf = parseSPF(spfTxt)
  const dmarc = parseDMARC(dmarcTxt)
  const overallGrade = calculateOverallGrade(spf, dmarc)

  return {
    domain,
    responseTimeMs: Date.now() - start,
    spf,
    dmarc,
    overallGrade,
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

    const result = await checkSpfDmarc(cleaned)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    logger.error('SPF/DMARC check API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
