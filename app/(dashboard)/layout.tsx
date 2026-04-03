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
import { TrialBanner } from '@/components/dashboard/trial-banner'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

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

  const isTrialing = subWithPlan?.subscription?.status === 'trialing'
  const trialEndsAt = subWithPlan?.subscription?.trial_ends_at ?? null

  return (
    <Providers user={user} organisation={organisation} workspaces={workspaces}>
      <div className="app-shell">
        <Sidebar />
        <div className="main-wrapper">
          {isImpersonating && <ImpersonationBanner userEmail={user.email} />}
          <Header />
          <EnvironmentBanner />
          {isTrialing && trialEndsAt && subWithPlan?.plan && (
            <TrialBanner trialEndsAt={trialEndsAt} planName={subWithPlan.plan.name} />
          )}
          <Breadcrumbs />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
