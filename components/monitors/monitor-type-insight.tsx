import type { Monitor } from '@/lib/types'

type Meta = Record<string, unknown>

function Row({ label, value, sub, valueColor }: { label: string; value: React.ReactNode; sub?: string; valueColor?: string }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: valueColor ?? 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Pill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-block', background: bg, color, border: `1px solid ${color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 4, marginBottom: 4 }}>
      {text}
    </span>
  )
}

function expiryColor(days: number): string {
  if (days < 14) return '#f87171'
  if (days < 30) return '#fbbf24'
  return '#4ade80'
}

// ── SSL ─────────────────────────────────────────────────────────────────────
function SslInsight({ meta }: { meta: Meta }) {
  const days = meta.daysUntilExpiry as number | undefined
  return (
    <>
      {days != null && (
        <Row
          label="Days Until Expiry"
          value={`${days} days`}
          sub={meta.validTo as string | undefined}
          valueColor={expiryColor(days)}
        />
      )}
      {meta.issuer && <Row label="Issuer" value={meta.issuer as string} />}
      {meta.subject && <Row label="Subject" value={meta.subject as string} />}
      {meta.chainValid != null && (
        <Row
          label="Certificate Chain"
          value={meta.chainValid ? 'Valid' : 'Invalid'}
          sub={meta.chainError as string | undefined}
          valueColor={meta.chainValid ? '#4ade80' : '#f87171'}
        />
      )}
    </>
  )
}

// ── Domain ──────────────────────────────────────────────────────────────────
function DomainInsight({ meta }: { meta: Meta }) {
  const days = meta.daysUntilExpiry as number | undefined
  return (
    <>
      {days != null && (
        <Row
          label="Days Until Expiry"
          value={`${days} days`}
          sub={meta.expiryDate as string | undefined}
          valueColor={expiryColor(days)}
        />
      )}
      {meta.domain && <Row label="Domain" value={meta.domain as string} />}
    </>
  )
}

// ── Security Headers ─────────────────────────────────────────────────────────
function SecurityHeadersInsight({ meta }: { meta: Meta }) {
  const score = meta.score as number | undefined
  const missing = meta.missing as string[] | undefined
  const headers = meta.headers as Record<string, string> | undefined
  return (
    <>
      {score != null && (
        <Row
          label="Header Score"
          value={`${score} / 10`}
          valueColor={score >= 7 ? '#4ade80' : score >= 4 ? '#fbbf24' : '#f87171'}
        />
      )}
      {missing && missing.length > 0 && (
        <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Missing Headers</div>
          {missing.map(h => <Pill key={h} text={h} color="#f87171" bg="#ef444410" />)}
        </div>
      )}
      {headers && Object.keys(headers).length > 0 && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Present Headers</div>
          {Object.keys(headers).map(h => <Pill key={h} text={h} color="#4ade80" bg="#10b98110" />)}
        </div>
      )}
    </>
  )
}

// ── SPF / DMARC ──────────────────────────────────────────────────────────────
function SpfDmarcInsight({ meta }: { meta: Meta }) {
  const issues = meta.issues as string[] | undefined
  return (
    <>
      <Row
        label="SPF Record"
        value={meta.spfRecord ? (meta.spfRecord as string) : 'Not found'}
        valueColor={meta.spfRecord ? 'var(--text-primary)' : '#f87171'}
      />
      <Row
        label="DMARC Record"
        value={meta.dmarcRecord ? (meta.dmarcRecord as string) : 'Not found'}
        valueColor={meta.dmarcRecord ? 'var(--text-primary)' : '#f87171'}
      />
      {issues && issues.length > 0 && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Issues</div>
          {issues.map((iss, i) => <div key={i} style={{ fontSize: 13, color: '#fbbf24', marginBottom: 4 }}>• {iss}</div>)}
        </div>
      )}
    </>
  )
}

// ── Blacklist ─────────────────────────────────────────────────────────────────
function BlacklistInsight({ meta }: { meta: Meta }) {
  const listed = meta.listed as string[] | undefined
  const checked = meta.checked as string[] | undefined
  return (
    <>
      {meta.ip && <Row label="IP Address" value={meta.ip as string} />}
      <Row
        label="Blacklist Status"
        value={listed && listed.length > 0 ? `Listed on ${listed.length} zone(s)` : 'Clean — not listed'}
        valueColor={listed && listed.length > 0 ? '#f87171' : '#4ade80'}
        sub={checked ? `Checked ${checked.length} lists` : undefined}
      />
      {listed && listed.length > 0 && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Listed On</div>
          {listed.map(l => <Pill key={l} text={l} color="#f87171" bg="#ef444410" />)}
        </div>
      )}
    </>
  )
}

// ── MX Health ─────────────────────────────────────────────────────────────────
function MxHealthInsight({ meta }: { meta: Meta }) {
  const records = meta.mxRecords as { exchange: string; priority: number }[] | undefined
  return (
    <>
      {meta.primaryMx && <Row label="Primary Mail Server" value={meta.primaryMx as string} />}
      {records && records.length > 0 && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>MX Records</div>
          {records.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>Priority {r.priority}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.exchange}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── DNS ───────────────────────────────────────────────────────────────────────
function DnsInsight({ meta }: { meta: Meta }) {
  const records = meta.records as Record<string, string[]> | undefined
  return (
    <>
      <Row
        label="Change Detected"
        value={meta.changed ? 'Yes — DNS records changed' : 'No changes detected'}
        valueColor={meta.changed ? '#f87171' : '#4ade80'}
      />
      {records && Object.entries(records).map(([type, values]) =>
        Array.isArray(values) && values.length > 0 ? (
          <div key={type} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{type} Records</div>
            {values.map((v: string, i: number) => (
              <div key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 2 }}>{v}</div>
            ))}
          </div>
        ) : null
      )}
    </>
  )
}

// ── Redirect Chain ───────────────────────────────────────────────────────────
function RedirectChainInsight({ meta }: { meta: Meta }) {
  const chain = meta.chain as { url: string; status: number; location?: string }[] | undefined
  return (
    <>
      <Row label="Total Redirects" value={`${meta.hops ?? 0} hop${(meta.hops as number) !== 1 ? 's' : ''}`} />
      {chain && chain.length > 0 && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Redirect Chain</div>
          {chain.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, background: step.status < 400 ? '#10b98120' : '#ef444420', color: step.status < 400 ? '#4ade80' : '#f87171', borderRadius: 4, padding: '2px 6px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{step.status}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{step.url}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── IP Change ────────────────────────────────────────────────────────────────
function IpChangeInsight({ meta }: { meta: Meta }) {
  return (
    <>
      <Row label="Current IP" value={meta.currentIp as string ?? '—'} />
      {meta.previousIp && (
        <Row
          label="Previous IP"
          value={meta.previousIp as string}
          sub={meta.changed ? 'IP has changed' : undefined}
          valueColor={meta.changed ? '#fbbf24' : 'var(--text-secondary)'}
        />
      )}
      <Row
        label="Change Detected"
        value={meta.changed ? 'Yes — IP changed' : 'No change'}
        valueColor={meta.changed ? '#f87171' : '#4ade80'}
      />
    </>
  )
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
function SitemapInsight({ meta }: { meta: Meta }) {
  const sizeKb = meta.sizeBytes != null ? Math.round((meta.sizeBytes as number) / 1024) : null
  return (
    <>
      {meta.urlCount != null && <Row label="URLs in Sitemap" value={(meta.urlCount as number).toLocaleString()} />}
      {meta.sitemapCount != null && <Row label="Sitemaps Found" value={meta.sitemapCount as number} />}
      {sizeKb != null && <Row label="Sitemap Size" value={`${sizeKb} KB`} />}
      {meta.isSitemapIndex != null && <Row label="Sitemap Index" value={meta.isSitemapIndex ? 'Yes' : 'No'} />}
    </>
  )
}

// ── robots.txt ────────────────────────────────────────────────────────────────
function RobotsTxtInsight({ meta }: { meta: Meta }) {
  return (
    <>
      <Row
        label="Change Detected"
        value={meta.changed ? 'Yes — robots.txt changed' : 'No changes detected'}
        valueColor={meta.changed ? '#f87171' : '#4ade80'}
      />
      {meta.length != null && <Row label="File Size" value={`${meta.length} bytes`} />}
    </>
  )
}

// ── Cookie Consent ────────────────────────────────────────────────────────────
function CookieConsentInsight({ meta }: { meta: Meta }) {
  return (
    <>
      <Row
        label="Consent Banner"
        value={meta.consentFound ? 'Detected' : 'Not found'}
        valueColor={meta.consentFound ? '#4ade80' : '#f87171'}
      />
      {meta.pattern && <Row label="Pattern Matched" value={meta.pattern as string} />}
    </>
  )
}

// ── Nameserver Change ─────────────────────────────────────────────────────────
function NameserverInsight({ meta }: { meta: Meta }) {
  const current = meta.currentNs as string[] | undefined
  const previous = meta.previousNs as string[] | undefined
  return (
    <>
      <Row
        label="Change Detected"
        value={meta.changed ? 'Yes — nameservers changed' : 'No changes detected'}
        valueColor={meta.changed ? '#f87171' : '#4ade80'}
      />
      {current && current.length > 0 && (
        <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Current Nameservers</div>
          {current.map(ns => <div key={ns} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 2 }}>{ns}</div>)}
        </div>
      )}
      {previous && previous.length > 0 && meta.changed && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Previous Nameservers</div>
          {previous.map(ns => <div key={ns} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: 2, textDecoration: 'line-through' }}>{ns}</div>)}
        </div>
      )}
    </>
  )
}

// ── Response Time ─────────────────────────────────────────────────────────────
function ResponseTimeInsight({ meta }: { meta: Meta }) {
  const ms = meta.responseTimeMs as number | undefined
  const threshold = meta.thresholdMs as number | undefined
  const degraded = meta.degradedMs as number | undefined
  const exceeded = ms != null && threshold != null && ms > threshold
  return (
    <>
      {ms != null && (
        <Row
          label="Current Response Time"
          value={`${ms}ms`}
          valueColor={exceeded ? '#f87171' : ms > (degraded ?? Infinity) ? '#fbbf24' : '#4ade80'}
        />
      )}
      {threshold != null && <Row label="Alert Threshold" value={`${threshold}ms`} />}
      {degraded != null && <Row label="Degraded Threshold" value={`${degraded}ms`} />}
    </>
  )
}

// ── Page Size ─────────────────────────────────────────────────────────────────
function PageSizeInsight({ meta }: { meta: Meta }) {
  const size = meta.sizeKb as number | undefined
  const max = meta.maxSizeKb as number | undefined
  const warn = meta.warnSizeKb as number | undefined
  const exceeded = size != null && max != null && size > max
  return (
    <>
      {size != null && (
        <Row
          label="Page Size"
          value={`${size} KB`}
          valueColor={exceeded ? '#f87171' : size > (warn ?? Infinity) ? '#fbbf24' : '#4ade80'}
        />
      )}
      {max != null && <Row label="Max Allowed" value={`${max} KB`} />}
      {warn != null && <Row label="Warn Above" value={`${warn} KB`} />}
    </>
  )
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
function HeartbeatInsight({ meta }: { meta: Meta }) {
  const secs = meta.lastPingSecondsAgo as number | undefined
  function fmt(s: number): string {
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  }
  return (
    <>
      {secs != null && <Row label="Last Heartbeat" value={fmt(secs)} valueColor={secs > 3600 ? '#f87171' : '#4ade80'} />}
    </>
  )
}

// ── TITLE MAP ─────────────────────────────────────────────────────────────────
const TITLES: Record<string, string> = {
  ssl: 'SSL Certificate',
  domain: 'Domain Registration',
  'security-headers': 'Security Headers',
  'spf-dmarc': 'SPF & DMARC',
  blacklist: 'Blacklist Status',
  'mx-health': 'Mail Server (MX)',
  dns: 'DNS Records',
  'redirect-chain': 'Redirect Chain',
  'ip-change': 'IP Address',
  'whois-change': 'WHOIS / Domain',
  sitemap: 'Sitemap',
  'robots-txt': 'robots.txt',
  'cookie-consent': 'Cookie Consent',
  'nameserver-change': 'Nameservers',
  'response-time': 'Response Time Threshold',
  'page-size': 'Page Size',
  heartbeat: 'Heartbeat',
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export function MonitorTypeInsight({
  monitor,
  latestMetadata,
}: {
  monitor: Pick<Monitor, 'type'>
  latestMetadata: Record<string, unknown> | undefined | null
}): React.ReactElement | null {
  if (!latestMetadata) return null

  const meta = latestMetadata
  const title = TITLES[monitor.type]
  if (!title) return null

  let body: React.ReactNode = null
  switch (monitor.type) {
    case 'ssl':             body = <SslInsight meta={meta} />; break
    case 'domain':
    case 'whois-change':    body = <DomainInsight meta={meta} />; break
    case 'security-headers': body = <SecurityHeadersInsight meta={meta} />; break
    case 'spf-dmarc':       body = <SpfDmarcInsight meta={meta} />; break
    case 'blacklist':       body = <BlacklistInsight meta={meta} />; break
    case 'mx-health':       body = <MxHealthInsight meta={meta} />; break
    case 'dns':             body = <DnsInsight meta={meta} />; break
    case 'redirect-chain':  body = <RedirectChainInsight meta={meta} />; break
    case 'ip-change':       body = <IpChangeInsight meta={meta} />; break
    case 'sitemap':         body = <SitemapInsight meta={meta} />; break
    case 'robots-txt':      body = <RobotsTxtInsight meta={meta} />; break
    case 'cookie-consent':  body = <CookieConsentInsight meta={meta} />; break
    case 'nameserver-change': body = <NameserverInsight meta={meta} />; break
    case 'response-time':   body = <ResponseTimeInsight meta={meta} />; break
    case 'page-size':       body = <PageSizeInsight meta={meta} />; break
    case 'heartbeat':       body = <HeartbeatInsight meta={meta} />; break
    default:                return null
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div className="card-title">{title} — Latest Reading</div>
      </div>
      <div style={{ padding: '0 20px 4px' }}>
        {body}
      </div>
    </div>
  )
}
