import { redirect } from 'next/navigation'
import { getUserProfile, getUsersByOrg } from '@/lib/db/users'
import { getSubscription, getInvoices, getAllVisiblePlans, getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { SettingsContent } from '@/components/dashboard/settings/settings-content'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const [members, subscription, invoices, apiKeys, plans, subscriptionWithPlan, teamLimit] = await Promise.all([
    getUsersByOrg(organisation.id),
    getSubscription(organisation.id),
    getInvoices(organisation.id),
    getApiKeysByOrg(organisation.id),
    getAllVisiblePlans(),
    getSubscriptionWithPlan(organisation.id),
    checkTeamMemberLimit(organisation.id),
  ])

  const currentPlan = subscriptionWithPlan?.plan ?? null

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Settings</h1>
      <SettingsContent
        organisation={organisation}
        members={members}
        currentUserId={user.id}
        currentUserRole={user.role}
        subscription={subscription}
        invoices={invoices}
        apiKeys={apiKeys}
        plans={plans}
        currentPlan={currentPlan}
        teamMemberLimit={teamLimit.limit}
        teamMemberCount={teamLimit.currentCount}
        canInvite={teamLimit.allowed}
      />
    </div>
  )
}
