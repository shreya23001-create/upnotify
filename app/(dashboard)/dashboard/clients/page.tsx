import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { ClientWorkspaceCard } from '@/components/dashboard/client-workspace-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const org = await getCurrentOrganisation()
  if (!org || org.type !== 'agency') redirect('/dashboard')

  const workspaces = await getWorkspacesByOrg(org.id)
  const clientWorkspaces = workspaces.filter((w) => !w.is_internal)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      {clientWorkspaces.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-sm text-zinc-500">No client workspaces yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientWorkspaces.map((ws) => (
            <ClientWorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  )
}
