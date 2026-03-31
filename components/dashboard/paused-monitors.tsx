'use client'

import Link from 'next/link'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import type { Monitor } from '@/lib/types'

export function PausedMonitors({ monitors }: { monitors: Monitor[] }) {
  return (
    <div className="card stat-card stat-card-yellow">
      <div className="card-header">
        <div className="card-header-row">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot status-dot-paused" />
            Paused Monitors ({monitors.length})
          </div>
          <Link href="/dashboard/monitors" className="btn btn-sm btn-ghost">View All</Link>
        </div>
      </div>
      <div className="card-content">
        <div className="space-y-sm">
          {monitors.map(m => (
            <Link
              key={m.id}
              href={`/dashboard/monitors/${m.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, transition: 'background 0.15s' }}
              className="checklist-item"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MonitorTypeIcon type={m.type} />
                <span style={{ fontWeight: 500, marginLeft: 4 }}>{m.name}</span>
              </span>
              <span className="badge badge-outline">Paused</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
