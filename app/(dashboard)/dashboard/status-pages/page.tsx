import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function StatusPagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const statusPages = defaultWorkspace
    ? await getStatusPagesByWorkspace(defaultWorkspace.id)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Status Pages</h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Create Status Page
        </Button>
      </div>
      {statusPages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-zinc-500">
              No status pages yet. Create one to share uptime status with your users.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {statusPages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{page.name}</CardTitle>
                <Badge variant={page.is_published ? 'default' : 'outline'}>
                  {page.is_published ? 'Published' : 'Draft'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">/status/{page.slug}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
