'use client'

import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { TimelineBarGraph } from '@/components/ui/timeline-bar-graph'
import type { Monitor } from '@/lib/types'

interface UptimeSlot { slot: string; timestamp: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  monitor: Monitor
  uptimeSlots: UptimeSlot[]
  uptimePercent: number
  range: string
}

const RANGE_LABELS: Record<string, string> = {
  '24h': '24 hours',
  '7d':  '7 days',
  '30d': '30 days',
  '90d': '90 days',
}

const PILL_CLASS: Record<string, string> = {
  up:       'sp-status-pill up',
  down:     'sp-status-pill down',
  degraded: 'sp-status-pill warn',
  paused:   'sp-status-pill paused',
}

const PILL_LABEL: Record<string, string> = {
  up:       'Up',
  down:     'Down',
  degraded: 'Degraded',
  paused:   'Paused',
}

const PCT_COLOR: Record<string, string> = {
  good: 'var(--color-up)',
  ok:   'var(--color-warn)',
  bad:  'var(--color-down)',
}

export function StatusMonitorRow({ monitor, uptimeSlots, uptimePercent, range }: Props): React.ReactElement {
  const status = monitor.status ?? 'up'
  const pillClass = PILL_CLASS[status] ?? 'sp-status-pill paused'
  const pillLabel = PILL_LABEL[status] ?? status

  const pctColor = uptimePercent >= 99.9 ? PCT_COLOR.good
    : uptimePercent >= 99 ? PCT_COLOR.ok
    : PCT_COLOR.bad

  const rangeLabel = RANGE_LABELS[range] ?? '30 days'
  const hasData = uptimeSlots.filter(s => s.status !== 'none').length >= 2

  return (
    <div className="sp-monitor-row">
      {/* Row 1: icon + name + status pill */}
      <div className="sp-monitor-row-top">
        <div className="sp-monitor-type-icon">
          <MonitorTypeIcon type={monitor.type} iconOnly />
        </div>
        <div className="sp-monitor-name">{monitor.name}</div>
        <div className="sp-monitor-row-pill">
          <div className={pillClass}>
            <svg width="7" height="7" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>
            {pillLabel}
          </div>
        </div>
      </div>

      {/* Row 2: uptime bars + percentage + range label */}
      <div className="sp-monitor-row-bottom">
        {!hasData ? (
          <div className="sp-monitor-collecting">Collecting data…</div>
        ) : (
          <>
            <div className="sp-uptime-bars">
              <TimelineBarGraph
                data={uptimeSlots.map(s => ({ timestamp: s.timestamp, status: s.status }))}
                height={20}
                showFooter={false}
              />
            </div>
            <span className="sp-uptime-pct" style={{ color: pctColor }}>{uptimePercent.toFixed(2)}%</span>
            <span className="sp-bars-range-label">{rangeLabel}</span>
          </>
        )}
      </div>
    </div>
  )
}
