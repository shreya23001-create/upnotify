import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const hostname = monitor.target.replace(/^https?:\/\//, '').split('/')[0]
  const start = Date.now()

  try {
    const [aRecords, mxRecords, nsRecords, txtRecords] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolveMx(hostname),
      dns.resolveNs(hostname),
      dns.resolveTxt(hostname),
    ])

    const responseTimeMs = Date.now() - start
    const records = {
      A: aRecords.status === 'fulfilled' ? aRecords.value : [],
      MX:
        mxRecords.status === 'fulfilled'
          ? mxRecords.value.map((r) => r.exchange)
          : [],
      NS: nsRecords.status === 'fulfilled' ? nsRecords.value : [],
      TXT: txtRecords.status === 'fulfilled' ? txtRecords.value.flat() : [],
    }

    const previousRecords = (monitor.config as Record<string, unknown>)
      ?.lastDnsRecords as Record<string, unknown> | undefined
    const currentHash = JSON.stringify(records)
    const previousHash = previousRecords ? JSON.stringify(previousRecords) : null
    const changed = previousHash !== null && previousHash !== currentHash

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { records, changed },
      ...(changed && { errorMessage: 'DNS records have changed' }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'DNS lookup failed',
    }
  }
}
