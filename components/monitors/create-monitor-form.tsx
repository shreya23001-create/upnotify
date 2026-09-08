'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { KeywordTagInput } from './keyword-tag-input'
import { getKeywordSuggestions } from '@/lib/utils/keyword-suggestions'
import { MonitorTypeHelp } from './monitor-type-help'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { CustomSelect } from '@/components/ui/custom-select'
import { MonitorTypeIcon } from './monitor-type-icon'
import {
  IconHttp, IconSsl, IconDns, IconKeyword, IconDomain,
  IconPort, IconPing, IconApi, IconHeartbeat, IconCompetitor,
  IconSecurityHeaders, IconResponseTime, IconRobotsTxt, IconIpChange,
  IconMxHealth, IconWhoisChange, IconSitemap, IconRedirectChain,
  IconSpfDmarc, IconBlacklist, IconPageSize, IconCookieConsent, IconNameserverChange,
  IconWordpress,
} from '@/components/icons'

const typeIconMap: Record<string, React.ReactElement> = {
  http:               <IconHttp size={16} />,
  ssl:                <IconSsl size={16} />,
  dns:                <IconDns size={16} />,
  keyword:            <IconKeyword size={16} />,
  domain:             <IconDomain size={16} />,
  port:               <IconPort size={16} />,
  ping:               <IconPing size={16} />,
  api:                <IconApi size={16} />,
  heartbeat:          <IconHeartbeat size={16} />,
  competitor:         <IconCompetitor size={16} />,
  'security-headers': <IconSecurityHeaders size={16} />,
  'response-time':    <IconResponseTime size={16} />,
  'robots-txt':       <IconRobotsTxt size={16} />,
  'ip-change':        <IconIpChange size={16} />,
  'mx-health':        <IconMxHealth size={16} />,
  'whois-change':     <IconWhoisChange size={16} />,
  sitemap:            <IconSitemap size={16} />,
  'redirect-chain':   <IconRedirectChain size={16} />,
  'spf-dmarc':        <IconSpfDmarc size={16} />,
  blacklist:          <IconBlacklist size={16} />,
  'page-size':        <IconPageSize size={16} />,
  'cookie-consent':   <IconCookieConsent size={16} />,
  'nameserver-change':<IconNameserverChange size={16} />,
  wordpress:          <IconWordpress size={16} />,
}

const monitorTypes = MONITOR_TYPES.map(t => ({
  value: t.type,
  label: t.name,
  icon: typeIconMap[t.type] ?? <MonitorTypeIcon type={t.type} iconOnly iconSize={16} />,
}))

const ALL_INTERVALS = [
  { value: 30, label: 'Every 30 seconds' },
  { value: 60, label: 'Every 1 minute' },
  { value: 180, label: 'Every 3 minutes' },
  { value: 300, label: 'Every 5 minutes' },
  { value: 600, label: 'Every 10 minutes' },
  { value: 1800, label: 'Every 30 minutes' },
  { value: 3600, label: 'Every 1 hour' },
  { value: 21600, label: 'Every 6 hours' },
  { value: 86400, label: 'Every 24 hours' },
]

const SEVERITY_OPTIONS = [
  { value: 'P1', label: 'P1 — Critical', icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P2', label: 'P2 — High',     icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P3', label: 'P3 — Medium',   icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P4', label: 'P4 — Low',      icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} /> },
]

const HTTP_METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
]

function getDefaultIntervalForType(type: string, minCheckInterval: number): number {
  const def = MONITOR_TYPES.find(t => t.type === type)
  const recommended = def?.defaultInterval ?? 60
  return Math.max(recommended, minCheckInterval)
}

export function CreateMonitorForm({ minCheckInterval = 600, defaultType = 'http' }: { minCheckInterval?: number; defaultType?: string }): React.ReactElement {
  const [type, setType] = useState(defaultType)
  const [interval, setInterval] = useState(() => getDefaultIntervalForType(defaultType, minCheckInterval))
  const [severity, setSeverity] = useState('P2')
  const [method, setMethod] = useState('GET')
  const [target, setTarget] = useState('')
  const [positiveKeywords, setPositiveKeywords] = useState<string[]>([])
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([])
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const typeDef = MONITOR_TYPES.find(t => t.type === type)
  const typeMinInterval = typeDef?.minInterval ?? 30
  const intervals = ALL_INTERVALS.filter(i => i.value >= minCheckInterval && i.value >= typeMinInterval)
  const intervalOptions = intervals.map(i => ({ value: String(i.value), label: i.label }))

  const localSuggestions = useMemo(() => getKeywordSuggestions(target), [target])
  const [dbSuggestions, setDbSuggestions] = useState<{ positive: string[]; negative: string[] }>({ positive: [], negative: [] })

  useEffect(() => {
    if (type !== 'keyword') return
    const url = target.trim()
    async function fetchDbSuggestions(): Promise<void> {
      try {
        const params = url ? `?url=${encodeURIComponent(url)}` : ''
        const res = await fetch(`/api/v1/keyword-suggestions${params}`)
        if (res.ok) {
          const data = await res.json() as { positive: { keyword: string }[]; negative: { keyword: string }[] }
          setDbSuggestions({
            positive: data.positive.map(s => s.keyword),
            negative: data.negative.map(s => s.keyword),
          })
        }
      } catch {
        // Silently ignore
      }
    }
    fetchDbSuggestions()
  }, [type, target])

  const suggestions = useMemo(() => {
    const pos = [...new Set([...localSuggestions.positive, ...dbSuggestions.positive])]
    const neg = [...new Set([...localSuggestions.negative, ...dbSuggestions.negative])]
    return { positive: pos, negative: neg }
  }, [localSuggestions, dbSuggestions])

  function handleSubmit(formData: FormData): void {
    setError(null)
    if (type === 'keyword') {
      formData.set('positiveKeywords', JSON.stringify(positiveKeywords))
      formData.set('negativeKeywords', JSON.stringify(negativeKeywords))
    }
    if (type === 'competitor') {
      formData.set('ignoreWhitespace', String(ignoreWhitespace))
    }
    startTransition(async () => {
      const result = await createMonitorAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="create-monitor-grid">
      {/* Left — form */}
      <div className="create-monitor-form-card">
        <form action={handleSubmit}>
          {error && (
            <div className="form-error">
              {error.includes('Monitor limit reached') && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              {error}
              {error.includes('Monitor limit reached') && (
                <>{' '}<Link href="/dashboard/settings?tab=billing" className="form-error-link">Upgrade your plan</Link></>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Monitor Name</label>
            <input className="form-input" id="name" name="name" required placeholder="My Website" disabled={isPending} maxLength={500} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type">Monitor Type</label>
            <CustomSelect
              id="type"
              name="type"
              options={monitorTypes}
              value={type}
              onChange={newType => {
                setType(newType)
                setInterval(getDefaultIntervalForType(newType, minCheckInterval))
              }}
              disabled={isPending}
              searchable
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="target">
              {type === 'keyword' ? 'Page URL to Monitor'
                : type === 'port' ? 'Host (e.g. example.com:3306)'
                : type === 'heartbeat' ? 'Monitor Name (no target needed)'
                : 'Target URL or Domain'}
            </label>
            <input
              className="form-input"
              id="target"
              name="target"
              required
              placeholder={
                type === 'keyword' ? 'https://yoursite.com/checkout'
                  : type === 'http' || type === 'ssl' || type === 'api' || type === 'competitor' || type === 'ping' || type === 'robots-txt' || type === 'security-headers' || type === 'response-time' || type === 'sitemap' || type === 'redirect-chain' || type === 'page-size' || type === 'cookie-consent' ? 'https://example.com'
                  : type === 'dns' || type === 'domain' || type === 'ip-change' || type === 'mx-health' || type === 'whois-change' || type === 'spf-dmarc' || type === 'blacklist' || type === 'nameserver-change' ? 'example.com'
                  : type === 'port' ? 'example.com:3306'
                  : 'my-cron-job'
              }
              disabled={isPending}
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
            {type === 'keyword' && (
              <span className="form-hint">Enter the full page URL, not just the domain</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="check_interval_seconds">Check Interval</label>
            <CustomSelect
              id="check_interval_seconds"
              name="check_interval_seconds"
              options={intervalOptions}
              value={String(interval)}
              onChange={v => setInterval(Number(v))}
              disabled={isPending}
            />
            {typeDef && typeDef.defaultInterval >= 3600 && (
              <span className="form-hint">
                Recommended every {typeDef.defaultInterval === 86400 ? '24 hours' : typeDef.defaultInterval === 21600 ? '6 hours' : '1 hour'} — this type changes slowly so frequent checks waste quota.
              </span>
            )}
            {minCheckInterval > 60 && (
              <span className="form-hint">
                Your plan supports a minimum of {minCheckInterval >= 60 ? `${minCheckInterval / 60} minute${minCheckInterval > 60 ? 's' : ''}` : `${minCheckInterval}s`} intervals.{' '}
                <Link href="/dashboard/settings?tab=billing" className="form-hint-link">Upgrade for faster checks.</Link>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="severity">Severity</label>
            <CustomSelect
              id="severity"
              name="severity"
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={setSeverity}
              disabled={isPending}
            />
          </div>

          {type === 'keyword' && (
            <>
              <KeywordTagInput
                label="Keywords that MUST exist on the page"
                helperText="If any of these disappear, we will alert you"
                keywords={positiveKeywords}
                onChange={setPositiveKeywords}
                variant="positive"
                disabled={isPending}
                placeholder="Type a keyword and press Enter"
                suggestions={suggestions.positive}
              />
              <KeywordTagInput
                label="Keywords that must NOT appear on the page"
                helperText="If any of these appear, we will alert you (e.g. error messages, spam)"
                keywords={negativeKeywords}
                onChange={setNegativeKeywords}
                variant="negative"
                disabled={isPending}
                placeholder="Type a keyword and press Enter"
                suggestions={suggestions.negative}
              />
            </>
          )}

          {type === 'port' && (
            <div className="form-group">
              <label className="form-label" htmlFor="port">Port Number</label>
              <input className="form-input" id="port" name="port" type="number" placeholder="3306" disabled={isPending} />
            </div>
          )}

          {type === 'heartbeat' && (
            <>
              <div className="heartbeat-info">
                <h4 className="heartbeat-info-title">How Heartbeat Monitoring Works</h4>
                <p className="heartbeat-info-body">
                  Unlike other monitors where Upnotify checks your server, heartbeat monitoring works the other way around:
                  <strong> your server sends a ping to Upnotify</strong> at regular intervals. If we stop receiving pings, we alert you.
                </p>
                <p className="heartbeat-info-body"><strong>Setup steps:</strong></p>
                <ol className="heartbeat-info-list">
                  <li>Create this monitor first — your unique <strong>heartbeat URL</strong> will appear on the monitor detail page after creation</li>
                  <li>Copy that URL and add a cron job on your server that calls it at regular intervals</li>
                  <li>Example cron (every 5 minutes): <code className="heartbeat-code">*/5 * * * * curl -s YOUR_HEARTBEAT_URL</code></li>
                  <li>Upnotify alerts you if it stops receiving pings</li>
                </ol>
                <p className="heartbeat-info-foot">Ideal for: cron jobs, backup scripts, batch processes, scheduled tasks, queue workers.</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="expectedInterval">Expected Ping Interval (seconds)</label>
                <input className="form-input" id="expectedInterval" name="expectedInterval" type="number" defaultValue="300" disabled={isPending} />
                <span className="form-hint">How often your server will ping us. We alert if no ping received within 2× this interval.</span>
              </div>
            </>
          )}

          {type === 'api' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="method">HTTP Method</label>
                <CustomSelect
                  id="method"
                  name="method"
                  options={HTTP_METHOD_OPTIONS}
                  value={method}
                  onChange={setMethod}
                  disabled={isPending}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="headers">Headers (JSON)</label>
                <input className="form-input" id="headers" name="headers" placeholder='{"Authorization": "Bearer ..."}' disabled={isPending} />
              </div>
            </>
          )}

          {type === 'competitor' && (
            <div className="form-group">
              <label className="form-label form-label-toggle" htmlFor="ignoreWhitespace">
                <span>Ignore Whitespace</span>
                <input
                  type="checkbox"
                  id="ignoreWhitespace"
                  checked={ignoreWhitespace}
                  onChange={e => setIgnoreWhitespace(e.target.checked)}
                  disabled={isPending}
                  className="form-toggle-input"
                />
              </label>
              <span className="form-hint">When ON, changes to spaces, tabs, and line breaks are ignored — only meaningful content changes trigger alerts.</span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>

      {/* Right — contextual help panel */}
      <div className="create-monitor-sticky">
        <MonitorTypeHelp type={type} />
      </div>
    </div>
  )
}
