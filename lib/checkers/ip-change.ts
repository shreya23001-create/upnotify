import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const hostname = monitor.target.replace(/^https?:\/\//, '').split('/')[0]
  const start = Date.now()

  try {
    const addresses = await dns.resolve4(hostname)
    const responseTimeMs = Date.now() - start
    const currentIp = addresses[0]

    const previousIp = (monitor.config as CheckerConfig)?.lastIp
    const changed = previousIp !== undefined && previousIp !== currentIp

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { currentIp, previousIp: previousIp ?? null, allAddresses: addresses, changed },
      configUpdates: { lastIp: currentIp },
      ...(changed && { errorMessage: `IP changed from ${previousIp} to ${currentIp}` }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'IP lookup failed',
    }
  }
}
