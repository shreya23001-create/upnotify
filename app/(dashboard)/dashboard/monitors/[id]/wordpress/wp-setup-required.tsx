'use client'

import { useState } from 'react'
import type { Monitor } from '@/lib/types'

interface WpSetupRequiredProps {
  monitor: Monitor
  token: string
}

export function WpSetupRequired({ monitor, token }: WpSetupRequiredProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  function handleCopy(): void {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{monitor.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Complete setup to start monitoring your WordPress site.
          </p>
        </div>
        <a href="/dashboard/monitors" className="btn btn-ghost">← All Monitors</a>
      </div>

      <div className="card" style={{ maxWidth: 620, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-info-bg, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Plugin setup required</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Install the Uptrue plugin on <strong>{monitor.target}</strong> to activate monitoring.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>1</div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Download the Uptrue plugin</div>
              <a
                href="/downloads/uptrue-monitor.php"
                download="uptrue-monitor.php"
                className="btn btn-outline"
                style={{ fontSize: 13 }}
              >
                ⬇ Download uptrue-monitor.php
              </a>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                Create a folder named <code>uptrue-monitor</code>, place the file inside, zip it, then upload via{' '}
                <strong>WordPress Admin → Plugins → Add New → Upload Plugin</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>2</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Activate the plugin, then go to Uptrue → Settings</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Paste your secret API token into the plugin settings:
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{
                  flex: 1, padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 8,
                  fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', border: '1px solid var(--border-input)',
                }}>
                  {token}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-outline"
                  style={{ flexShrink: 0, fontSize: 12 }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#667eea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>3</div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Save settings — your report appears here</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Click <strong>Save Settings</strong> in the plugin. The first data push arrives within seconds and this page will show your full WordPress health report.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          Once the plugin sends its first report, <strong>refresh this page</strong> to see your WordPress health dashboard.
        </div>
      </div>
    </div>
  )
}
