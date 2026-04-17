import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = monitor.target.replace(/^https?:\/\//, '').split('/')[0]
  const start = Date.now()

  try {
    const mxRecords = await dns.resolveMx(domain)
    const responseTimeMs = Date.now() - start

    if (mxRecords.length === 0) {
      return { status: 'down', responseTimeMs, errorMessage: 'No MX records found for domain' }
    }

    // Sort by priority and check the highest priority MX resolves
    const sorted = mxRecords.sort((a, b) => a.priority - b.priority)
    const primaryMx = sorted[0].exchange

    try {
      await dns.resolve4(primaryMx)
    } catch {
      return {
        status: 'degraded',
        responseTimeMs: Date.now() - start,
        errorMessage: `Primary MX host ${primaryMx} does not resolve`,
        metadata: { mxRecords: sorted },
      }
    }

    return {
      status: 'up',
      responseTimeMs,
      metadata: { mxRecords: sorted, primaryMx },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'MX health check failed',
    }
  }
}
