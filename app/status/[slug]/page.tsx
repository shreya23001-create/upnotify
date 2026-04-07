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
  const range = ['24h', '7d', '30d', '90d'].includes(rangeParam || '') ? rangeParam! : '30d'

  const statusPage = await getStatusPageBySlug(slug)
  if (!statusPage) notFound()

  const supabase = createAdminClient()

  // Fetch org logo if available
  let orgLogoUrl: string | null = null
  if (statusPage.org_id) {
    const { data: org } = await supabase
      .from('organisations')
      .select('logo_url')
      .eq('id', statusPage.org_id)
      .single()
    orgLogoUrl = org?.logo_url ?? null
  }

  const monitorIds = (statusPage.monitor_ids || []) as string[]

  let monitors: Monitor[] = []
  if (monitorIds.length > 0) {
    const { data } = await supabase.from('monitors').select('*').in('id', monitorIds)
    monitors = data ?? []
  }

  const uptimeDays = range === '24h' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : 30

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
    <div className="status-page-layout">
      {/* Top navigation bar */}
      <nav className="sp-nav">
        <div className="sp-nav-inner">
          <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer" className="sp-nav-brand">
            <div className="sp-nav-logo">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="sp-nav-name">{statusPage.name}</span>
          </a>
          <div className="sp-nav-actions">
            <span className="sp-nav-powered">Powered by <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer">Uptrue</a></span>
          </div>
        </div>
      </nav>

    <div className="status-page">
      <div className="status-page-header">
        {orgLogoUrl && (
          <div className="status-page-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={orgLogoUrl}
              alt={`${statusPage.name} logo`}
              className="status-page-logo-img"
            />
          </div>
        )}
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
          <div className="status-card-wrap">
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

    </div>
    </div>
  )
}
