'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MonitorStatusBadge } from './monitor-status-badge'
import { TimelineBarGraph } from '@/components/ui/timeline-bar-graph'
import { MonitorTypeIcon } from './monitor-type-icon'
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

export function MonitorTable({ monitors, uptimeData, initialSearch = '', initialStatus = '', initialType = '', pagination }: MonitorTableProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Push search/filter changes into the URL so the server query (the single
  // source of truth for pagination) re-runs. Always reset to page 1.
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

  // Local search box value for snappy typing; pushed to the URL (debounced).
  const [searchInput, setSearchInput] = useState(initialSearch)
  useEffect(() => { setSearchInput(initialSearch) }, [initialSearch])
  useEffect(() => {
    if (searchInput === initialSearch) return
    const t = setTimeout(() => updateParams({ search: searchInput }), 400)
    return () => clearTimeout(t)
  }, [searchInput, initialSearch, updateParams])

  function handlePauseResume(id: string, isPaused: boolean): void {
    setPendingConfirm({ type: 'pause', ids: [id], isPaused })
  }

  function handleDelete(id: string): void {
    setPendingConfirm({ type: 'delete', ids: [id] })
  }

  function executeConfirm(): void {
    if (!pendingConfirm) return
    const { type, ids, isPaused } = pendingConfirm
    setPendingConfirm(null)

    startTransition(async () => {
      switch (type) {
        case 'delete':
          await deleteMonitorAction(ids[0])
          break
        case 'bulk-delete':
          await bulkDeleteMonitorsAction(ids)
          break
        case 'pause':
          if (isPaused) {
            await resumeMonitorAction(ids[0])
          } else {
            await pauseMonitorAction(ids[0])
          }
          break
        case 'bulk-pause':
          await bulkPauseMonitorsAction(ids)
          break
        case 'bulk-resume':
          await bulkResumeMonitorsAction(ids)
          break
      }
    })
  }

  function getConfirmProps(): { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' } {
    if (!pendingConfirm) return { title: '', message: '', confirmText: '', variant: 'danger' }
    switch (pendingConfirm.type) {
      case 'delete':
        return { title: 'Delete Monitor', message: 'This monitor and all its check history will be permanently deleted. This action cannot be undone.', confirmText: 'Delete', variant: 'danger' }
      case 'bulk-delete':
        return { title: `Delete ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitor(s) and all their check history will be permanently deleted. This action cannot be undone.`, confirmText: 'Delete All', variant: 'danger' }
      case 'pause':
        return { title: pendingConfirm.isPaused ? 'Resume Monitor' : 'Pause Monitor', message: pendingConfirm.isPaused ? 'This monitor will start checking again.' : 'This monitor will stop checking until resumed.', confirmText: pendingConfirm.isPaused ? 'Resume' : 'Pause', variant: 'warning' }
      case 'bulk-pause':
        return { title: `Pause ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitor(s) will stop checking until resumed.`, confirmText: 'Pause All', variant: 'warning' }
      case 'bulk-resume':
        return { title: `Resume ${pendingConfirm.ids.length} Monitor(s)`, message: `${pendingConfirm.ids.length} monitor(s) will start checking again.`, confirmText: 'Resume All', variant: 'warning' }
    }
  }

  const columns: Column<Monitor>[] = [
    { key: 'type', label: 'Type', render: (m) => <MonitorTypeIcon type={m.type} /> },
    { key: 'name', label: 'Name', render: (m) => <Link href={m.type === 'wordpress' ? `/dashboard/monitors/${m.id}/wordpress` : `/dashboard/monitors/${m.id}`} className="table-link">{m.name}</Link> },
    { key: 'target', label: 'URL', render: (m) => (
      <a
        href={m.target}
        target="_blank"
        rel="noopener noreferrer"
        className="table-link"
        title={m.target}
        style={{ display: 'inline-block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
      >
        {m.target.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </a>
    ) },
    { key: 'uptime', label: 'Uptime (24h)', sortable: false, searchable: false, render: (m) => {
      const slotSeconds = Math.max(m.check_interval_seconds, Math.ceil(86400 / 288))
      const numSlots    = Math.floor(86400 / slotSeconds)
      return (
        <TimelineBarGraph
          data={(uptimeData[m.id] || []).map(s => ({ timestamp: s.timestamp, status: s.status }))}
          intervalSeconds={slotSeconds}
          maxBars={numSlots}
          height={24}
          showFooter={false}
        />
      )
    }},
    { key: 'status', label: 'Status', render: (m) => <MonitorStatusBadge status={m.status} monitorType={m.type} /> },
    { key: 'last_checked_at', label: 'Last Checked', render: (m) => <span className="table-muted">{m.last_checked_at ? timeAgo(m.last_checked_at) : 'Never'}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      searchable: false,
      render: (m) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Link href={`/dashboard/monitors/${m.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handlePauseResume(m.id, m.is_paused)}
            disabled={isPending}
          >
            {m.is_paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            style={{ color: '#dc2626' }}
            onClick={() => handleDelete(m.id)}
            disabled={isPending}
          >
            Delete
          </button>
        </span>
      ),
    },
  ]

  const filters = [
    { key: 'status', label: 'All Statuses', options: [
      { label: 'Up', value: 'up' },
      { label: 'Down', value: 'down' },
      { label: 'Degraded', value: 'degraded' },
      { label: 'Paused', value: 'paused' },
      { label: 'Unknown', value: 'unknown' },
    ]},
    { key: 'type', label: 'All Types', options: [
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
      { label: 'Nameserver Change', value: 'nameserver-change' },
    ]},
  ]

  function handleBulkPause(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-pause', ids: selectedIds })
  }

  function handleBulkResume(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-resume', ids: selectedIds })
  }

  function handleBulkDelete(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-delete', ids: selectedIds })
  }

  const bulkActions: BulkAction[] = [
    { label: 'Pause', onClick: handleBulkPause },
    { label: 'Resume', onClick: handleBulkResume },
    { label: 'Delete', onClick: handleBulkDelete, variant: 'danger' },
  ]

  const confirmProps = getConfirmProps()

  return (
    <>
      <DataTable
        columns={columns}
        data={monitors}
        searchPlaceholder="Search monitors..."
        serverMode
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controlledFilterValues={{ status: initialStatus, type: initialType }}
        onFilterChange={(key, value) => updateParams({ [key]: value })}
        filters={filters}
        bulkActions={bulkActions}
        emptyIcon="📡"
        emptyMessage="No monitors yet. Create your first monitor to get started."
        emptyAction={{ label: '+ Add Your First Monitor', href: '/dashboard/monitors/scan' }}
      />
      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        variant={confirmProps.variant}
      />
      {pagination && <Pagination {...pagination} />}
    </>
  )
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
