import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWebsiteSubscriptions } from '@/lib/db/subscriptions'
import { AddWebsitesForm } from '@/components/billing/add-websites-form'

export const metadata: Metadata = {
  title: 'Websites',
}

export default async function WebsitesPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const websiteSubs = await getWebsiteSubscriptions(user.org_id)
  const existingWebsites = websiteSubs
    .filter(s => s.status !== 'canceled')
    .flatMap(s => s.domains.map(domain => ({ domain, status: s.status })))

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Websites</div>
          <div className="db-page-sub">Add the websites you want to monitor. You&apos;ll choose which ones to subscribe to on the next step.</div>
        </div>
      </div>

      <AddWebsitesForm existingWebsites={existingWebsites} />
    </div>
  )
}
