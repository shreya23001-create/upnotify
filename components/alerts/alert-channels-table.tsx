'use client'

import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import type { AlertChannel } from '@/lib/types'

const typeLabels: Record<string, string> = {
  email: '\u{1F4E7} Email',
  slack: '\u{1F4AC} Slack',
  teams: '\u{1F465} Teams',
  whatsapp: '\u{1F4F1} WhatsApp',
  voice: '\u{1F4DE} Voice',
  webhook: '\u{1F517} Webhook',
}

export function AlertChannelsTable({ channels }: { channels: AlertChannel[] }) {
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
