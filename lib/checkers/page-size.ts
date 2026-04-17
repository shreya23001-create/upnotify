import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { isSafeUrl } from './ssrf-guard'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const url = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  if (!isSafeUrl(url)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const config = monitor.config as CheckerConfig
  const maxSizeKb = config.maxSizeKb ?? 5000
  const warnSizeKb = config.warnSizeKb ?? Math.round(maxSizeKb * 0.8)
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `HTTP ${response.status}` }
    }

    const body = await response.arrayBuffer()
    const sizeKb = Math.round(body.byteLength / 1024)
    const metadata = { sizeKb, maxSizeKb, warnSizeKb }

    if (sizeKb > maxSizeKb) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `Page size ${sizeKb}KB exceeds limit ${maxSizeKb}KB`,
        metadata,
      }
    }

    if (sizeKb > warnSizeKb) {
      return {
        status: 'degraded',
        responseTimeMs,
        errorMessage: `Page size ${sizeKb}KB is large (limit: ${maxSizeKb}KB)`,
        metadata,
      }
    }

    return { status: 'up', responseTimeMs, metadata }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Page size check failed',
    }
  }
}
