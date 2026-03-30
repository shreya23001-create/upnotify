'use client'

import {
  IconHttp, IconSsl, IconDns, IconKeyword, IconDomain,
  IconPort, IconPing, IconApi, IconHeartbeat, IconCompetitor, IconServer,
} from '@/components/icons'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  http: IconHttp,
  ssl: IconSsl,
  dns: IconDns,
  keyword: IconKeyword,
  domain: IconDomain,
  port: IconPort,
  ping: IconPing,
  api: IconApi,
  heartbeat: IconHeartbeat,
  competitor: IconCompetitor,
  server: IconServer,
}

export function MonitorTypeIcon({ type }: { type: string }) {
  const Icon = iconMap[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
      {Icon && <Icon size={16} />}
      {type}
    </span>
  )
}
