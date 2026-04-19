'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { KeywordTagInput } from './keyword-tag-input'
import { getKeywordSuggestions } from '@/lib/utils/keyword-suggestions'
import { MonitorTypeHelp } from './monitor-type-help'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

const monitorTypes = MONITOR_TYPES.map(t => ({ value: t.type, label: t.name }))

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

function getDefaultIntervalForType(type: string, minCheckInterval: number): number {
  const def = MONITOR_TYPES.find(t => t.type === type)
  const recommended = def?.defaultInterval ?? 60
  return Math.max(recommended, minCheckInterval)
}

export function CreateMonitorForm({ minCheckInterval = 600 }: { minCheckInterval?: number }): React.ReactElement {
  const [type, setType] = useState('http')
  const [interval, setInterval] = useState(() => getDefaultIntervalForType('http', minCheckInterval))
  const [target, setTarget] = useState('')
  const [positiveKeywords, setPositiveKeywords] = useState<string[]>([])
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Only show intervals allowed by the plan and the type's minInterval
  const typeDef = MONITOR_TYPES.find(t => t.type === type)
  const typeMinInterval = typeDef?.minInterval ?? 30
  const intervals = ALL_INTERVALS.filter(i => i.value >= minCheckInterval && i.value >= typeMinInterval)

  const localSuggestions = useMemo(() => getKeywordSuggestions(target), [target])
  const [dbSuggestions, setDbSuggestions] = useState<{ positive: string[]; negative: string[] }>({ positive: [], negative: [] })

  // Fetch DB suggestions when type is keyword and target changes
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

  // Merge local + DB suggestions (deduplicated)
  const suggestions = useMemo(() => {
    const pos = [...new Set([...localSuggestions.positive, ...dbSuggestions.positive])]
    const neg = [...new Set([...localSuggestions.negative, ...dbSuggestions.negative])]
    return { positive: pos, negative: neg }
  }, [localSuggestions, dbSuggestions])

  function handleSubmit(formData: FormData): void {
    setError(null)

    // Inject keyword arrays into form data as JSON
    if (type === 'keyword') {
      formData.set('positiveKeywords', JSON.stringify(positiveKeywords))
      formData.set('negativeKeywords', JSON.stringify(negativeKeywords))
    }

    startTransition(async () => {
      const result = await createMonitorAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      gap: 32,
      alignItems: 'start',
    }} className="create-monitor-layout">
      {/* Left — the form */}
      <form action={handleSubmit}>
      {error && (
        <div className="form-error">
          {error.includes('Monitor limit reached') && (
            <span style={{ marginRight: 6, fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
          )}
          {error}
          {error.includes('Monitor limit reached') && (
            <>
              {' '}
              <Link href="/dashboard/settings?tab=billing" style={{ color: 'var(--accent, #06b6d4)', textDecoration: 'underline', fontWeight: 600 }}>
                Upgrade your plan
              </Link>
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="name">Monitor Name</label>
        <input className="form-input" id="name" name="name" required placeholder="My Website" disabled={isPending} maxLength={500} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="type">Monitor Type</label>
        <select className="form-select" id="type" name="type" value={type} onChange={e => {
          const newType = e.target.value
          setType(newType)
          setInterval(getDefaultIntervalForType(newType, minCheckInterval))
        }} disabled={isPending}>
          {monitorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="target">
          {type === 'keyword'
            ? 'Page URL to Monitor'
            : type === 'port'
              ? 'Host (e.g. example.com:3306)'
              : type === 'heartbeat'
                ? 'Monitor Name (no target needed)'
                : 'Target URL or Domain'}
        </label>
        <input
          className="form-input"
          id="target"
          name="target"
          required
          placeholder={
            type === 'keyword'
              ? 'https://yoursite.com/checkout'
              : type === 'http' || type === 'ssl' || type === 'api' || type === 'competitor' || type === 'ping'
                ? 'https://example.com'
                : type === 'dns' || type === 'domain'
                  ? 'example.com'
                  : type === 'port'
                    ? 'example.com:3306'
                    : 'my-cron-job'
          }
          disabled={isPending}
          value={target}
          onChange={e => setTarget(e.target.value)}
        />
        {type === 'keyword' && (
          <span className="form-helper-text">Enter the full page URL, not just the domain</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="check_interval_seconds">Check Interval</label>
        <select
          className="form-select"
          id="check_interval_seconds"
          name="check_interval_seconds"
          value={String(interval)}
          onChange={e => setInterval(Number(e.target.value))}
          disabled={isPending}
        >
          {intervals.map(i => (
            <option key={i.value} value={String(i.value)}>{i.label}</option>
          ))}
        </select>
        {typeDef && typeDef.defaultInterval >= 3600 && (
          <span className="form-helper-text">
            Recommended every {typeDef.defaultInterval === 86400 ? '24 hours' : typeDef.defaultInterval === 21600 ? '6 hours' : '1 hour'} — this type changes slowly so frequent checks waste quota.
          </span>
        )}
        {minCheckInterval > 60 && (
          <span className="form-helper-text">
            Your plan supports a minimum of {minCheckInterval >= 60 ? `${minCheckInterval / 60} minute${minCheckInterval > 60 ? 's' : ''}` : `${minCheckInterval}s`} intervals.{' '}
            <a href="/dashboard/settings?tab=billing" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Upgrade for faster checks.</a>
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="severity">Severity</label>
        <select className="form-select" id="severity" name="severity" disabled={isPending}>
          <option value="P1">P1 -- Critical</option>
          <option value="P2" selected>P2 -- High</option>
          <option value="P3">P3 -- Medium</option>
          <option value="P4">P4 -- Low</option>
        </select>
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
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>How Heartbeat Monitoring Works</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
              Unlike other monitors where Uptrue checks your server, heartbeat monitoring works the other way around:
              <strong> your server sends a ping to Uptrue</strong> at regular intervals. If we stop receiving pings, we alert you.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
              <strong>Setup steps:</strong>
            </p>
            <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18, marginBottom: 10 }}>
              <li>Create this monitor first — your unique <strong>heartbeat URL</strong> will appear on the monitor detail page after creation</li>
              <li>Copy that URL and add a cron job on your server that calls it at regular intervals</li>
              <li>Example cron (every 5 minutes): <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>*/5 * * * * curl -s YOUR_HEARTBEAT_URL</code></li>
              <li>Uptrue alerts you if it stops receiving pings</li>
            </ol>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Ideal for: cron jobs, backup scripts, batch processes, scheduled tasks, queue workers.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="expectedInterval">Expected Ping Interval (seconds)</label>
            <input className="form-input" id="expectedInterval" name="expectedInterval" type="number" defaultValue="300" disabled={isPending} />
            <span className="form-helper-text">How often your server will ping us. We alert if no ping received within 2x this interval.</span>
          </div>
        </>
      )}

      {type === 'api' && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="method">HTTP Method</label>
            <select className="form-select" id="method" name="method" disabled={isPending}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="headers">Headers (JSON)</label>
            <input className="form-input" id="headers" name="headers" placeholder='{"Authorization": "Bearer ..."}' disabled={isPending} />
          </div>
        </>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Creating...' : 'Create Monitor'}
      </button>
    </form>

      {/* Right — contextual help panel */}
      <div style={{ position: 'sticky', top: 24 }}>
        <MonitorTypeHelp type={type} />
      </div>
    </div>
  )
}
