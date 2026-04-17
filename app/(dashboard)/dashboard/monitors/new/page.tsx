import Link from 'next/link'

export default function NewMonitorPage(): React.ReactElement {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add a Monitor</h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32, maxWidth: 560 }}>
        Not sure where to start? Scan your domain and we'll show you what's at risk.
        Or jump straight in and configure a monitor manually.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 720 }}>

        {/* Scan — primary */}
        <Link href="/dashboard/monitors/scan" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '2px solid var(--accent)',
            borderRadius: 16,
            padding: 28,
            cursor: 'pointer',
            background: 'var(--bg-card)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            height: '100%',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
          >
            <div style={{ fontSize: 36, marginBottom: 14 }}>🔭</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Scan a Website</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              Enter your domain and we'll run 18 health checks instantly — SSL, security headers,
              DNS, blacklists, email auth, performance, and more. Issues are pre-selected for you.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
              Start Scan →
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Recommended for new users · Takes ~15 seconds
            </div>
          </div>
        </Link>

        {/* Manual — secondary */}
        <Link href="/dashboard/monitors/new/manual" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1.5px solid var(--border-primary)',
            borderRadius: 16,
            padding: 28,
            cursor: 'pointer',
            background: 'var(--bg-card)',
            transition: 'transform 0.15s, border-color 0.15s',
            height: '100%',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = '' }}
          >
            <div style={{ fontSize: 36, marginBottom: 14 }}>✏️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Add Manually</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              Choose a specific monitor type and configure it yourself. Best when you know exactly
              what you want — keyword detection, API endpoints, heartbeat monitors, and more.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
              Configure Manually →
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              23 monitor types · Full configuration control
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
