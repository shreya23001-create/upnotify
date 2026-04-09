// =============================================================================
// AOE — Automated Outreach Engine
// Cron: site-discovery — runs weekly (Sunday 2am UTC)
// Discovers new sites via two sources:
//   1. crt.sh CT logs  — sites with SSL expiring in 7–60 days (high intent)
//   2. Tranco top-1M   — broad pool of real live sites (AI SEO + cold outreach)
// Splits limit 50/50 between sources. Ignores existing domains automatically.
// Categorisation happens later in outreach-checker — not here.
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { insertDiscoveredSite, domainExists } from '@/lib/aoe/db/aoe-site-discovery'
import { findContactEmail } from '@/lib/aoe/services/email-finder'
import { detectPlatform } from '@/lib/aoe/services/platform-detector'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — discovery is the longest cron

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONCURRENCY     = 5     // parallel email finders
const REQUEST_TIMEOUT = 8000  // ms per domain

// SSL expiry window — wide enough to get volume, specific enough to be relevant
const SSL_MIN_DAYS = 7
const SSL_MAX_DAYS = 60

// Tranco rank window — SMBs, not mega-corps or tiny spam sites
const TRANCO_RANK_START = 5_001
const TRANCO_RANK_END   = 50_000

// TLDs most likely to be SMB targets (UK, IE, AU, NZ, CA + generic)
const TARGET_TLDS = ['co.uk', 'org.uk', 'com.au', 'co.nz', 'ie', 'ca', 'com']

// ---------------------------------------------------------------------------
// Source 1: crt.sh — SSL expiry window (widened to 7–60 days)
// ---------------------------------------------------------------------------

interface CrtShEntry {
  common_name: string
  name_value:  string
  not_after:   string
}

async function discoverViaCrtSh(limit: number): Promise<string[]> {
  const domains = new Set<string>()
  const minMs = SSL_MIN_DAYS * 24 * 60 * 60 * 1000
  const maxMs = SSL_MAX_DAYS * 24 * 60 * 60 * 1000

  for (const tld of TARGET_TLDS) {
    if (domains.size >= limit) break

    try {
      const url = `https://crt.sh/?q=%.${tld}&output=json`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })
      clearTimeout(timer)

      if (!res.ok) continue

      const entries = await res.json() as CrtShEntry[]
      const now = Date.now()

      for (const entry of entries) {
        if (domains.size >= limit) break

        const expiry = new Date(entry.not_after).getTime()
        const msUntilExpiry = expiry - now

        // SSL expiring in 7–60 days — meaningful lead time for outreach
        if (msUntilExpiry < minMs || msUntilExpiry > maxMs) continue

        const rawName = entry.common_name || entry.name_value || ''
        const domain = rawName
          .replace(/^\*\./, '')
          .split('\n')[0]
          .trim()
          .toLowerCase()

        if (!domain || domain.includes(' ') || !domain.includes('.')) continue
        if (domain.startsWith('www.')) continue

        // Filter to target TLDs
        if (!TARGET_TLDS.some(t => domain.endsWith(`.${t}`))) continue

        domains.add(domain)
      }
    } catch (err) {
      logger.error('AOE discovery: crt.sh query failed', { tld, error: String(err) })
    }
  }

  return [...domains]
}

// ---------------------------------------------------------------------------
// Source 2: Tranco top-1M — all domains (no ecom filter — checker categorises)
// Pulls a random slice from TRANCO_RANK_START–TRANCO_RANK_END to avoid
// always returning the same domains on daily runs
// ---------------------------------------------------------------------------

interface TrancoEntry {
  rank:   number
  domain: string
}

async function discoverViaTranco(limit: number): Promise<string[]> {
  try {
    // Get latest list ID
    const metaRes = await fetch('https://tranco-list.eu/api/lists/latest', {
      headers: { 'Accept': 'application/json' },
    })
    if (!metaRes.ok) return []

    const meta = await metaRes.json() as { list_id: string }
    const listId = meta.list_id

    // Random offset within our rank window so daily runs don't repeat
    const windowSize = TRANCO_RANK_END - TRANCO_RANK_START
    const pullSize   = Math.min(limit * 4, windowSize) // pull 4x, filter down to limit
    const maxStart   = TRANCO_RANK_START + windowSize - pullSize
    const fromRank   = TRANCO_RANK_START + Math.floor(Math.random() * maxStart)
    const toRank     = fromRank + pullSize

    const listRes = await fetch(
      `https://tranco-list.eu/api/lists/${listId}?from=${fromRank}&to=${toRank}`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!listRes.ok) return []

    const data = await listRes.json() as { sites: TrancoEntry[] }
    const all  = (data.sites ?? []).map(s => s.domain.toLowerCase())

    // Filter to target TLDs — Tranco has all TLDs, we only want SMB-friendly ones
    return all
      .filter(d => TARGET_TLDS.some(t => d.endsWith(`.${t}`)))
      .slice(0, limit * 2) // keep 2x so we have buffer for existing-domain skips
  } catch (err) {
    logger.error('AOE discovery: Tranco query failed', { error: String(err) })
    return []
  }
}

// ---------------------------------------------------------------------------
// Process a single domain — find email + platform, insert to discovery
// Returns true if newly inserted, false if already exists or skipped
// ---------------------------------------------------------------------------

async function processDomain(domain: string): Promise<boolean> {
  const exists = await domainExists(domain)
  if (exists) return false

  const [emailResult, platform] = await Promise.all([
    findContactEmail(domain, REQUEST_TIMEOUT),
    detectPlatform(domain, REQUEST_TIMEOUT),
  ])

  await insertDiscoveredSite({
    domain,
    platform,
    email:       emailResult.email,
    emailSource: emailResult.source,
  })

  return true
}

async function processBatch(domains: string[], cap: number): Promise<{ added: number; skipped: number }> {
  let added   = 0
  let skipped = 0

  for (let i = 0; i < domains.length && added < cap; i += CONCURRENCY) {
    const chunk   = domains.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(chunk.map(d => processDomain(d)))

    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value) added++
        else         skipped++
      }
    }
  }

  return { added, skipped }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const { cron }   = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId     = await startCronRun('/api/cron/aoe/site-discovery', getTriggeredBy(request))

  try {
    const settings = await getAoeSettings()

    if (!settings.master_enabled) {
      logger.info('AOE site-discovery: skipped — master disabled')
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: master_disabled' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    const totalLimit  = settings.daily_discovery_limit ?? 50
    const crtLimit    = Math.ceil(totalLimit * 0.5)   // 50% from crt.sh
    const trancoLimit = totalLimit - crtLimit          // 50% from Tranco

    logger.info('AOE site-discovery: starting', {
      totalLimit,
      crtLimit,
      trancoLimit,
      sslWindow: `${SSL_MIN_DAYS}–${SSL_MAX_DAYS} days`,
    })

    // ── Source 1: crt.sh (SSL expiry) ──────────────────────────────────────
    const crtDomains = await discoverViaCrtSh(crtLimit * 2) // pull 2x, cap on insert
    logger.info('AOE site-discovery: crt.sh fetched', { count: crtDomains.length })

    // ── Source 2: Tranco (all domains, TLD-filtered) ────────────────────────
    const trancoDomains = await discoverViaTranco(trancoLimit)
    logger.info('AOE site-discovery: Tranco fetched', { count: trancoDomains.length })

    // ── Process both sources in parallel ───────────────────────────────────
    const [crtResult, trancoResult] = await Promise.all([
      processBatch(crtDomains,    crtLimit),
      processBatch(trancoDomains, trancoLimit),
    ])

    const totalAdded   = crtResult.added   + trancoResult.added
    const totalSkipped = crtResult.skipped + trancoResult.skipped

    logger.info('AOE site-discovery completed', {
      crtFetched:    crtDomains.length,
      trancoFetched: trancoDomains.length,
      crtAdded:      crtResult.added,
      trancoAdded:   trancoResult.added,
      totalAdded,
      totalSkipped,
    })

    const summary = `added: ${totalAdded} (crt: ${crtResult.added}, tranco: ${trancoResult.added}) | skipped (existing): ${totalSkipped}`
    await endCronRun(runId, cronStart, 'ok', { summary })

    return NextResponse.json({
      ok: true,
      totalAdded,
      totalSkipped,
      crtFetched:  crtDomains.length,
      crtAdded:    crtResult.added,
      trancoFetched: trancoDomains.length,
      trancoAdded: trancoResult.added,
      sslWindow:   `${SSL_MIN_DAYS}–${SSL_MAX_DAYS} days`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE site-discovery error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
