import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { isSafeUrl } from './ssrf-guard'
import * as crypto from 'crypto'

/**
 * Parse robots.txt blocks and return true if Googlebot (or all crawlers via *)
 * is blocked from crawling all content (Disallow: /).
 */
function isGooglebotBlocked(content: string): boolean {
  const lines = content.split('\n').map(l => l.replace(/#.*$/, '').trim())
  let inGooglebotBlock = false
  let inWildcardBlock = false
  let wildcardDisallowsAll = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim().toLowerCase()
      if (agent === 'googlebot') {
        // If we find Googlebot block with Disallow: / immediately, return true
        inGooglebotBlock = true
        inWildcardBlock = false
      } else if (agent === '*') {
        inWildcardBlock = true
        inGooglebotBlock = false
      } else {
        inGooglebotBlock = false
        inWildcardBlock = false
      }
    } else if (lower.startsWith('disallow:')) {
      const path = line.slice('disallow:'.length).trim()
      if (path === '/') {
        if (inGooglebotBlock) return true  // explicit Googlebot block
        if (inWildcardBlock) wildcardDisallowsAll = true
      }
    } else if (line === '') {
      inGooglebotBlock = false
      inWildcardBlock = false
    }
  }
  return wildcardDisallowsAll
}

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const base = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  const robotsUrl = new URL('/robots.txt', base).toString()
  if (!isSafeUrl(robotsUrl)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(robotsUrl, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return { status: 'degraded', responseTimeMs, statusCode: response.status, errorMessage: `robots.txt returned HTTP ${response.status}` }
    }

    const text = await response.text()
    const hash = crypto.createHash('sha256').update(text).digest('hex')

    const previousHash = (monitor.config as CheckerConfig)?.lastRobotsHash
    const changed = previousHash !== undefined && previousHash !== hash

    // Critical: Googlebot blocked = DOWN, escalated to P1 regardless of the
    // monitor's configured severity. A "Disallow: /" can wipe a site from
    // Google within days — it is always a P1 event (KB: product/roadmap +
    // issue #150 "P1 alert if Googlebot is blocked").
    if (isGooglebotBlocked(text)) {
      return {
        status: 'down',
        responseTimeMs,
        severityOverride: 'P1',
        metadata: { hash, changed, length: text.length, googlebotBlocked: true },
        configUpdates: { lastRobotsHash: hash },
        errorMessage: 'robots.txt is blocking Googlebot (Disallow: /) — SEO critical',
      }
    }

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { hash, changed, length: text.length, googlebotBlocked: false },
      configUpdates: { lastRobotsHash: hash },
      ...(changed && { errorMessage: 'robots.txt content has changed' }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'robots.txt check failed',
    }
  }
}
