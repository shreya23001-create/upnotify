import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { apexDomain } from './utils'

// Lightweight WHOIS-like check via DNS SOA record (registrar changes affect SOA)
export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = apexDomain(monitor.target)
  const start = Date.now()

  try {
    const [soaResult, nsResult] = await Promise.allSettled([
      dns.resolveSoa(domain),
      dns.resolveNs(domain),
    ])

    const responseTimeMs = Date.now() - start

    if (soaResult.status === 'rejected') {
      return { status: 'down', responseTimeMs, errorMessage: 'SOA lookup failed — domain may not be registered' }
    }

    const soa = soaResult.value
    const nsServers = nsResult.status === 'fulfilled' ? nsResult.value.sort() : []

    const currentSnapshot = JSON.stringify({ nsmaname: soa.nsname, hostmaster: soa.hostmaster, ns: nsServers })
    const previousSnapshot = (monitor.config as CheckerConfig)?.lastWhoisSnapshot
    const changed = previousSnapshot !== undefined && previousSnapshot !== currentSnapshot

    return {
      status: changed ? 'degraded' : 'up',
      responseTimeMs,
      metadata: { soa, nsServers, changed },
      configUpdates: { lastWhoisSnapshot: currentSnapshot },
      ...(changed && { errorMessage: 'WHOIS/registrar data has changed' }),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'WHOIS check failed',
    }
  }
}
