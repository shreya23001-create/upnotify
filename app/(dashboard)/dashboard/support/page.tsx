import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketsByOrg } from '@/lib/db/support'
import { TicketList } from '@/components/support/ticket-list'

export const metadata: Metadata = { title: 'Support — Uptrue' }

export default async function SupportPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const tickets = await getTicketsByOrg(user.org_id)

  return (
    <div>
      <TicketList tickets={tickets} />
    </div>
  )
}
