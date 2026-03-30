'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Workspace } from '@/lib/types'

export function ClientWorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link href={`/dashboard/clients/${workspace.id}`}>
      <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{workspace.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">/{workspace.slug}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
