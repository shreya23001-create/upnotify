import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getCompetitorById } from '@/lib/db/competitor-monitors'
import { getMonitorsByOrgId } from '@/lib/db/monitors'
import type { Monitor } from '@/lib/types'
import { CompetitorDetail } from '@/components/competitors/competitor-detail'

export const metadata: Metadata = { title: 'Watchdog — Site Detail' }

export default async function WatchdogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const [competitor, orgMonitors] = await Promise.all([
    getCompetitorById(id, user.org_id),
    getMonitorsByOrgId(user.org_id),
  ])

  if (!competitor) notFound()

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <Link href="/dashboard/watchdog" className="db-breadcrumb">← Watchdog</Link>
          <div className="db-page-title">{competitor.display_name}</div>
          <div className="db-page-sub">{competitor.domain}</div>
        </div>
      </div>

      <CompetitorDetail
        competitor={competitor}
        orgMonitors={orgMonitors as Pick<Monitor, 'id' | 'name' | 'target'>[]}
      />
    </div>
  )
}
