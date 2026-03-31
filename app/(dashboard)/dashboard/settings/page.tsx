import { redirect } from 'next/navigation'
import { getUserProfile, getUsersByOrg } from '@/lib/db/users'
import { getSubscription, getInvoices, getAllVisiblePlans, getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { SettingsContent } from '@/components/dashboard/settings/settings-content'

export default async function SettingsPage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const [members, subscription, invoices, apiKeys, plans, subscriptionWithPlan] = await Promise.all([
    getUsersByOrg(organisation.id),
    getSubscription(organisation.id),
    getInvoices(organisation.id),
    getApiKeysByOrg(organisation.id),
    getAllVisiblePlans(),
    getSubscriptionWithPlan(organisation.id),
  ])

  const currentPlan = subscriptionWithPlan?.plan ?? null

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Settings</h1>
      <SettingsContent
        organisation={organisation}
        members={members}
        currentUserId={user.id}
        subscription={subscription}
        invoices={invoices}
        apiKeys={apiKeys}
        plans={plans}
        currentPlan={currentPlan}
      />
    </div>
  )
}
