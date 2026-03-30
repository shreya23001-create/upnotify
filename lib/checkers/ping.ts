import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const target = monitor.target.startsWith('http')
    ? monitor.target
    : `https://${monitor.target}`
  const start = Date.now()

  try {
    const response = await fetch(target, {
      method: 'HEAD',
      signal: AbortSignal.timeout(monitor.timeout_ms),
      redirect: 'follow',
    })

    const responseTimeMs = Date.now() - start
    return {
      status: response.ok ? 'up' : 'down',
      responseTimeMs,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Host unreachable',
    }
  }
}
