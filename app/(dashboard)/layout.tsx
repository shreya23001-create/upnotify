export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { EnvironmentBanner } from '@/components/dashboard/environment-banner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const workspaces = await getWorkspacesByOrg(organisation.id)

  return (
    <Providers user={user} organisation={organisation} workspaces={workspaces}>
      <div className="app-shell">
        <Sidebar />
        <div className="main-wrapper">
          <Header />
          <EnvironmentBanner />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
