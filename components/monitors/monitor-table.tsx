'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Radio, Search } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MonitorStatusBadge } from './monitor-status-badge'
import { TimelineBarGraph } from '@/components/ui/timeline-bar-graph'
import { MonitorTypeIcon } from './monitor-type-icon'
import { MonitorRowActions } from './monitor-row-actions'
import { pauseMonitorAction, resumeMonitorAction, deleteMonitorAction, bulkDeleteMonitorsAction, bulkPauseMonitorsAction, bulkResumeMonitorsAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { Pagination } from '@/components/ui/pagination'
import type { Monitor } from '@/lib/types'
import type { PaginationMeta } from '@/lib/utils/pagination'

interface UptimeSlot { slot: string; timestamp: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface MonitorTableProps {
  monitors: Monitor[]
  uptimeData: Record<string, UptimeSlot[]>
  initialSearch?: string
  initialStatus?: string
  initialType?: string
  pagination?: PaginationMeta
}

interface PendingConfirm {
  type: 'delete' | 'bulk-delete' | 'pause' | 'bulk-pause' | 'bulk-resume'
  ids: string[]
  isPaused?: boolean
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const STATUS_ORDER = ['', 'up', 'down', 'degraded', 'paused', 'unknown']
const TYPE_OPTIONS = [
  { label: 'HTTP', value: 'http' },
  { label: 'SSL', value: 'ssl' },
  { label: 'DNS', value: 'dns' },
  { label: 'Keyword', value: 'keyword' },
  { label: 'Domain', value: 'domain' },
  { label: 'Port', value: 'port' },
  { label: 'Ping', value: 'ping' },
  { label: 'API', value: 'api' },
  { label: 'Heartbeat', value: 'heartbeat' },
  { label: 'Competitor', value: 'competitor' },
  { label: 'Security Headers', value: 'security-headers' },
  { label: 'Response Time', value: 'response-time' },
  { label: 'robots.txt', value: 'robots-txt' },
  { label: 'IP Change', value: 'ip-change' },
  { label: 'MX Health', value: 'mx-health' },
  { label: 'WHOIS Change', value: 'whois-change' },
  { label: 'Sitemap', value: 'sitemap' },
  { label: 'Redirect Chain', value: 'redirect-chain' },
  { label: 'SPF / DMARC', value: 'spf-dmarc' },
  { label: 'Blacklist', value: 'blacklist' },
  { label: 'Page Size', value: 'page-size' },
  { label: 'Cookie Consent', value: 'cookie-consent' },
  { label: 'Nameservers', value: 'nameserver-change' },
]

export function MonitorTable({ monitors, uptimeData, initialSearch = '', initialStatus = '', initialType = '', pagination }: MonitorTableProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [pathname, router, searchParams])

  const [searchInput, setSearchInput] = useState(initialSearch)
  useEffect(() => { setSearchInput(initialSearch) }, [initialSearch])
  useEffect(() => {
    if (searchInput === initialSearch) return
    const t = setTimeout(() => startTransition(() => updateParams({ search: searchInput })), 400)
    return () => clearTimeout(t)
  }, [searchInput, initialSearch, updateParams, startTransition])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === monitors.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(monitors.map(m => m.id)))
  }

  function executeConfirm() {
    if (!pendingConfirm) return
    const { type, ids, isPaused } = pendingConfirm
    setPendingConfirm(null)
    setSelectedIds(new Set())
    startTransition(async () => {
      switch (type) {
        case 'delete': await deleteMonitorAction(ids[0]); break
        case 'bulk-delete': await bulkDeleteMonitorsAction(ids); break
        case 'pause':
          if (isPaused) await resumeMonitorAction(ids[0])
          else await pauseMonitorAction(ids[0])
          break
        case 'bulk-pause': await bulkPauseMonitorsAction(ids); break
        case 'bulk-resume': await bulkResumeMonitorsAction(ids); break
      }
    })
  }

  function getConfirmProps(): { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' } {
    if (!pendingConfirm) return { title: '', message: '', confirmText: '', variant: 'danger' }
    switch (pendingConfirm.type) {
      case 'delete': return { title: 'Delete Monitor', message: 'This monitor and all its check history will be permanently deleted.', confirmText: 'Delete', variant: 'danger' }
      case 'bulk-delete': return { title: `Delete ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitors and all their history will be permanently deleted.`, confirmText: 'Delete All', variant: 'danger' }
      case 'pause': return { title: pendingConfirm.isPaused ? 'Resume Monitor' : 'Pause Monitor', message: pendingConfirm.isPaused ? 'This monitor will start checking again.' : 'This monitor will stop checking until resumed.', confirmText: pendingConfirm.isPaused ? 'Resume' : 'Pause', variant: 'warning' }
      case 'bulk-pause': return { title: `Pause ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitors will stop checking until resumed.`, confirmText: 'Pause All', variant: 'warning' }
      case 'bulk-resume': return { title: `Resume ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitors will start checking again.`, confirmText: 'Resume All', variant: 'warning' }
    }
  }

  const confirmProps = getConfirmProps()
  const allSelected = monitors.length > 0 && selectedIds.size === monitors.length
  const someSelected = selectedIds.size > 0

  if (monitors.length === 0 && !initialSearch && !initialStatus && !initialType) {
    return (
      <div className="mon-empty-state">
        <div className="mon-empty-state-icon"><Radio size={30} strokeWidth={1.5} /></div>
        <h3>No monitors yet</h3>
        <p>Start monitoring your websites, APIs, and other important endpoints — you&apos;ll see uptime, response time, and alerts here once you add one.</p>
        <Link href="/dashboard/monitors/new/manual" className="btn btn-primary">
          + Add Monitor
        </Link>
      </div>
    )
  }

  return (
    <div className="mon-list-wrap">
      {/* Toolbar */}
      <div className="mon-toolbar">
        <div className="mon-toolbar-left">
          <div className="mon-search-wrap">
            <Search size={15} className="mon-search-icon" />
            <input
              className="mon-search"
              type="text"
              placeholder="Search monitors…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div className="mon-filter-row">
            <select
              className="mon-filter-select"
              value={initialStatus}
              onChange={e => updateParams({ status: e.target.value })}
            >
              <option value="">All Statuses</option>
              {STATUS_ORDER.slice(1).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              className="mon-filter-select"
              value={initialType}
              onChange={e => updateParams({ type: e.target.value })}
            >
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {someSelected && (
          <div className="mon-bulk-bar">
            <span className="mon-bulk-count">{selectedIds.size} selected</span>
            <div className="mon-bulk-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => setPendingConfirm({ type: 'bulk-pause', ids: Array.from(selectedIds) })}>Pause</button>
              <button className="btn btn-sm btn-secondary" onClick={() => setPendingConfirm({ type: 'bulk-resume', ids: Array.from(selectedIds) })}>Resume</button>
              <button className="btn btn-sm btn-ghost" style={{ color: '#dc2626' }} onClick={() => setPendingConfirm({ type: 'bulk-delete', ids: Array.from(selectedIds) })}>Delete</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelectedIds(new Set())}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* Header row */}
      <div className="mon-list-header">
        <div className="mon-col-check">
          <input type="checkbox" className="mon-checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
        </div>
        <div className="mon-col-name">Monitor</div>
        <div className="mon-col-type">Type</div>
        <div className="mon-col-status">Status</div>
        <div className="mon-col-uptime">Uptime (24h)</div>
        <div className="mon-col-checked">Last Checked</div>
        <div className="mon-col-checked">Actions</div>
      </div>

      {/* Monitor rows */}
      <div className="mon-list">
        {monitors.length === 0 ? (
          <div className="mon-empty-filtered">
            <Search size={22} strokeWidth={1.5} />
            <span>No monitors match your filters.</span>
          </div>
        ) : monitors.map(m => {
          const isSelected = selectedIds.has(m.id)
          const slotSeconds = Math.max(m.check_interval_seconds, Math.ceil(86400 / 288))
          const numSlots = Math.floor(86400 / slotSeconds)
          const detailHref = m.type === 'wordpress' ? `/dashboard/monitors/${m.id}/wordpress` : `/dashboard/monitors/${m.id}`
          const statusClass = m.status === 'down' ? 'mon-row--down' : m.status === 'degraded' ? 'mon-row--degraded' : m.status === 'paused' ? 'mon-row--paused' : 'mon-row--up'

          return (
            <div key={m.id} className={`mon-row ${statusClass}${isSelected ? ' mon-row--selected' : ''}`}>
              <div className="mon-col-check">
                <input type="checkbox" className="mon-checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)} aria-label={`Select ${m.name}`} />
              </div>

              <div className="mon-col-name">
                <Link href={detailHref} className="mon-name">{m.name}</Link>
                <a
                  href={/^https?:\/\//i.test(m.target) ? m.target : `https://${m.target}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mon-url"
                >
                  {m.target.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
                {/* Mobile-only: status + type below name */}
                <div className="mon-mobile-meta">
                  <MonitorStatusBadge status={m.status} monitorType={m.type} />
                  <span className="mon-type-chip"><MonitorTypeIcon type={m.type} /></span>
                </div>
              </div>

              {/* Desktop-only columns */}
              <div className="mon-col-type">
                <span className="mon-type-chip">
                  <MonitorTypeIcon type={m.type} />
                </span>
              </div>

              <div className="mon-col-status">
                <MonitorStatusBadge status={m.status} monitorType={m.type} />
              </div>

              <div className="mon-col-uptime">
                <TimelineBarGraph
                  data={(uptimeData[m.id] || []).map(s => ({ timestamp: s.timestamp, status: s.status }))}
                  intervalSeconds={slotSeconds}
                  maxBars={numSlots}
                  height={24}
                  showFooter={false}
                />
              </div>

              <div className="mon-col-checked">
                <span className="mon-last-checked">
                  {m.last_checked_at ? timeAgo(m.last_checked_at) : '—'}
                </span>
              </div>

              <div className="mon-col-actions">
                <MonitorRowActions
                  detailHref={detailHref}
                  editHref={`/dashboard/monitors/${m.id}/edit`}
                  isPaused={m.is_paused}
                  disabled={isPending}
                  onTogglePause={() => setPendingConfirm({ type: 'pause', ids: [m.id], isPaused: m.is_paused })}
                  onDelete={() => setPendingConfirm({ type: 'delete', ids: [m.id] })}
                />
              </div>
            </div>
          )
        })}
      </div>

      {pagination && <Pagination {...pagination} />}

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        variant={confirmProps.variant}
      />
    </div>
  )
}
