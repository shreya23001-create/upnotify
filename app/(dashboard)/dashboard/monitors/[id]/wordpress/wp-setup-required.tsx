'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Monitor } from '@/lib/types'

interface WpSetupRequiredProps {
  monitor: Monitor
  token: string
}

type WizardStep = 1 | 2 | 3

function stepCircleClass(s: WizardStep, current: WizardStep): string {
  if (s < current) return 'wp-step-circle done'
  if (s === current) return 'wp-step-circle active'
  return 'wp-step-circle'
}

function stepLabelClass(s: WizardStep, current: WizardStep): string {
  if (s < current) return 'wp-step-label done'
  if (s === current) return 'wp-step-label active'
  return 'wp-step-label'
}

export function WpSetupRequired({ monitor, token }: WpSetupRequiredProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<WizardStep>(2)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function handleCopy(): void {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleProceedToVerify(): void {
    setStep(3)
    setVerifying(true)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/v1/wp-agent/verify?monitor_id=${monitor.id}`)
        const data = await res.json() as { verified: boolean }
        if (data.verified) {
          clearInterval(pollRef.current!)
          setVerified(true)
          setVerifying(false)
          setTimeout(() => router.refresh(), 1500)
        }
      } catch { /* ignore */ }
      if (attempts >= 120) {
        clearInterval(pollRef.current!)
        setVerifying(false)
      }
    }, 5000)
  }

  const steps: { label: string }[] = [
    { label: 'Site details' },
    { label: 'Install plugin' },
    { label: 'Verify connection' },
  ]

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Finish WordPress Monitor Setup</div>
        <div className="db-page-actions">
          <a href="/dashboard/monitors" className="btn btn-ghost btn-sm">← All Monitors</a>
        </div>
      </div>

      <div className="wp-wizard">
        {/* Step indicator */}
        <div className="wp-steps">
          {steps.map((s, i) => (
            <div key={i} className="wp-step">
              <div className="wp-step-inner">
                <div className={stepCircleClass((i + 1) as WizardStep, step)}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={stepLabelClass((i + 1) as WizardStep, step)}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`wp-step-line${i + 1 < step ? ' done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 2 — Install plugin */}
        {step === 2 && (
          <div className="create-monitor-grid">
            {/* Left — main steps */}
            <div className="create-monitor-form-card">
              <div className="wp-card-title">Install the Uptrue plugin on {monitor.target}</div>
              <p className="wp-card-sub">Follow the 3 steps below, then come back here to verify the connection.</p>

              <div className="wp-install-steps">
                <div className="wp-install-step">
                  <div className="wp-install-step-num">1</div>
                  <div className="wp-install-step-body">
                    <div className="wp-install-step-title">Download the plugin</div>
                    <a
                      href="/downloads/uptrue-monitor.zip"
                      download="uptrue-monitor.zip"
                      className="btn btn-secondary wp-download-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download uptrue-monitor.zip
                    </a>
                    <p className="wp-install-step-desc">
                      Upload via <strong>WordPress Admin → Plugins → Add New → Upload Plugin</strong>.
                    </p>
                  </div>
                </div>

                <div className="wp-install-step">
                  <div className="wp-install-step-num">2</div>
                  <div className="wp-install-step-body">
                    <div className="wp-install-step-title">Activate the plugin, then go to Uptrue → Settings</div>
                    <p className="wp-install-step-desc">
                      In your WordPress Admin, go to <strong>Uptrue → Settings</strong> and paste your API token:
                    </p>
                    <div className="wp-token-row">
                      <code className="wp-token">{token}</code>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`wp-token-copy${copied ? ' copied' : ''}`}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="wp-install-step">
                  <div className="wp-install-step-num">3</div>
                  <div className="wp-install-step-body">
                    <div className="wp-install-step-title">Save the settings in the plugin</div>
                    <p className="wp-install-step-desc">
                      Click <strong>Save Settings</strong> — the plugin will immediately send the first data push to Uptrue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="wp-cta">
                <button type="button" onClick={handleProceedToVerify} className="btn btn-primary wp-cta-btn">
                  I&apos;ve installed and saved the plugin →
                </button>
              </div>
            </div>

            {/* Right — info panel matching monitor-help-panel style */}
            <div className="create-monitor-sticky">
              <div className="monitor-help-panel">
                <div className="monitor-help-header">
                  <span className="monitor-help-icon monitor-help-icon-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="28" height="28">
                      <circle cx="256" cy="256" r="248" fill="#21759b" />
                      <path fill="#fff" d="M38.4 256c0 86.6 50.3 161.7 123.5 197.9L58.1 163.7C45.5 193.5 38.4 226.9 38.4 256zm336.8-10.1c0-27-9.7-45.7-18-60.2-11.1-18-21.5-33.2-21.5-51.2 0-20.1 15.2-38.8 36.7-38.8.97 0 1.9.1 2.84.16C338.8 63 299 48 256 48c-57.2 0-107.5 29.3-136.8 73.7 3.84.12 7.46.19 10.6.19 17.2 0 43.8-2.1 43.8-2.1 8.86-.52 9.9 12.5 1.05 13.5 0 0-8.91 1.05-18.8 1.57l59.9 178.3 36-107.8-25.6-70.5c-8.86-.52-17.2-1.57-17.2-1.57-8.86-.52-7.82-14 1.04-13.5 0 0 27.1 2.1 43.3 2.1 17.2 0 43.8-2.1 43.8-2.1 8.87-.52 9.91 12.5 1.05 13.5 0 0-8.92 1.05-18.8 1.57l59.4 176.8 16.4-54.7c7.1-22.7 12.5-39 12.5-53z"/>
                      <path fill="#fff" d="M259.4 273.6l-49.3 143.3c14.7 4.33 30.3 6.69 46.4 6.69 19.1 0 37.5-3.3 54.6-9.3-.44-.7-.84-1.44-1.17-2.24L259.4 273.6zm150.5-99.4c.78 5.76 1.22 11.9 1.22 18.5 0 18.3-3.42 38.8-13.7 64.5l-55 159c53.5-31.2 89.5-89.1 89.5-155.2 0-31.8-8.13-61.7-22-87.8z"/>
                    </svg>
                  </span>
                  <div>
                    <div className="monitor-help-name">WordPress Monitor</div>
                  </div>
                </div>
                <div className="monitor-help-body">
                  <p className="monitor-help-desc">
                    A lightweight plugin installed on your WordPress site that monitors security threats, software health, content changes, and performance — then sends findings to Uptrue for real-time alerts.
                  </p>
                  <div className="monitor-help-faqs-label">What it catches</div>
                  <ul className="help-list" style={{ marginTop: 8 }}>
                    <li>PHP files injected into <code>/uploads/</code></li>
                    <li>New admin users created without your knowledge</li>
                    <li>Outdated plugins with known vulnerabilities</li>
                    <li>Modified core files (wp-config.php, .htaccess)</li>
                    <li>WP debug mode left on in production</li>
                  </ul>
                  <div className="monitor-help-faqs-label" style={{ marginTop: 16 }}>Having trouble?</div>
                  <p className="monitor-help-desc" style={{ marginBottom: 0, marginTop: 6 }}>
                    Check <strong>Uptrue → Cron Status</strong> in your WP Admin, or{' '}
                    <a href="/dashboard/support" style={{ color: 'var(--accent)', fontWeight: 600 }}>open a support ticket</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Verify connection */}
        {step === 3 && (
          <div className="wp-waiting">
            {!verified ? (
              <>
                <div className="wp-waiting-icon">{verifying ? '⏳' : '🔌'}</div>
                <div className="wp-waiting-title">Waiting for connection…</div>
                <p className="wp-waiting-desc">
                  Once you save the plugin settings, the first data push will arrive within a few seconds.
                  This page checks automatically every 5 seconds.
                </p>
                {verifying && (
                  <div className="wp-dots">
                    <div className="wp-dot" />
                    <div className="wp-dot" />
                    <div className="wp-dot" />
                  </div>
                )}
                <p className="wp-waiting-foot">
                  Not seeing a connection?{' '}
                  <button type="button" onClick={() => setStep(2)} className="wp-waiting-back">
                    Go back
                  </button>
                  {' '}or check <strong>Uptrue → Cron Status</strong> in your WordPress admin.
                </p>
              </>
            ) : (
              <>
                <div className="wp-waiting-icon">✅</div>
                <div className="wp-waiting-title">Connected!</div>
                <p className="wp-waiting-desc">
                  Your WordPress site is now connected to Uptrue. Loading your monitor report…
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
