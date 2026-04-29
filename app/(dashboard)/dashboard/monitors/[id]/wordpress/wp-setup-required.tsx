'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Monitor } from '@/lib/types'

interface WpSetupRequiredProps {
  monitor: Monitor
  token: string
}

export function WpSetupRequired({ monitor, token }: WpSetupRequiredProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<2 | 3>(2)
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Finish WordPress Monitor Setup</h1>
        <a href="/dashboard/monitors" className="btn btn-ghost">← All Monitors</a>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, maxWidth: 540 }}>
        {([1, 2, 3] as const).map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
              background: s < step ? 'var(--color-up)' : step === s ? '#667eea' : 'var(--bg-muted)',
              color: s <= step ? '#fff' : 'var(--text-muted)',
              border: step === s ? '2px solid #667eea' : 'none',
            }}>
              {s < step ? '✓' : s}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginLeft: 8, color: step === s ? '#667eea' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {s === 1 ? 'Site details' : s === 2 ? 'Install plugin' : 'Verify connection'}
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: s < step ? 'var(--color-up)' : 'var(--border-primary)', margin: '0 12px' }} />}
          </div>
        ))}
      </div>

      {/* Step 2 — Install plugin */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 600, padding: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Install the Uptrue plugin on {monitor.target}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Follow the 3 steps below, then come back here.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>1</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Download the plugin</div>
                <a
                  href="/downloads/uptrue-monitor.zip"
                  download="uptrue-monitor.zip"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: '#2271b1', color: '#fff', border: '1px solid #135e96',
                    borderRadius: 3, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download uptrue-monitor.zip
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                  Upload the zip directly via{' '}
                  <strong>WordPress Admin → Plugins → Add New → Upload Plugin</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>2</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Activate the plugin, then go to Uptrue → Settings</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  In your WordPress Admin, go to <strong>Uptrue → Settings</strong> and paste your API token:
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{
                    flex: 1, padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 8,
                    fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', border: '1px solid var(--border-input)',
                  }}>
                    {token}
                  </code>
                  <button type="button" onClick={handleCopy} className="btn btn-outline" style={{ flexShrink: 0, fontSize: 12 }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>3</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Save the settings in the plugin</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Click <strong>Save Settings</strong> — the plugin will immediately send the first data push to Uptrue.
                </p>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleProceedToVerify} className="btn btn-primary" style={{ width: '100%', marginTop: 28 }}>
            I've installed and saved the plugin →
          </button>
        </div>
      )}

      {/* Step 3 — Verify connection */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: 540, padding: 'var(--space-6)', textAlign: 'center' }}>
          {!verified ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{verifying ? '⏳' : '🔌'}</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Waiting for connection…</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Once you save the plugin settings, the first data push will arrive here within a few seconds.
                This page checks automatically every 5 seconds.
              </p>
              {verifying && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#667eea',
                      animation: 'pulse 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                Not seeing a connection?{' '}
                <button type="button" onClick={() => setStep(2)} style={{ color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                  Go back
                </button>
                {' '}or check the <strong>Uptrue → Cron Status</strong> page in your WordPress admin.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connected!</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Your WordPress site is now connected to Uptrue. Loading your monitor report…
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
