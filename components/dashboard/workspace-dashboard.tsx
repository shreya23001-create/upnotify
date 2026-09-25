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

interface MonitorStats { total: number; websites: number; up: number; down: number; degraded: number; paused: number }
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

  const stats        = data?.stats        ?? { total: 0, websites: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const monitors     = data?.monitors     ?? []
  const incidents    = data?.incidents    ?? []
  const checkResults = data?.checkResults ?? []

  return (
    <div className="db-dashboard">
      <DashboardStatsBar stats={stats} />

      <div className="db-home-split db-home-split--equal">
        <IncidentsPanel incidents={incidents} />
        <WebsitesPanel monitors={monitors} checkResults={checkResults} />
      </div>

      <ActivityFeed monitors={monitors} incidents={incidents} />
    </div>
  )
}
