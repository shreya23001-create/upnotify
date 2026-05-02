export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/db/users'
import { getWorkspacesByOrg, getWorkspacesByOrgAdmin } from '@/lib/db/workspaces'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { getDefaultCurrency } from '@/lib/utils/geo.server'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { EnvironmentBanner } from '@/components/dashboard/environment-banner'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'
import { OrgSwitchBanner } from '@/components/dashboard/org-switch-banner'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createAdminClient } from '@/lib/supabase/admin'

async function getOrgName(orgId: string | null): Promise<string | null> {
  if (!orgId) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('organisations').select('name').eq('id', orgId).single()
  return data?.name ?? null
}

// When user is back in their original org, find the invited org they can switch to
async function getAcceptedInviteOrg(userEmail: string, excludeOrgId: string): Promise<{ id: string; name: string } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('team_invites')
    .select('org_id, organisations!inner(name)')
    .eq('email', userEmail)
    .eq('status', 'accepted')
    .neq('org_id', excludeOrgId)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .single()
  if (!data) return null
  const orgName = (data.organisations as unknown as { name: string }).name
  return { id: data.org_id, name: orgName }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation, isImpersonating } = profile
  const [workspaces, subWithPlan, geoCurrency] = await Promise.all([
    isImpersonating
      ? getWorkspacesByOrgAdmin(organisation.id)
      : getWorkspacesByOrg(organisation.id),
    getSubscriptionWithPlan(organisation.id),
    getDefaultCurrency(),
  ])

  const sub = subWithPlan?.subscription as Record<string, unknown> | null
  const sidebarCurrency = sub?.razorpay_subscription_id ? 'inr'
    : sub?.stripe_subscription_id ? 'gbp'
    : geoCurrency

  // Org switching — user may be in their original org or an invited org
  const originalOrgId = (user as unknown as Record<string, unknown>).original_org_id as string | null
  const isInInvitedOrg = originalOrgId && originalOrgId !== organisation.id
  const isInOriginalOrg = originalOrgId && originalOrgId === organisation.id

  // Resolve names for both directions
  const [originalOrgName, invitedOrg] = await Promise.all([
    isInInvitedOrg ? getOrgName(originalOrgId) : Promise.resolve(null),
    isInOriginalOrg ? getAcceptedInviteOrg(user.email, organisation.id) : Promise.resolve(null),
  ])

  return (
    <Providers user={user} organisation={organisation} workspaces={workspaces}>
      <div className="app-shell">
        <Sidebar currency={sidebarCurrency} />
        <div className="main-wrapper">
          {isImpersonating && <ImpersonationBanner userEmail={user.email} />}
          {isInInvitedOrg && originalOrgName && (
            <OrgSwitchBanner
              currentOrgName={organisation.name}
              targetOrgId={originalOrgId}
              targetOrgName={originalOrgName}
              label="Switch back to"
            />
          )}
          {isInOriginalOrg && invitedOrg && (
            <OrgSwitchBanner
              currentOrgName={organisation.name}
              targetOrgId={invitedOrg.id}
              targetOrgName={invitedOrg.name}
              label="Switch to"
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
