'use client'

import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { UptimeBar } from '@/components/monitors/uptime-bar'
import type { Monitor } from '@/lib/types'

interface UptimeSlot { slot: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface Props {
  monitor: Monitor
  uptimeSlots: UptimeSlot[]
  uptimePercent: number
}

export function StatusMonitorRow({ monitor, uptimeSlots, uptimePercent }: Props): React.ReactElement {
  const statusClass = monitor.status === 'up' ? 'status-dot-up'
    : monitor.status === 'down' ? 'status-dot-down'
    : monitor.status === 'degraded' ? 'status-dot-degraded'
    : 'status-dot-paused'

  return (
    <div className="status-monitor-row">
      <div className="status-monitor-info">
        <span className={`status-dot ${statusClass}`} />
        <MonitorTypeIcon type={monitor.type} />
        <span className="status-monitor-name">{monitor.name}</span>
      </div>
      <div className="status-monitor-uptime">
        <UptimeBar slots={uptimeSlots} />
        <span className={`status-monitor-percent ${uptimePercent >= 99.9 ? 'percent-good' : uptimePercent >= 99 ? 'percent-ok' : 'percent-bad'}`}>
          {uptimePercent}%
        </span>
      </div>
    </div>
  )
}
