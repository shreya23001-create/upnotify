import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStatusPageBySlug, getUptimePercentage } from '@/lib/db/status-pages'
import { getUptimeBarDataForRange } from '@/lib/db/check-results'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusOverallBanner } from '@/components/status-page/status-overall-banner'
import { StatusMonitorRow } from '@/components/status-page/status-monitor-row'
import { StatusIncidentList } from '@/components/status-page/status-incident-list'
import { StatusSubscribeForm } from '@/components/status-page/status-subscribe-form'
import { UptimeBarLegend } from '@/components/status-page/uptime-bar-legend'
import { StatusTimeRangeLinks } from '@/components/status-page/status-time-range-links'
import type { Monitor, Incident } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const statusPage = await getStatusPageBySlug(slug)
  if (!statusPage) return { title: 'Status Page Not Found' }

  const title = `${statusPage.name} — Status`
  const description = `Real-time status and uptime monitoring for ${statusPage.name}. Check current service status, incident history, and subscribe for updates.`

  return {
    title,
    description,
    alternates: { canonical: `https://uptrue.io/status/${slug}` },
    openGraph: {
      title: `${statusPage.name} — Status | Uptrue`,
      description,
      url: `https://uptrue.io/status/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${statusPage.name} — Status | Uptrue`,
      description,
    },
  }
}

export default async function PublicStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ range?: string }>
}): Promise<React.ReactElement> {
  const { slug } = await params
  const { range: rangeParam } = await searchParams
  const range = ['24h', '7d', '30d'].includes(rangeParam || '') ? rangeParam! : '24h'

  const statusPage = await getStatusPageBySlug(slug)
  if (!statusPage) notFound()

  const supabase = createAdminClient()
  const monitorIds = (statusPage.monitor_ids || []) as string[]

  let monitors: Monitor[] = []
  if (monitorIds.length > 0) {
    const { data } = await supabase.from('monitors').select('*').in('id', monitorIds)
    monitors = data ?? []
  }

  const uptimeDays = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90

  const [uptimeEntries, uptimePercentages] = await Promise.all([
    Promise.all(monitors.map(async (m) => [m.id, await getUptimeBarDataForRange(m.id, range)] as const)),
    Promise.all(monitors.map(async (m) => [m.id, await getUptimePercentage(m.id, uptimeDays)] as const)),
  ])
  const uptimeData = Object.fromEntries(uptimeEntries)
  const uptimePercent = Object.fromEntries(uptimePercentages)

  let incidents: Incident[] = []
  if (monitorIds.length > 0) {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .in('monitor_id', monitorIds)
      .order('started_at', { ascending: false })
      .limit(20)
    incidents = data ?? []
  }

  const openIncidents = incidents.filter(i => i.status !== 'resolved')

  return (
    <div className="status-page">
      <div className="status-page-header">
        <h1 className="status-page-title">{statusPage.name}</h1>
        <p className="status-last-updated">Last updated: {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>

      <StatusOverallBanner monitors={monitors} openIncidents={openIncidents.length} />

      <div className="status-page-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h2 className="status-page-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Monitors</h2>
          <StatusTimeRangeLinks slug={slug} currentRange={range} />
        </div>
        <UptimeBarLegend />
        {monitors.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No monitors configured for this status page.</p>
        ) : (
          <div className="status-monitor-list">
            {monitors.map(m => (
              <StatusMonitorRow
                key={m.id}
                monitor={m}
                uptimeSlots={uptimeData[m.id] || []}
                uptimePercent={uptimePercent[m.id] ?? 100}
              />
            ))}
          </div>
        )}
      </div>

      {incidents.length > 0 && (
        <div className="status-page-section">
          <h2 className="status-page-section-title">Incident History</h2>
          <StatusIncidentList incidents={incidents} />
        </div>
      )}

      <div className="status-page-section">
        <h2 className="status-page-section-title">Subscribe to Updates</h2>
        <StatusSubscribeForm statusPageId={statusPage.id} />
      </div>

      <footer className="status-page-footer">
        Powered by <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer">Uptrue</a>
      </footer>
    </div>
  )
}
