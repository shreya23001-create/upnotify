'use client'

import { useMemo, useRef } from 'react'
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { Favicon } from '@/components/ui/favicon'
import { SvgLineChart } from './charts/svg-line-chart'
import { HEALTH_STATUS_LABEL } from '@/lib/services/report-metrics-shared'
import { buildReportInsights } from '@/lib/utils/report-insights'
import type { WebsiteReportMetrics } from '@/lib/services/report-metrics'

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
}

function fmtIncidentTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const HEALTH_DOT_COLOR: Record<string, string> = {
  operational: 'var(--color-up)',
  attention: 'var(--color-warn)',
  incident: 'var(--color-down)',
}

function HealthBadge({ health }: { health: WebsiteReportMetrics['health'] }): React.ReactElement {
  return (
    <span className={`rpt-health-badge rpt-health-badge--${health}`}>
      <span className="status-dot" style={{ background: HEALTH_DOT_COLOR[health] }} />
      {HEALTH_STATUS_LABEL[health]}
    </span>
  )
}

function InsufficientData({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  const days = Math.max(1, Math.round((metrics.range.until.getTime() - metrics.range.start.getTime()) / 86400000))
  return (
    <div className="rpt-nodata">
      <p className="rpt-nodata-title">Insufficient monitoring data</p>
      <p className="rpt-nodata-body">
        {metrics.totalChecks === 0
          ? `No checks were recorded for this website's monitors during the selected ${days}-day period.`
          : `This website's monitors only have partial data for the selected period.`}
      </p>
    </div>
  )
}

function IncidentSection({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  const { incidents } = metrics
  return (
    <div className="rpt-panel">
      <div className="rpt-panel-title">Incidents</div>
      {incidents.count === 0 ? (
        <div className="rpt-nodata rpt-nodata--inline">
          <p className="rpt-nodata-title">No incidents recorded</p>
          <p className="rpt-nodata-body">All checks completed successfully during this period.</p>
        </div>
      ) : (
        <>
          <div className="rpt-incident-summary">
            <span className="rpt-incident-count">{incidents.count} incident{incidents.count === 1 ? '' : 's'}</span>
            <span className="rpt-incident-downtime">{fmtDuration(incidents.totalDowntimeSeconds)} total downtime</span>
          </div>
          <div className="rpt-incident-list">
            {incidents.items.map(item => (
              <div key={item.id} className="rpt-incident-row">
                <span className="rpt-incident-time">{fmtIncidentTime(item.startedAt)}</span>
                <span className="rpt-incident-title">{item.title}</span>
                <span className="rpt-incident-duration">{item.durationSeconds !== null ? fmtDuration(item.durationSeconds) : 'Ongoing'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TrendChart({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  return (
    <div className="rpt-panel rpt-panel--chart">
      <div className="rpt-panel-title">Uptime Trend</div>
      {metrics.trend.length >= 2 ? (
        <SvgLineChart data={metrics.trend} unit="%" height={148} color="var(--accent, #1392FB)" />
      ) : (
        <div className="rpt-chart-empty">Not enough data points for a trend chart</div>
      )}
    </div>
  )
}

const HEALTH_RING_LABEL: Record<WebsiteReportMetrics['health'], string> = {
  operational: 'Excellent',
  attention: 'Needs Attention',
  incident: 'Critical',
}

function HealthRing({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  const pct = metrics.uptimePct ?? 100
  const size = 108
  const r = 44
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const filled = (Math.min(pct, 100) / 100) * circ
  const color = HEALTH_DOT_COLOR[metrics.health]

  return (
    <div className="rpt-health-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-primary)" strokeWidth={9} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={9}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={19} fontWeight={800} fill="var(--text-primary)">
          {metrics.uptimePct !== null ? `${pct.toFixed(1)}%` : '—'}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
          Health
        </text>
      </svg>
      <div className="rpt-health-ring-text">
        <div className="rpt-health-ring-label" style={{ color }}>{HEALTH_RING_LABEL[metrics.health]}</div>
        <div className="rpt-health-ring-sub">Based on uptime, incidents &amp; response time</div>
      </div>
    </div>
  )
}

function HeroStats({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  const items = [
    { value: metrics.uptimePct !== null ? `${metrics.uptimePct.toFixed(2)}%` : '—', label: 'Uptime' },
    { value: fmtDuration(metrics.incidents.totalDowntimeSeconds), label: 'Total Downtime' },
    { value: metrics.avgResponseMs !== null ? `${metrics.avgResponseMs}ms` : '—', label: 'Avg Response Time' },
    { value: String(metrics.incidents.count), label: metrics.incidents.count === 1 ? 'Incident' : 'Incidents' },
  ]

  return (
    <div className="rpt-hero">
      <HealthRing metrics={metrics} />
      <div className="rpt-hero-stats">
        {items.map(item => (
          <div key={item.label} className="rpt-hero-stat">
            <span className="rpt-hero-stat-value">{item.value}</span>
            <span className="rpt-hero-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const INSIGHT_ICON: Record<'positive' | 'neutral' | 'warning', React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  positive: CheckCircle2,
  neutral: TrendingUp,
  warning: AlertTriangle,
}

function InsightsPanel({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement | null {
  const insights = useMemo(() => buildReportInsights(metrics), [metrics])
  if (insights.length === 0) return null

  return (
    <div className="rpt-panel">
      <div className="rpt-panel-title">Key Insights</div>
      <ul className="rpt-insights-list">
        {insights.map((insight, i) => {
          const Icon = INSIGHT_ICON[insight.tone]
          return (
            <li key={i} className={`rpt-insight-row rpt-insight-row--${insight.tone}`}>
              <Icon size={14} strokeWidth={2.25} />
              <span>{insight.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MonitorBreakdownPanel({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  return (
    <div className="rpt-panel rpt-panel--breakdown">
      <div className="rpt-panel-title">Monitor Breakdown</div>
      <table className="rpt-breakdown-table">
        <thead>
          <tr>
            <th>Monitor</th>
            <th>Status</th>
            <th>Uptime</th>
            <th>Incidents</th>
          </tr>
        </thead>
        <tbody>
          {metrics.monitors.map(m => (
            <tr key={m.monitorId}>
              <td className="rpt-breakdown-name-cell">
                <span className="rpt-breakdown-icon"><MonitorTypeIcon type={m.monitorType} iconOnly iconSize={13} /></span>
                <span className="rpt-breakdown-name">{m.monitorName}</span>
              </td>
              <td><span className="status-dot rpt-breakdown-dot" style={{ background: HEALTH_DOT_COLOR[m.health] }} /></td>
              <td className="rpt-breakdown-uptime">{m.uptimePct !== null ? `${m.uptimePct.toFixed(1)}%` : '—'}</td>
              <td className="rpt-breakdown-incidents">{m.incidentCount > 0 ? `${m.incidentCount}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Chromium can print a blank placeholder for an <img> whose network
 *  fetch/decode hasn't finished yet — a real risk here since the report
 *  (and its footer logo) can mount and the user can click Download PDF in
 *  quick succession right after the async report fetch resolves. Wait for
 *  every image already in the report to finish decoding before calling
 *  window.print(), falling back to printing anyway after a short timeout
 *  so a slow/broken image can never block the button entirely. */
async function printWhenImagesReady(container: HTMLElement | null): Promise<void> {
  if (!container) { window.print(); return }
  const images = Array.from(container.querySelectorAll('img'))
  await Promise.race([
    Promise.all(images.map(img => img.decode().catch(() => undefined))),
    new Promise(resolve => setTimeout(resolve, 800)),
  ])
  window.print()
}

export function ReportView({ metrics }: { metrics: WebsiteReportMetrics }): React.ReactElement {
  const generatedAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const pageRef = useRef<HTMLDivElement>(null)

  return (
    <div className="rpt-a4" ref={pageRef}>
      <div className="no-print rpt-actions">
        <button className="btn btn-primary btn-sm" onClick={() => printWhenImagesReady(pageRef.current)}>Download PDF</button>
      </div>

      <div className="rpt-page">
        <div className="rpt-header">
          <div className="rpt-header-left">
            <Favicon domain={metrics.domain} size={28} />
            <div>
              <div className="rpt-header-domain">{metrics.domain}</div>
              <div className="rpt-header-monitor">
                {metrics.monitors.length} monitor{metrics.monitors.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div className="rpt-header-right">
            <div className="rpt-header-period-label">
              {metrics.range.period === 'daily' ? 'Daily Report' : metrics.range.period === 'weekly' ? 'Weekly Report' : metrics.range.period === 'monthly' ? 'Monthly Report' : 'Yearly Report'}
            </div>
            <div className="rpt-header-period-range">{metrics.range.label}</div>
            <HealthBadge health={metrics.health} />
          </div>
        </div>

        {metrics.isPartial && metrics.hasEnoughData && (
          <div className="rpt-partial-banner">
            This {metrics.range.period} period isn&apos;t fully covered by available monitoring history — showing data from {metrics.availableRange.label}.
          </div>
        )}

        {!metrics.hasEnoughData ? (
          <InsufficientData metrics={metrics} />
        ) : (
          <>
            <HeroStats metrics={metrics} />
            <InsightsPanel metrics={metrics} />
            <TrendChart metrics={metrics} />
            <MonitorBreakdownPanel metrics={metrics} />
            <IncidentSection metrics={metrics} />
          </>
        )}

        <div className="rpt-footer">
          <span>Generated from monitoring data · {generatedAt}</span>
          <span className="rpt-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- print/PDF header, not a Next-optimized asset */}
            <img src="/Logo_2.png" alt="Upnotify" />
            Powered by Upnotify
          </span>
        </div>
      </div>
    </div>
  )
}
