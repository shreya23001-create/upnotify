'use client'

import { useState, useTransition } from 'react'
import { updateMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { MonitorTypeIcon } from './monitor-type-icon'
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
  port?: number
  expectedIntervalSeconds?: number
  method?: string
  headers?: Record<string, string>
  body?: string
}

export function EditMonitorForm({ monitor }: { monitor: Monitor }) {
  const config = monitor.config as MonitorConfig
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('type', monitor.type)
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
        <label className="form-label" htmlFor="target">Target</label>
        <input className="form-input" id="target" name="target" required defaultValue={monitor.target} disabled={isPending} />
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
          <option value="P1">P1 — Critical</option>
          <option value="P2">P2 — High</option>
          <option value="P3">P3 — Medium</option>
          <option value="P4">P4 — Low</option>
        </select>
      </div>

      {monitor.type === 'keyword' && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="keyword">Keyword</label>
            <input className="form-input" id="keyword" name="keyword" defaultValue={config.keyword || ''} disabled={isPending} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="shouldExist">Condition</label>
            <select className="form-select" id="shouldExist" name="shouldExist" defaultValue={config.shouldExist !== false ? 'true' : 'false'} disabled={isPending}>
              <option value="true">Alert if keyword is MISSING</option>
              <option value="false">Alert if keyword is FOUND</option>
            </select>
          </div>
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
