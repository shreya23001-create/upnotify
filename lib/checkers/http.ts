import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(monitor.target, {
      method: (config.method || 'GET').toUpperCase(),
      headers: config.headers || {},
      body: config.method === 'POST' ? config.body : undefined,
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start
    const expectedStatus = config.expectedStatus || 200

    if (response.status >= 500) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `Server error: ${response.status}` }
    }

    if (config.expectedStatus && response.status !== config.expectedStatus) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `Expected ${expectedStatus}, got ${response.status}` }
    }

    if (response.status >= 400) {
      return { status: 'degraded', responseTimeMs, statusCode: response.status, errorMessage: `Client error: ${response.status}` }
    }

    return { status: 'up', responseTimeMs, statusCode: response.status }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('abort')) {
      return { status: 'down', responseTimeMs, errorMessage: `Timeout after ${monitor.timeout_ms}ms` }
    }
    return { status: 'down', responseTimeMs, errorMessage: message }
  }
}
