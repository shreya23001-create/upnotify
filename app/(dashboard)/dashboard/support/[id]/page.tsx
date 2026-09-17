import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketById, getMessages } from '@/lib/db/support'
import { TicketThread } from '@/components/support/ticket-thread'
import { IconArrowLeft } from '@/components/icons'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'

export const metadata: Metadata = { title: 'Ticket — Upnotify Support' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SupportTicketPage({ params }: PageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const { id } = await params
  const [ticket, messages] = await Promise.all([
    getTicketById(id, user.org_id),
    getMessages(id),
  ])

  if (!ticket) notFound()

  return (
    <div>
      <Link href="/dashboard/support" className="support-back-link">
        <IconArrowLeft size={16} /> Back to Support
      </Link>
      <TicketThread ticket={ticket} messages={messages} isAdmin={false} />
    </div>
  )
}
