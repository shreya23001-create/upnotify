import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'

export default async function StatusPagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const statusPages = defaultWorkspace ? await getStatusPagesByWorkspace(defaultWorkspace.id) : []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Status Pages</h1>
        <button className="btn btn-primary" disabled>+ Create Status Page</button>
      </div>
      {statusPages.length === 0 ? (
        <div className="empty-state"><p>No status pages yet. Create one to share uptime status with your users.</p></div>
      ) : (
        <div className="space-y-sm">
          {statusPages.map((page) => (
            <div key={page.id} className="card">
              <div className="card-content-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{page.name}</div>
                  <div style={{ fontSize: 14, color: '#71717a' }}>/status/{page.slug}</div>
                </div>
                <span className={`badge ${page.is_published ? 'badge-success' : 'badge-outline'}`}>
                  {page.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
