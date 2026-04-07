'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteAlertChannelAction, toggleAlertChannelAction, bulkDeleteAlertChannelsAction, bulkEnableAlertChannelsAction, bulkDisableAlertChannelsAction } from '@/app/(dashboard)/dashboard/alerts/actions'
import { useToast } from '@/components/ui/toast'
import type { AlertChannel } from '@/lib/types'

const typeLabels: Record<string, string> = {
  email: '📧 Email',
  slack: '💬 Slack',
  teams: '👥 Teams',
  whatsapp: '📱 WhatsApp',
  voice: '📞 Voice',
  webhook: '🔗 Webhook',
}

interface ChannelConfig {
  email?: string
  slackWebhookUrl?: string
  slackChannel?: string
  teamsWebhookUrl?: string
  webhookUrl?: string
}

function getDestination(channel: AlertChannel): string {
  const config = channel.config as ChannelConfig
  switch (channel.type) {
    case 'email': return config.email || '—'
    case 'slack': return config.slackChannel || config.slackWebhookUrl?.slice(0, 40) + '...' || '—'
    case 'teams': return config.teamsWebhookUrl?.slice(0, 40) + '...' || '—'
    case 'webhook': return config.webhookUrl?.slice(0, 40) + '...' || '—'
    default: return '—'
  }
}

interface PendingConfirm {
  type: 'delete' | 'bulk-delete' | 'bulk-enable' | 'bulk-disable'
  ids: string[]
}

export function AlertChannelsTable({ channels }: { channels: AlertChannel[] }) {
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null)
  const toast = useToast()

  async function handleTestAlert(channelId: string): Promise<void> {
    setTestingChannelId(channelId)
    try {
      const res = await fetch('/api/v1/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      const data: { success?: boolean; error?: string; message?: string } = await res.json()
      if (res.ok && data.success) {
        toast.addToast(data.message || 'Test alert sent successfully.', 'success')
      } else {
        toast.addToast(data.error || 'Failed to send test alert.', 'error')
      }
    } catch {
      toast.addToast('Failed to send test alert. Check your connection.', 'error')
    } finally {
      setTestingChannelId(null)
    }
  }

  function handleToggle(id: string, currentlyEnabled: boolean): void {
    startTransition(async () => {
      await toggleAlertChannelAction(id, !currentlyEnabled)
    })
  }

  function handleDelete(id: string): void {
    setPendingConfirm({ type: 'delete', ids: [id] })
  }

  function executeConfirm(): void {
    if (!pendingConfirm) return
    const { type, ids } = pendingConfirm
    setPendingConfirm(null)

    startTransition(async () => {
      switch (type) {
        case 'delete':
          await deleteAlertChannelAction(ids[0])
          break
        case 'bulk-delete':
          await bulkDeleteAlertChannelsAction(ids)
          break
        case 'bulk-enable':
          await bulkEnableAlertChannelsAction(ids)
          break
        case 'bulk-disable':
          await bulkDisableAlertChannelsAction(ids)
          break
      }
    })
  }

  function getConfirmProps(): { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' } {
    if (!pendingConfirm) return { title: '', message: '', confirmText: '', variant: 'danger' }
    switch (pendingConfirm.type) {
      case 'delete':
        return { title: 'Delete Alert Channel', message: 'This alert channel will be permanently deleted. You will no longer receive notifications through it. This action cannot be undone.', confirmText: 'Delete', variant: 'danger' }
      case 'bulk-delete':
        return { title: `Delete ${pendingConfirm.ids.length} Alert Channel(s)`, message: `${pendingConfirm.ids.length} alert channel(s) will be permanently deleted. This action cannot be undone.`, confirmText: 'Delete All', variant: 'danger' }
      case 'bulk-enable':
        return { title: `Enable ${pendingConfirm.ids.length} Alert Channel(s)`, message: `${pendingConfirm.ids.length} alert channel(s) will be enabled and start sending notifications.`, confirmText: 'Enable All', variant: 'warning' }
      case 'bulk-disable':
        return { title: `Disable ${pendingConfirm.ids.length} Alert Channel(s)`, message: `${pendingConfirm.ids.length} alert channel(s) will be disabled. You will stop receiving notifications through them.`, confirmText: 'Disable All', variant: 'warning' }
    }
  }

  const columns: Column<AlertChannel>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (ch) => <span style={{ fontWeight: 500 }}>{typeLabels[ch.type] || ch.type}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (ch) => <span style={{ fontWeight: 600 }}>{ch.name}</span>,
    },
    {
      key: 'destination',
      label: 'Destination',
      sortable: false,
      searchable: false,
      render: (ch) => (
        <span className="table-muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {getDestination(ch)}
        </span>
      ),
    },
    {
      key: 'severity_filter',
      label: 'Severities',
      sortable: false,
      searchable: false,
      render: (ch) => {
        const filters = (ch.severity_filter || []) as string[]
        return (
          <span style={{ display: 'flex', gap: 4 }}>
            {filters.map((s) => (
              <span
                key={s}
                className={`badge ${s === 'P1' || s === 'P2' ? 'badge-danger' : 'badge-muted'}`}
                style={{ fontSize: 11 }}
              >
                {s}
              </span>
            ))}
          </span>
        )
      },
    },
    {
      key: 'is_enabled',
      label: 'Status',
      render: (ch) => (
        <span className={`badge ${ch.is_enabled ? 'badge-success' : 'badge-outline'}`}>
          <span
            className={`status-dot ${ch.is_enabled ? 'status-dot-up' : 'status-dot-paused'}`}
            style={{ marginRight: 6 }}
          />
          {ch.is_enabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      searchable: false,
      render: (ch) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleTestAlert(ch.id)}
            disabled={testingChannelId === ch.id}
          >
            {testingChannelId === ch.id ? 'Sending...' : 'Test'}
          </button>
          <Link href={`/dashboard/alerts/${ch.id}`} className="btn btn-sm btn-secondary">
            Edit
          </Link>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleToggle(ch.id, ch.is_enabled)}
            disabled={isPending}
          >
            {ch.is_enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            style={{ color: '#dc2626' }}
            onClick={() => handleDelete(ch.id)}
            disabled={isPending}
          >
            Delete
          </button>
        </span>
      ),
    },
  ]

  const filters = [
    {
      key: 'type',
      label: 'All Types',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Slack', value: 'slack' },
        { label: 'Teams', value: 'teams' },
        { label: 'Webhook', value: 'webhook' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Voice', value: 'voice' },
      ],
    },
  ]

  function handleBulkDelete(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-delete', ids: selectedIds })
  }

  function handleBulkEnable(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-enable', ids: selectedIds })
  }

  function handleBulkDisable(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-disable', ids: selectedIds })
  }

  const bulkActions: BulkAction[] = [
    { label: 'Enable', onClick: handleBulkEnable },
    { label: 'Disable', onClick: handleBulkDisable },
    { label: 'Delete', onClick: handleBulkDelete, variant: 'danger' },
  ]

  const confirmProps = getConfirmProps()

  return (
    <>
      <DataTable
        columns={columns}
        data={channels}
        searchPlaceholder="Search alert channels..."
        filters={filters}
        bulkActions={bulkActions}
        emptyIcon="🔔"
        emptyMessage="No alert channels configured. Add a channel to receive downtime notifications."
        emptyAction={{ label: '+ Add Channel', href: '/dashboard/alerts/new' }}
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
    </>
  )
}
