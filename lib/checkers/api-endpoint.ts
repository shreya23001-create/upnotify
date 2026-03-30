import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const start = Date.now()

  try {
    const response = await fetch(monitor.target, {
      method: (config.method || 'GET').toUpperCase(),
      headers: config.headers || {},
      body: config.body || undefined,
      signal: AbortSignal.timeout(monitor.timeout_ms),
    })

    const responseTimeMs = Date.now() - start
    const body = await response.text()
    const failures: string[] = []

    for (const assertion of config.assertions || []) {
      if (assertion.type === 'status' && response.status !== parseInt(assertion.value, 10)) {
        failures.push(`Expected status ${assertion.value}, got ${response.status}`)
      }
      if (assertion.type === 'body_contains' && !body.includes(assertion.value)) {
        failures.push(`Body does not contain "${assertion.value}"`)
      }
      if (assertion.type === 'response_time' && responseTimeMs > parseInt(assertion.value, 10)) {
        failures.push(`Response time ${responseTimeMs}ms exceeds ${assertion.value}ms`)
      }
    }

    if (failures.length > 0) {
      return {
        status: 'down',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: failures.join('; '),
        metadata: { failures },
      }
    }

    return { status: 'up', responseTimeMs, statusCode: response.status }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'API check failed',
    }
  }
}
