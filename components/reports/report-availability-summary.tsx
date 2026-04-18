import { SvgBarChart } from './charts/svg-bar-chart'

interface DomainGroup {
  domain: string
  healthScore: number
  overallStatus: string
  monitors: { type: string; name: string; status: string }[]
}

interface AvailabilitySummaryData {
  domainGroups?: DomainGroup[]
  totalIncidents: number
  meanResolutionMinutes: number
}

function uptimeColor(u: number): string {
  if (u >= 99.9) return '#10b981'
  if (u >= 99) return '#f59e0b'
  return '#ef4444'
}

export function ReportAvailabilitySummary({ data }: { data: AvailabilitySummaryData }): React.ReactElement {
  const groups = data.domainGroups ?? []

  if (groups.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>
        No availability data found for this period.
      </div>
    )
  }

  const chartData = groups.map(g => ({
    label: g.domain,
    value: g.healthScore,
    sublabel: `${g.monitors.length} monitor${g.monitors.length !== 1 ? 's' : ''}`,
  }))

  const highRisk = groups.filter(g => g.healthScore < 99)
  const perfect = groups.filter(g => g.healthScore === 100)

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
        Availability Summary
      </h2>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981' }}>{perfect.length}</div>
          <div style={{ fontSize: 12, color: '#064e3b', marginTop: 2 }}>Domains at 100% health</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{highRisk.length}</div>
          <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>Domains below 99% health</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1e293b' }}>{data.totalIncidents}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Total incidents in period</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Health Score by Domain
        </h3>
        <SvgBarChart data={chartData} max={100} unit="%" />
      </div>

      {/* Detail table */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Domain Breakdown
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Domain</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Monitors</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Passing</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Issues</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Health Score</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.sort((a, b) => a.healthScore - b.healthScore).map((g, i) => {
            const issues = g.monitors.filter(m => m.status !== 'up').length
            const statusLabel = g.overallStatus === 'up' ? 'Healthy' : g.overallStatus === 'degraded' ? 'Warning' : 'Down'
            const statusStyle = {
              up: { bg: '#ecfdf5', color: '#10b981' },
              degraded: { bg: '#fffbeb', color: '#d97706' },
              down: { bg: '#fef2f2', color: '#ef4444' },
            }[g.overallStatus as 'up' | 'degraded' | 'down'] ?? { bg: '#f8fafc', color: '#94a3b8' }

            return (
              <tr key={g.domain} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b' }}>{g.domain}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{g.monitors.length}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{g.monitors.filter(m => m.status === 'up').length}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: issues > 0 ? '#ef4444' : '#94a3b8', fontWeight: issues > 0 ? 600 : 400 }}>{issues}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: uptimeColor(g.healthScore) }}>{g.healthScore}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color }}>
                    {statusLabel}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
