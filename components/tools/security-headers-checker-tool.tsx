'use client'

import { useState } from 'react'
import { MonitorNudge, toolDomain } from './monitor-nudge'

interface SecurityHeaderEntry {
  name: string
  present: boolean
  value: string | null
  description: string
  importance: 'critical' | 'important' | 'recommended'
}

interface SecurityHeadersResult {
  url: string
  responseTimeMs: number
  statusCode: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  headers: SecurityHeaderEntry[]
  fetchError?: string
}

function gradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#10b981'
  if (grade === 'B') return '#3b82f6'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

function importanceLabel(importance: 'critical' | 'important' | 'recommended'): string {
  if (importance === 'critical') return 'Critical'
  if (importance === 'important') return 'Important'
  return 'Recommended'
}

function importanceColor(importance: 'critical' | 'important' | 'recommended'): string {
  if (importance === 'critical') return '#ef4444'
  if (importance === 'important') return '#f59e0b'
  return '#6366f1'
}

function formatHeaderName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-')
}

const IMPORTANCE_ORDER: Array<'critical' | 'important' | 'recommended'> = ['critical', 'important', 'recommended']

export function SecurityHeadersCheckerTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SecurityHeadersResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL')
      return
    }
    const withScheme =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/security-headers-checker?url=${encodeURIComponent(withScheme)}`)
      const data: unknown = await res.json()

      if (!res.ok) {
        const errData = data as { error?: string }
        setError(errData.error || 'Failed to check security headers')
        return
      }

      setResult(data as SecurityHeadersResult)
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

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="url"
          className="form-input ssl-checker-input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="URL to check security headers"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Headers'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {result.fetchError ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Could Not Reach URL</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>{result.fetchError}</p>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Make sure the URL is publicly accessible and try again.
              </p>
            </div>
          ) : (
            <>
              {/* Grade card */}
              <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '3.5rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      color: gradeColor(result.grade),
                    }}
                    aria-label={`Security grade: ${result.grade}`}
                  >
                    {result.grade}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Security Grade
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Score</span>
                    <span style={{ fontWeight: 700, color: gradeColor(result.grade) }}>{result.score}/100</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 5, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${result.score}%`,
                        height: '100%',
                        background: gradeColor(result.grade),
                        borderRadius: 5,
                        transition: 'width 0.5s ease',
                      }}
                      role="progressbar"
                      aria-valuenow={result.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {result.statusCode > 0 && <>HTTP {result.statusCode} · </>}
                    {result.responseTimeMs}ms response
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: 200 }}>
                  <span style={{ fontWeight: 500 }}>Checked:</span>{' '}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ wordBreak: 'break-all', color: 'var(--color-primary)' }}
                  >
                    {result.url}
                  </a>
                </div>
              </div>

              {/* Headers grouped by importance */}
              {IMPORTANCE_ORDER.map((importance) => {
                const group = result.headers.filter((h) => h.importance === importance)
                if (group.length === 0) return null
                return (
                  <div key={importance} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${importanceColor(importance)}20`,
                          color: importanceColor(importance),
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {importanceLabel(importance)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {group.map((header) => (
                        <div
                          key={header.name}
                          className="card"
                          style={{ padding: '1rem 1.25rem', borderLeft: `3px solid ${header.present ? '#10b981' : '#ef4444'}` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <code style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                  {formatHeaderName(header.name)}
                                </code>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: 99,
                                    background: header.present ? '#10b98120' : '#ef444420',
                                    color: header.present ? '#10b981' : '#ef4444',
                                  }}
                                >
                                  {header.present ? 'Present' : 'Missing'}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                {header.description}
                              </p>
                              {header.present && header.value && (
                                <div
                                  style={{
                                    marginTop: '0.5rem',
                                    padding: '0.375rem 0.625rem',
                                    background: 'var(--color-surface-secondary, #f8fafc)',
                                    borderRadius: 4,
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  {header.value}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {result.score < 100 && (
                <div className="card" style={{ padding: '1.25rem', marginTop: '0.5rem', background: 'var(--color-surface-secondary, #f8fafc)' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <strong>Want automatic security header monitoring?</strong> Uptrue can check your headers daily and alert you when something changes or a header is removed.{' '}
                    <a href="/signup" style={{ color: 'var(--color-primary)' }}>Start free →</a>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {result && <MonitorNudge toolType="security-headers" domain={toolDomain(result.url)} detail={String(result.headers.filter(h => !h.present).length)} />}
    </div>
  )
}
