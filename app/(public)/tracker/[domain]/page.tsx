import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getPublicMonitorByDomainIncludingInactive,
  getPublicCheckResults,
  getPublicIncidents,
  calculatePublicUptime,
  getPublicMonitorIncidentCount,
  getPublicMonitorAvgResponseTime,
  getCurrentlyDownSites,
  normalisePublicMonitorDomain,
} from '@/lib/db/public-monitors'
import { getPublishedOutageBlogForSite } from '@/lib/db/blog-posts'
import { TrackerSubscribeForm } from '@/components/tracker/tracker-subscribe-form'
import { TimelineBarGraph } from '@/components/ui/timeline-bar-graph'
import { AlsoDownSection } from '@/components/tracker/also-down-section'
import { TrackerSoftNotFound } from '@/components/tracker/tracker-soft-not-found'
import { TRACKED_SITES } from '@/lib/constants/tracked-sites'
import {
  SITE_INFO,
  CATEGORY_DOWNTIME_REASONS,
  CATEGORY_IMPACT,
  getRelatedSites,
} from '@/lib/constants/tracker-site-info'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)
  const canonicalDomain = normalisePublicMonitorDomain(decodedDomain)
  const monitorAny = await getPublicMonitorByDomainIncludingInactive(canonicalDomain)

  // Soft 404 — domain not in our tracker. Render with helpful content
  // (related sites + signup CTA) but don't index the URL.
  if (!monitorAny) {
    return {
      title: `${canonicalDomain || 'Site'} not in tracker — monitor any site free | Uptrue`,
      description: `${canonicalDomain || 'This site'} isn't in the public Uptrue tracker yet. Monitor it yourself in 2 minutes on the Free plan, or browse other tracked sites.`,
      robots: { index: false, follow: true },
    }
  }

  // Deactivated — site was tracked, isn't any more. Same robots:noindex
  // so Google can deindex the old URL cleanly.
  if (!monitorAny.is_active) {
    return {
      title: `${monitorAny.display_name} no longer tracked | Uptrue`,
      description: `${monitorAny.display_name} was previously on the Uptrue public tracker and has been removed.`,
      robots: { index: false, follow: false },
    }
  }

  const monitor = monitorAny
  const siteInfo = SITE_INFO[monitor.domain]
  const siteName = siteInfo?.name ?? monitor.display_name

  // Per-domain SEO override takes precedence when present (e.g. salesforce → "sfdc status" keyword)
  const rawTitle = siteInfo?.seoTitle ?? `Is ${siteName} Down? Live Status & Uptime | Uptrue`
  const title = siteInfo?.seoTitle ? { absolute: siteInfo.seoTitle } : rawTitle
  const description = siteInfo?.seoDescription ?? (siteInfo
    ? `Check if ${siteName} is down right now. Live status, response time, uptime history, and incident log for ${siteName} (${monitor.domain}). Get alerts when ${siteName} goes down.`
    : `Check if ${monitor.display_name} (${monitor.domain}) is down right now. Live status, response time, uptime history, and incident log.`)

  return {
    title,
    description,
    alternates: { canonical: `https://uptrue.io/tracker/${monitor.domain}` },
    openGraph: {
      title: rawTitle,
      description,
      url: `https://uptrue.io/tracker/${monitor.domain}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: rawTitle,
      description,
    },
  }
}

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Operational'
  if (status === 'down') return 'Currently Down'
  if (status === 'degraded') return 'Degraded Performance'
  return 'Unknown'
}

function getStatusLabelSimple(status: string): string {
  if (status === 'up') return 'UP'
  if (status === 'down') return 'DOWN'
  if (status === 'degraded') return 'experiencing degraded performance'
  return 'unknown'
}

function formatResponseTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimeAgoSeconds(dateStr: string | null): string {
  if (!dateStr) return 'unknown'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours !== 1 ? 's' : ''}`
}

function buildUptimeBars(
  checks: Array<{ status: string; checked_at: string }>,
  totalSlots: number
): Array<{ status: string; count: number; timestamp: string }> {
  const now = Date.now()
  const windowMs = 7 * 24 * 60 * 60 * 1000
  const slotDuration = windowMs / totalSlots
  const windowStart = now - windowMs

  if (checks.length === 0) {
    return Array.from({ length: totalSlots }, (_, i) => ({
      status: 'unknown',
      count: 0,
      timestamp: new Date(windowStart + i * slotDuration).toISOString(),
    }))
  }

  const slots: Array<{ up: number; down: number; degraded: number }> = Array.from(
    { length: totalSlots },
    () => ({ up: 0, down: 0, degraded: 0 })
  )

  for (const check of checks) {
    const age = now - new Date(check.checked_at).getTime()
    const slotIndex = totalSlots - 1 - Math.floor(age / slotDuration)
    if (slotIndex >= 0 && slotIndex < totalSlots) {
      if (check.status === 'up') slots[slotIndex].up++
      else if (check.status === 'down') slots[slotIndex].down++
      else slots[slotIndex].degraded++
    }
  }

  return slots.map((slot, i) => {
    const timestamp = new Date(windowStart + i * slotDuration).toISOString()
    const total = slot.up + slot.down + slot.degraded
    if (total === 0) return { status: 'unknown', count: 0, timestamp }
    if (slot.down > 0) return { status: 'down', count: total, timestamp }
    if (slot.degraded > 0) return { status: 'degraded', count: total, timestamp }
    return { status: 'up', count: total, timestamp }
  })
}


interface FaqItem {
  question: string
  answer: string
}

function buildFaqItems(
  displayName: string,
  domain: string,
  category: string,
  status: string,
  lastCheckedAt: string | null,
  incidentCount30d: number,
  uptime30d: number,
  avgResponseTime: number | null
): FaqItem[] {
  const siteInfo = SITE_INFO[domain]
  const siteName = siteInfo?.name ?? displayName

  return [
    {
      question: `Is ${siteName} down right now?`,
      answer: `Based on our monitoring, ${siteName} is currently ${getStatusLabelSimple(status)}. Last checked ${formatTimeAgoSeconds(lastCheckedAt)} ago. This page updates every 5 minutes with real monitoring data from Uptrue's infrastructure.`,
    },
    {
      question: `How often does ${siteName} go down?`,
      answer: `In the last 30 days, ${siteName} has experienced ${incidentCount30d} incident${incidentCount30d !== 1 ? 's' : ''} with an overall uptime of ${uptime30d}%. Most major services aim for 99.9% uptime or higher. You can subscribe to alerts above to be notified of future outages.`,
    },
    {
      question: `What is ${siteName}'s average response time?`,
      answer: avgResponseTime !== null
        ? `${siteName}'s average response time over the last 30 days is ${formatResponseTime(avgResponseTime)}. Response times can vary by region and time of day.`
        : `We do not have enough response time data for ${siteName} over the last 30 days yet. Check back soon as we continue monitoring.`,
    },
    {
      question: `How can I check if ${siteName} is down?`,
      answer: `You can check ${siteName}'s live status on this page, which is updated every 5 minutes with real monitoring data. You can also subscribe for email alerts to get notified when the status changes.`,
    },
    {
      question: `What should I do when ${siteName} is down?`,
      answer: siteInfo?.statusPageUrl
        ? `Check ${siteName}'s official status page for updates. You can also try clearing your browser cache, switching networks, or using alternative services. Subscribe to our alerts above to know the moment it comes back online.`
        : `Try clearing your browser cache, switching from Wi-Fi to mobile data, or using a VPN to rule out local issues. If the problem is on their end, subscribe to our alerts above to know the moment it comes back online.`,
    },
    {
      question: `Why is my ${siteName} slow today?`,
      answer: `Slowness on ${siteName} can be caused by server-side performance issues, heavy traffic, your internet connection, browser extensions, or regional CDN problems. If ${siteName} shows degraded performance on this page, the issue is likely on their end. Try a different browser or device to rule out local causes.`,
    },
    {
      question: `Does ${siteName} downtime affect my SEO?`,
      answer: category === 'Search & Ads'
        ? `When ${siteName} is down, search crawlers cannot access your site through their services. Prolonged outages can temporarily impact indexing, but rankings typically recover once the service is restored.`
        : `If your website depends on ${siteName} for critical functionality (such as hosting, CDN, or embedded content), downtime can indirectly affect your SEO. Search engines may penalise your site if it is unreachable due to a third-party dependency being offline.`,
    },
    {
      question: `Can I get notified when ${siteName} goes down?`,
      answer: `Yes. Use the subscribe form above to enter your email address. Uptrue will send you an alert the moment ${siteName} goes down and again when it recovers. It is completely free and you can unsubscribe at any time.`,
    },
  ]
}

function buildFaqJsonLd(faqItems: FaqItem[], pageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
    'url': pageUrl,
  }
}

export default async function TrackerDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>
}): Promise<React.ReactElement> {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)
  const canonicalDomain = normalisePublicMonitorDomain(decodedDomain)

  // If the URL contains a non-canonical form (uppercase, www., scheme prefix,
  // trailing slash), 308-redirect to the canonical /tracker/<domain> so we
  // don't fragment SEO across multiple URLs that resolve the same row.
  if (canonicalDomain && canonicalDomain !== decodedDomain) {
    redirect(`/tracker/${canonicalDomain}`)
  }

  // Look up including inactive so we can branch into:
  //   - active row → render the full live-status page (200)
  //   - inactive row → render "no longer tracked" soft page with
  //     robots:noindex,nofollow (200)
  //   - no row → render "we don't track this yet" soft page (200)
  // generateMetadata sets the right robots header per branch.
  const monitorAny = await getPublicMonitorByDomainIncludingInactive(canonicalDomain)

  if (!monitorAny) {
    return <TrackerSoftNotFound requestedDomain={canonicalDomain} variant="not-tracked" />
  }
  if (!monitorAny.is_active) {
    return <TrackerSoftNotFound requestedDomain={monitorAny.display_name} variant="deactivated" />
  }
  const monitor = monitorAny

  // Derive site info before data fetches — needed for conditional queries
  const siteInfo = SITE_INFO[monitor.domain]
  const siteName = siteInfo?.name ?? monitor.display_name
  const siteCategory = siteInfo?.category ?? TRACKED_SITES.find((s) => s.domain === monitor.domain)?.category ?? 'General'

  const isDown = monitor.last_status === 'down' || monitor.last_status === 'degraded'

  const [checks, incidents, uptime30, uptime7, incidentCount30d, avgResponseTime, downSites, outagePost] =
    await Promise.all([
      getPublicCheckResults(monitor.id, 7),
      getPublicIncidents(monitor.id),
      calculatePublicUptime(monitor.id, 30),
      calculatePublicUptime(monitor.id, 7),
      getPublicMonitorIncidentCount(monitor.id, 30),
      getPublicMonitorAvgResponseTime(monitor.id, 30),
      isDown ? getCurrentlyDownSites(decodedDomain, siteCategory, 7) : Promise.resolve([]),
      isDown ? getPublishedOutageBlogForSite(siteName) : Promise.resolve(null),
    ])

  const uptimeBars = buildUptimeBars(checks, 60)
  const openIncidents = incidents.filter((i) => !i.resolved_at)
  const resolvedIncidents = incidents.filter((i) => i.resolved_at)

  const downtimeReasons = CATEGORY_DOWNTIME_REASONS[siteCategory] ?? CATEGORY_DOWNTIME_REASONS['Cloud & Hosting'] ?? []
  const impactStatements = CATEGORY_IMPACT[siteCategory] ?? CATEGORY_IMPACT['Cloud & Hosting'] ?? []
  const relatedSites = getRelatedSites(monitor.domain, siteCategory, TRACKED_SITES)

  const faqItems = buildFaqItems(
    monitor.display_name,
    monitor.domain,
    siteCategory,
    monitor.last_status,
    monitor.last_checked_at,
    incidentCount30d,
    uptime30,
    avgResponseTime
  )

  const faqJsonLd = buildFaqJsonLd(
    faqItems,
    `https://uptrue.io/tracker/${monitor.domain}`
  )

  return (
    <div className="tracker-detail">
      {/* FAQ JSON-LD for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="tracker-breadcrumb">
        <Link href="/tracker">All Sites</Link>
        <span className="tracker-breadcrumb-sep">/</span>
        <span>{siteName}</span>
      </div>

      {/* Status banner */}
      <div
        className="tracker-status-banner"
        style={{ borderColor: getStatusColor(monitor.last_status) }}
      >
        <div className="tracker-status-banner-left">
          <span
            className="tracker-status-dot-lg"
            style={{ background: getStatusColor(monitor.last_status) }}
          />
          <div>
            <h1 className="tracker-detail-title">{siteName}</h1>
            <p className="tracker-detail-domain">{monitor.domain}</p>
          </div>
        </div>
        <div className="tracker-status-banner-right">
          <span
            className="tracker-status-label"
            style={{ color: getStatusColor(monitor.last_status) }}
          >
            {getStatusLabel(monitor.last_status)}
          </span>
          <span className="tracker-checked-ago">
            Last checked: {formatTimeAgo(monitor.last_checked_at)}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="tracker-stats-row">
        <div className="tracker-stat-card">
          <span className="tracker-stat-label">Response Time</span>
          <span className="tracker-stat-value">
            {formatResponseTime(monitor.last_response_time_ms)}
          </span>
        </div>
        <div className="tracker-stat-card">
          <span className="tracker-stat-label">7-Day Uptime</span>
          <span className="tracker-stat-value">{uptime7}%</span>
        </div>
        <div className="tracker-stat-card">
          <span className="tracker-stat-label">30-Day Uptime</span>
          <span className="tracker-stat-value">{uptime30}%</span>
        </div>
        <div className="tracker-stat-card">
          <span className="tracker-stat-label">Incidents (recent)</span>
          <span className="tracker-stat-value">{incidents.length}</span>
        </div>
      </div>

      {/* Uptime bars */}
      <div className="tracker-uptime-section">
        <h2 className="tracker-section-heading">7-Day Uptime History</h2>
        <TimelineBarGraph
          data={uptimeBars.map(bar => ({
            timestamp: bar.timestamp,
            status: (bar.status === 'unknown' ? 'none' : bar.status) as 'up' | 'down' | 'degraded' | 'none',
            tooltipLabel: bar.count > 0 ? `${bar.status} · ${bar.count} check${bar.count !== 1 ? 's' : ''}` : undefined,
          }))}
          intervalSeconds={Math.round((7 * 24 * 3600) / 60)}
          height={32}
          label=""
        />
      </div>

      {/* Open incidents */}
      {openIncidents.length > 0 && (
        <div className="tracker-incidents-section">
          <h2 className="tracker-section-heading tracker-down-title">
            Active Incidents
          </h2>
          {openIncidents.map((incident) => (
            <div
              key={incident.id}
              className="tracker-incident tracker-incident-open"
            >
              <div className="tracker-incident-header">
                <span
                  className="tracker-status-dot"
                  style={{
                    background: 'var(--color-danger, #ef4444)',
                  }}
                />
                <span className="tracker-incident-cause">
                  {incident.cause ?? 'Site unreachable'}
                </span>
              </div>
              <div className="tracker-incident-meta">
                Started:{' '}
                {new Date(incident.started_at).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {incident.status_code
                  ? ` (HTTP ${incident.status_code})`
                  : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved incidents */}
      {resolvedIncidents.length > 0 && (
        <div className="tracker-incidents-section">
          <h2 className="tracker-section-heading">Recent Incidents</h2>
          {resolvedIncidents.map((incident) => {
            const duration = incident.resolved_at
              ? Math.round(
                  (new Date(incident.resolved_at).getTime() -
                    new Date(incident.started_at).getTime()) /
                    60000
                )
              : null
            return (
              <div key={incident.id} className="tracker-incident">
                <div className="tracker-incident-header">
                  <span
                    className="tracker-status-dot"
                    style={{
                      background: 'var(--text-muted, #94a3b8)',
                    }}
                  />
                  <span className="tracker-incident-cause">
                    {incident.cause ?? 'Site was unreachable'}
                  </span>
                </div>
                <div className="tracker-incident-meta">
                  {new Date(incident.started_at).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {duration !== null
                    ? ` — resolved after ${duration < 1 ? '<1' : duration} min`
                    : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── NEW SEO SECTIONS ─────────────────────────────────── */}

      {/* About [Site] */}
      <div className="tracker-about-section">
        <h2 className="tracker-section-heading">About {siteName}</h2>
        <p className="tracker-about-description">
          {siteInfo
            ? siteInfo.description
            : `${monitor.display_name} is a website that Uptrue monitors for uptime and performance. We check ${monitor.domain} every 5 minutes from multiple locations to detect downtime, slow responses, and SSL issues.`}
        </p>
        {siteInfo && (
          <div className="tracker-about-meta">
            <div className="tracker-about-meta-item">
              <span className="tracker-about-meta-label">Founded</span>
              <span className="tracker-about-meta-value">{siteInfo.founded}</span>
            </div>
            <div className="tracker-about-meta-item">
              <span className="tracker-about-meta-label">Category</span>
              <span className="tracker-about-meta-value">{siteInfo.category}</span>
            </div>
            <div className="tracker-about-meta-item">
              <span className="tracker-about-meta-label">Scale</span>
              <span className="tracker-about-meta-value">{siteInfo.users}</span>
            </div>
          </div>
        )}
      </div>

      {/* Common Reasons [Site] Goes Down */}
      {downtimeReasons.length > 0 && (
        <div className="tracker-reasons-section">
          <h2 className="tracker-section-heading">
            Common Reasons {siteName} Goes Down
          </h2>
          <p className="tracker-reasons-intro">
            Even the most reliable services experience downtime. Here are the most common reasons {siteName} may be unavailable:
          </p>
          <ul className="tracker-reasons-list">
            {downtimeReasons.map((reason, i) => (
              <li key={i} className="tracker-reasons-item">{reason}</li>
            ))}
          </ul>
          <p className="tracker-reasons-footer">
            When {siteName} experiences issues, our monitoring detects it within minutes. Subscribe above to get notified instantly.
          </p>
        </div>
      )}

      {/* What to Do When [Site] Is Down */}
      <div className="tracker-whatdo-section">
        <h2 className="tracker-section-heading">
          What to Do When {siteName} Is Down
        </h2>
        <div className="tracker-whatdo-steps">
          {siteInfo?.statusPageUrl && (
            <div className="tracker-whatdo-step">
              <span className="tracker-whatdo-step-num">1</span>
              <div>
                <strong>Check the official status page</strong>
                <p>
                  Visit{' '}
                  <a
                    href={siteInfo.statusPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tracker-link"
                  >
                    {siteName}&apos;s status page
                  </a>{' '}
                  for official updates from their engineering team.
                </p>
              </div>
            </div>
          )}
          <div className="tracker-whatdo-step">
            <span className="tracker-whatdo-step-num">
              {siteInfo?.statusPageUrl ? '2' : '1'}
            </span>
            <div>
              <strong>Confirm it is not just you</strong>
              <p>
                This page shows real monitoring data. If {siteName} appears operational here but is not working for you, the issue may be local to your network, browser, or ISP.
              </p>
            </div>
          </div>
          <div className="tracker-whatdo-step">
            <span className="tracker-whatdo-step-num">
              {siteInfo?.statusPageUrl ? '3' : '2'}
            </span>
            <div>
              <strong>Try basic troubleshooting</strong>
              <p>
                Clear your browser cache, try a different browser, switch between Wi-Fi and mobile data, or use a VPN to bypass potential regional blocks.
              </p>
            </div>
          </div>
          {siteInfo?.alternatives && siteInfo.alternatives.length > 0 && (
            <div className="tracker-whatdo-step">
              <span className="tracker-whatdo-step-num">
                {siteInfo?.statusPageUrl ? '4' : '3'}
              </span>
              <div>
                <strong>Try alternative services</strong>
                <p>
                  While waiting for {siteName} to recover, consider using{' '}
                  {siteInfo.alternatives.map((alt, i) => {
                    const altInfo = SITE_INFO[alt]
                    const altName = altInfo?.name ?? alt
                    return (
                      <span key={alt}>
                        {i > 0 && (i === siteInfo.alternatives.length - 1 ? ', or ' : ', ')}
                        <Link href={`/tracker/${alt}`} className="tracker-link">
                          {altName}
                        </Link>
                      </span>
                    )
                  })}
                  .
                </p>
              </div>
            </div>
          )}
          <div className="tracker-whatdo-step">
            <span className="tracker-whatdo-step-num">
              {siteInfo?.statusPageUrl
                ? String((siteInfo.alternatives?.length ?? 0) > 0 ? 5 : 4)
                : String((siteInfo?.alternatives?.length ?? 0) > 0 ? 4 : 3)}
            </span>
            <div>
              <strong>Subscribe for recovery alerts</strong>
              <p>
                Use the subscribe form above to get an email the moment {siteName} comes back online. No need to keep refreshing this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How [Site] Downtime Affects You */}
      {impactStatements.length > 0 && (
        <div className="tracker-impact-section">
          <h2 className="tracker-section-heading">
            How {siteName} Downtime Affects You
          </h2>
          <p className="tracker-impact-intro">
            When {siteName} goes offline, the effects ripple across businesses and users who depend on it:
          </p>
          <ul className="tracker-impact-list">
            {impactStatements.map((impact, i) => (
              <li key={i} className="tracker-impact-item">{impact}</li>
            ))}
          </ul>
          <p className="tracker-impact-footer">
            Monitoring your own dependencies on services like {siteName} is essential. <Link href="/score" className="tracker-link">Check your website&apos;s health score</Link> to see how resilient your site is to third-party outages.
          </p>
        </div>
      )}

      {/* Also Down Right Now — only shown when site is down/degraded */}
      {isDown && (
        <AlsoDownSection
          siteName={siteName}
          outagePost={outagePost}
          downSites={downSites}
        />
      )}

      {/* Subscribe */}
      <div className="tracker-subscribe-section">
        <h2 className="tracker-section-heading">Get Notified</h2>
        <p className="tracker-subscribe-desc">
          Enter your email to receive alerts when {siteName} goes
          down or recovers.
        </p>
        <TrackerSubscribeForm monitorId={monitor.id} />
      </div>

      {/* FAQ section (expanded to 8 questions) */}
      <div className="tracker-faq-section">
        <h2 className="tracker-section-heading">
          Frequently Asked Questions
        </h2>
        {faqItems.map((faq, i) => (
          <div key={i} className="tracker-faq-item">
            <h3 className="tracker-faq-question">{faq.question}</h3>
            <p className="tracker-faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Related Sites */}
      {relatedSites.length > 0 && (
        <div className="tracker-related-section">
          <h2 className="tracker-section-heading">
            Related {siteCategory} Sites We Monitor
          </h2>
          <div className="tracker-related-grid">
            {relatedSites.map((site) => (
              <Link
                key={site.domain}
                href={`/tracker/${site.domain}`}
                className="tracker-related-card"
              >
                <span className="tracker-related-name">{site.display_name}</span>
                <span className="tracker-related-domain">{site.domain}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Monitor YOUR Website CTA */}
      <div className="tracker-cta-section">
        <h2>Monitor YOUR Website 24/7</h2>
        <p>
          Don&apos;t just check if {siteName} is down &mdash; monitor your own website around the clock.
          Get instant uptime alerts, performance metrics, and public status pages. Free plan includes 5 monitors with 5-minute checks.
        </p>
        <div className="tracker-cta-buttons">
          <Link href="/" className="btn btn-primary">
            Start Monitoring Free
          </Link>
          <Link href="/score" className="tracker-cta-secondary">
            Check Your Website Score
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="tracker-disclaimer">
        <p>
          This page shows automated checks from Uptrue&apos;s monitoring
          infrastructure. Status may not reflect your local experience. Results
          are provided for informational purposes only. Uptrue is not affiliated
          with {siteName}.
        </p>
      </div>
    </div>
  )
}
