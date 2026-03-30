'use client'

const statusConfig: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  up: { label: 'Up', badgeClass: 'badge-success', dotClass: 'status-dot-up' },
  down: { label: 'Down', badgeClass: 'badge-danger', dotClass: 'status-dot-down' },
  degraded: { label: 'Degraded', badgeClass: 'badge-warning', dotClass: 'status-dot-degraded' },
  paused: { label: 'Paused', badgeClass: 'badge-outline', dotClass: 'status-dot-paused' },
  unknown: { label: 'Unknown', badgeClass: 'badge-outline', dotClass: 'status-dot-unknown' },
}

export function MonitorStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.unknown
  return (
    <span className={`badge ${config.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={`status-dot ${config.dotClass}`} />
      {config.label}
    </span>
  )
}
