'use client'

import {
  IconHttp, IconSsl, IconDns, IconKeyword, IconDomain,
  IconPort, IconPing, IconApi, IconHeartbeat, IconCompetitor, IconServer,
  IconSecurityHeaders, IconResponseTime, IconRobotsTxt, IconIpChange,
  IconMxHealth, IconWhoisChange, IconSitemap, IconRedirectChain,
  IconSpfDmarc, IconBlacklist, IconPageSize, IconCookieConsent, IconNameserverChange,
  IconWordpress,
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
  wordpress: IconWordpress,
}

const displayNames: Record<string, string> = {
  http: 'HTTP Uptime',
  ssl: 'SSL Certificate',
  dns: 'DNS Records',
  keyword: 'Keyword',
  domain: 'Domain Expiry',
  port: 'Port Check',
  ping: 'Ping',
  api: 'API Endpoint',
  heartbeat: 'Heartbeat',
  competitor: 'Competitor',
  server: 'Server',
  'security-headers': 'Security Headers',
  'response-time': 'Response Time',
  'robots-txt': 'robots.txt',
  'ip-change': 'IP Change',
  'mx-health': 'MX Health',
  'whois-change': 'WHOIS Change',
  sitemap: 'Sitemap',
  'redirect-chain': 'Redirect Chain',
  'spf-dmarc': 'SPF / DMARC',
  blacklist: 'Blacklist',
  'page-size': 'Page Size',
  'cookie-consent': 'Cookie Consent',
  'nameserver-change': 'Nameservers',
  wordpress: 'WordPress',
}

export function MonitorTypeIcon({ type, iconOnly = false }: { type: string; iconOnly?: boolean }) {
  const Icon = iconMap[type]
  const label = displayNames[type] ?? type
  if (iconOnly) {
    return Icon ? <Icon size={14} /> : <span style={{ fontSize: 10 }}>{label.slice(0, 2)}</span>
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={16} />}
      {label}
    </span>
  )
}
