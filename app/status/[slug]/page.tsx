import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStatusPageBySlug, getUptimePercentage } from '@/lib/db/status-pages'
import { getUptimeBarData } from '@/lib/db/check-results'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusOverallBanner } from '@/components/status-page/status-overall-banner'
import { StatusMonitorRow } from '@/components/status-page/status-monitor-row'
import { StatusIncidentList } from '@/components/status-page/status-incident-list'
import { StatusSubscribeForm } from '@/components/status-page/status-subscribe-form'
import { UptimeBarLegend } from '@/components/status-page/uptime-bar-legend'
import type { Monitor, Incident } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const statusPage = await getStatusPageBySlug(slug)
  if (!statusPage) return { title: 'Status Page Not Found' }
  return {
    title: `${statusPage.name} — Status | Uptrue`,
    description: `Real-time status and uptime monitoring for ${statusPage.name}. Check current service status, incident history, and subscribe for updates.`,
  }
}

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }): Promise<React.ReactElement> {
  const { slug } = await params
  const statusPage = await getStatusPageBySlug(slug)
  if (!statusPage) notFound()

  const supabase = createAdminClient()
  const monitorIds = (statusPage.monitor_ids || []) as string[]

  // Fetch monitors
  let monitors: Monitor[] = []
  if (monitorIds.length > 0) {
    const { data } = await supabase.from('monitors').select('*').in('id', monitorIds)
    monitors = data ?? []
  }

  // Fetch uptime data and percentages in parallel
  const [uptimeEntries, uptimePercentages] = await Promise.all([
    Promise.all(monitors.map(async (m) => [m.id, await getUptimeBarData(m.id)] as const)),
    Promise.all(monitors.map(async (m) => [m.id, await getUptimePercentage(m.id)] as const)),
  ])
  const uptimeData = Object.fromEntries(uptimeEntries)
  const uptimePercent = Object.fromEntries(uptimePercentages)

  // Fetch recent incidents for these monitors
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
        <h2 className="status-page-section-title">Monitors</h2>
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
