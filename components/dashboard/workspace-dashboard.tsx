'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { StatsCards } from './stats-cards'
import { RecentIncidents } from './recent-incidents'
import { DashboardCharts } from './dashboard-charts'
import type { Incident } from '@/lib/types'

interface MonitorStats {
  total: number
  up: number
  down: number
  degraded: number
  paused: number
}

interface CheckResultLike {
  status: string
  response_time_ms?: number | null
  checked_at: string
}

interface DashboardData {
  stats: MonitorStats
  incidents: Incident[]
  checkResults: CheckResultLike[]
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card stat-card" style={{ minHeight: 110, opacity: 0.5 }}>
          <div className="card-content-compact">
            <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, width: '60%', marginBottom: 8 }} />
            <div style={{ height: 28, background: 'var(--border)', borderRadius: 4, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WorkspaceDashboard(): React.ReactElement {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchStats(): Promise<void> {
      try {
        const url = currentWorkspace
          ? `/api/v1/dashboard/stats?workspaceId=${encodeURIComponent(currentWorkspace.id)}`
          : '/api/v1/dashboard/stats'

        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json() as { success: boolean; stats: MonitorStats; incidents: Incident[]; checkResults: CheckResultLike[] }
        if (!cancelled && json.success) {
          setData({ stats: json.stats, incidents: json.incidents, checkResults: json.checkResults })
        }
      } catch {
        // Silently fail — page still loads without charts
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [currentWorkspace])

  if (loading) return <LoadingSkeleton />

  const stats = data?.stats ?? { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  const incidents = data?.incidents ?? []
  const checkResults = data?.checkResults ?? []

  return (
    <>
      <StatsCards stats={stats} />
      <DashboardCharts stats={stats} incidents={incidents} checkResults={checkResults} />
      <div className="grid-2" style={{ marginTop: 24 }}>
        <RecentIncidents incidents={incidents} />
      </div>
    </>
  )
}
