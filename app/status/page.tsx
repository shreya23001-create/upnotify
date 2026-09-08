import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'System Status — Upnotify',
  description: 'Current operational status of Upnotify monitoring services.',
  alternates: { canonical: 'https://uptrue.io/status' },
}

const SERVICES = [
  { name: 'Monitoring Engine',    status: 'operational' },
  { name: 'Alerting (Email)',      status: 'operational' },
  { name: 'Alerting (Slack / Teams / Webhooks)', status: 'operational' },
  { name: 'Dashboard & API',       status: 'operational' },
  { name: 'Status Pages',          status: 'operational' },
  { name: 'AI Reports',            status: 'operational' },
]

export default function StatusPage(): React.ReactElement {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🟢</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>All Systems Operational</h1>
        <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: 15 }}>
          All Upnotify services are running normally.
        </p>
      </div>

      <div style={{ border: '1px solid var(--border-primary, #e2e8f0)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        {SERVICES.map((svc, i) => (
          <div
            key={svc.name}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: i > 0 ? '1px solid var(--border-primary, #e2e8f0)' : undefined,
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 14 }}>{svc.name}</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(34,197,94,0.1)', color: '#16a34a',
            }}>
              Operational
            </span>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginBottom: 24 }}>
        Last updated: {new Date().toUTCString()}
      </p>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--accent, #3b82f6)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to Upnotify
        </Link>
      </div>
    </main>
  )
}
