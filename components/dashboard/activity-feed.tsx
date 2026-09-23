'use client'

import { useMemo } from 'react'
import { PlusCircle, AlertOctagon, CheckCircle2 } from 'lucide-react'
import type { Monitor, Incident } from '@/lib/types'

type ActivityKind = 'monitor_created' | 'incident_opened' | 'incident_resolved'

interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  subtitle: string
  at: string
}

// Built ONLY from data already returned by /api/v1/dashboard/stats — no
// fabricated event types (e.g. no SSL-expiry/config-change entries, since
// that data isn't available here). Three real, verifiable event kinds:
// a monitor being created, an incident opening, and an incident resolving.
function buildActivity(monitors: Monitor[], incidents: Incident[]): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const m of monitors) {
    items.push({
      id: `monitor-${m.id}`,
      kind: 'monitor_created',
      title: 'Monitor created',
      subtitle: m.name,
      at: m.created_at,
    })
  }

  for (const inc of incidents) {
    items.push({
      id: `incident-open-${inc.id}`,
      kind: 'incident_opened',
      title: 'Incident detected',
      subtitle: inc.title,
      at: inc.started_at,
    })
    if (inc.resolved_at) {
      items.push({
        id: `incident-resolved-${inc.id}`,
        kind: 'incident_resolved',
        title: 'Incident resolved',
        subtitle: inc.title,
        at: inc.resolved_at,
      })
    }
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const KIND_ICON: Record<ActivityKind, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  monitor_created: PlusCircle,
  incident_opened: AlertOctagon,
  incident_resolved: CheckCircle2,
}
const KIND_CLASS: Record<ActivityKind, string> = {
  monitor_created: 'activity-icon--info',
  incident_opened: 'activity-icon--down',
  incident_resolved: 'activity-icon--up',
}

export function ActivityFeed({ monitors, incidents }: { monitors: Monitor[]; incidents: Incident[] }): React.ReactElement {
  const items = useMemo(() => buildActivity(monitors, incidents), [monitors, incidents])

  return (
    <div className="db-card activity-feed">
      <div className="db-card-header">
        <div className="db-card-title">Recent Activity</div>
      </div>

      {items.length === 0 ? (
        <div className="activity-feed-empty">Nothing to show yet — activity will appear here as monitors run.</div>
      ) : (
        <div className="activity-feed-list">
          {items.map(item => {
            const Icon = KIND_ICON[item.kind]
            return (
              <div key={item.id} className="activity-row">
                <span className={`activity-icon ${KIND_CLASS[item.kind]}`}><Icon size={13} strokeWidth={2.25} /></span>
                <div className="activity-row-body">
                  <span className="activity-row-title">{item.title}</span>
                  <span className="activity-row-subtitle">{item.subtitle}</span>
                </div>
                <span className="activity-row-time">{timeAgo(item.at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
