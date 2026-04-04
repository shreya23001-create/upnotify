'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type WizardStep = 1 | 2 | 3

interface MonitorOption {
  type: string
  label: string
  description: string
  enabled: boolean
  locked: boolean
}

interface MonitorResult {
  id: string
  name: string
  type: string
  target: string
  status: string
  responseTimeMs: number | null
  statusCode: number | null
  errorMessage: string | null
  metadata: Record<string, unknown> | null
}

interface SetupWizardProps {
  onComplete: () => void
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ONBOARDING_COMPLETE_KEY = 'uptrue_onboarding_complete'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function normaliseUrl(input: string): string {
  let url = input.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  return url
}

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(normaliseUrl(input))
    return parsed.hostname.includes('.')
  } catch {
    return false
  }
}

function isHttps(input: string): boolean {
  return normaliseUrl(input).startsWith('https://')
}

function extractDomain(input: string): string {
  try {
    return new URL(normaliseUrl(input)).hostname
  } catch {
    return input
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'up': return 'Operational'
    case 'down': return 'Down'
    case 'degraded': return 'Degraded'
    default: return 'Unknown'
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'up': return 'wizard-status-up'
    case 'down': return 'wizard-status-down'
    case 'degraded': return 'wizard-status-degraded'
    default: return 'wizard-status-unknown'
  }
}

function getMonitorIcon(type: string): string {
  switch (type) {
    case 'http': return '\u{1F310}'
    case 'ssl': return '\u{1F512}'
    case 'dns': return '\u{1F4E1}'
    case 'keyword': return '\u{1F50D}'
    default: return '\u{2699}'
  }
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return '--'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatSslExpiry(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null
  const days = metadata.daysUntilExpiry as number | undefined
  if (typeof days !== 'number') return null
  if (days < 0) return 'Expired'
  return `Expires in ${days} days`
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function SetupWizard({ onComplete }: SetupWizardProps): React.ReactElement {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [monitorOptions, setMonitorOptions] = useState<MonitorOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<MonitorResult[]>([])
  const [apiError, setApiError] = useState('')

  /* -- Step 1: URL input ------------------------------------------- */

  const handleUrlChange = useCallback((value: string): void => {
    setUrl(value)
    if (urlError) setUrlError('')
  }, [urlError])

  const handleUrlSubmit = useCallback((): void => {
    const trimmed = url.trim()
    if (!trimmed) {
      setUrlError('Please enter a URL')
      return
    }
    if (!isValidUrl(trimmed)) {
      setUrlError('Please enter a valid website address')
      return
    }

    const normalisedUrl = normaliseUrl(trimmed)
    const domain = extractDomain(trimmed)
    const usesSsl = isHttps(trimmed)

    setMonitorOptions([
      {
        type: 'http',
        label: 'Uptime Monitoring',
        description: `Check if ${domain} is reachable every 5 minutes`,
        enabled: true,
        locked: true,
      },
      {
        type: 'ssl',
        label: 'SSL Certificate',
        description: usesSsl
          ? `Monitor SSL certificate expiry for ${domain}`
          : `No HTTPS detected — enable if you add SSL later`,
        enabled: usesSsl,
        locked: false,
      },
      {
        type: 'dns',
        label: 'DNS Health',
        description: `Monitor DNS resolution for ${domain}`,
        enabled: false,
        locked: false,
      },
      {
        type: 'keyword',
        label: 'Page Content Check',
        description: `Verify ${domain} loads expected content`,
        enabled: false,
        locked: false,
      },
    ])

    setStep(2)
  }, [url])

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUrlSubmit()
    }
  }, [handleUrlSubmit])

  /* -- Step 2: Monitor selection ----------------------------------- */

  const toggleMonitor = useCallback((index: number): void => {
    setMonitorOptions(prev =>
      prev.map((opt, i) => {
        if (i !== index || opt.locked) return opt
        return { ...opt, enabled: !opt.enabled }
      })
    )
  }, [])

  const handleSetupMonitors = useCallback(async (): Promise<void> => {
    const selectedMonitors = monitorOptions.filter(m => m.enabled)
    if (selectedMonitors.length === 0) {
      setApiError('Please select at least one monitor')
      return
    }

    setIsSubmitting(true)
    setApiError('')

    const normalisedUrl = normaliseUrl(url)
    const domain = extractDomain(url)

    const monitorsPayload = selectedMonitors.map(m => ({
      type: m.type,
      name: `${m.label} — ${domain}`,
      target: normalisedUrl,
    }))

    try {
      const response = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalisedUrl, monitors: monitorsPayload }),
      })

      const data = await response.json() as { success?: boolean; monitors?: MonitorResult[]; error?: string }

      if (!response.ok || !data.success) {
        setApiError(data.error ?? 'Failed to create monitors. Please try again.')
        setIsSubmitting(false)
        return
      }

      setResults(data.monitors ?? [])
      markOnboardingComplete()
      setStep(3)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      logger.error('Onboarding request failed', { error: message })
      setApiError('Connection error. Please check your network and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [monitorOptions, url])

  /* -- Step 3: Results --------------------------------------------- */

  const handleGoToDashboard = useCallback((): void => {
    onComplete()
    router.refresh()
  }, [onComplete, router])

  const handleAddAnother = useCallback((): void => {
    setUrl('')
    setUrlError('')
    setMonitorOptions([])
    setResults([])
    setApiError('')
    setStep(1)
  }, [])

  /* -- Render ------------------------------------------------------ */

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        {/* Progress bar */}
        <div className="wizard-progress">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`wizard-progress-step${s <= step ? ' active' : ''}${s < step ? ' completed' : ''}`}
            >
              <div className="wizard-progress-dot">
                {s < step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{s}</span>
                )}
              </div>
              <span className="wizard-progress-label">
                {s === 1 ? 'Your website' : s === 2 ? 'Choose checks' : 'All set'}
              </span>
            </div>
          ))}
          <div className="wizard-progress-line">
            <div
              className="wizard-progress-line-fill"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          {step === 1 && (
            <div className="wizard-step wizard-step-active">
              <h2 className="wizard-title">What&apos;s your website?</h2>
              <p className="wizard-subtitle">
                Enter the URL you want to monitor. We&apos;ll start checking it immediately.
              </p>
              <div className="wizard-url-input-wrapper">
                <div className="wizard-url-prefix">https://</div>
                <input
                  type="text"
                  className={`form-input wizard-url-input${urlError ? ' error' : ''}`}
                  placeholder="example.com"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  autoComplete="url"
                  spellCheck={false}
                />
              </div>
              {urlError && <p className="wizard-error">{urlError}</p>}
              <button
                className="btn btn-primary wizard-btn"
                onClick={handleUrlSubmit}
                disabled={!url.trim()}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step wizard-step-active">
              <h2 className="wizard-title">What should we check?</h2>
              <p className="wizard-subtitle">
                We&apos;ve selected smart defaults for <strong>{extractDomain(url)}</strong>. Toggle any you&apos;d like.
              </p>
              <div className="wizard-monitors-list">
                {monitorOptions.map((opt, index) => (
                  <label
                    key={opt.type}
                    className={`wizard-monitor-option${opt.enabled ? ' enabled' : ''}${opt.locked ? ' locked' : ''}`}
                  >
                    <div className="wizard-monitor-checkbox">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={() => toggleMonitor(index)}
                        disabled={opt.locked}
                      />
                    </div>
                    <div className="wizard-monitor-icon">{getMonitorIcon(opt.type)}</div>
                    <div className="wizard-monitor-info">
                      <div className="wizard-monitor-label">
                        {opt.label}
                        {opt.locked && <span className="wizard-required-badge">Required</span>}
                      </div>
                      <div className="wizard-monitor-desc">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {apiError && <p className="wizard-error">{apiError}</p>}
              <div className="wizard-actions">
                <button
                  className="btn wizard-btn-back"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  className="btn btn-primary wizard-btn"
                  onClick={handleSetupMonitors}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Set up monitors
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step wizard-step-active">
              <div className="wizard-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="wizard-title">You&apos;re all set!</h2>
              <p className="wizard-subtitle">
                Your monitors are live and checking <strong>{extractDomain(url)}</strong> right now.
              </p>

              <div className="wizard-results">
                {results.map(result => (
                  <div key={result.id} className="wizard-result-card">
                    <div className="wizard-result-header">
                      <span className="wizard-result-icon">{getMonitorIcon(result.type)}</span>
                      <span className="wizard-result-name">{result.name}</span>
                      <span className={`badge ${getStatusClass(result.status)}`}>
                        {getStatusLabel(result.status)}
                      </span>
                    </div>
                    <div className="wizard-result-details">
                      {result.responseTimeMs !== null && (
                        <div className="wizard-result-stat">
                          <span className="wizard-result-stat-label">Response</span>
                          <span className="wizard-result-stat-value">
                            {formatResponseTime(result.responseTimeMs)}
                          </span>
                        </div>
                      )}
                      {result.statusCode !== null && (
                        <div className="wizard-result-stat">
                          <span className="wizard-result-stat-label">Status</span>
                          <span className="wizard-result-stat-value">{result.statusCode}</span>
                        </div>
                      )}
                      {result.type === 'ssl' && result.metadata && (
                        <div className="wizard-result-stat">
                          <span className="wizard-result-stat-label">SSL</span>
                          <span className="wizard-result-stat-value">
                            {formatSslExpiry(result.metadata) ?? '--'}
                          </span>
                        </div>
                      )}
                      {result.errorMessage && result.status !== 'up' && (
                        <div className="wizard-result-error">{result.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="wizard-trial-note">
                You&apos;re on the Free plan. Upgrade anytime from Settings &gt; Billing.
              </p>

              <div className="wizard-actions">
                <button
                  className="btn wizard-btn-back"
                  onClick={handleAddAnother}
                >
                  Add another site
                </button>
                <button
                  className="btn btn-primary wizard-btn"
                  onClick={handleGoToDashboard}
                >
                  Go to Dashboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers — localStorage persistence                                  */
/* ------------------------------------------------------------------ */

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true'
}

export function markOnboardingComplete(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
}
