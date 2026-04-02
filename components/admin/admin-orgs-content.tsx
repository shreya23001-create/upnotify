'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { Organisation } from '@/lib/types'

interface AdminOrgsContentProps {
  organisations: Organisation[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminOrgsContent({ organisations }: AdminOrgsContentProps): React.ReactElement {
  const columns: Column<Organisation>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (o) => <span style={{ fontWeight: 500 }}>{o.name}</span>,
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (o) => <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.slug}</code>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (o) => (
        <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
          {o.type ?? 'direct'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      searchable: false,
      render: (o) => <span>{formatDate(o.created_at)}</span>,
    },
  ]

  const filters = [
    {
      key: 'type',
      label: 'All Types',
      options: [
        { label: 'Direct', value: 'direct' },
        { label: 'Agency', value: 'agency' },
      ],
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={organisations}
      searchPlaceholder="Search organisations by name..."
      filters={filters}
      pageSize={50}
      emptyMessage="No organisations found."
    />
  )
}
