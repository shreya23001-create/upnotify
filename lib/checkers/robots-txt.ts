import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { isSafeUrl } from './ssrf-guard'
import * as crypto from 'crypto'

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

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { hash, changed, length: text.length },
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
