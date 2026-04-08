import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { WorkspaceDashboard } from '@/components/dashboard/workspace-dashboard'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Dashboard</div>
          <div className="db-page-sub">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="db-page-actions">
          <Link href="/dashboard/reports/new" className="btn btn-ghost btn-sm">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Generate Report
          </Link>
          <Link href="/dashboard/monitors/new" className="btn btn-primary btn-sm">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Monitor
          </Link>
        </div>
      </div>

      <WorkspaceDashboard />
    </div>
  )
}
