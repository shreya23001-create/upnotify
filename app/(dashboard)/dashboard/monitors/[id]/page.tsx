import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { getCheckResultsByMonitor } from '@/lib/db/check-results'
import { MonitorStatusBadge } from '@/components/monitors/monitor-status-badge'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { MonitorActions } from '@/components/monitors/monitor-actions'
import { CheckResultsHistory } from '@/components/monitors/check-results-history'
import { BadgeEmbed } from '@/components/monitors/badge-embed'
import { KeywordResultsDisplay } from '@/components/monitors/keyword-results-display'

interface KeywordMonitorConfig {
  positiveKeywords?: string[]
  negativeKeywords?: string[]
  keyword?: string
  shouldExist?: boolean
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

  const [incidents, checkResults] = await Promise.all([
    getIncidentsByWorkspace(monitor.workspace_id, { limit: 5 }),
    getCheckResultsByMonitor(monitor.id, 20),
  ])

  const isKeywordMonitor = monitor.type === 'keyword'
  const keywordConfig = monitor.config as KeywordMonitorConfig | undefined

  // Resolve keywords for display (backward compat with legacy single keyword)
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

  // Get the latest check result metadata for keyword display
  const latestResult = checkResults.length > 0 ? checkResults[0] : undefined
  const latestMetadata = latestResult?.metadata as Record<string, unknown> | undefined

  return (
    <div>
      <div className="monitor-header">
        <MonitorTypeIcon type={monitor.type} />
        <h1 className="page-title">{monitor.name}</h1>
        <MonitorStatusBadge status={monitor.status} />
      </div>

      <MonitorActions monitorId={monitor.id} isPaused={monitor.is_paused} />

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Configuration</div></div>
          <div className="card-content">
            <div className="info-row"><span className="info-row-label">Type</span><span className="info-row-value">{monitor.type}</span></div>
            <div className="info-row"><span className="info-row-label">Target</span><span className="info-row-value" style={{ textTransform: 'none' }}>{monitor.target}</span></div>
            <div className="info-row"><span className="info-row-label">Interval</span><span className="info-row-value">{monitor.check_interval_seconds}s</span></div>
            <div className="info-row"><span className="info-row-label">Timeout</span><span className="info-row-value">{monitor.timeout_ms}ms</span></div>
            <div className="info-row"><span className="info-row-label">Severity</span><span className="info-row-value">{monitor.severity}</span></div>
            <div className="info-row"><span className="info-row-label">Flap Count</span><span className="info-row-value">{monitor.flap_count}</span></div>
            {monitor.last_checked_at && (
              <div className="info-row"><span className="info-row-label">Last Checked</span><span className="info-row-value" style={{ textTransform: 'none' }}>{new Date(monitor.last_checked_at).toLocaleString()}</span></div>
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
          <div className="card-header"><div className="card-title">
            {isKeywordMonitor ? 'Last Keyword Check' : 'Recent Incidents'}
          </div></div>
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
                  <p style={{ fontSize: 14, color: '#71717a' }}>No incidents for this monitor.</p>
                ) : (
                  <div className="space-y-sm">
                    {incidents.map((inc) => (
                      <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{inc.title}</span>
                        <span className={`badge ${inc.status === 'resolved' ? 'badge-outline' : 'badge-danger'}`}>{inc.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* For keyword monitors, show incidents below the keyword results */}
      {isKeywordMonitor && incidents.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Incidents</div></div>
            <div className="card-content">
              <div className="space-y-sm">
                {incidents.map((inc) => (
                  <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{inc.title}</span>
                    <span className={`badge ${inc.status === 'resolved' ? 'badge-outline' : 'badge-danger'}`}>{inc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <CheckResultsHistory results={checkResults} />
      </div>

      <div style={{ marginTop: 24 }}>
        <BadgeEmbed monitorId={monitor.id} />
      </div>
    </div>
  )
}
