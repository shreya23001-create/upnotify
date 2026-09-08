import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStatusPageBySlug, getUptimePercentage } from '@/lib/db/status-pages'
import { getUptimeBarDataForRange } from '@/lib/db/check-results'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import { StatusOverallBanner } from '@/components/status-page/status-overall-banner'
import { StatusMonitorRow } from '@/components/status-page/status-monitor-row'
import { StatusIncidentList } from '@/components/status-page/status-incident-list'
import { StatusSubscribeForm } from '@/components/status-page/status-subscribe-form'
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
      title: `${statusPage.name} — Status | Upnotify`,
      description,
      url: `https://uptrue.io/status/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${statusPage.name} — Status | Upnotify`,
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

  let orgLogoUrl: string | null = null
  let hasWhiteLabel = false
  if (statusPage.org_id) {
    const [orgResult, planLimits] = await Promise.all([
      supabase.from('organisations').select('logo_url').eq('id', statusPage.org_id).single(),
      getPlanLimits(statusPage.org_id),
    ])
    orgLogoUrl = orgResult.data?.logo_url ?? null
    hasWhiteLabel = planLimits.hasWhiteLabel
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

  const anyDown = monitors.some(m => m.status === 'down')
  const navStatusText = anyDown ? 'Major Outage'
    : openIncidents.length > 0 ? 'Partial Outage'
    : 'All Systems Operational'

  return (
    <div className="sp-wrap">

      {/* Nav */}
      <nav className="sp-nav">
        <div className="sp-nav-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Upnotify" className="sp-nav-uptrue-logo" />
          {statusPage.name} — Status
        </div>
        <div className="sp-nav-right">
          {!hasWhiteLabel && (
            <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer" className="sp-nav-powered">
              Powered by <span className="sp-nav-powered-brand">Upnotify</span>
            </a>
          )}
          <div className={`sp-nav-status ${anyDown ? 'down' : openIncidents.length > 0 ? 'warn' : 'up'}`}>
            <div className={`sp-nav-dot${anyDown || openIncidents.length > 0 ? ' pulse' : ''}`} />
            {navStatusText}
          </div>
        </div>
      </nav>

      {/* Hero — overall status */}
      <StatusOverallBanner
        monitors={monitors}
        openIncidents={openIncidents.length}
        name={statusPage.name}
        logoUrl={orgLogoUrl}
      />

      {/* Main content */}
      <div className="sp-content">

        {/* Active incidents */}
        {openIncidents.length > 0 && (
          <>
            <div className="sp-section-label">Active Incident</div>
            {openIncidents.map(inc => (
              <div key={inc.id} className="sp-incident-card active" style={{ marginBottom: 12 }}>
                <div className="sp-incident-header">
                  <div className="sp-incident-icon warn">
                    <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="sp-incident-info">
                    <div className="sp-incident-title">{inc.title}</div>
                    <div className="sp-incident-meta">
                      Started {new Date(inc.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="sp-incident-badge-wrap">
                    <span className="sp-incident-badge-active">ONGOING</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Current Status */}
        <div className="sp-section-label">Current Status</div>
        <StatusTimeRangeLinks slug={slug} currentRange={range} />
        <div className="sp-card">
          {monitors.length === 0 ? (
            <div style={{ padding: '20px', color: '#94a3b8', fontSize: 14 }}>
              No monitors configured for this status page.
            </div>
          ) : (
            monitors.map(m => (
              <StatusMonitorRow
                key={m.id}
                monitor={m}
                uptimeSlots={uptimeData[m.id] || []}
                uptimePercent={uptimePercent[m.id] ?? 100}
                range={range}
              />
            ))
          )}
        </div>

        {/* Incident History */}
        <div className="sp-section-label">Incident History</div>
        <div className="sp-card">
          {incidents.length === 0 ? (
            <div style={{ padding: '20px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No incidents recorded in this period.
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <StatusIncidentList incidents={incidents} />
            </div>
          )}
        </div>

        {/* Subscribe */}
        <StatusSubscribeForm statusPageId={statusPage.id} />

        {/* Footer */}
        {!hasWhiteLabel && (
          <div className="sp-footer">
            <div className="sp-footer-text">
              Powered by <span className="sp-footer-brand">Upnotify</span>{' \u00b7 '}
              <a href="/privacy">Privacy</a>{' \u00b7 '}
              <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer">uptrue.io</a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
