import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { dispatchChecker } from '@/lib/services/checker'
import type { Monitor } from '@/lib/types/index'

// Rate limiting — simple in-memory store (per Vercel instance; good enough for auth-gated endpoint)
const scanRateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

// The 18 domain-eligible monitor types for scanning
const SCAN_TYPES: Array<{ type: string; label: string; emoji: string; description: string }> = [
  { type: 'http',               label: 'HTTP Uptime',         emoji: '🌐', description: 'Is your website loading?' },
  { type: 'ssl',                label: 'SSL Certificate',     emoji: '🔒', description: 'Valid certificate, days until expiry' },
  { type: 'dns',                label: 'DNS Records',         emoji: '📡', description: 'DNS resolving correctly' },
  { type: 'domain',             label: 'Domain Expiry',       emoji: '📅', description: 'Domain registration expiry' },
  { type: 'ping',               label: 'Ping',                emoji: '📶', description: 'Host reachability' },
  { type: 'security-headers',   label: 'Security Headers',    emoji: '🛡️', description: 'CSP, HSTS, X-Frame-Options and more' },
  { type: 'spf-dmarc',          label: 'SPF / DMARC',         emoji: '📧', description: 'Email authentication policy' },
  { type: 'blacklist',          label: 'Blacklist Check',     emoji: '🚫', description: 'IP reputation across 4 DNSBL zones' },
  { type: 'mx-health',          label: 'MX Health',           emoji: '📮', description: 'Mail server reachability' },
  { type: 'whois-change',       label: 'WHOIS Change',        emoji: '📋', description: 'Registrar / ownership snapshot' },
  { type: 'redirect-chain',     label: 'Redirect Chain',      emoji: '↪️', description: 'Redirect hops to final destination' },
  { type: 'response-time',      label: 'Response Time',       emoji: '⏱️', description: 'How fast is your homepage?' },
  { type: 'page-size',          label: 'Page Size',           emoji: '📦', description: 'Homepage download size' },
  { type: 'robots-txt',         label: 'robots.txt',          emoji: '🤖', description: 'robots.txt present and readable' },
  { type: 'sitemap',            label: 'Sitemap',             emoji: '🗺️', description: 'sitemap.xml valid and reachable' },
  { type: 'cookie-consent',     label: 'Cookie Consent',      emoji: '🍪', description: 'Consent banner detected on page' },
  { type: 'ip-change',          label: 'IP Address',          emoji: '🔄', description: 'Resolved IP for the domain' },
  { type: 'nameserver-change',  label: 'Nameservers',         emoji: '🖥️', description: 'Current nameserver records' },
]

// Private IP ranges — SSRF guard
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^169\.254\./, /^metadata\./i,
]

function isSafeDomain(domain: string): boolean {
  const cleaned = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
  for (const p of PRIVATE_IP_PATTERNS) {
    if (p.test(cleaned)) return false
  }
  return true
}

function normaliseDomain(input: string): string {
  const stripped = input.trim().replace(/^https?:\/\//, '').split('/')[0]
  return stripped
}

function buildScanMonitor(type: string, target: string): Monitor {
  const now = new Date().toISOString()
  return {
    id: `scan-${type}`,
    org_id: 'scan',
    workspace_id: 'scan',
    name: `Scan: ${type}`,
    type,
    target,
    check_interval_seconds: 300,
    timeout_ms: 10000,
    severity: 'P2',
    status: 'unknown',
    is_paused: false,
    config: {},
    flap_count: 0,
    last_checked_at: null,
    next_check_at: null,
    created_at: now,
    updated_at: now,
  } as unknown as Monitor
}

function checkRateLimit(orgId: string): boolean {
  const now = Date.now()
  const entry = scanRateLimit.get(orgId)
  if (!entry || now > entry.resetAt) {
    scanRateLimit.set(orgId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (!checkRateLimit(user.org_id)) {
    return NextResponse.json({ error: 'Too many scans. Please wait a minute.' }, { status: 429 })
  }

  const body = await request.json() as { domain?: string }
  const rawDomain = body.domain ?? ''

  if (!rawDomain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

  const domain = normaliseDomain(rawDomain)

  if (!isSafeDomain(domain)) {
    return NextResponse.json({ error: 'Private or localhost domains cannot be scanned' }, { status: 400 })
  }

  // Build full URL and bare domain targets
  const urlTarget = `https://${domain}`
  const domainTarget = domain

  // Fetch existing monitors to flag duplicates
  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspaceId = workspaces[0]?.id
  const existingMonitors = workspaceId ? await getMonitorsByWorkspace(workspaceId) : []
  const existingSet = new Set(
    existingMonitors
      .filter(m => {
        const t = m.target.replace(/^https?:\/\//, '').split('/')[0]
        return t === domain
      })
      .map(m => m.type)
  )

  // Run all 18 checks in parallel with Promise.allSettled (never throws)
  const results = await Promise.allSettled(
    SCAN_TYPES.map(async ({ type }) => {
      // DNS-based types use bare domain, HTTP-based types use full URL
      const httpTypes = ['http', 'ssl', 'security-headers', 'redirect-chain', 'response-time', 'page-size', 'robots-txt', 'sitemap', 'cookie-consent']
      const target = httpTypes.includes(type) ? urlTarget : domainTarget
      const monitor = buildScanMonitor(type, target)
      const result = await dispatchChecker(monitor)
      return { type, result }
    })
  )

  const findings = SCAN_TYPES.map((meta, i) => {
    const settled = results[i]
    const alreadyMonitored = existingSet.has(meta.type)

    if (settled.status === 'fulfilled') {
      const { result } = settled.value
      return {
        ...meta,
        status: result.status,
        responseTimeMs: result.responseTimeMs ?? null,
        errorMessage: result.errorMessage ?? null,
        metadata: result.metadata ?? null,
        alreadyMonitored,
      }
    }

    return {
      ...meta,
      status: 'down' as const,
      responseTimeMs: null,
      errorMessage: 'Check timed out or failed',
      metadata: null,
      alreadyMonitored,
    }
  })

  return NextResponse.json({ domain, findings })
}
