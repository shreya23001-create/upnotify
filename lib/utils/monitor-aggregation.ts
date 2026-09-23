import type { Monitor } from '@/lib/types'

export interface CheckResultLite { status: string; response_time_ms?: number | null; checked_at: string; monitor_id: string }

export const STATUS_ORDER = ['down', 'degraded', 'paused', 'up', 'unknown'] as const
export type AggStatus = typeof STATUS_ORDER[number]

// Only these types being 'down' means the site is truly unreachable.
export const AVAILABILITY_TYPES = new Set(['http', 'ping', 'ssl', 'heartbeat', 'api', 'port'])

export function worstStatus(monitors: Monitor[]): AggStatus {
  const active = monitors.filter(m => !m.is_paused)
  if (active.some(m => m.status === 'down' && AVAILABILITY_TYPES.has(m.type))) return 'down'
  if (active.some(m => m.status === 'down' || m.status === 'degraded')) return 'degraded'
  if (monitors.some(m => m.is_paused)) return 'paused'
  if (active.some(m => m.status === 'up')) return 'up'
  return 'unknown'
}

export interface DomainAggregate {
  domain: string
  monitors: Monitor[]
  status: AggStatus
  uptimePct: number | null
  avgResponseMs: number | null
  trend: number[]
  lastCheckedAt: string | null
}

/** Aggregates already-domain-grouped monitors (e.g. from getMonitorsGroupedByWebsite,
 *  keyed by target_domain) with their check-result history. */
export function aggregateDomainGroup(domain: string, monitors: Monitor[], checkResults: CheckResultLite[]): DomainAggregate {
  const monitorIds = new Set(monitors.map(m => m.id))
  const results = checkResults
    .filter(r => monitorIds.has(r.monitor_id))
    .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())

  const upCount = results.filter(r => r.status === 'up').length
  const uptimePct = results.length > 0 ? (upCount / results.length) * 100 : null

  const withTiming = results.filter((r): r is CheckResultLite & { response_time_ms: number } => typeof r.response_time_ms === 'number')
  const avgResponseMs = withTiming.length > 0
    ? Math.round(withTiming.reduce((sum, r) => sum + r.response_time_ms, 0) / withTiming.length)
    : null

  const trend = withTiming.slice(-12).map(r => r.response_time_ms)

  const lastCheckedAt = monitors.reduce<string | null>((latest, m) => {
    if (!m.last_checked_at) return latest
    if (!latest || new Date(m.last_checked_at) > new Date(latest)) return m.last_checked_at
    return latest
  }, null)

  return { domain, monitors, status: worstStatus(monitors), uptimePct, avgResponseMs, trend, lastCheckedAt }
}

export function sortByWorstStatus(groups: DomainAggregate[]): DomainAggregate[] {
  return [...groups].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
}

export const STATUS_LABEL: Record<AggStatus, string> = {
  down: 'Down', degraded: 'Degraded', paused: 'Paused', up: 'Operational', unknown: 'Unknown',
}
export const STATUS_DOT_COLOR: Record<AggStatus, string> = {
  down: 'var(--color-down)', degraded: 'var(--color-warn)', paused: 'var(--text-muted)', up: 'var(--color-up)', unknown: 'var(--text-muted)',
}
export const STATUS_BADGE_CLASS: Record<AggStatus, string> = {
  down: 'db-badge-down', degraded: 'db-badge-warn', paused: 'db-badge-outline', up: 'db-badge-up', unknown: 'db-badge-outline',
}

export function timeAgoShort(dateStr: string | null): string {
  if (!dateStr) return 'Never checked'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
