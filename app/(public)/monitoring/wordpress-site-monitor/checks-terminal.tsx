const CHECKS: { text: string; category: string }[] = [
  { text: 'PHP files in wp-content/uploads', category: 'file-integrity' },
  { text: 'JavaScript files in wp-content/uploads', category: 'file-integrity' },
  { text: 'Executable code patterns in uploads', category: 'file-integrity' },
  { text: '.htaccess modifications', category: 'file-integrity' },
  { text: 'wp-config.php changes', category: 'file-integrity' },
  { text: 'WordPress core file modifications', category: 'file-integrity' },
  { text: 'Active theme file changes', category: 'file-integrity' },
  { text: 'New administrator accounts', category: 'access' },
  { text: 'New editor accounts', category: 'access' },
  { text: 'Recently created pages (last 7 days)', category: 'access' },
  { text: 'Foreign-language content — 10 scripts', category: 'access' },
  { text: 'Application passwords in use', category: 'access' },
  { text: '2FA plugin active', category: 'access' },
  { text: 'Outdated plugins (update available)', category: 'versions' },
  { text: 'Outdated active theme', category: 'versions' },
  { text: 'WordPress core version', category: 'versions' },
  { text: 'PHP version (flags end-of-life)', category: 'versions' },
  { text: 'Recently modified plugin files (24h)', category: 'versions' },
  { text: 'Debug mode status (WP_DEBUG)', category: 'config' },
  { text: 'World-writable directories', category: 'config' },
  { text: 'XML-RPC enabled / disabled', category: 'config' },
  { text: 'REST API user enumeration exposed', category: 'config' },
  { text: 'WordPress auto-update settings', category: 'config' },
  { text: 'Backup plugin present', category: 'config' },
  { text: 'Failed login attempts (24h brute force)', category: 'system' },
  { text: 'Memory limit', category: 'system' },
  { text: 'Database size', category: 'system' },
  { text: 'Spam comment volume', category: 'system' },
  { text: 'Disk usage percentage', category: 'system' },
]

const CATEGORY_LABEL: Record<string, string> = {
  'file-integrity': 'file',
  'access': 'access',
  'versions': 'version',
  'config': 'config',
  'system': 'system',
}

export function ChecksTerminal() {
  return (
    <div style={{
      background: '#0d1117',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 8px 30px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)',
      border: '1px solid #21262d',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 16px',
        background: '#161b22',
        borderBottom: '1px solid #21262d',
      }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{
          marginLeft: 10, fontSize: 12.5, fontFamily: "'SF Mono', 'JetBrains Mono', Consolas, monospace",
          color: '#8b949e', fontWeight: 500,
        }}>
          uptrue-monitor — security-scan.log
        </span>
        <span style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontFamily: "'SF Mono', 'JetBrains Mono', Consolas, monospace", color: '#3fb950',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#3fb950',
            boxShadow: '0 0 6px #3fb950', flexShrink: 0,
          }} />
          {CHECKS.length}/{CHECKS.length} passed
        </span>
      </div>

      {/* Scan log */}
      <div style={{
        padding: '18px 20px',
        fontFamily: "'SF Mono', 'JetBrains Mono', Consolas, monospace",
        fontSize: 12.5,
        lineHeight: 1.9,
        maxHeight: 340,
        overflowY: 'auto',
      }}>
        {CHECKS.map((check, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#484f58', flexShrink: 0, userSelect: 'none' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ color: '#3fb950', fontWeight: 700, flexShrink: 0 }}>[✓]</span>
            <span style={{
              color: '#7ee787', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 0.4, background: 'rgba(126,231,135,0.1)',
              padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            }}>
              {CATEGORY_LABEL[check.category]}
            </span>
            <span style={{ color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {check.text}
            </span>
            <span style={{ color: '#484f58', marginLeft: 'auto', flexShrink: 0 }}>OK</span>
          </div>
        ))}
      </div>
    </div>
  )
}
