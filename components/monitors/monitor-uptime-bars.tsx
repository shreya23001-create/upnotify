'use client'

interface UptimeSlot { slot: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  slots: UptimeSlot[]
  uptimePercent: number
  rangeLabel?: string
}

export function MonitorUptimeBars({ slots, uptimePercent, rangeLabel = '30 days' }: Props): React.ReactElement {
  const pctColor = uptimePercent >= 99.9 ? '#10b981' : uptimePercent >= 99 ? '#f59e0b' : '#ef4444'

  return (
    <div className="uptime-bar-section">
      <div className="uptime-bar-section-header">
        <span className="uptime-bar-section-title">Uptime History · {rangeLabel}</span>
        <span className="uptime-bar-pct" style={{ color: pctColor }}>{uptimePercent.toFixed(2)}% uptime</span>
      </div>

      <div className="uptime-bar-grid">
        {slots.map((slot, i) => {
          const cls = slot.status === 'up' ? 'uptime-bar-cell uptime-bar-cell-up'
            : slot.status === 'down' ? 'uptime-bar-cell uptime-bar-cell-down'
            : slot.status === 'degraded' ? 'uptime-bar-cell uptime-bar-cell-degraded'
            : 'uptime-bar-cell uptime-bar-cell-none'
          const label = slot.status === 'up' ? 'Operational'
            : slot.status === 'down' ? 'Down'
            : slot.status === 'degraded' ? 'Degraded'
            : 'No data'
          return <div key={i} className={cls} title={`${slot.slot}: ${label}`} />
        })}
      </div>

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
