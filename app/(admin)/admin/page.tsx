import { getAllOrganisations, getAllUsers, getFeatureFlags, getPlans } from '@/lib/db/admin'
import { UserSearch } from '@/components/admin/user-search'
import { FeatureFlagsTable } from '@/components/admin/feature-flags-table'
import { PlansTable } from '@/components/admin/plans-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function AdminPage() {
  const [organisations, users, featureFlags, plans] = await Promise.all([
    getAllOrganisations(),
    getAllUsers(),
    getFeatureFlags(),
    getPlans(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Panel</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organisations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureFlags.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserSearch users={users} organisations={organisations} />
        </TabsContent>
        <TabsContent value="flags" className="mt-6">
          <FeatureFlagsTable flags={featureFlags} />
        </TabsContent>
        <TabsContent value="plans" className="mt-6">
          <PlansTable plans={plans} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
