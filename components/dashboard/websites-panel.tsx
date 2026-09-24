'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { Sparkline } from '@/components/ui/sparkline'
import {
  aggregateDomainGroup, sortByWorstStatus, timeAgoShort,
  STATUS_LABEL, STATUS_DOT_COLOR, STATUS_BADGE_CLASS,
  type CheckResultLite, type DomainAggregate,
} from '@/lib/utils/monitor-aggregation'
import { targetToWebsiteDomain } from '@/lib/utils/validate-domain'
import type { Monitor } from '@/lib/types'

type CheckResult = CheckResultLite

function groupByDomain(monitors: Monitor[], checkResults: CheckResult[]): DomainAggregate[] {
  const map: Record<string, Monitor[]> = {}
  for (const m of monitors) {
    const d = targetToWebsiteDomain(m.target) || m.name || m.target
    if (!map[d]) map[d] = []
    map[d].push(m)
  }

  return sortByWorstStatus(
    Object.entries(map).map(([domain, mons]) => aggregateDomainGroup(domain, mons, checkResults))
  )
}

const timeAgo = timeAgoShort

function truncateWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= wordCount) return text
  return `${words.slice(0, wordCount).join(' ')}...`
}

const MAX_WEBSITES_SHOWN = 5

export function WebsitesPanel({ monitors, checkResults }: { monitors: Monitor[]; checkResults: CheckResult[] }): React.ReactElement {
  const groups = useMemo(() => groupByDomain(monitors, checkResults).slice(0, MAX_WEBSITES_SHOWN), [monitors, checkResults])

  return (
    <div className="db-card websites-panel">
      <div className="db-card-header">
        <div className="db-card-title">Websites</div>
        <div className="db-card-actions">
          <Link href="/dashboard/monitors/new/manual" className="btn btn-primary btn-sm">
            <Plus size={13} strokeWidth={2.5} />
            Add Monitor
          </Link>
          <Link href="/dashboard/monitors" className="btn btn-ghost btn-sm websites-panel-viewall">
            View all monitors <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="websites-panel-empty">
          <p>No websites yet. Add your first monitor to start tracking uptime.</p>
          <Link href="/dashboard/monitors/new/manual" className="btn btn-primary btn-sm">+ Add Your First Monitor</Link>
        </div>
      ) : (
        <div className="websites-panel-list">
          {groups.map(g => (
            <Link
              key={g.domain}
              href={`/dashboard/monitors?search=${encodeURIComponent(g.domain)}`}
              className={`websites-row${g.status === 'down' ? ' websites-row--down' : ''}`}
            >
              <span className="websites-row-dot" style={{ background: STATUS_DOT_COLOR[g.status] }} />

              <span className="websites-row-name">{g.domain}</span>

              <span className="websites-row-monitor-name">
                {g.monitors[0] ? truncateWords(g.monitors[0].name, 6) : '—'}
              </span>

              <span className="websites-row-metric">
                {g.uptimePct !== null ? `${g.uptimePct.toFixed(1)}%` : '—'}
              </span>

              <span className="websites-row-metric websites-row-metric-muted">
                {g.avgResponseMs !== null ? `${g.avgResponseMs}ms` : '—'}
              </span>

              <span className="websites-row-sparkline">
                {g.trend.length >= 2 && (
                  <Sparkline values={g.trend} color={STATUS_DOT_COLOR[g.status]} />
                )}
              </span>

              <span className="websites-row-count">{g.monitors.length} monitor{g.monitors.length === 1 ? '' : 's'}</span>

              <span className="websites-row-meta">
                <span className={`db-badge ${STATUS_BADGE_CLASS[g.status]} websites-row-status`}>
                  {STATUS_LABEL[g.status]}
                </span>
                <span className="websites-row-time">{timeAgo(g.lastCheckedAt)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
