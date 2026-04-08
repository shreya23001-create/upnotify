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
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/dashboard/watchdog" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Watchdog
            </Link>
          </div>
          <h1 className="page-title">{competitor.display_name}</h1>
          <p className="page-subtitle">{competitor.domain}</p>
        </div>
      </div>

      <CompetitorDetail
        competitor={competitor}
        orgMonitors={orgMonitors as Pick<Monitor, 'id' | 'name' | 'target'>[]}
      />
    </div>
  )
}
