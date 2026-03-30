import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function MonitorsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace
    ? await getMonitorsByWorkspace(defaultWorkspace.id)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitors</h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Monitor
        </Button>
      </div>
      <MonitorTable monitors={monitors} />
    </div>
  )
}
