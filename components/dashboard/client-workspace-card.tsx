'use client'

import Link from 'next/link'
import type { Workspace } from '@/lib/types'

export function ClientWorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link href={`/dashboard/clients/${workspace.id}`}>
      <div className="card card-link">
        <div className="card-content-compact">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{workspace.name}</div>
          <div style={{ fontSize: 14, color: '#71717a' }}>/{workspace.slug}</div>
        </div>
      </div>
    </Link>
  )
}
