'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MonitorStatusBadge } from './monitor-status-badge'
import type { Monitor } from '@/lib/types'

export function MonitorTable({ monitors }: { monitors: Monitor[] }) {
  if (monitors.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-sm text-zinc-500">No monitors yet. Create your first monitor to get started.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Checked</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monitors.map((monitor) => (
          <TableRow key={monitor.id}>
            <TableCell>
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="font-medium hover:underline"
              >
                {monitor.name}
              </Link>
            </TableCell>
            <TableCell className="capitalize">{monitor.type}</TableCell>
            <TableCell className="max-w-48 truncate text-zinc-500">
              {monitor.target}
            </TableCell>
            <TableCell>
              <MonitorStatusBadge status={monitor.status} />
            </TableCell>
            <TableCell className="text-zinc-500">
              {monitor.last_checked_at
                ? new Date(monitor.last_checked_at).toLocaleString()
                : 'Never'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
