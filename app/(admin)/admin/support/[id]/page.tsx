import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getTicketById, getMessages } from '@/lib/db/support'
import { TicketThread } from '@/components/support/ticket-thread'
import { IconArrowLeft } from '@/components/icons'

export const metadata: Metadata = { title: 'Ticket — Admin Support' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminSupportTicketPage({ params }: PageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const canRead = await canAccessAdminModule(user.email, Boolean(user.is_super_admin), 'support')
  if (!canRead) redirect('/admin')

  const { id } = await params
  const [ticket, messages] = await Promise.all([
    getTicketById(id),   // no orgId — admin sees any ticket
    getMessages(id),
  ])

  if (!ticket) notFound()

  return (
    <div>
      <Link href="/admin/support" className="support-back-link">
        <IconArrowLeft size={16} /> Back to Support Queue
      </Link>
      <TicketThread ticket={ticket} messages={messages} isAdmin={true} />
    </div>
  )
}
