import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getPublicMonitorByDomain,
  getPublicCheckResults,
  getPublicIncidents,
  calculatePublicUptime,
  getPublicMonitorIncidentCount,
  getPublicMonitorAvgResponseTime,
} from '@/lib/db/public-monitors'
import { TrackerSubscribeForm } from '@/components/tracker/tracker-subscribe-form'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)
  const monitor = await getPublicMonitorByDomain(decodedDomain)

  if (!monitor) {
    return { title: 'Site Not Found | Uptrue Tracker' }
  }

  const title = `Is ${monitor.display_name} Down? Live Status & Uptime | Uptrue`
  const description = `Check if ${monitor.display_name} (${monitor.domain}) is down right now. Live status, response time, uptime history, and incident log.`

  return {
    title,
    description,
    alternates: { canonical: `https://uptrue.io/tracker/${monitor.domain}` },
    openGraph: {
      title,
      description,
      url: `https://uptrue.io/tracker/${monitor.domain}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
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
): Array<{ status: string; count: number }> {
  if (checks.length === 0) {
    return Array(totalSlots).fill({ status: 'unknown', count: 0 })
  }

  const now = Date.now()
  const slotDuration = (7 * 24 * 60 * 60 * 1000) / totalSlots
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

  return slots.map((slot) => {
    const total = slot.up + slot.down + slot.degraded
    if (total === 0) return { status: 'unknown', count: 0 }
    if (slot.down > 0) return { status: 'down', count: total }
    if (slot.degraded > 0) return { status: 'degraded', count: total }
    return { status: 'up', count: total }
  })
}

function getBarColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--border-primary, #334155)'
}

interface FaqItem {
  question: string
  answer: string
}

function buildFaqItems(
  displayName: string,
  status: string,
  lastCheckedAt: string | null,
  incidentCount30d: number,
  uptime30d: number,
  avgResponseTime: number | null
): FaqItem[] {
  return [
    {
      question: `Is ${displayName} down right now?`,
      answer: `Based on our monitoring, ${displayName} is currently ${getStatusLabelSimple(status)}. Last checked ${formatTimeAgoSeconds(lastCheckedAt)} ago.`,
    },
    {
      question: `How often does ${displayName} go down?`,
      answer: `In the last 30 days, ${displayName} has experienced ${incidentCount30d} incident${incidentCount30d !== 1 ? 's' : ''} with an overall uptime of ${uptime30d}%.`,
    },
    {
      question: `What is ${displayName}'s average response time?`,
      answer: avgResponseTime !== null
        ? `${displayName}'s average response time over the last 30 days is ${formatResponseTime(avgResponseTime)}.`
        : `We do not have enough response time data for ${displayName} over the last 30 days yet.`,
    },
    {
      question: `How can I check if ${displayName} is down?`,
      answer: `You can check ${displayName}'s live status on this page, which is updated every 5 minutes with real monitoring data. You can also subscribe for email alerts to get notified when the status changes.`,
    },
    {
      question: `What should I do when ${displayName} is down?`,
      answer: `If ${displayName} is experiencing issues, you can check their official status page, try alternative services, or wait for the issue to resolve. Subscribe to our alerts to get notified when it's back up.`,
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
  const monitor = await getPublicMonitorByDomain(decodedDomain)

  if (!monitor) notFound()

  const [checks, incidents, uptime30, uptime7, incidentCount30d, avgResponseTime] =
    await Promise.all([
      getPublicCheckResults(monitor.id, 7),
      getPublicIncidents(monitor.id),
      calculatePublicUptime(monitor.id, 30),
      calculatePublicUptime(monitor.id, 7),
      getPublicMonitorIncidentCount(monitor.id, 30),
      getPublicMonitorAvgResponseTime(monitor.id, 30),
    ])

  const uptimeBars = buildUptimeBars(checks, 60)
  const openIncidents = incidents.filter((i) => !i.resolved_at)
  const resolvedIncidents = incidents.filter((i) => i.resolved_at)

  const faqItems = buildFaqItems(
    monitor.display_name,
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
        <span>{monitor.display_name}</span>
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
            <h1 className="tracker-detail-title">{monitor.display_name}</h1>
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
        <div className="tracker-uptime-bars">
          {uptimeBars.map((bar, i) => (
            <div
              key={i}
              className="tracker-uptime-bar"
              style={{ background: getBarColor(bar.status) }}
              title={`${bar.status} (${bar.count} checks)`}
            />
          ))}
        </div>
        <div className="tracker-uptime-legend">
          <span>7 days ago</span>
          <span>Now</span>
        </div>
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

      {/* Subscribe */}
      <div className="tracker-subscribe-section">
        <h2 className="tracker-section-heading">Get Notified</h2>
        <p className="tracker-subscribe-desc">
          Enter your email to receive alerts when {monitor.display_name} goes
          down or recovers.
        </p>
        <TrackerSubscribeForm monitorId={monitor.id} />
      </div>

      {/* FAQ section */}
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

      {/* CTA */}
      <div className="tracker-cta-section">
        <h2>Monitor YOUR Website</h2>
        <p>
          Get instant uptime alerts, performance metrics, and status pages for
          your own sites. Free plan includes 5 monitors with 5-minute checks.
        </p>
        <a href="https://uptrue.io" className="btn btn-primary">
          Start Monitoring Free
        </a>
      </div>

      {/* Disclaimer */}
      <div className="tracker-disclaimer">
        <p>
          This page shows automated checks from Uptrue&apos;s monitoring
          infrastructure. Status may not reflect your local experience. Results
          are provided for informational purposes only. Uptrue is not affiliated
          with {monitor.display_name}.
        </p>
      </div>
    </div>
  )
}
