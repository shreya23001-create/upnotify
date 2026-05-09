'use client'

// Base status colours — same for every type
const badgeClasses: Record<string, { badgeClass: string; dotClass: string }> = {
  up:       { badgeClass: 'badge-success', dotClass: 'status-dot-up' },
  down:     { badgeClass: 'badge-danger',  dotClass: 'status-dot-down' },
  degraded: { badgeClass: 'badge-warning', dotClass: 'status-dot-degraded' },
  paused:   { badgeClass: 'badge-outline', dotClass: 'status-dot-paused' },
  unknown:  { badgeClass: 'badge-outline', dotClass: 'status-dot-unknown' },
}

// Type-specific label overrides — only define what differs from Up/Down/Degraded
const typeLabels: Record<string, { up?: string; down?: string; degraded?: string }> = {
  'ssl':              { up: 'Valid',      down: 'Expired',   degraded: 'Expiring' },
  'domain':           { up: 'Valid',      down: 'Expired',   degraded: 'Expiring' },
  'dns':              { up: 'No change',  down: 'Changed' },
  'ip-change':        { up: 'No change',  down: 'Changed' },
  'nameserver-change':{ up: 'No change',  down: 'Changed' },
  'whois-change':     { up: 'No change',  down: 'Changed' },
  'robots-txt':       { up: 'No change',  down: 'Changed' },
  'sitemap':          { up: 'Valid',      down: 'Invalid',   degraded: 'Changed' },
  'redirect-chain':   { up: 'No change',  down: 'Changed',   degraded: 'Long chain' },
  'competitor':       { up: 'No change',  down: 'Changed' },
  'security-headers': { up: 'Healthy',    down: 'Issues',    degraded: 'Partial' },
  'mx-health':        { up: 'Healthy',    down: 'Issues',    degraded: 'Partial' },
  'spf-dmarc':        { up: 'Valid',      down: 'Invalid',   degraded: 'Weak' },
  'blacklist':        { up: 'Clean',      down: 'Listed' },
  'response-time':    { up: 'Fast',       down: 'Slow',      degraded: 'Slow' },
  'page-size':        { up: 'OK',         down: 'Oversized', degraded: 'Large' },
  'cookie-consent':   { up: 'Present',    down: 'Missing' },
  'heartbeat':        { up: 'Alive',      down: 'Missed' },
  'wordpress':       { up: 'Connected',    down: 'Not Connected', degraded: 'Partially Connected' },
}

const defaultLabels = { up: 'Up', down: 'Down', degraded: 'Degraded', paused: 'Paused', unknown: 'Unknown' }

export function MonitorStatusBadge({ status, monitorType }: { status: string; monitorType?: string }) {
  const classes = badgeClasses[status] ?? badgeClasses.unknown
  const overrides = monitorType ? typeLabels[monitorType] : undefined
  const label = overrides?.[status as 'up' | 'down' | 'degraded'] ?? defaultLabels[status as keyof typeof defaultLabels] ?? 'Unknown'

  return (
    <span className={`badge ${classes.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={`status-dot ${classes.dotClass}`} />
      {label}
    </span>
  )
}
