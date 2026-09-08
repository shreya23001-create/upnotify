import {
  Globe, Lock, Radio, Search, CalendarClock, Plug, Wifi, Zap, HeartPulse,
  Eye, ShieldCheck, Timer, Bot, MapPin, Mail, Landmark, Map, Link2,
  MailCheck, Ban, Package, Cookie, Network,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MONITOR_TYPE_ICONS: Record<string, LucideIcon> = {
  'http': Globe,
  'ssl': Lock,
  'dns': Radio,
  'keyword': Search,
  'domain': CalendarClock,
  'port': Plug,
  'ping': Wifi,
  'api': Zap,
  'heartbeat': HeartPulse,
  'competitor': Eye,
  'security-headers': ShieldCheck,
  'response-time': Timer,
  'robots-txt': Bot,
  'ip-change': MapPin,
  'mx-health': Mail,
  'whois-change': Landmark,
  'sitemap': Map,
  'redirect-chain': Link2,
  'spf-dmarc': MailCheck,
  'blacklist': Ban,
  'page-size': Package,
  'cookie-consent': Cookie,
  'nameserver-change': Network,
}

const GRADIENT_ID = 'monitor-icon-gradient'

// Lucide icons render stroke paths using the `stroke` prop (or currentColor
// via `color`). Passing an SVG paint-server reference lets a single flat
// gradient def (rendered once via MonitorIconGradientDefs) drive every icon.
export function MonitorIconGradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00c94a" />
          <stop offset="100%" stopColor="#4dff88" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function MonitorTypeIcon({ type, size = 20, strokeWidth = 2 }: { type: string; size?: number; strokeWidth?: number }) {
  const Icon = MONITOR_TYPE_ICONS[type] ?? Globe
  return <Icon size={size} strokeWidth={strokeWidth} stroke={`url(#${GRADIENT_ID})`} />
}

const MONITOR_SLUG_ICONS: Record<string, LucideIcon> = {
  'http-uptime-monitoring': Globe,
  'ssl-certificate-monitoring': Lock,
  'dns-monitoring': Radio,
  'keyword-monitoring': Search,
  'domain-expiry-monitoring': CalendarClock,
  'port-monitoring': Plug,
  'ping-monitoring': Wifi,
  'api-endpoint-monitoring': Zap,
  'heartbeat-monitoring': HeartPulse,
  'page-change-detection': Eye,
  'security-headers-monitoring': ShieldCheck,
  'response-time-monitoring': Timer,
  'robots-txt-monitoring': Bot,
  'ip-change-monitoring': MapPin,
  'mx-health-monitoring': Mail,
  'whois-registrar-monitoring': Landmark,
  'sitemap-monitoring': Map,
  'redirect-chain-monitoring': Link2,
  'spf-dmarc-monitoring': MailCheck,
  'blacklist-monitoring': Ban,
  'page-size-monitoring': Package,
  'cookie-consent-monitoring': Cookie,
  'nameserver-monitoring': Network,
}

export function MonitorSlugIcon({ slug, size = 20, strokeWidth = 2 }: { slug: string; size?: number; strokeWidth?: number }) {
  const Icon = MONITOR_SLUG_ICONS[slug] ?? Globe
  return <Icon size={size} strokeWidth={strokeWidth} stroke={`url(#${GRADIENT_ID})`} />
}
