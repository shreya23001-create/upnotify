interface ChangeEvent {
  monitorId: string
  monitorName: string
  type: string
  target: string
  detectedAt: string
  errorMessage: string | null
}

interface ChangeDigestData {
  changes?: ChangeEvent[]
  totalMonitors: number
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  dns: 'DNS Records',
  'robots-txt': 'robots.txt',
  'whois-change': 'WHOIS / Registrar',
  'nameserver-change': 'Nameservers',
  'ip-change': 'IP Address',
  'redirect-chain': 'Redirect Chain',
  sitemap: 'Sitemap',
  competitor: 'Page Content',
  'cookie-consent': 'Cookie Consent',
  'page-size': 'Page Size',
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  dns: '#3b82f6',
  'robots-txt': '#8b5cf6',
  'whois-change': '#f59e0b',
  'nameserver-change': '#ef4444',
  'ip-change': '#ef4444',
  'redirect-chain': '#6366f1',
  sitemap: '#0ea5e9',
  competitor: '#10b981',
  'cookie-consent': '#f97316',
  'page-size': '#64748b',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ReportChangeDigest({ data }: { data: ChangeDigestData }): React.ReactElement {
  const changes = data.changes ?? []

  // Group by type
  const byType: Record<string, ChangeEvent[]> = {}
  for (const c of changes) {
    if (!byType[c.type]) byType[c.type] = []
    byType[c.type].push(c)
  }

  // Count stable monitors (those with no changes)
  const changedMonitorIds = new Set(changes.map(c => c.monitorId))
  const stableCount = data.totalMonitors - changedMonitorIds.size

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
        Change Detection Digest
      </h2>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ padding: '16px 20px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{changes.length}</div>
          <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>Changes detected</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{changedMonitorIds.size}</div>
          <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>Monitors with changes</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981' }}>{stableCount}</div>
          <div style={{ fontSize: 12, color: '#064e3b', marginTop: 2 }}>Stable monitors</div>
        </div>
      </div>

      {changes.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#065f46' }}>No changes detected during this period</div>
          <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>All monitored pages, DNS records, and configurations remained stable.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(byType).map(([type, events]) => (
            <div key={type} className="report-domain-card" style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', pageBreakInside: 'avoid' }}>
              {/* Type header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHANGE_TYPE_COLORS[type] ?? '#94a3b8', flexShrink: 0 }} />
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                  {CHANGE_TYPE_LABELS[type] ?? type}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                  {events.length} change{events.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Events list */}
              <div>
                {events.map((e, i) => (
                  <div key={i} style={{
                    padding: '10px 16px',
                    borderBottom: i < events.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', minWidth: 120, marginTop: 2 }}>
                      {formatDate(e.detectedAt)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{e.monitorName}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{e.target}</div>
                      {e.errorMessage && (
                        <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>{e.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
