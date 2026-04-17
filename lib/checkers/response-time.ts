import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { isSafeUrl } from './ssrf-guard'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const url = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  if (!isSafeUrl(url)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const config = monitor.config as CheckerConfig
  const thresholdMs = config.thresholdMs ?? 3000
  const degradedMs = config.degradedMs ?? Math.round(thresholdMs * 0.7)
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - start
    const metadata = { responseTimeMs, thresholdMs, degradedMs }

    if (!response.ok) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `HTTP ${response.status}`, metadata }
    }

    if (responseTimeMs > thresholdMs) {
      return {
        status: 'down',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: `Response time ${responseTimeMs}ms exceeds threshold ${thresholdMs}ms`,
        metadata,
      }
    }

    if (responseTimeMs > degradedMs) {
      return {
        status: 'degraded',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: `Response time ${responseTimeMs}ms is slow (threshold: ${thresholdMs}ms)`,
        metadata,
      }
    }

    return { status: 'up', responseTimeMs, statusCode: response.status, metadata }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Response time check failed',
    }
  }
}
