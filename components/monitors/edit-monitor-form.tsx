'use client'

import { useState, useTransition, useMemo } from 'react'
import { updateMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { MonitorTypeIcon } from './monitor-type-icon'
import { KeywordTagInput } from './keyword-tag-input'
import { getKeywordSuggestions } from '@/lib/utils/keyword-suggestions'
import type { Monitor } from '@/lib/types'

const intervals = [
  { value: '60', label: 'Every 1 minute' },
  { value: '180', label: 'Every 3 minutes' },
  { value: '300', label: 'Every 5 minutes' },
  { value: '600', label: 'Every 10 minutes' },
  { value: '1800', label: 'Every 30 minutes' },
  { value: '3600', label: 'Every 1 hour' },
]

interface MonitorConfig {
  keyword?: string
  shouldExist?: boolean
  positiveKeywords?: string[]
  negativeKeywords?: string[]
  port?: number
  expectedIntervalSeconds?: number
  method?: string
  headers?: Record<string, string>
  body?: string
}

/**
 * Resolve legacy single-keyword config into arrays for the new UI.
 */
function resolveKeywordConfig(config: MonitorConfig): { positive: string[]; negative: string[] } {
  let positive: string[] = []
  let negative: string[] = []

  if (Array.isArray(config.positiveKeywords) && config.positiveKeywords.length > 0) {
    positive = config.positiveKeywords
  } else if (config.keyword && config.shouldExist !== false) {
    positive = [config.keyword]
  }

  if (Array.isArray(config.negativeKeywords) && config.negativeKeywords.length > 0) {
    negative = config.negativeKeywords
  } else if (config.keyword && config.shouldExist === false) {
    negative = [config.keyword]
  }

  return { positive, negative }
}

export function EditMonitorForm({ monitor }: { monitor: Monitor }): React.ReactElement {
  const config = monitor.config as MonitorConfig
  const resolved = resolveKeywordConfig(config)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [target, setTarget] = useState(monitor.target)
  const [positiveKeywords, setPositiveKeywords] = useState<string[]>(resolved.positive)
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>(resolved.negative)

  const suggestions = useMemo(() => getKeywordSuggestions(target), [target])

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('type', monitor.type)

    if (monitor.type === 'keyword') {
      formData.set('positiveKeywords', JSON.stringify(positiveKeywords))
      formData.set('negativeKeywords', JSON.stringify(negativeKeywords))
    }

    startTransition(async () => {
      const result = await updateMonitorAction(monitor.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Monitor Type</label>
        <div style={{ padding: '12px 16px', background: '#f8f9fc', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MonitorTypeIcon type={monitor.type} />
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>(cannot be changed)</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="name">Monitor Name</label>
        <input className="form-input" id="name" name="name" required defaultValue={monitor.name} disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="target">
          {monitor.type === 'keyword' ? 'Page URL to Monitor' : 'Target'}
        </label>
        <input
          className="form-input"
          id="target"
          name="target"
          required
          value={target}
          onChange={e => setTarget(e.target.value)}
          disabled={isPending}
        />
        {monitor.type === 'keyword' && (
          <span className="form-helper-text">Enter the full page URL, not just the domain</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="check_interval_seconds">Check Interval</label>
        <select className="form-select" id="check_interval_seconds" name="check_interval_seconds" defaultValue={String(monitor.check_interval_seconds)} disabled={isPending}>
          {intervals.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="severity">Severity</label>
        <select className="form-select" id="severity" name="severity" defaultValue={monitor.severity} disabled={isPending}>
          <option value="P1">P1 -- Critical</option>
          <option value="P2">P2 -- High</option>
          <option value="P3">P3 -- Medium</option>
          <option value="P4">P4 -- Low</option>
        </select>
      </div>

      {monitor.type === 'keyword' && (
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

      {monitor.type === 'port' && (
        <div className="form-group">
          <label className="form-label" htmlFor="port">Port Number</label>
          <input className="form-input" id="port" name="port" type="number" defaultValue={config.port || ''} disabled={isPending} />
        </div>
      )}

      {monitor.type === 'heartbeat' && (
        <div className="form-group">
          <label className="form-label" htmlFor="expectedInterval">Expected Ping Interval (seconds)</label>
          <input className="form-input" id="expectedInterval" name="expectedInterval" type="number" defaultValue={config.expectedIntervalSeconds || 300} disabled={isPending} />
        </div>
      )}

      {monitor.type === 'api' && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="method">HTTP Method</label>
            <select className="form-select" id="method" name="method" defaultValue={config.method || 'GET'} disabled={isPending}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="headers">Headers (JSON)</label>
            <input className="form-input" id="headers" name="headers" defaultValue={config.headers ? JSON.stringify(config.headers) : ''} disabled={isPending} />
          </div>
        </>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
