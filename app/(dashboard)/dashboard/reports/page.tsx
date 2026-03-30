import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getReportsByWorkspace } from '@/lib/db/reports'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const reports = defaultWorkspace
    ? await getReportsByWorkspace(defaultWorkspace.id)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-zinc-500">
              No reports generated yet. Reports will be available once monitoring data is collected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium capitalize">{report.type} Report</p>
                  <p className="text-xs text-zinc-500">
                    {report.period_start} — {report.period_end}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(report.generated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
