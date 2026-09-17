import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketsByOrg } from '@/lib/db/support'
import { TicketList } from '@/components/support/ticket-list'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'

export const metadata: Metadata = { title: 'Support — Upnotify' }

export default async function SupportPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const tickets = await getTicketsByOrg(user.org_id)

  return (
    <div>
      <TicketList tickets={tickets} />
    </div>
  )
}
