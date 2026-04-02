/**
 * Security headers checker for Uptrue Score.
 * Performs a single HTTP GET and evaluates security-related response headers.
 */

import { logger } from '@/lib/utils/logger'

export interface SecurityHeadersResult {
  hasHSTS: boolean
  hasCSP: boolean
  hasXFrameOptions: boolean
  hasXContentTypeOptions: boolean
  hasReferrerPolicy: boolean
  headers: Record<string, string>
  score: number
}

const HEADER_CHECKS: { header: string; key: keyof Omit<SecurityHeadersResult, 'headers' | 'score'> }[] = [
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
    logger.warn('Security headers check failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return result
}
