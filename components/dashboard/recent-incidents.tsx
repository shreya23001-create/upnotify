'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Incident } from '@/lib/types'

const severityVariant: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  P1: 'destructive',
  P2: 'destructive',
  P3: 'secondary',
  P4: 'outline',
}

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-sm text-zinc-500">No incidents recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{incident.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(incident.started_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={severityVariant[incident.severity] ?? 'secondary'}>
                    {incident.severity}
                  </Badge>
                  <Badge variant={incident.status === 'resolved' ? 'outline' : 'secondary'}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
