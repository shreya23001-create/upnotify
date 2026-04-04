export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/db/users'
import { getWorkspacesByOrg, getWorkspacesByOrgAdmin } from '@/lib/db/workspaces'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { EnvironmentBanner } from '@/components/dashboard/environment-banner'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'
import { OrgSwitchBanner } from '@/components/dashboard/org-switch-banner'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createAdminClient } from '@/lib/supabase/admin'

async function getOriginalOrgName(originalOrgId: string | null): Promise<string | null> {
  if (!originalOrgId) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('organisations').select('name').eq('id', originalOrgId).single()
  return data?.name ?? null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation, isImpersonating } = profile
  const [workspaces, subWithPlan] = await Promise.all([
    isImpersonating
      ? getWorkspacesByOrgAdmin(organisation.id)
      : getWorkspacesByOrg(organisation.id),
    getSubscriptionWithPlan(organisation.id),
  ])

  // Check if user is in an invited org (not their original)
  const originalOrgId = (user as unknown as Record<string, unknown>).original_org_id as string | null
  const isInInvitedOrg = originalOrgId && originalOrgId !== organisation.id
  const originalOrgName = isInInvitedOrg ? await getOriginalOrgName(originalOrgId) : null

  return (
    <Providers user={user} organisation={organisation} workspaces={workspaces}>
      <div className="app-shell">
        <Sidebar />
        <div className="main-wrapper">
          {isImpersonating && <ImpersonationBanner userEmail={user.email} />}
          {isInInvitedOrg && originalOrgName && (
            <OrgSwitchBanner
              currentOrgName={organisation.name}
              originalOrgId={originalOrgId}
              originalOrgName={originalOrgName}
            />
          )}
          <Header />
          <EnvironmentBanner />
          <Breadcrumbs />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
