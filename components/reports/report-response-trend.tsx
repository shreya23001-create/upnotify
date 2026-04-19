import { SvgLineChart } from './charts/svg-line-chart'

interface DailyTrend {
  date: string
  avgMs: number
  minMs: number
  maxMs: number
  checks: number
}

interface MonitorTrend {
  monitorId: string
  name: string
  type: string
  target: string
  daily: DailyTrend[]
  overallAvg: number
}

interface ResponseTrendData {
  monitorTrends?: MonitorTrend[]
}

function perfColor(ms: number): string {
  if (ms <= 300) return '#10b981'
  if (ms <= 800) return '#f59e0b'
  return '#ef4444'
}

function perfGrade(ms: number): string {
  if (ms <= 200) return 'A'
  if (ms <= 400) return 'B'
  if (ms <= 800) return 'C'
  if (ms <= 1500) return 'D'
  return 'F'
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

export function ReportResponseTrend({ data }: { data: ResponseTrendData }): React.ReactElement {
  const trends = (data.monitorTrends ?? []).filter(t => t.daily.length > 0)

  if (trends.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>
        No response time data found for this period. Add HTTP, API, or Response Time monitors to generate this report.
      </div>
    )
  }

  const sorted = [...trends].sort((a, b) => b.overallAvg - a.overallAvg)
  const slowest = sorted[0]
  const fastest = sorted[sorted.length - 1]
  const overallAvg = Math.round(trends.reduce((s, t) => s + t.overallAvg, 0) / trends.length)

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
        Response Time Trends
      </h2>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: perfColor(overallAvg) }}>{formatMs(overallAvg)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Average response time</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slowest.name}</div>
          <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>Slowest — {formatMs(slowest.overallAvg)} avg</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fastest.name}</div>
          <div style={{ fontSize: 12, color: '#064e3b', marginTop: 2 }}>Fastest — {formatMs(fastest.overallAvg)} avg</div>
        </div>
      </div>

      {/* Per-monitor trend charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {trends.map(trend => {
          const lineData = trend.daily.map(d => ({ label: d.date, value: d.avgMs }))
          const grade = perfGrade(trend.overallAvg)
          const gradeColor = perfColor(trend.overallAvg)
          const worstDay = trend.daily.reduce((a, b) => a.avgMs > b.avgMs ? a : b)
          const bestDay = trend.daily.reduce((a, b) => a.avgMs < b.avgMs ? a : b)

          return (
            <div key={trend.monitorId} className="report-domain-card" style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', pageBreakInside: 'avoid' }}>
              {/* Monitor header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{trend.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{trend.target} · {trend.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: gradeColor }}>{grade}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Grade</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: gradeColor }}>{formatMs(trend.overallAvg)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ padding: '12px 16px 4px' }}>
                <SvgLineChart data={lineData} color={gradeColor} unit="ms" height={160} />
              </div>

              {/* Min/max row */}
              <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, padding: '8px 16px', borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Best day</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{formatMs(bestDay.avgMs)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{bestDay.date}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 16px', borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Worst day</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatMs(worstDay.avgMs)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{worstDay.date}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Total checks</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                    {trend.daily.reduce((s, d) => s + d.checks, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance grade legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
        <strong style={{ color: '#1e293b' }}>Grade: </strong>
        <span><strong style={{ color: '#10b981' }}>A</strong> ≤200ms</span>
        <span><strong style={{ color: '#22c55e' }}>B</strong> ≤400ms</span>
        <span><strong style={{ color: '#f59e0b' }}>C</strong> ≤800ms</span>
        <span><strong style={{ color: '#f97316' }}>D</strong> ≤1.5s</span>
        <span><strong style={{ color: '#ef4444' }}>F</strong> &gt;1.5s</span>
      </div>
    </div>
  )
}
