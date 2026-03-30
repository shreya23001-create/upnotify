import { redirect } from 'next/navigation'
import { getUserProfile, getUsersByOrg } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getSubscription, getInvoices } from '@/lib/db/subscriptions'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrgSettings } from '@/components/dashboard/settings/org-settings'
import { TeamSettings } from '@/components/dashboard/settings/team-settings'
import { BillingSettings } from '@/components/dashboard/settings/billing-settings'
import { ApiKeysSettings } from '@/components/dashboard/settings/api-keys-settings'

export default async function SettingsPage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const [members, , subscription, invoices, apiKeys] = await Promise.all([
    getUsersByOrg(organisation.id),
    getWorkspacesByOrg(organisation.id),
    getSubscription(organisation.id),
    getInvoices(organisation.id),
    getApiKeysByOrg(organisation.id),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="organisation">
        <TabsList>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="organisation" className="mt-6">
          <OrgSettings organisation={organisation} />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamSettings members={members} currentUserId={user.id} />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingSettings subscription={subscription} invoices={invoices} />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysSettings apiKeys={apiKeys} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
