import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const expectedInterval = (config.expectedIntervalSeconds || 300) * 1000

  if (!monitor.last_checked_at) {
    return { status: 'down', errorMessage: 'No heartbeat received yet' }
  }

  const lastPing = new Date(monitor.last_checked_at).getTime()
  const elapsed = Date.now() - lastPing
  const missedBy = elapsed - expectedInterval

  if (elapsed > expectedInterval * 2) {
    return {
      status: 'down',
      errorMessage: `No heartbeat for ${Math.floor(elapsed / 1000)}s (expected every ${config.expectedIntervalSeconds || 300}s)`,
    }
  }

  if (elapsed > expectedInterval) {
    return {
      status: 'degraded',
      errorMessage: `Heartbeat late by ${Math.floor(missedBy / 1000)}s`,
    }
  }

  return { status: 'up', metadata: { lastPingSecondsAgo: Math.floor(elapsed / 1000) } }
}
