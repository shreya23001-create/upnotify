export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserProfile, getUsersByOrg } from '@/lib/db/users'
import { getSubscription, getInvoices, getAllVisiblePlans, getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { getUserCredits, getUserCreditBalance } from '@/lib/db/user-credits'
import { getAllCreditRules } from '@/lib/db/credit-rules'
import { getOrCreateReferralCode, getReferralsByUser } from '@/lib/db/referrals'
import { getActiveCompetePlans, getCompeteSubscription } from '@/lib/db/compete-plans'
import { getDefaultCurrency } from '@/lib/utils/geo'
import { SettingsContent } from '@/components/dashboard/settings/settings-content'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const defaultCurrency = await getDefaultCurrency()
  const [
    members, subscription, invoices, apiKeys, plans,
    subscriptionWithPlan, teamLimit,
    credits, creditBalance, creditRules,
    referralCode, referrals,
    competePlans, competeSubscription,
  ] = await Promise.all([
    getUsersByOrg(organisation.id),
    getSubscription(organisation.id),
    getInvoices(organisation.id),
    getApiKeysByOrg(organisation.id),
    getAllVisiblePlans(),
    getSubscriptionWithPlan(organisation.id),
    checkTeamMemberLimit(organisation.id),
    getUserCredits(user.id),
    getUserCreditBalance(user.id),
    getAllCreditRules(),
    getOrCreateReferralCode(user.id),
    getReferralsByUser(user.id),
    getActiveCompetePlans(),
    getCompeteSubscription(organisation.id),
  ])

  const currentPlan = subscriptionWithPlan?.plan ?? null
  const hasPaidBasePlan = !!subscription && subscription.status === 'active' && (currentPlan?.price_monthly_gbp ?? 0) > 0

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
        credits={credits}
        creditBalance={creditBalance}
        creditRules={creditRules}
        referralCode={referralCode}
        referrals={referrals}
        competePlans={competePlans}
        competeSubscription={competeSubscription}
        hasPaidBasePlan={hasPaidBasePlan}
        defaultCurrency={defaultCurrency}
      />
    </div>
  )
}
