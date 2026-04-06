'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import type { PublicMonitor } from '@/lib/db/public-monitors'

interface Props {
  initialMonitors: PublicMonitor[]
  initialPage: number
  initialTotalPages: number
  selectedCategory?: string
}

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Operational'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Unknown'
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function groupByCategory(monitors: PublicMonitor[]): Record<string, PublicMonitor[]> {
  const groups: Record<string, PublicMonitor[]> = {}
  for (const m of monitors) {
    const cat = m.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(m)
  }
  return groups
}

export function TrackerInfiniteGrid({
  initialMonitors,
  initialPage,
  initialTotalPages,
  selectedCategory,
}: Props): React.ReactElement {
  const [monitors, setMonitors] = useState<PublicMonitor[]>(initialMonitors)
  const [page, setPage] = useState(initialPage)
  const [totalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchMore = useCallback(async () => {
    const nextPage = page + 1
    if (nextPage > totalPages || loading) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(nextPage) })
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      const res = await fetch(`/api/v1/tracker/monitors?${params}`)
      if (!res.ok) return
      const data = await res.json() as { monitors: PublicMonitor[] }
      setMonitors(prev => [...prev, ...data.monitors])
      setPage(nextPage)
    } finally {
      setLoading(false)
    }
  }, [page, totalPages, loading, selectedCategory])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchMore()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchMore])

  const downMonitors = monitors.filter((m) => m.last_status === 'down')
  const grouped = groupByCategory(monitors)
  const categoryNames = Object.keys(grouped).sort()

  return (
    <>
      {downMonitors.length > 0 && (
        <div className="tracker-section tracker-down-section">
          <h2 className="tracker-section-title tracker-down-title">Currently Down</h2>
          <div className="tracker-grid">
            {downMonitors.map((m) => (
              <Link key={m.id} href={`/tracker/${m.domain}`} className="tracker-card tracker-card-down">
                <div className="tracker-card-header">
                  <span className="tracker-status-dot" style={{ background: getStatusColor(m.last_status) }} />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span className="tracker-card-status" style={{ color: getStatusColor(m.last_status) }}>
                    {getStatusLabel(m.last_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categoryNames.map((category) => (
        <div key={category} className="tracker-section">
          <h2 className="tracker-section-title">{category}</h2>
          <div className="tracker-grid">
            {grouped[category].map((m) => (
              <Link key={m.id} href={`/tracker/${m.domain}`} className="tracker-card">
                <div className="tracker-card-header">
                  <span className="tracker-status-dot" style={{ background: getStatusColor(m.last_status) }} />
                  <span className="tracker-card-name">{m.display_name}</span>
                </div>
                <div className="tracker-card-meta">
                  <span className="tracker-card-domain">{m.domain}</span>
                  <span className="tracker-card-response">{formatResponseTime(m.last_response_time_ms)}</span>
                </div>
                <div className="tracker-card-footer">
                  <span className="tracker-card-status" style={{ color: getStatusColor(m.last_status) }}>
                    {getStatusLabel(m.last_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Intersection observer sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {loading && (
        <div className="tracker-loading">
          <span className="tracker-loading-spinner" />
          Loading more...
        </div>
      )}
    </>
  )
}
