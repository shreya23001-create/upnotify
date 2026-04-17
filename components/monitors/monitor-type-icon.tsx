'use client'

import {
  IconHttp, IconSsl, IconDns, IconKeyword, IconDomain,
  IconPort, IconPing, IconApi, IconHeartbeat, IconCompetitor, IconServer,
  IconSecurityHeaders, IconResponseTime, IconRobotsTxt, IconIpChange,
  IconMxHealth, IconWhoisChange, IconSitemap, IconRedirectChain,
  IconSpfDmarc, IconBlacklist, IconPageSize, IconCookieConsent, IconNameserverChange,
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
  'security-headers': IconSecurityHeaders,
  'response-time': IconResponseTime,
  'robots-txt': IconRobotsTxt,
  'ip-change': IconIpChange,
  'mx-health': IconMxHealth,
  'whois-change': IconWhoisChange,
  sitemap: IconSitemap,
  'redirect-chain': IconRedirectChain,
  'spf-dmarc': IconSpfDmarc,
  blacklist: IconBlacklist,
  'page-size': IconPageSize,
  'cookie-consent': IconCookieConsent,
  'nameserver-change': IconNameserverChange,
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
