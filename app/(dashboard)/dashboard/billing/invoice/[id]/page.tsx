export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/db/users'
import { getInvoiceById, getWebsiteSubscriptionById } from '@/lib/db/subscriptions'
import { getSellerEntityByCurrency } from '@/lib/db/seller-entities'
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

  // Fetch the issuing entity (Vision Ltd / Crozent / future) by currency.
  // Helper guarantees a non-null result via hardcoded fallback so render
  // never crashes even if migration 00092 hasn't run yet.
  const websiteSubscriptionId = (invoice as unknown as { website_subscription_id: string | null }).website_subscription_id

  const [seller, websiteSub] = await Promise.all([
    getSellerEntityByCurrency(invoice.currency),
    websiteSubscriptionId
      ? getWebsiteSubscriptionById(websiteSubscriptionId, organisation.id)
      : Promise.resolve(null),
  ])

  return (
    <InvoicePrint
      invoice={invoice}
      organisation={organisation}
      userEmail={user.email}
      seller={seller}
      domains={websiteSub?.domains ?? []}
    />
  )
}
