'use client'

import { useState } from 'react'
import { MonitorNudge } from './monitor-nudge'

interface PortCheckResult {
  host: string
  port: number
  open: boolean
  responseTimeMs: number
  service: string
  error?: string
}

const QUICK_PORTS: number[] = [80, 443, 22, 25, 3306, 5432]

export function PortCheckerTool(): React.ReactElement {
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PortCheckResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const cleanHost = host.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const cleanPort = port.trim()

    if (!cleanHost) {
      setError('Please enter a hostname or IP address')
      return
    }
    if (!cleanPort) {
      setError('Please enter a port number')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(
        `/api/tools/port-checker?host=${encodeURIComponent(cleanHost)}&port=${encodeURIComponent(cleanPort)}`
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to check port')
        return
      }

      setResult(data as PortCheckResult)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  function selectPort(p: number): void {
    setPort(String(p))
    setResult(null)
    setError('')
  }

  const statusColor = result
    ? result.open
      ? '#10b981'
      : '#ef4444'
    : 'var(--text-muted)'

  return (
    <div className="ssl-checker">
      {/* Input row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input ssl-checker-input"
          style={{ flex: '2 1 220px' }}
          placeholder="Hostname or IP (e.g., github.com)"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Host to check"
        />
        <input
          type="number"
          className="form-input ssl-checker-input"
          style={{ flex: '1 1 100px', minWidth: '90px' }}
          placeholder="Port"
          value={port}
          min={1}
          max={65535}
          onChange={(e) => setPort(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Port number"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Port'}
        </button>
      </div>

      {/* Quick port buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted, #6b7280)', alignSelf: 'center', marginRight: '4px' }}>
          Common ports:
        </span>
        {QUICK_PORTS.map((p) => (
          <button
            key={p}
            onClick={() => selectPort(p)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border, #e5e7eb)',
              background: port === String(p) ? 'var(--color-primary, #3b82f6)' : 'var(--color-surface, #fff)',
              color: port === String(p) ? '#fff' : 'var(--color-text, #374151)',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            aria-label={`Check port ${p}`}
          >
            {p}
          </button>
        ))}
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Status badge */}
          <div
            className="card"
            style={{
              padding: '24px',
              textAlign: 'center',
              borderTop: `4px solid ${statusColor}`,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: result.open ? '#d1fae5' : '#fee2e2',
                color: result.open ? '#065f46' : '#7f1d1d',
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{result.open ? '✓' : '✗'}</span>
              Port {result.port} is {result.open ? 'Open' : 'Closed'}
            </div>

            {result.error && !result.open && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
                {result.error}
              </p>
            )}
          </div>

          {/* Details grid */}
          <div className="ssl-details-grid">
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Host</span>
              <span className="ssl-detail-value" style={{ fontFamily: 'monospace' }}>{result.host}</span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Port</span>
              <span className="ssl-detail-value" style={{ fontFamily: 'monospace' }}>{result.port}</span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Service</span>
              <span className="ssl-detail-value">
                {result.service !== 'Unknown' ? result.service : '—'}
              </span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Response Time</span>
              <span className="ssl-detail-value">{result.responseTimeMs}ms</span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Status</span>
              <span
                className="ssl-detail-value"
                style={{ color: statusColor, fontWeight: 600 }}
              >
                {result.open ? 'Accepting connections' : 'Not reachable'}
              </span>
            </div>
          </div>
        </div>
      )}
      {result && <MonitorNudge toolType="port" domain={result.host} />}
    </div>
  )
}
