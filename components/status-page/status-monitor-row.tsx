'use client'

import type { Monitor } from '@/lib/types'

interface UptimeSlot { slot: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  monitor: Monitor
  uptimeSlots: UptimeSlot[]
  uptimePercent: number
  range: string
}

const RANGE_LABELS: Record<string, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
}

export function StatusMonitorRow({ monitor, uptimeSlots, uptimePercent, range }: Props): React.ReactElement {
  const status = monitor.status ?? 'up'
  const pillClass = status === 'up' ? 'sp-status-pill up'
    : status === 'down' ? 'sp-status-pill down'
    : status === 'degraded' ? 'sp-status-pill warn'
    : 'sp-status-pill paused'

  const pillLabel = status === 'up' ? 'Operational'
    : status === 'down' ? 'Down'
    : status === 'degraded' ? 'Degraded'
    : 'Paused'

  const pctColor = uptimePercent >= 99.9 ? 'var(--color-up)'
    : uptimePercent >= 99 ? 'var(--color-warn)'
    : 'var(--color-down)'

  const rangeLabel = RANGE_LABELS[range] ?? '30 days'
  const hasData = uptimeSlots.filter(s => s.status !== 'none').length >= 2

  return (
    <div className="sp-monitor-row">
      <div className="sp-monitor-info">
        <div className="sp-monitor-name">{monitor.name}</div>
        <div className="sp-monitor-url">{monitor.target}</div>
      </div>

      <div className="sp-bars-wrap">
        {!hasData ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Collecting data…</div>
        ) : (
          <>
            <div className="sp-bars-range-label">{rangeLabel}</div>
            <div className="sp-uptime-bars">
              {uptimeSlots.map((slot, i) => {
                const tickClass = slot.status === 'up' ? 'sp-uptime-tick ok'
                  : slot.status === 'down' ? 'sp-uptime-tick down-t'
                  : slot.status === 'degraded' ? 'sp-uptime-tick warn-t'
                  : 'sp-uptime-tick none'
                return <div key={i} className={tickClass} title={`${slot.slot}: ${slot.status}`} />
              })}
            </div>
          </>
        )}
      </div>

      <div className="sp-monitor-right">
        <span className="sp-uptime-pct" style={{ color: pctColor }}>{uptimePercent.toFixed(2)}%</span>
        <div className={pillClass}>
          <svg width="7" height="7" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>
          {pillLabel}
        </div>
      </div>
    </div>
  )
}
