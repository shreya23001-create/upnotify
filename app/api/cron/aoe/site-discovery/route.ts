// =============================================================================
// AOE — Automated Outreach Engine
// Cron: site-discovery — runs weekly (Sunday 2am UTC)
// Discovers new sites via two sources:
//   1. crt.sh CT logs  — recently-issued SSL certs (exclude=expired, last 180 days)
//   2. Tranco top-1M   — CSV zip download, random window from rank 5001–50000
// Splits limit 50/50. Duplicate domains silently skipped.
// Categorisation happens in outreach-checker — not here.
// =============================================================================

import { createInflateRaw } from 'zlib'
import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { insertDiscoveredSite, domainExists } from '@/lib/aoe/db/aoe-site-discovery'
import { findContactEmail } from '@/lib/aoe/services/email-finder'
import { detectPlatform } from '@/lib/aoe/services/platform-detector'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONCURRENCY     = 5
const REQUEST_TIMEOUT = 8000

// SSL window — wide enough for volume. Checker re-validates on send.
const SSL_MIN_DAYS = 7
const SSL_MAX_DAYS = 60

// Only include certs issued within this many days (filters out historical records)
const RECENTLY_ISSUED_DAYS = 180

// Tranco rank window — avoid top 5000 (mega-corps) and bottom long tail
const TRANCO_RANK_START = 5_001
const TRANCO_RANK_END   = 50_000

// TLDs most likely to be SMB targets
const TARGET_TLDS = ['co.uk', 'org.uk', 'com.au', 'co.nz', 'ie', 'ca', 'com']

// ---------------------------------------------------------------------------
// Source 1: crt.sh — recently-issued SSL certs (non-expired)
// exclude=expired → server filters expired certs → we see recent issuances
// not_before filter → ignore historical records pre-dating RECENTLY_ISSUED_DAYS
// ---------------------------------------------------------------------------

interface CrtShEntry {
  common_name: string
  name_value:  string
  not_after:   string
  not_before?: string
}

async function discoverViaCrtSh(limit: number): Promise<string[]> {
  const domains       = new Set<string>()
  const minMs         = SSL_MIN_DAYS  * 86_400_000
  const maxMs         = SSL_MAX_DAYS  * 86_400_000
  const recentCutoff  = Date.now() - RECENTLY_ISSUED_DAYS * 86_400_000

  for (const tld of TARGET_TLDS) {
    if (domains.size >= limit) break

    try {
      // Basic JSON query — crt.sh does not support exclude=expired in JSON mode
      // We filter in code below: not_after within our window
      const url = `https://crt.sh/?q=%.${tld}&output=json`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })
      clearTimeout(timer)

      if (!res.ok) {
        logger.warn('AOE discovery: crt.sh non-OK', { tld, status: res.status })
        continue
      }

      const entries = await res.json() as CrtShEntry[]
      const now = Date.now()

      for (const entry of entries) {
        if (domains.size >= limit) break

        // Filter: only recently-issued certs (eliminates historical records)
        if (entry.not_before) {
          const issuedAt = new Date(entry.not_before).getTime()
          if (issuedAt < recentCutoff) continue
        }

        // Filter: SSL expiring in our window (relevant for SSL campaign)
        const expiry       = new Date(entry.not_after).getTime()
        const msUntilExpiry = expiry - now
        if (msUntilExpiry < minMs || msUntilExpiry > maxMs) continue

        const rawName = entry.common_name || entry.name_value || ''
        const domain = rawName
          .replace(/^\*\./, '')
          .split('\n')[0]
          .trim()
          .toLowerCase()

        if (!domain || domain.includes(' ') || !domain.includes('.')) continue
        if (domain.startsWith('www.')) continue
        if (!TARGET_TLDS.some(t => domain.endsWith(`.${t}`))) continue

        domains.add(domain)
      }

      logger.info('AOE discovery: crt.sh tld processed', {
        tld,
        returned: entries.length,
        collected: domains.size,
      })
    } catch (err) {
      logger.error('AOE discovery: crt.sh query failed', { tld, error: String(err) })
    }
  }

  return [...domains]
}

// ---------------------------------------------------------------------------
// Source 2: Tranco — download CSV zip, parse with built-in zlib
// URL: https://tranco-list.eu/top-1m.csv.zip (confirmed returning 200)
// Format: rank,domain  (no header row)
// ZIP local file header → deflate-compressed → CSV
// ---------------------------------------------------------------------------


async function discoverViaTranco(limit: number): Promise<string[]> {
  try {
    logger.info('AOE discovery: downloading Tranco CSV zip')

    const res = await fetch('https://tranco-list.eu/top-1m.csv.zip', {
      headers: { 'Accept': '*/*' },
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      logger.warn('AOE discovery: Tranco download failed', { status: res.status })
      return []
    }

    const zipBuffer = Buffer.from(await res.arrayBuffer())
    logger.info('AOE discovery: Tranco zip downloaded', { sizeKb: Math.round(zipBuffer.length / 1024) })

    // Parse ZIP header
    if (zipBuffer.readUInt32LE(0) !== 0x04034b50) {
      logger.warn('AOE discovery: Tranco file is not a valid ZIP')
      return []
    }

    const compressionMethod = zipBuffer.readUInt16LE(8)
    let   compressedSize    = zipBuffer.readUInt32LE(18)
    const fileNameLength    = zipBuffer.readUInt16LE(26)
    const extraFieldLength  = zipBuffer.readUInt16LE(28)
    const dataOffset        = 30 + fileNameLength + extraFieldLength

    // Resolve compressedSize if 0 (stored in data descriptor)
    if (compressedSize === 0) {
      let eocd = zipBuffer.length - 22
      while (eocd > dataOffset && zipBuffer.readUInt32LE(eocd) !== 0x06054b50) eocd--
      const cdOffset = zipBuffer.readUInt32LE(eocd + 16)
      compressedSize = cdOffset - dataOffset
    }

    const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize)

    // Decompress
    let csvText: string

    if (compressionMethod === 0) {
      csvText = compressed.toString('utf8')
    } else if (compressionMethod === 8) {
      csvText = await new Promise<string>((resolve, reject) => {
        const inflate = createInflateRaw()
        const chunks: Buffer[] = []
        inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
        inflate.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')))
        inflate.on('error', reject)
        inflate.write(compressed)
        inflate.end()
      })
    } else {
      logger.warn('AOE discovery: unsupported ZIP compression', { method: compressionMethod })
      return []
    }

    // Parse CSV: "rank,domain" — no header
    const lines = csvText.split('\n')
    logger.info('AOE discovery: Tranco CSV parsed', { totalLines: lines.length })

    // Random window within rank 5001–50000 — avoids repeating same domains daily
    const windowSize  = TRANCO_RANK_END - TRANCO_RANK_START
    const maxStart    = Math.max(0, windowSize - limit * 4)
    const windowStart = TRANCO_RANK_START + Math.floor(Math.random() * maxStart)
    const slice       = lines.slice(windowStart, windowStart + limit * 4)

    return slice
      .map(line => line.split(',')[1]?.replace(/\r/g, '').trim().toLowerCase())
      .filter((d): d is string => Boolean(d) && d.includes('.'))
      .filter(d => TARGET_TLDS.some(t => d.endsWith(`.${t}`)))
      .slice(0, limit * 2) // 2x buffer so processBatch can cap at limit
  } catch (err) {
    logger.error('AOE discovery: Tranco failed', { error: String(err) })
    return []
  }
}

// ---------------------------------------------------------------------------
// Process a single domain — find email + platform, insert to discovery
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

async function processBatch(
  domains: string[],
  cap: number,
): Promise<{ added: number; skipped: number }> {
  let added = 0, skipped = 0

  for (let i = 0; i < domains.length && added < cap; i += CONCURRENCY) {
    const chunk   = domains.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(chunk.map(d => processDomain(d)))
    for (const r of results) {
      if (r.status === 'fulfilled') r.value ? added++ : skipped++
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
    if (!request.headers.get('x-vercel-cron')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId     = await startCronRun('/api/cron/aoe/site-discovery', getTriggeredBy(request))

  try {
    const settings = await getAoeSettings()

    if (!settings.master_enabled) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: master_disabled' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    const totalLimit  = settings.daily_discovery_limit ?? 50
    const crtLimit    = Math.ceil(totalLimit * 0.5)
    const trancoLimit = totalLimit - crtLimit

    logger.info('AOE site-discovery: starting', { totalLimit, crtLimit, trancoLimit })

    // ── Source 1: crt.sh ───────────────────────────────────────────────────
    const crtDomains = await discoverViaCrtSh(crtLimit * 2)
    logger.info('AOE discovery: crt.sh collected', { count: crtDomains.length })

    // ── Source 2: Tranco CSV zip ───────────────────────────────────────────
    const trancoDomains = await discoverViaTranco(trancoLimit)
    logger.info('AOE discovery: Tranco collected', { count: trancoDomains.length })

    // ── Process both in parallel ───────────────────────────────────────────
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

    const summary = `added: ${totalAdded} (crt: ${crtResult.added}, tranco: ${trancoResult.added}) | skipped existing: ${totalSkipped}`
    await endCronRun(runId, cronStart, 'ok', { summary })

    return NextResponse.json({
      ok:            true,
      totalAdded,
      totalSkipped,
      crtFetched:    crtDomains.length,
      crtAdded:      crtResult.added,
      trancoFetched: trancoDomains.length,
      trancoAdded:   trancoResult.added,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE site-discovery error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
