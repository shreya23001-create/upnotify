import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { MonitorStatusBadge } from '@/components/monitors/monitor-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const monitor = await getMonitorById(id)
  if (!monitor) notFound()

  const incidents = await getIncidentsByWorkspace(monitor.workspace_id, { limit: 5 })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{monitor.name}</h1>
        <MonitorStatusBadge status={monitor.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Type" value={monitor.type} />
            <InfoRow label="Target" value={monitor.target} />
            <InfoRow label="Check Interval" value={`${monitor.check_interval_seconds}s`} />
            <InfoRow label="Timeout" value={`${monitor.timeout_ms}ms`} />
            <InfoRow label="Severity" value={monitor.severity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              Check history chart will appear here once monitoring is active.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-zinc-500">No incidents for this monitor.</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm">{inc.title}</span>
                  <Badge variant={inc.status === 'resolved' ? 'outline' : 'destructive'}>
                    {inc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
