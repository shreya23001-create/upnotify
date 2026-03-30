import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getReportsByWorkspace } from '@/lib/db/reports'

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const reports = defaultWorkspace ? await getReportsByWorkspace(defaultWorkspace.id) : []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <button className="btn btn-primary" disabled>+ Generate Report</button>
      </div>
      {reports.length === 0 ? (
        <div className="empty-state"><p>No reports generated yet. Reports will be available once monitoring data is collected.</p></div>
      ) : (
        <div className="space-y-sm">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="card-content-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, textTransform: 'capitalize' }}>{report.type} Report</div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>{report.period_start} — {report.period_end}</div>
                </div>
                <span style={{ fontSize: 12, color: '#71717a' }}>{new Date(report.generated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
