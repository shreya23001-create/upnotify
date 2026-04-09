'use client'

import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import type { Monitor } from '@/lib/types'

interface UptimeSlot { slot: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  monitor: Monitor
  uptimeSlots: UptimeSlot[]
  uptimePercent: number
}

const STATUS_LABELS: Record<string, string> = {
  up: 'Operational',
  down: 'Down',
  degraded: 'Degraded',
  paused: 'Paused',
}

export function StatusMonitorRow({ monitor, uptimeSlots, uptimePercent }: Props): React.ReactElement {
  const status = monitor.status ?? 'up'
  const pillClass = status === 'up' ? 'status-pill status-pill-up'
    : status === 'down' ? 'status-pill status-pill-down'
    : status === 'degraded' ? 'status-pill status-pill-degraded'
    : 'status-pill status-pill-paused'

  const pctClass = uptimePercent >= 99.9 ? 'status-monitor-percent percent-good'
    : uptimePercent >= 99 ? 'status-monitor-percent percent-ok'
    : 'status-monitor-percent percent-bad'

  return (
    <div className="status-monitor-row">
      {/* Left — name + URL */}
      <div className="status-monitor-info">
        <MonitorTypeIcon type={monitor.type} />
        <div style={{ minWidth: 0 }}>
          <div className="status-monitor-name">{monitor.name}</div>
          <div className="status-monitor-url-txt">{monitor.target}</div>
        </div>
      </div>

      {/* Middle — uptime bars */}
      <div className="status-monitor-uptime">
        {/* Show "Insufficient data" when fewer than 2 days have real check data */}
        {uptimeSlots.filter(s => s.status !== 'none').length < 2 ? (
          <div className="status-uptime-insufficient">Collecting data…</div>
        ) : (
          <div className="status-monitor-uptime-bar">
            {uptimeSlots.map((slot, i) => {
              const tickClass = slot.status === 'up' ? 'status-uptime-tick status-uptime-tick-up'
                : slot.status === 'down' ? 'status-uptime-tick status-uptime-tick-down'
                : slot.status === 'degraded' ? 'status-uptime-tick status-uptime-tick-degraded'
                : 'status-uptime-tick status-uptime-tick-none'
              return <div key={i} className={tickClass} title={`${slot.slot}: ${slot.status}`} />
            })}
          </div>
        )}
      </div>

      {/* Right — percentage + status pill */}
      <div className="status-monitor-right">
        <span className={pctClass}>{uptimePercent.toFixed(2)}%</span>
        <span className={pillClass}>{STATUS_LABELS[status] ?? status}</span>
      </div>
    </div>
  )
}
