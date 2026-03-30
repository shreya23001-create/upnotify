import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspaceById } from '@/lib/db/workspaces'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const workspace = await getWorkspaceById(id)
  if (!workspace) notFound()

  const [monitors, incidents] = await Promise.all([
    getMonitorsByWorkspace(workspace.id),
    getIncidentsByWorkspace(workspace.id, { limit: 5 }),
  ])

  const openIncidents = incidents.filter((i) => i.status !== 'resolved')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        {openIncidents.length > 0 && (
          <Badge variant="destructive">{openIncidents.length} open incidents</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitors.filter((m) => m.status === 'up').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {monitors.filter((m) => m.status === 'down').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <MonitorTable monitors={monitors} />
    </div>
  )
}
