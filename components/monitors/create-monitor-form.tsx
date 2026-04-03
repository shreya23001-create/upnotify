'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'

const monitorTypes = [
  { value: 'http', label: 'HTTP/HTTPS Uptime' },
  { value: 'ssl', label: 'SSL Certificate' },
  { value: 'dns', label: 'DNS Records' },
  { value: 'keyword', label: 'Keyword Detection' },
  { value: 'domain', label: 'Domain Expiry' },
  { value: 'port', label: 'Port Check' },
  { value: 'ping', label: 'Ping/Reachability' },
  { value: 'api', label: 'API Endpoint' },
  { value: 'heartbeat', label: 'Heartbeat Monitor' },
  { value: 'competitor', label: 'Page Change Detection' },
]

const intervals = [
  { value: '60', label: 'Every 1 minute' },
  { value: '180', label: 'Every 3 minutes' },
  { value: '300', label: 'Every 5 minutes' },
  { value: '600', label: 'Every 10 minutes' },
  { value: '1800', label: 'Every 30 minutes' },
  { value: '3600', label: 'Every 1 hour' },
]

export function CreateMonitorForm(): React.ReactElement {
  const [type, setType] = useState('http')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData): void {
    setError(null)
    startTransition(async () => {
      const result = await createMonitorAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="form-error">
          {error}
          {error.includes('Monitor limit reached') && (
            <>
              {' '}
              <Link href="/dashboard/settings" style={{ color: 'var(--accent, #06b6d4)', textDecoration: 'underline', fontWeight: 600 }}>
                Upgrade your plan
              </Link>
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="name">Monitor Name</label>
        <input className="form-input" id="name" name="name" required placeholder="My Website" disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="type">Monitor Type</label>
        <select className="form-select" id="type" name="type" value={type} onChange={e => setType(e.target.value)} disabled={isPending}>
          {monitorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="target">
          {type === 'port' ? 'Host (e.g. example.com:3306)' : type === 'heartbeat' ? 'Monitor Name (no target needed)' : 'Target URL or Domain'}
        </label>
        <input className="form-input" id="target" name="target" required placeholder={
          type === 'http' || type === 'ssl' || type === 'keyword' || type === 'api' || type === 'competitor' || type === 'ping'
            ? 'https://example.com'
            : type === 'dns' || type === 'domain'
              ? 'example.com'
              : type === 'port'
                ? 'example.com:3306'
                : 'my-cron-job'
        } disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="check_interval_seconds">Check Interval</label>
        <select className="form-select" id="check_interval_seconds" name="check_interval_seconds" disabled={isPending}>
          {intervals.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="severity">Severity</label>
        <select className="form-select" id="severity" name="severity" disabled={isPending}>
          <option value="P1">P1 — Critical</option>
          <option value="P2" selected>P2 — High</option>
          <option value="P3">P3 — Medium</option>
          <option value="P4">P4 — Low</option>
        </select>
      </div>

      {type === 'keyword' && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="keyword">Keyword to Search</label>
            <input className="form-input" id="keyword" name="keyword" placeholder="Expected text on page" disabled={isPending} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="shouldExist">Condition</label>
            <select className="form-select" id="shouldExist" name="shouldExist" disabled={isPending}>
              <option value="true">Alert if keyword is MISSING</option>
              <option value="false">Alert if keyword is FOUND</option>
            </select>
          </div>
        </>
      )}

      {type === 'port' && (
        <div className="form-group">
          <label className="form-label" htmlFor="port">Port Number</label>
          <input className="form-input" id="port" name="port" type="number" placeholder="3306" disabled={isPending} />
        </div>
      )}

      {type === 'heartbeat' && (
        <div className="form-group">
          <label className="form-label" htmlFor="expectedInterval">Expected Ping Interval (seconds)</label>
          <input className="form-input" id="expectedInterval" name="expectedInterval" type="number" defaultValue="300" disabled={isPending} />
        </div>
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
  )
}
