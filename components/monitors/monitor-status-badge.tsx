'use client'

const statusConfig: Record<string, { label: string; className: string }> = {
  up: { label: 'Up', className: 'badge-success' },
  down: { label: 'Down', className: 'badge-danger' },
  degraded: { label: 'Degraded', className: 'badge-warning' },
  paused: { label: 'Paused', className: 'badge-outline' },
  unknown: { label: 'Unknown', className: 'badge-outline' },
}

export function MonitorStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.unknown
  return <span className={`badge ${config.className}`}>{config.label}</span>
}
