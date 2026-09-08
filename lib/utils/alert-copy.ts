// Single source of truth for alert copy across all channels.
// Resolves {{placeholders}} from monitor, incident, and checker metadata.
// Used by: email, Slack, webhook, SMS, voice.

import { getMonitorTypeByType } from '@/lib/constants/monitor-types'
import type { AlertCopyTemplate } from '@/lib/constants/monitor-types'

export interface ResolvedAlertCopy {
  subject: string
  headline: string
  detail: string
  shortText: string
  voiceScript: string
}

export type AlertCopyVariant = 'alert' | 'recovery'

interface AlertCopyOptions {
  variant?: AlertCopyVariant
  metadata?: Record<string, unknown>
}

// Minimal shapes — pulled from lib/types/index.ts at runtime
interface MonitorLike {
  name: string
  target: string
  type: string
}

interface IncidentLike {
  severity?: string | null
  created_at?: string | null
  resolved_at?: string | null
}

export function getAlertCopy(
  monitor: MonitorLike,
  incident: IncidentLike,
  { variant = 'alert', metadata = {} }: AlertCopyOptions = {}
): ResolvedAlertCopy {
  const typeDef = getMonitorTypeByType(monitor.type)
  const template: AlertCopyTemplate =
    variant === 'recovery'
      ? (typeDef?.recoveryCopy ?? fallbackRecoveryCopy(monitor.name))
      : (typeDef?.alertCopy ?? fallbackAlertCopy(monitor.name))

  const context = buildContext(monitor, incident, metadata)

  return {
    subject: resolve(template.subject, context),
    headline: resolve(template.headline, context),
    detail: resolve(template.detail, context),
    shortText: resolve(template.shortText, context),
    voiceScript: resolve(template.voiceScript, context),
  }
}

// Replace {{key}} tokens with values from context map
function resolve(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => context[key] ?? `{{${key}}}`)
}

function buildContext(
  monitor: MonitorLike,
  incident: IncidentLike,
  metadata: Record<string, unknown>
): Record<string, string> {
  const checkedAt = formatDate(incident.created_at)
  const resolvedAt = formatDate(incident.resolved_at)
  const downDuration = computeDuration(incident.created_at, incident.resolved_at)

  return {
    monitorName: monitor.name,
    target: monitor.target,
    severity: incident.severity ?? 'P2',
    checkedAt,
    resolvedAt,
    downDuration,

    // SSL / domain expiry
    daysUntilExpiry: String(metadata.daysUntilExpiry ?? ''),
    issuer: String(metadata.issuer ?? ''),

    // Security headers
    grade: String(metadata.grade ?? ''),
    missingHeaders: joinArray(metadata.missing ?? metadata.missingHeaders),

    // IP change
    currentIp: String(metadata.currentIp ?? ''),
    previousIp: String(metadata.previousIp ?? ''),

    // Blacklist
    listedOn: joinArray(metadata.listed ?? metadata.listedOn),

    // Redirect chain
    hopCount: String(metadata.hopCount ?? ''),
    finalUrl: String(metadata.finalUrl ?? ''),

    // MX health
    mxIssues: joinArray(metadata.mxIssues),

    // SPF / DMARC
    spfStatus: String(metadata.spfStatus ?? ''),
    dmarcStatus: String(metadata.dmarcStatus ?? ''),

    // WHOIS
    registrar: String(metadata.registrar ?? ''),

    // Page size
    pageSize: metadata.pageSizeKb ? `${metadata.pageSizeKb}KB` : String(metadata.pageSize ?? ''),

    // Response time
    responseTime: metadata.responseTimeMs ? `${metadata.responseTimeMs}ms` : String(metadata.responseTime ?? ''),
    threshold: metadata.thresholdMs ? `${metadata.thresholdMs}ms` : String(metadata.threshold ?? ''),

    // robots.txt / sitemap / WHOIS change type
    changeType: String(metadata.changeType ?? 'content changed'),
  }
}

function joinArray(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value == null) return ''
  return String(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'unknown time'
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return dateStr
  }
}

function computeDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return 'unknown duration'
  const endTime = end ? new Date(end).getTime() : Date.now()
  const seconds = Math.floor((endTime - new Date(start).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

function fallbackAlertCopy(monitorName: string): AlertCopyTemplate {
  return {
    subject: `[Alert] ${monitorName} has an issue`,
    headline: `${monitorName} detected an issue`,
    detail: `An issue was detected on ${monitorName} at {{checkedAt}}. Please investigate.`,
    shortText: `[Upnotify] ${monitorName} has an issue at {{checkedAt}}.`,
    voiceScript: `This is an Upnotify alert. ${monitorName} has detected an issue. Please investigate immediately.`,
  }
}

function fallbackRecoveryCopy(monitorName: string): AlertCopyTemplate {
  return {
    subject: `✅ ${monitorName} has recovered`,
    headline: `${monitorName} is back to normal`,
    detail: `${monitorName} has recovered as of {{resolvedAt}}. Downtime was {{downDuration}}.`,
    shortText: `[Upnotify] ${monitorName} has recovered.`,
    voiceScript: `This is an Upnotify recovery alert. ${monitorName} has recovered.`,
  }
}
