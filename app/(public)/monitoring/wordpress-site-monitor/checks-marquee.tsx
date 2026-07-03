const CHECKS: string[] = [
  'PHP files in uploads',
  'JS files in uploads',
  'Executable code patterns',
  '.htaccess modifications',
  'wp-config.php changes',
  'Core file modifications',
  'Active theme file changes',
  'New administrator accounts',
  'New editor accounts',
  'Recently created pages',
  'Foreign-language content',
  'Application passwords',
  '2FA plugin active',
  'Outdated plugins',
  'Outdated active theme',
  'WordPress core version',
  'PHP version (EOL check)',
  'Modified plugin files',
  'Debug mode status',
  'World-writable directories',
  'XML-RPC status',
  'REST API enumeration',
  'Auto-update settings',
  'Backup plugin present',
  'Failed login attempts',
  'Memory limit',
  'Database size',
  'Spam comment volume',
  'Disk usage percentage',
]

function LogoText({ text }: { text: string }) {
  return (
    <span style={{
      fontSize: 17, fontWeight: 600,
      color: 'var(--text-secondary)',
      opacity: 0.65,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      letterSpacing: '-0.01em',
      transition: 'color 0.2s',
    }}>
      {text}
    </span>
  )
}

function MarqueeRow({ items, direction }: { items: string[]; direction: 'left' | 'right' }) {
  // Duplicate the row so the CSS animation can loop seamlessly at -50%.
  const doubled = [...items, ...items]
  return (
    <div className="checks-marquee-track">
      <div
        className={direction === 'left' ? 'checks-marquee-left' : 'checks-marquee-right'}
        style={{ display: 'flex', alignItems: 'center', gap: 56, width: 'max-content' }}
      >
        {doubled.map((text, i) => <LogoText key={i} text={text} />)}
      </div>
    </div>
  )
}

export function ChecksMarquee() {
  const mid = Math.ceil(CHECKS.length / 2)
  const rowA = CHECKS.slice(0, mid)
  const rowB = CHECKS.slice(mid)

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      padding: '48px 0',
      display: 'flex', flexDirection: 'column', gap: 44,
    }}>
      <style>{`
        @keyframes checks-marquee-scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes checks-marquee-scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .checks-marquee-track {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
        }
        .checks-marquee-left { animation: checks-marquee-scroll-left 38s linear infinite; }
        .checks-marquee-right { animation: checks-marquee-scroll-right 38s linear infinite; }
        .checks-marquee-track:hover .checks-marquee-left,
        .checks-marquee-track:hover .checks-marquee-right { animation-play-state: paused; }
      `}</style>
      <MarqueeRow items={rowA} direction="left" />
      <MarqueeRow items={rowB} direction="right" />
    </div>
  )
}
