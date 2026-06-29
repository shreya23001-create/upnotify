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
import { CopyUrlButton } from '@/components/monitors/copy-url-button'
import { MonitorTypeInsight } from '@/components/monitors/monitor-type-insight'

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

  // WordPress monitors have their own dedicated report page
  if (monitor.type === 'wordpress') redirect(`/dashboard/monitors/${id}/wordpress`)

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
            <MonitorStatusBadge status={monitor.status} monitorType={monitor.type} />
            <span className="monitor-type-badge">{monitor.type}</span>
          </div>
          <div className="monitor-target-row">
            <a
              href={/^https?:\/\//i.test(monitor.target) ? monitor.target : `https://${monitor.target}`}
              target="_blank"
              rel="noopener noreferrer"
              className="monitor-header-v2-url monitor-header-v2-url-link"
            >
              {monitor.target}
            </a>
            <CopyUrlButton url={monitor.target} />
          </div>
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
          <div className="monitor-stat-icon icon-up">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
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
          <div className="monitor-stat-icon icon-blue">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="monitor-stat-label">Avg Response · 50 checks</div>
          <div className="monitor-stat-value">
            {avgResponseTime != null ? <>{avgResponseTime}<span className="monitor-stat-unit">ms</span></> : '—'}
          </div>
          <div className="monitor-stat-sub">
            {p95ResponseTime != null ? `P95: ${p95ResponseTime}ms` : 'No response data'}
          </div>
        </div>

        <div className="monitor-stat-card card-up">
          <div className="monitor-stat-icon icon-up">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="monitor-stat-label">Checks · Recent</div>
          <div className="monitor-stat-value">{totalChecks30d}</div>
          <div className="monitor-stat-sub">
            {checkResults.filter(r => r.status === 'down').length} failed
          </div>
        </div>

        <div className={`monitor-stat-card ${openIncidentCount > 0 ? 'card-warn' : 'card-up'}`}>
          <div className={`monitor-stat-icon ${openIncidentCount > 0 ? 'icon-warn' : 'icon-up'}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="monitor-stat-label">Open Incidents</div>
          <div className="monitor-stat-value">{openIncidentCount}</div>
          <div className="monitor-stat-sub">
            {incidents.length} total in view
          </div>
        </div>
      </div>

      {/* 30-day uptime bars */}
      <MonitorUptimeBars slots={uptimeSlots} uptimePercent={uptimePercent} rangeLabel="30 days" />

      {/* Type-specific insight */}
      <MonitorTypeInsight monitor={monitor} latestMetadata={latestMetadata as Record<string, unknown> | undefined} />

      {/* Config + incidents */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monitor Settings</div>
          </div>
          <div className="mon-config-grid">
            <div className="mon-config-item">
              <div className="mon-config-item-label">Check Interval</div>
              <div className="mon-config-item-value">{formatInterval(monitor.check_interval_seconds)}</div>
              <div className="mon-config-item-sub">{Math.round(86400 / monitor.check_interval_seconds).toLocaleString()} checks/day</div>
            </div>
            <div className="mon-config-item">
              <div className="mon-config-item-label">Timeout</div>
              <div className="mon-config-item-value">{monitor.timeout_ms / 1000}s</div>
              <div className="mon-config-item-sub">Returns SLOW above 800ms</div>
            </div>
            <div className="mon-config-item">
              <div className="mon-config-item-label">Type</div>
              <div className="mon-config-item-value" style={{ textTransform: 'capitalize' }}>{monitor.type}</div>
              <div className="mon-config-item-sub" style={{ textTransform: 'capitalize' }}>{monitor.severity} severity</div>
            </div>
          </div>
          {isKeywordMonitor && (displayPositive.length > 0 || displayNegative.length > 0) && (
            <div className="alert-channels-row">
              {displayPositive.length > 0 && (
                <>
                  <div className="alert-channels-label">Must Exist</div>
                  <div>
                    {displayPositive.map((kw, i) => (
                      <span key={i} className="keyword-tag keyword-tag-positive keyword-tag-readonly">{kw}</span>
                    ))}
                  </div>
                </>
              )}
              {displayNegative.length > 0 && (
                <>
                  <div className="alert-channels-label" style={{ marginTop: 8 }}>Must NOT Exist</div>
                  <div>
                    {displayNegative.map((kw, i) => (
                      <span key={i} className="keyword-tag keyword-tag-negative keyword-tag-readonly">{kw}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="alert-channels-row">
            <div className="alert-channels-label">Alert Channels</div>
            <div>
              <span className="alert-chip">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </span>
              <span className="alert-chip">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                Slack
              </span>
              <span className="alert-chip">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v3a0 0 0 010-.08z"/></svg>
                Webhooks
              </span>
            </div>
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
