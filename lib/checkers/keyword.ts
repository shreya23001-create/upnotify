import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const keyword = config.keyword || ''
  const shouldExist = config.shouldExist !== false
  const start = Date.now()

  if (!keyword) {
    return { status: 'down', errorMessage: 'No keyword configured' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(monitor.target, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return {
        status: 'down',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: `HTTP ${response.status}`,
      }
    }

    const body = await response.text()
    const found = body.includes(keyword)

    if (shouldExist && !found) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `Keyword "${keyword}" not found on page`,
      }
    }

    if (!shouldExist && found) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `Keyword "${keyword}" found on page (should not exist)`,
      }
    }

    return { status: 'up', responseTimeMs, metadata: { keywordFound: found } }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Failed to check keyword',
    }
  }
}
