'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { DashboardStatsBar } from './dashboard-stats-bar'
import { WebsitesPanel } from './websites-panel'
import { IncidentsPanel } from './incidents-panel'
import { ActivityFeed } from './activity-feed'
import type { Monitor, Incident } from '@/lib/types'

// ─── Types (unchanged contract with GET /api/v1/dashboard/stats) ─────────────

interface MonitorStats { total: number; up: number; down: number; degraded: number; paused: number }
interface CheckResult   { status: string; response_time_ms?: number | null; checked_at: string; monitor_id: string }
interface DashboardData {
  stats: MonitorStats
  monitors: Monitor[]
  incidents: Incident[]
  checkResults: CheckResult[]
}

function Skeleton(): React.ReactElement {
  return (
    <div className="db-skeleton">
      <div className="db-skeleton-hero" />
      <div className="db-home-split">
        <div className="db-skeleton-card" style={{ height: 320 }} />
        <div className="db-skeleton-card" style={{ height: 320 }} />
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div className="db-error-state">
      <AlertCircle size={28} strokeWidth={1.5} />
      <h3>Couldn&apos;t load your dashboard</h3>
      <p>Something went wrong fetching your monitoring data. Your monitors are still running — this is just a display issue.</p>
      <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
        <RefreshCw size={13} strokeWidth={2.25} />
        Try again
      </button>
    </div>
  )
}

export function WorkspaceDashboard(): React.ReactElement {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    async function load(): Promise<void> {
      try {
        const url = currentWorkspace
          ? `/api/v1/dashboard/stats?workspaceId=${encodeURIComponent(currentWorkspace.id)}`
          : '/api/v1/dashboard/stats'
        const res = await fetch(url)
        if (!res.ok) {
          if (!cancelled) setError(true)
          return
        }
        const json = await res.json() as { success: boolean } & DashboardData
        if (!cancelled) {
          if (json.success) {
            setData(json)
            setLastLoadedAt(new Date())
          } else {
            setError(true)
          }
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentWorkspace, retryToken])

  if (loading) return <Skeleton />
  if (error && !data) return <ErrorState onRetry={() => setRetryToken(t => t + 1)} />

  const stats        = data?.stats        ?? { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const monitors     = data?.monitors     ?? []
  const incidents    = data?.incidents    ?? []
  const checkResults = data?.checkResults ?? []

  const overallLabel = stats.total === 0
    ? 'No monitors yet'
    : stats.down > 0
      ? `${stats.down} monitor${stats.down === 1 ? '' : 's'} down`
      : stats.degraded > 0
        ? `${stats.degraded} monitor${stats.degraded === 1 ? '' : 's'} degraded`
        : 'All systems operational'
  const overallState: 'up' | 'warn' | 'down' | 'neutral' = stats.total === 0 ? 'neutral' : stats.down > 0 ? 'down' : stats.degraded > 0 ? 'warn' : 'up'

  return (
    <div className="db-dashboard">
      <div className="db-status-strip">
        <span className={`db-status-strip-dot db-status-strip-dot--${overallState}`} />
        <span className="db-status-strip-label">{overallLabel}</span>
        <span className="db-status-strip-sep">·</span>
        <span className="db-status-strip-meta">{stats.total} monitor{stats.total === 1 ? '' : 's'} monitored</span>
        {lastLoadedAt && (
          <>
            <span className="db-status-strip-sep">·</span>
            <span className="db-status-strip-meta">Last checked {lastLoadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          </>
        )}
      </div>

      <DashboardStatsBar stats={stats} />

      <div className="db-home-split db-home-split--equal">
        <IncidentsPanel incidents={incidents} />
        <WebsitesPanel monitors={monitors} checkResults={checkResults} />
      </div>

      <ActivityFeed monitors={monitors} incidents={incidents} />
    </div>
  )
}
