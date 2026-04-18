import { SvgGauge } from './charts/svg-gauge'

interface MonitorHealthEntry {
  type: string
  name: string
  status: string
  detail?: string
}

interface DomainGroup {
  domain: string
  healthScore: number
  overallStatus: string
  monitors: MonitorHealthEntry[]
}

interface SiteHealthData {
  domainGroups?: DomainGroup[]
}

const TYPE_LABELS: Record<string, string> = {
  http: 'HTTP Uptime', ssl: 'SSL Cert', dns: 'DNS', domain: 'Domain Expiry',
  keyword: 'Keywords', port: 'Port', ping: 'Ping', api: 'API', heartbeat: 'Heartbeat',
  competitor: 'Page Change', 'security-headers': 'Security Headers',
  'response-time': 'Response Time', 'robots-txt': 'robots.txt',
  'ip-change': 'IP Address', 'mx-health': 'MX / Email', 'whois-change': 'WHOIS',
  sitemap: 'Sitemap', 'redirect-chain': 'Redirects', 'spf-dmarc': 'SPF/DMARC',
  blacklist: 'Blacklist', 'page-size': 'Page Size',
  'cookie-consent': 'Cookie Consent', 'nameserver-change': 'Nameservers',
}

function statusColor(status: string): string {
  if (status === 'up') return '#10b981'
  if (status === 'degraded') return '#f59e0b'
  if (status === 'down') return '#ef4444'
  return '#94a3b8'
}

function statusBg(status: string): string {
  if (status === 'up') return '#ecfdf5'
  if (status === 'degraded') return '#fffbeb'
  if (status === 'down') return '#fef2f2'
  return '#f8fafc'
}

function statusBorder(status: string): string {
  if (status === 'up') return '#a7f3d0'
  if (status === 'degraded') return '#fde68a'
  if (status === 'down') return '#fecaca'
  return '#e2e8f0'
}

function statusDot(status: string): string {
  if (status === 'up') return '✓'
  if (status === 'degraded') return '!'
  if (status === 'down') return '✗'
  return '–'
}

export function ReportSiteHealth({ data }: { data: SiteHealthData }): React.ReactElement {
  const groups = data.domainGroups ?? []

  if (groups.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>
        No domain health data available for this period.
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
        Site Health Summary
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map(group => (
          <div key={group.domain} className="report-domain-card" style={{
            border: `1px solid ${statusBorder(group.overallStatus)}`,
            borderRadius: 10,
            overflow: 'hidden',
            pageBreakInside: 'avoid',
          }}>
            {/* Domain header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              background: statusBg(group.overallStatus),
              borderBottom: `1px solid ${statusBorder(group.overallStatus)}`,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{group.domain}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {group.monitors.length} monitor{group.monitors.length !== 1 ? 's' : ''}
                </div>
              </div>
              <SvgGauge value={group.healthScore} size={80} label="Health" />
            </div>

            {/* Monitor chips grid */}
            <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {group.monitors.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 6,
                  background: statusBg(m.status),
                  border: `1px solid ${statusBorder(m.status)}`,
                  fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: statusColor(m.status), fontSize: 13 }}>
                    {statusDot(m.status)}
                  </span>
                  <span style={{ color: '#334155', fontWeight: 500 }}>
                    {TYPE_LABELS[m.type] ?? m.type}
                  </span>
                  {m.detail && (
                    <span style={{ color: '#64748b' }}>· {m.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 12, color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> Passing
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>!</span> Warning / Changed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span> Failing
        </span>
      </div>
    </div>
  )
}
