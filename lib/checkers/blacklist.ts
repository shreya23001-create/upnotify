import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { apexDomain } from './utils'

// Common DNS-based block lists
const DNSBL_ZONES = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'b.barracudacentral.org',
]

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = apexDomain(monitor.target)
  const start = Date.now()

  try {
    // Resolve domain IP for reverse lookup
    const addresses = await dns.resolve4(domain)
    const ip = addresses[0]
    const reversed = ip.split('.').reverse().join('.')

    const results = await Promise.allSettled(
      DNSBL_ZONES.map(zone => dns.resolve4(`${reversed}.${zone}`))
    )

    const responseTimeMs = Date.now() - start
    const listed: string[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        listed.push(DNSBL_ZONES[i])
      }
    })

    if (listed.length > 0) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `IP ${ip} is listed on: ${listed.join(', ')}`,
        metadata: { ip, listed, checked: DNSBL_ZONES },
      }
    }

    return {
      status: 'up',
      responseTimeMs,
      metadata: { ip, listed: [], checked: DNSBL_ZONES },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Blacklist check failed',
    }
  }
}
