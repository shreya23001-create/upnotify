import * as crypto from 'crypto'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const start = Date.now()

  try {
    const response = await fetch(monitor.target, {
      signal: AbortSignal.timeout(monitor.timeout_ms),
      redirect: 'follow',
    })

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
    const contentHash = crypto.createHash('sha256').update(body).digest('hex')
    const previousHash = (monitor.config as Record<string, unknown>)?.lastContentHash as
      | string
      | undefined
    const changed = previousHash !== undefined && previousHash !== contentHash

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { contentHash, previousHash: previousHash || null, changed },
      ...(changed && { errorMessage: 'Page content has changed' }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch page',
    }
  }
}
