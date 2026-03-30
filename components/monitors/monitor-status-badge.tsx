'use client'

import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  up: { label: 'Up', variant: 'default' },
  down: { label: 'Down', variant: 'destructive' },
  degraded: { label: 'Degraded', variant: 'secondary' },
  paused: { label: 'Paused', variant: 'outline' },
  unknown: { label: 'Unknown', variant: 'outline' },
}

export function MonitorStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.unknown
  return <Badge variant={config.variant}>{config.label}</Badge>
}
