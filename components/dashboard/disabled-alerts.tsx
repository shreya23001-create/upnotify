'use client'

import Link from 'next/link'
import type { AlertChannel } from '@/lib/types'

const typeLabels: Record<string, string> = {
  email: '📧', slack: '💬', teams: '👥', whatsapp: '📱', voice: '📞', webhook: '🔗',
}

export function DisabledAlerts({ channels }: { channels: AlertChannel[] }) {
  return (
    <div className="card stat-card stat-card-red">
      <div className="card-header">
        <div className="card-header-row">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot status-dot-paused" />
            Disabled Alert Channels ({channels.length})
          </div>
          <Link href="/dashboard/alerts" className="btn btn-sm btn-ghost">View All</Link>
        </div>
      </div>
      <div className="card-content">
        <div className="space-y-sm">
          {channels.map(ch => (
            <Link
              key={ch.id}
              href={`/dashboard/alerts/${ch.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, transition: 'background 0.15s' }}
              className="checklist-item"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{typeLabels[ch.type] || '🔔'}</span>
                <span style={{ fontWeight: 500 }}>{ch.name}</span>
              </span>
              <span className="badge badge-outline">Disabled</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
