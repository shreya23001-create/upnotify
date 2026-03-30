import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const domain = monitor.target.replace(/^https?:\/\//, '').split('/')[0]
  const start = Date.now()

  try {
    // Use rdap.org (free, no API key) for domain registration info
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(monitor.timeout_ms),
    })

    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `RDAP lookup failed: ${response.status}`,
      }
    }

    const data = (await response.json()) as Record<string, unknown>
    const events =
      (data.events as Array<{ eventAction: string; eventDate: string }>) || []
    const expirationEvent = events.find((e) => e.eventAction === 'expiration')

    if (!expirationEvent) {
      return {
        status: 'up',
        responseTimeMs,
        metadata: { domain, expiryDate: null },
        errorMessage: 'No expiry date found',
      }
    }

    const expiryDate = new Date(expirationEvent.eventDate)
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const metadata = {
      domain,
      expiryDate: expirationEvent.eventDate,
      daysUntilExpiry,
    }

    if (daysUntilExpiry < 7) {
      return {
        status: 'down',
        responseTimeMs,
        errorMessage: `Domain expires in ${daysUntilExpiry} days`,
        metadata,
      }
    } else if (daysUntilExpiry < 30) {
      return {
        status: 'degraded',
        responseTimeMs,
        errorMessage: `Domain expires in ${daysUntilExpiry} days`,
        metadata,
      }
    }

    return { status: 'up', responseTimeMs, metadata }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Domain check failed',
    }
  }
}
