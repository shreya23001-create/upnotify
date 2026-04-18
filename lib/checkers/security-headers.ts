import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { isSafeUrl } from './ssrf-guard'
import { logger } from '@/lib/utils/logger'

export interface SecurityHeadersResult {
  hasHSTS: boolean
  hasCSP: boolean
  hasXFrameOptions: boolean
  hasXContentTypeOptions: boolean
  hasReferrerPolicy: boolean
  headers: Record<string, string>
  score: number
  fetchFailed?: boolean
  fetchError?: string
}

const HEADER_CHECKS: { header: string; key: keyof Omit<SecurityHeadersResult, 'headers' | 'score' | 'fetchFailed' | 'fetchError'> }[] = [
  { header: 'strict-transport-security', key: 'hasHSTS' },
  { header: 'content-security-policy', key: 'hasCSP' },
  { header: 'x-frame-options', key: 'hasXFrameOptions' },
  { header: 'x-content-type-options', key: 'hasXContentTypeOptions' },
  { header: 'referrer-policy', key: 'hasReferrerPolicy' },
]

const POINTS_PER_HEADER = 4

export async function checkSecurityHeaders(url: string, timeoutMs: number = 10000): Promise<SecurityHeadersResult> {
  const result: SecurityHeadersResult = {
    hasHSTS: false,
    hasCSP: false,
    hasXFrameOptions: false,
    hasXContentTypeOptions: false,
    hasReferrerPolicy: false,
    headers: {},
    score: 0,
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    let totalScore = 0

    for (const check of HEADER_CHECKS) {
      const value = response.headers.get(check.header)
      if (value) {
        result[check.key] = true
        result.headers[check.header] = value
        totalScore += POINTS_PER_HEADER
      }
    }

    result.score = totalScore
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.warn('Security headers fetch failed', { url, error: msg })
    result.fetchFailed = true
    result.fetchError = msg
  }

  return result
}

// Monitor checker interface — wraps checkSecurityHeaders for the dispatch registry
export async function check(monitor: Monitor): Promise<CheckerResult> {
  const url = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  if (!isSafeUrl(url)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const start = Date.now()

  try {
    const result = await checkSecurityHeaders(url, monitor.timeout_ms)
    const responseTimeMs = Date.now() - start

    // Fetch failed entirely — report the real error, not a misleading "no headers" message
    if (result.fetchFailed) {
      return { status: 'down', responseTimeMs, errorMessage: result.fetchError ?? 'Fetch failed' }
    }

    const missing = HEADER_CHECKS
      .filter(h => !result[h.key])
      .map(h => h.header)

    const metadata = {
      score: result.score,
      headers: result.headers,
      missing,
    }

    // Site reachable but no security headers at all — degraded, not down
    if (result.score === 0) {
      return { status: 'degraded', responseTimeMs, errorMessage: 'No security headers found', metadata }
    }
    if (missing.length > 0) {
      return { status: 'degraded', responseTimeMs, errorMessage: `Missing: ${missing.join(', ')}`, metadata }
    }
    return { status: 'up', responseTimeMs, metadata }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Security headers check failed',
    }
  }
}
