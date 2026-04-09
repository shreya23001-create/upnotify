export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/db/users'
import { getInvoiceById } from '@/lib/db/subscriptions'
import { InvoicePrint } from '@/components/billing/invoice-print'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params
  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const { user, organisation } = profile
  const invoice = await getInvoiceById(id, organisation.id)
  if (!invoice) notFound()

  return (
    <InvoicePrint
      invoice={invoice}
      organisation={organisation}
      userEmail={user.email}
    />
  )
}
