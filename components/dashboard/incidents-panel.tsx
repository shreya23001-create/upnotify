'use client'

import Link from 'next/link'
import { AlertOctagon, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import type { Incident } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

type IncidentVariant = 'down' | 'warn' | 'up'

function iconVariant(inc: Incident): IncidentVariant {
  if (inc.status === 'resolved') return 'up'
  if (inc.severity === 'P3' || inc.severity === 'P4') return 'warn'
  return 'down'
}

const VARIANT_ICON: Record<IncidentVariant, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  down: AlertOctagon,
  warn: AlertTriangle,
  up: CheckCircle2,
}

export function IncidentsPanel({ incidents }: { incidents: Incident[] }): React.ReactElement {
  const open = incidents.filter(i => i.status !== 'resolved')
  const resolved = incidents.filter(i => i.status === 'resolved')

  return (
    <div className="db-card incidents-panel">
      <div className="db-card-header">
        <div className="db-card-title">Incidents</div>
        <div className="db-card-actions">
          {open.length > 0 && <span className="db-badge db-badge-down" style={{ fontSize: 10 }}>{open.length} open</span>}
          <Link href="/dashboard/incidents" className="btn btn-ghost btn-sm websites-panel-viewall">
            View all <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="incidents-panel-empty">
          <CheckCircle2 size={22} strokeWidth={1.5} />
          <p>No incidents recorded — all systems clear.</p>
        </div>
      ) : (
        <div className="incidents-panel-list">
          {open.map(inc => {
            const v = iconVariant(inc)
            const Icon = VARIANT_ICON[v]
            return (
              <div key={inc.id} className={`incident-row incident-row--active incident-row--${v}`}>
                <div className={`incident-row-icon incident-row-icon--${v}`}><Icon size={15} strokeWidth={2.25} /></div>
                <div className="incident-row-body">
                  <div className="incident-row-title">{inc.title}</div>
                  <div className="incident-row-detail">{inc.root_cause ?? inc.severity} · Started {timeAgo(inc.started_at)}</div>
                </div>
                <div className="incident-row-meta">
                  <span className={`db-badge ${v === 'down' ? 'db-badge-down' : 'db-badge-warn'}`} style={{ fontSize: 10 }}>Open</span>
                  <span className="incident-row-time">{fmtTime(inc.started_at)}</span>
                </div>
              </div>
            )
          })}

          {resolved.map(inc => (
            <div key={inc.id} className="incident-row incident-row--resolved">
              <div className="incident-row-icon incident-row-icon--up"><CheckCircle2 size={15} strokeWidth={2.25} /></div>
              <div className="incident-row-body">
                <div className="incident-row-title">{inc.title}</div>
                <div className="incident-row-detail">{inc.root_cause ?? inc.severity}</div>
              </div>
              <div className="incident-row-meta">
                <span className="db-badge db-badge-outline" style={{ fontSize: 10 }}>
                  Resolved{inc.duration_seconds ? ` · ${Math.round(inc.duration_seconds / 60)}m` : ''}
                </span>
                <span className="incident-row-time">{fmtTime(inc.started_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
