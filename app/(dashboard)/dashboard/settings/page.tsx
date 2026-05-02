export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserProfile, getUsersByOrg } from '@/lib/db/users'
import { getSubscription, getInvoices, getAllVisiblePlans, getSubscriptionWithPlan, getLastSubscriptionProvider } from '@/lib/db/subscriptions'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { getUserCredits, getUserCreditBalance } from '@/lib/db/user-credits'
import { getAllCreditRules } from '@/lib/db/credit-rules'
import { getOrCreateReferralCode, getReferralsByUser } from '@/lib/db/referrals'
import { getDefaultCurrency, type SupportedCurrency } from '@/lib/utils/geo.server'
import { getAllLandingSections, getCmsTheme } from '@/lib/db/page-sections'
import { getServerConfig } from '@/lib/utils/config'
import { SettingsContent } from '@/components/dashboard/settings/settings-content'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const config = getServerConfig()
  const isSuperAdmin = config.adminEmails.includes((user.email ?? '').toLowerCase())

  const defaultCurrency = await getDefaultCurrency()
  const [
    members, subscription, invoices, apiKeys, plans,
    subscriptionWithPlan, teamLimit,
    credits, creditBalance, creditRules,
    referralCode, referrals,
    cmsSections, cmsTheme,
    lastProvider,
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
    isSuperAdmin ? getAllLandingSections() : Promise.resolve([]),
    isSuperAdmin ? getCmsTheme() : Promise.resolve(null),
    getLastSubscriptionProvider(organisation.id),
  ])

  const currentPlan = subscriptionWithPlan?.plan ?? null

  // Priority: active subscription provider → last used provider (even if cancelled) → geo
  let effectiveCurrency: SupportedCurrency = defaultCurrency
  if (subscription?.razorpay_subscription_id) effectiveCurrency = 'inr'
  else if (subscription?.stripe_subscription_id) effectiveCurrency = 'gbp'
  else if (lastProvider === 'razorpay') effectiveCurrency = 'inr'
  else if (lastProvider === 'stripe') effectiveCurrency = 'gbp'

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
        defaultCurrency={effectiveCurrency}
        isSuperAdmin={isSuperAdmin}
        cmsSections={cmsSections}
        cmsTheme={cmsTheme}
      />
    </div>
  )
}
