'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { deleteAlertChannelAction, toggleAlertChannelAction } from '@/app/(dashboard)/dashboard/alerts/actions'
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

export function AlertChannelsTable({ channels }: { channels: AlertChannel[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, currentlyEnabled: boolean): void {
    startTransition(async () => {
      await toggleAlertChannelAction(id, !currentlyEnabled)
    })
  }

  function handleDelete(id: string): void {
    if (!confirm('Delete this alert channel? This cannot be undone.')) return
    startTransition(async () => {
      await deleteAlertChannelAction(id)
    })
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

  const bulkActions: BulkAction[] = [
    { label: 'Delete', onClick: () => { /* TODO: bulk delete */ }, variant: 'danger' },
  ]

  return (
    <DataTable
      columns={columns}
      data={channels}
      searchPlaceholder="Search alert channels..."
      filters={filters}
      bulkActions={bulkActions}
      emptyMessage="No alert channels configured. Add a channel to receive downtime notifications."
    />
  )
}
