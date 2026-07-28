'use client'

import Link from 'next/link'
import { Mail, MessageSquare, Users, Phone, PhoneCall, Link2, Bell, type LucideIcon } from 'lucide-react'
import type { AlertChannel } from '@/lib/types'

const typeIcons: Record<string, LucideIcon> = {
  email: Mail, slack: MessageSquare, teams: Users, whatsapp: Phone, voice: PhoneCall, webhook: Link2,
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
          {channels.map(ch => {
            const Icon = typeIcons[ch.type] || Bell
            return (
              <Link
                key={ch.id}
                href={`/dashboard/alerts/${ch.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, transition: 'background 0.15s' }}
                className="checklist-item"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={16} />
                  <span style={{ fontWeight: 500 }}>{ch.name}</span>
                </span>
                <span className="badge badge-outline">Disabled</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
