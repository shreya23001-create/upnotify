// =============================================================================
// AOE — Automated Outreach Engine
// Cron: site-discovery — runs weekly (Sunday 2am UTC)
// Source: Tranco top-1M CSV zip — random window from rank 5001–50000
// crt.sh was dropped — consistently times out and only returns historical certs
// SSL expiry is still detected per-domain by the outreach-checker cron
// Categorisation happens in outreach-checker — not here.
// =============================================================================

import { createInflateRaw } from 'zlib'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { getAoeSettings } from '@/lib/aoe/db/aoe-settings'
import { insertDiscoveredSite, domainExists } from '@/lib/aoe/db/aoe-site-discovery'
import { findContactEmail } from '@/lib/aoe/services/email-finder'
import { detectPlatform } from '@/lib/aoe/services/platform-detector'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONCURRENCY     = 5
const REQUEST_TIMEOUT = 8000

// Tranco rank window — ranks 100K–500K are actual SMBs
// Top 50K contains major brands (national-lottery.co.uk, take2games.com etc)
const TRANCO_RANK_START = 100_000
const TRANCO_RANK_END   = 500_000

// TLDs most likely to be SMB targets
const TARGET_TLDS = ['co.uk', 'org.uk', 'com.au', 'co.nz', 'ie', 'ca', 'com']

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
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId     = await startCronRun('/api/cron/aoe/site-discovery', getTriggeredBy(request))

  try {
    const settings = await getAoeSettings()

    if (!settings.master_enabled) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: master_disabled' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'master_disabled' })
    }

    const totalLimit = settings.daily_discovery_limit ?? 50

    logger.info('AOE site-discovery: starting', { totalLimit, source: 'tranco' })

    // ── Tranco CSV zip — full quota ────────────────────────────────────────
    const trancoDomains = await discoverViaTranco(totalLimit)
    logger.info('AOE discovery: Tranco collected', { count: trancoDomains.length })

    // ── Process ────────────────────────────────────────────────────────────
    const result = await processBatch(trancoDomains, totalLimit)

    logger.info('AOE site-discovery completed', {
      trancoFetched: trancoDomains.length,
      added:         result.added,
      skipped:       result.skipped,
    })

    const summary = `added: ${result.added} | skipped existing: ${result.skipped}`
    await endCronRun(runId, cronStart, 'ok', { summary })

    return NextResponse.json({
      ok:            true,
      totalAdded:    result.added,
      totalSkipped:  result.skipped,
      trancoFetched: trancoDomains.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AOE site-discovery error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
