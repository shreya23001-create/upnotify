import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function AlertsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const channels = await getAlertChannelsByOrg(user.org_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alert Channels</h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>
      {channels.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-zinc-500">
              No alert channels configured. Add a channel to receive downtime notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{channel.name}</p>
                  <p className="text-xs capitalize text-zinc-500">{channel.type}</p>
                </div>
                <Badge variant={channel.is_enabled ? 'default' : 'outline'}>
                  {channel.is_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
