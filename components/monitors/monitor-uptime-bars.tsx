'use client'

import { TimelineBarGraph } from '@/components/ui/timeline-bar-graph'

interface UptimeSlot { slot: string; timestamp: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  slots: UptimeSlot[]
  uptimePercent: number
  rangeLabel?: string
}

export function MonitorUptimeBars({ slots, uptimePercent, rangeLabel = '30 days' }: Props): React.ReactElement {
  const pctColor = uptimePercent >= 99.9 ? '#10b981' : uptimePercent >= 99 ? '#f59e0b' : '#ef4444'
  const hasData = slots.filter(s => s.status !== 'none').length >= 2

  return (
    <div className="uptime-bar-section">
      <div className="uptime-bar-section-header">
        <span className="uptime-bar-section-title">Uptime History · {rangeLabel}</span>
        <span className="uptime-bar-pct" style={{ color: pctColor }}>{uptimePercent.toFixed(2)}% uptime</span>
      </div>

      {!hasData ? (
        <div className="uptime-bar-collecting">
          Collecting data — the first check will run shortly.
        </div>
      ) : (
        <div className="uptime-bar-graph-wrap">
          <TimelineBarGraph
            data={slots.map(s => ({ timestamp: s.timestamp, status: s.status }))}
            maxBars={slots.length}
            height={32}
            showFooter={false}
          />
        </div>
      )}

      <div className="uptime-bar-footer">
        <span>{rangeLabel} ago</span>
        <span>Today</span>
      </div>

      <div className="uptime-bar-legend">
        <div className="uptime-bar-legend-item">
          <div className="uptime-bar-legend-block" style={{ background: '#10b981' }} />
          Operational
        </div>
        <div className="uptime-bar-legend-item">
          <div className="uptime-bar-legend-block" style={{ background: '#f59e0b' }} />
          Degraded
        </div>
        <div className="uptime-bar-legend-item">
          <div className="uptime-bar-legend-block" style={{ background: '#ef4444' }} />
          Down
        </div>
        <div className="uptime-bar-legend-item">
          <div className="uptime-bar-legend-block" style={{ background: 'var(--border-primary)' }} />
          No data
        </div>
      </div>
    </div>
  )
}
