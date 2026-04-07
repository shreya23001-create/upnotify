import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { getCheckResultsByMonitor, getUptimeBarDataForRange } from '@/lib/db/check-results'
import { getUptimePercentage } from '@/lib/db/status-pages'
import { MonitorStatusBadge } from '@/components/monitors/monitor-status-badge'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { MonitorActions } from '@/components/monitors/monitor-actions'
import { CheckResultsHistory } from '@/components/monitors/check-results-history'
import { MonitorUptimeBars } from '@/components/monitors/monitor-uptime-bars'
import { BadgeEmbed } from '@/components/monitors/badge-embed'
import { KeywordResultsDisplay } from '@/components/monitors/keyword-results-display'

interface KeywordMonitorConfig {
  positiveKeywords?: string[]
  negativeKeywords?: string[]
  keyword?: string
  shouldExist?: boolean
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `Every ${seconds}s`
  if (seconds < 3600) return `Every ${seconds / 60}m`
  return `Every ${seconds / 3600}h`
}

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const monitor = await getMonitorById(id)
  if (!monitor) notFound()

  const [incidents, checkResults, uptimeSlots, uptimePercent] = await Promise.all([
    getIncidentsByWorkspace(monitor.workspace_id, { limit: 5 }),
    getCheckResultsByMonitor(monitor.id, 50),
    getUptimeBarDataForRange(monitor.id, '30d'),
    getUptimePercentage(monitor.id, 30),
  ])

  const isKeywordMonitor = monitor.type === 'keyword'
  const keywordConfig = monitor.config as KeywordMonitorConfig | undefined

  let displayPositive: string[] = []
  let displayNegative: string[] = []
  if (isKeywordMonitor && keywordConfig) {
    if (Array.isArray(keywordConfig.positiveKeywords) && keywordConfig.positiveKeywords.length > 0) {
      displayPositive = keywordConfig.positiveKeywords
    } else if (keywordConfig.keyword && keywordConfig.shouldExist !== false) {
      displayPositive = [keywordConfig.keyword]
    }
    if (Array.isArray(keywordConfig.negativeKeywords) && keywordConfig.negativeKeywords.length > 0) {
      displayNegative = keywordConfig.negativeKeywords
    } else if (keywordConfig.keyword && keywordConfig.shouldExist === false) {
      displayNegative = [keywordConfig.keyword]
    }
  }

  const latestResult = checkResults.length > 0 ? checkResults[0] : undefined
  const latestMetadata = latestResult?.metadata as Record<string, unknown> | undefined

  // Compute avg + p95 response time from recent results
  const responseTimes = checkResults
    .filter(r => r.response_time_ms != null && r.response_time_ms > 0)
    .map(r => r.response_time_ms as number)
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null
  const p95ResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)] ?? 0)
    : null
  const totalChecks30d = checkResults.length
  const openIncidentCount = incidents.filter(i => i.status !== 'resolved').length

  return (
    <div>
      {/* Redesigned monitor header */}
      <div className="monitor-header-v2">
        <div className="monitor-header-v2-left">
          <div className="monitor-header-v2-title-row">
            <h1 className="monitor-header-v2-name">{monitor.name}</h1>
            <MonitorStatusBadge status={monitor.status} />
            <span className="monitor-type-badge">{monitor.type}</span>
          </div>
          <div className="monitor-header-v2-url">{monitor.target}</div>
        </div>
        <div className="monitor-header-v2-right">
          <span className="monitor-interval-chip">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatInterval(monitor.check_interval_seconds)}
          </span>
          <MonitorActions monitorId={monitor.id} isPaused={monitor.is_paused} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="monitor-stat-grid">
        <div className="monitor-stat-card card-up">
          <div className="monitor-stat-label">Uptime · 30 days</div>
          <div className="monitor-stat-value">
            {uptimePercent.toFixed(2)}<span className="monitor-stat-unit">%</span>
          </div>
          <div className="monitor-stat-sub">
            {uptimeSlots.filter(s => s.status === 'down').length === 0
              ? 'No downtime recorded'
              : `${uptimeSlots.filter(s => s.status === 'down').length} slot(s) with issues`}
          </div>
        </div>

        <div className="monitor-stat-card card-blue">
          <div className="monitor-stat-label">Avg Response · 50 checks</div>
          <div className="monitor-stat-value">
            {avgResponseTime != null ? <>{avgResponseTime}<span className="monitor-stat-unit">ms</span></> : '—'}
          </div>
          <div className="monitor-stat-sub">
            {p95ResponseTime != null ? `P95: ${p95ResponseTime}ms` : 'No response data'}
          </div>
        </div>

        <div className="monitor-stat-card card-up">
          <div className="monitor-stat-label">Checks · Recent</div>
          <div className="monitor-stat-value">{totalChecks30d}</div>
          <div className="monitor-stat-sub">
            {checkResults.filter(r => r.status === 'down').length} failed
          </div>
        </div>

        <div className={`monitor-stat-card ${openIncidentCount > 0 ? 'card-warn' : 'card-up'}`}>
          <div className="monitor-stat-label">Open Incidents</div>
          <div className="monitor-stat-value">{openIncidentCount}</div>
          <div className="monitor-stat-sub">
            {incidents.length} total in view
          </div>
        </div>
      </div>

      {/* 90-day uptime bars */}
      <MonitorUptimeBars slots={uptimeSlots} uptimePercent={uptimePercent} rangeLabel="30 days" />

      {/* Config + incidents */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Configuration</div></div>
          <div className="card-content">
            <div className="info-row"><span className="info-row-label">Type</span><span className="info-row-value">{monitor.type}</span></div>
            <div className="info-row"><span className="info-row-label">Target</span><span className="info-row-value" style={{ textTransform: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{monitor.target}</span></div>
            <div className="info-row"><span className="info-row-label">Interval</span><span className="info-row-value">{formatInterval(monitor.check_interval_seconds)}</span></div>
            <div className="info-row"><span className="info-row-label">Timeout</span><span className="info-row-value">{monitor.timeout_ms}ms</span></div>
            <div className="info-row"><span className="info-row-label">Severity</span><span className="info-row-value">{monitor.severity}</span></div>
            {monitor.last_checked_at && (
              <div className="info-row">
                <span className="info-row-label">Last Check</span>
                <span className="info-row-value" style={{ textTransform: 'none' }}>
                  {new Date(monitor.last_checked_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            )}
            {isKeywordMonitor && displayPositive.length > 0 && (
              <div className="info-row" style={{ alignItems: 'flex-start' }}>
                <span className="info-row-label">Must Exist</span>
                <span className="info-row-value" style={{ textTransform: 'none' }}>
                  <span className="keyword-chips-row">
                    {displayPositive.map((kw, i) => (
                      <span key={i} className="keyword-tag keyword-tag-positive keyword-tag-readonly">{kw}</span>
                    ))}
                  </span>
                </span>
              </div>
            )}
            {isKeywordMonitor && displayNegative.length > 0 && (
              <div className="info-row" style={{ alignItems: 'flex-start' }}>
                <span className="info-row-label">Must NOT Exist</span>
                <span className="info-row-value" style={{ textTransform: 'none' }}>
                  <span className="keyword-chips-row">
                    {displayNegative.map((kw, i) => (
                      <span key={i} className="keyword-tag keyword-tag-negative keyword-tag-readonly">{kw}</span>
                    ))}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">{isKeywordMonitor ? 'Last Keyword Check' : 'Recent Incidents'}</div>
          </div>
          <div className="card-content">
            {isKeywordMonitor ? (
              latestMetadata ? (
                <KeywordResultsDisplay metadata={latestMetadata as { positiveResults?: { keyword: string; found: boolean }[]; negativeResults?: { keyword: string; found: boolean }[]; missingPositive?: string[]; foundNegative?: string[] }} />
              ) : (
                <p style={{ fontSize: 14, color: '#71717a' }}>No keyword check results yet. The first check will run shortly.</p>
              )
            ) : (
              <>
                {incidents.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#71717a' }}>No incidents recorded.</p>
                ) : (
                  <div className="space-y-sm">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="incident-row">
                        <div className="incident-row-info">
                          <span className="incident-row-title">{inc.title}</span>
                          <span className="incident-row-time">
                            {new Date(inc.started_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className={`badge ${inc.status === 'resolved' ? 'badge-outline' : 'badge-danger'}`}>
                          {inc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Keyword incidents below keyword results */}
      {isKeywordMonitor && incidents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Incidents</div></div>
            <div className="card-content">
              <div className="space-y-sm">
                {incidents.map((inc) => (
                  <div key={inc.id} className="incident-row">
                    <div className="incident-row-info">
                      <span className="incident-row-title">{inc.title}</span>
                      <span className="incident-row-time">
                        {new Date(inc.started_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <span className={`badge ${inc.status === 'resolved' ? 'badge-outline' : 'badge-danger'}`}>
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full check history */}
      <div style={{ marginBottom: 24 }}>
        <CheckResultsHistory results={checkResults} />
      </div>

      {/* Badge embed */}
      <div style={{ marginBottom: 24 }}>
        <BadgeEmbed monitorId={monitor.id} />
      </div>
    </div>
  )
}
