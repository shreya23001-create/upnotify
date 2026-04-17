import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = monitor.target.replace(/^https?:\/\//, '').split('/')[0]
  const start = Date.now()

  try {
    const nsRecords = await dns.resolveNs(domain)
    const responseTimeMs = Date.now() - start
    const currentNs = nsRecords.sort()

    const previousNs = (monitor.config as CheckerConfig)?.lastNameservers
    const changed = previousNs !== undefined && JSON.stringify(previousNs) !== JSON.stringify(currentNs)

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { currentNs, previousNs: previousNs ?? null, changed },
      ...(changed && { errorMessage: `Nameservers changed from [${previousNs?.join(', ')}] to [${currentNs.join(', ')}]` }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Nameserver check failed',
    }
  }
}
