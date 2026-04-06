// =============================================================================
// AOE — Automated Outreach Engine
// Cron: site-discovery — runs weekly (Sunday 2am UTC)
// Discovers new sites via crt.sh CT logs + Tranco list
// Queues them for 3-night silent monitoring before emailing
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { insertDiscoveredSite, domainExists } from '@/lib/aoe/db/aoe-site-discovery'
import { findContactEmail } from '@/lib/aoe/services/email-finder'
import { detectPlatform } from '@/lib/aoe/services/platform-detector'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — discovery is the longest cron

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE        = 150  // max new domains to queue per run
const CONCURRENCY       = 5    // parallel email finders
const REQUEST_TIMEOUT   = 8000 // ms per domain

// TLDs most likely to be SMB targets (UK, IE, AU, NZ, CA + generic)
const TARGET_TLDS = ['co.uk', 'org.uk', 'com.au', 'co.nz', 'ie', 'ca', 'com']

// ---------------------------------------------------------------------------
// crt.sh — query recently-issued certificates, filter by expiry
// ---------------------------------------------------------------------------

interface CrtShEntry {
  common_name: string
  name_value: string
  not_after: string
}

async function discoverViaCrtSh(limit: number): Promise<string[]> {
  const domains = new Set<string>()

  for (const tld of TARGET_TLDS) {
    if (domains.size >= limit) break

    try {
      const url = `https://crt.sh/?q=%.${tld}&output=json`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })
      clearTimeout(timer)

      if (!res.ok) continue

      const entries = await res.json() as CrtShEntry[]
      const now = Date.now()
      const fourteenDays = 14 * 24 * 60 * 60 * 1000
      const threeDays = 3 * 24 * 60 * 60 * 1000

      for (const entry of entries) {
        if (domains.size >= limit) break

        const expiry = new Date(entry.not_after).getTime()
        const msUntilExpiry = expiry - now

        // Only sites expiring in 3–14 days — urgent enough to act, time to respond
        if (msUntilExpiry < threeDays || msUntilExpiry > fourteenDays) continue

        // Extract domain from common_name / name_value
        const rawName = entry.common_name || entry.name_value || ''
        const domain = rawName
          .replace(/^\*\./, '') // strip wildcard
          .split('\n')[0]       // first name only
          .trim()
          .toLowerCase()

        if (!domain || domain.includes(' ') || !domain.includes('.')) continue
        if (domain.startsWith('www.')) continue // normalise

        domains.add(domain)
      }
    } catch (err) {
      logger.error('AOE discovery: crt.sh query failed', { tld, error: String(err) })
    }
  }

  return [...domains]
}

// ---------------------------------------------------------------------------
// Tranco — sample from top 1M list for ecommerce platform detection
// We pull a random slice (not the top 100 — already over-monitored)
// ---------------------------------------------------------------------------

interface TrancoEntry {
  rank: number
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

    // Pull ranks 5001–10000 — SMBs more likely than top 5000
    const listRes = await fetch(
      `https://tranco-list.eu/api/lists/${listId}?from=5001&to=${5000 + limit}`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!listRes.ok) return []

    const data = await listRes.json() as { sites: TrancoEntry[] }
    return (data.sites ?? []).map(s => s.domain.toLowerCase())
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Process a batch of domains — find email + platform, insert to discovery
// ---------------------------------------------------------------------------

async function processDomain(domain: string): Promise<boolean> {
  // Skip if already in our system
  const exists = await domainExists(domain)
  if (exists) return false

  const [emailResult, platform] = await Promise.all([
    findContactEmail(domain, REQUEST_TIMEOUT),
    detectPlatform(domain, REQUEST_TIMEOUT),
  ])

  await insertDiscoveredSite({
    domain,
    platform,
    email: emailResult.email,
    emailSource: emailResult.source,
  })

  return true
}

async function processBatch(domains: string[]): Promise<number> {
  let added = 0

  for (let i = 0; i < domains.length; i += CONCURRENCY) {
    const chunk = domains.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(chunk.map(d => processDomain(d)))
    added += results.filter(r => r.status === 'fulfilled' && r.value).length
  }

  return added
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Check master kill switch
    const settings = await getAoeSettings()
    if (!settings.master_enabled) {
      logger.info('AOE site-discovery: skipped — master disabled')
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    // ---- Source 1: crt.sh SSL expiry sites (main target — high intent) ----
    const sslTargetLimit = Math.ceil(BATCH_SIZE * 0.7) // 70% from SSL expiry
    const sslDomains = await discoverViaCrtSh(sslTargetLimit)

    // ---- Source 2: Tranco ecommerce sites (Shopify/WooCommerce cold outreach) ----
    const ecomTargetLimit = BATCH_SIZE - sslDomains.length
    const trancoDomains = ecomTargetLimit > 0
      ? await discoverViaTranco(ecomTargetLimit * 3) // pull 3x and filter for ecom below
      : []

    // Filter Tranco to ecommerce only — detect platform before inserting
    const ecomDomains: string[] = []
    for (let i = 0; i < trancoDomains.length && ecomDomains.length < ecomTargetLimit; i += CONCURRENCY) {
      const chunk = trancoDomains.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        chunk.map(async d => ({ domain: d, platform: await detectPlatform(d, REQUEST_TIMEOUT) }))
      )
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.platform) {
          ecomDomains.push(r.value.domain)
        }
      }
    }

    // ---- Process both batches ----
    const [sslAdded, ecomAdded] = await Promise.all([
      processBatch(sslDomains),
      processBatch(ecomDomains),
    ])

    const totalAdded = sslAdded + ecomAdded

    logger.info('AOE site-discovery completed', {
      sslDomains: sslDomains.length,
      ecomDomains: ecomDomains.length,
      sslAdded,
      ecomAdded,
      totalAdded,
    })

    return NextResponse.json({
      ok: true,
      sslDomains: sslDomains.length,
      ecomDomains: ecomDomains.length,
      sslAdded,
      ecomAdded,
      totalAdded,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE site-discovery error', { error: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
