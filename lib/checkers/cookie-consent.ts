import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { isSafeUrl } from './ssrf-guard'

// Common cookie consent patterns found in HTML/scripts
const CONSENT_PATTERNS = [
  /cookieyes/i,
  /cookie-?consent/i,
  /cookiepro/i,
  /onetrust/i,
  /trustarc/i,
  /cookiebot/i,
  /gdpr/i,
  /cookie-?law/i,
  /consentmanager/i,
  /usercentrics/i,
]

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const url = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  if (!isSafeUrl(url)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Uptrue/1.0 Monitoring' },
    })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const matched = CONSENT_PATTERNS.find(p => p.test(html))

    if (!matched) {
      return {
        status: 'degraded',
        responseTimeMs,
        errorMessage: 'No cookie consent mechanism detected',
        metadata: { consentFound: false },
      }
    }

    return {
      status: 'up',
      responseTimeMs,
      metadata: { consentFound: true, pattern: matched.source },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Cookie consent check failed',
    }
  }
}
