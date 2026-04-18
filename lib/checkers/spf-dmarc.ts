import * as dns from 'dns/promises'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { apexDomain } from './utils'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = apexDomain(monitor.target)
  const start = Date.now()

  const issues: string[] = []

  try {
    const [txtResult, dmarcResult] = await Promise.allSettled([
      dns.resolveTxt(domain),
      dns.resolveTxt(`_dmarc.${domain}`),
    ])

    const responseTimeMs = Date.now() - start

    // Check SPF
    const txtRecords = txtResult.status === 'fulfilled' ? txtResult.value.flat() : []
    const spfRecord = txtRecords.find(r => r.startsWith('v=spf1'))

    if (!spfRecord) {
      issues.push('No SPF record found')
    } else if (!spfRecord.includes('~all') && !spfRecord.includes('-all') && !spfRecord.includes('?all')) {
      issues.push('SPF record has no all mechanism')
    }

    // Check DMARC
    const dmarcRecords = dmarcResult.status === 'fulfilled' ? dmarcResult.value.flat() : []
    const dmarcRecord = dmarcRecords.find(r => r.startsWith('v=DMARC1'))

    if (!dmarcRecord) {
      issues.push('No DMARC record found')
    } else if (dmarcRecord.includes('p=none')) {
      issues.push('DMARC policy is p=none (monitoring only, no enforcement)')
    }

    const metadata = { spfRecord: spfRecord ?? null, dmarcRecord: dmarcRecord ?? null, issues }

    // Missing records = security gap (degraded), not an outage (down)
    if (issues.length > 0) {
      return { status: 'degraded', responseTimeMs, errorMessage: issues.join('; '), metadata }
    }

    return { status: 'up', responseTimeMs, metadata }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'SPF/DMARC check failed',
    }
  }
}
