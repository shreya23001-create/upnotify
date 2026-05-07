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
          <div className="wp-card">
            <div className="wp-card-title">Install the Uptrue plugin on {monitor.target}</div>
            <p className="wp-card-sub">Follow the 3 steps below, then come back here.</p>

            <div className="wp-install-steps">
              <div className="wp-install-step">
                <div className="wp-install-step-num">1</div>
                <div className="wp-install-step-body">
                  <div className="wp-install-step-title">Download the plugin</div>
                  <a
                    href="/downloads/uptrue-monitor.zip"
                    download="uptrue-monitor.zip"
                    className="btn btn-secondary btn-sm"
                    style={{ marginBottom: 8 }}
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
                    <button type="button" onClick={handleCopy} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
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

            <div className="form-actions">
              <button type="button" onClick={handleProceedToVerify} className="btn btn-primary" style={{ width: '100%' }}>
                I&apos;ve installed and saved the plugin →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Verify connection */}
        {step === 3 && (
          <div className="wp-card wp-waiting">
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
