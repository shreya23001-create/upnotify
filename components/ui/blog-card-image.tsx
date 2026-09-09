// Single source of truth for all blog card feature images.
// Used by: components/landing/blog-preview.tsx AND app/blog/blog-index-client.tsx
// DO NOT duplicate gradient/icon logic anywhere else.

const GRADIENTS: Record<string, [string, string]> = {
  Guide:             ['#1392FB', '#3b82f6'],
  Security:          ['#dc2626', '#b45309'],
  Performance:       ['#047857', '#0e7490'],
  Ecommerce:         ['#b45309', '#9d174d'],
  'Incident Report': ['#b91c1c', '#00873a'],
  Outage:            ['#b91c1c', '#00873a'],
  Agency:            ['#1e3a5f', '#1d4ed8'],
  WordPress:         ['#1392FB', '#ec4899'],
  Hosting:           ['#047857', '#1d4ed8'],
  Default:           ['#1d4ed8', '#0e7490'],
}

// SVG canvas
const W = 280, H = 148, CX = 140, CY = 74

// Deterministic hash — same title always produces same layout, different titles look different
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// N icons evenly spaced in a ring
function ringPos(n: number, r: number, startAngle = -90): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const a = (startAngle + i * (360 / n)) * (Math.PI / 180)
    return [Math.round(CX + r * Math.cos(a)), Math.round(CY + r * Math.sin(a))] as [number, number]
  })
}

// Shared stroke style
const sp = {
  stroke: 'rgba(255,255,255,0.82)',
  strokeWidth: 1.5,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Icon library — all drawn in ±6 coordinate space around (0,0)
const IC: Record<string, React.ReactElement> = {
  lock:      (<><path {...sp} d="M-3.5,0 L-3.5,4 L3.5,4 L3.5,0 Z"/><path {...sp} d="M-2,0 L-2,-2.5 A2,2 0 0,1 2,-2.5 L2,0"/><circle cx="0" cy="2.2" r="0.9" fill="rgba(255,255,255,0.5)" stroke="none"/></>),
  shield:    (<><path {...sp} fill="rgba(255,255,255,0.1)" d="M0,-5 L4.5,-2.5 L4.5,0.5 C4.5,3.5 0,5.5 0,5.5 C0,5.5 -4.5,3.5 -4.5,0.5 L-4.5,-2.5 Z"/><path {...sp} d="M-1.5,0.5 L-0.5,1.5 L2,-1.5"/></>),
  lightning: (<><path {...sp} fill="rgba(255,255,255,0.15)" d="M1.5,-5.5 L-2.5,0.5 L1,0.5 L-1.5,5.5 L2.5,-0.5 L-1,-0.5 Z"/></>),
  globe:     (<><circle {...sp} cx="0" cy="0" r="5"/><line {...sp} x1="-5" y1="0" x2="5" y2="0"/><path {...sp} d="M0,-5 C-2.5,-2 -2.5,2 0,5 C2.5,2 2.5,-2 0,-5"/></>),
  server:    (<><rect {...sp} x="-5" y="-5" width="10" height="4" rx="1"/><rect {...sp} x="-5" y="1" width="10" height="4" rx="1"/><circle cx="3.5" cy="-3" r="0.7" fill="rgba(255,255,255,0.7)" stroke="none"/><circle cx="3.5" cy="3" r="0.7" fill="rgba(255,255,255,0.7)" stroke="none"/></>),
  cloud:     (<><path {...sp} d="M-4.5,2 A3.5,3.5 0 0,1 -4.5,-1.5 A4.5,4.5 0 0,1 4.5,-1.5 A2.5,2.5 0 0,1 4.5,2 Z"/><line {...sp} x1="-2" y1="3.5" x2="-2" y2="5.5"/><line {...sp} x1="1" y1="3.5" x2="1" y2="6"/><line {...sp} x1="-4.5" y1="4" x2="-4.5" y2="6"/></>),
  cart:      (<><path {...sp} d="M-5.5,-3.5 L-3.5,-3.5 M-3.5,-3.5 L-0.5,3 L3.5,3 M-1.5,-1 L5,-1 L4,2 L-0.5,2"/><circle cx="-0.5" cy="4.8" r="1.1" {...sp}/><circle cx="3" cy="4.8" r="1.1" {...sp}/></>),
  card:      (<><rect {...sp} x="-5.5" y="-3.5" width="11" height="7" rx="1"/><line {...sp} x1="-5.5" y1="-0.5" x2="5.5" y2="-0.5"/><line {...sp} x1="-4" y1="2" x2="-1.5" y2="2"/></>),
  tag:       (<><path {...sp} fill="rgba(255,255,255,0.1)" d="M-1,-5.5 L4.5,-5.5 L5.5,-0.5 L-2.5,5.5 L-5.5,2.5 Z"/><circle cx="2.5" cy="-3" r="1" fill="rgba(255,255,255,0.6)" stroke="none"/></>),
  doc:       (<><path {...sp} d="M-4,-6 L2.5,-6 L4.5,-4 L4.5,6 L-4,6 Z"/><path {...sp} d="M2.5,-6 L2.5,-4 L4.5,-4"/><line {...sp} x1="-2.5" y1="-1" x2="2.5" y2="-1"/><line {...sp} x1="-2.5" y1="1.5" x2="2.5" y2="1.5"/><line {...sp} x1="-2.5" y1="4" x2="0.5" y2="4"/></>),
  magnifier: (<><circle {...sp} cx="-1" cy="-1" r="4"/><line {...sp} x1="2" y1="2" x2="5.5" y2="5.5"/></>),
  pencil:    (<><path {...sp} d="M3,-5.5 L5.5,-3 L-3,5.5 L-5.5,3 Z"/><line {...sp} x1="-5.5" y1="3" x2="-5.5" y2="5.5"/><line {...sp} x1="-5.5" y1="5.5" x2="-3" y2="5.5"/></>),
  chart:     (<><polyline {...sp} points="-5,3.5 -2,-2 1,1.5 4,-4"/><line {...sp} x1="-5" y1="5" x2="5.5" y2="5"/></>),
  alert:     (<><path {...sp} fill="rgba(255,255,255,0.1)" d="M0,-5.5 L5.5,4.5 L-5.5,4.5 Z"/><line {...sp} x1="0" y1="-2.5" x2="0" y2="1.5"/><circle cx="0" cy="3" r="0.8" fill="rgba(255,255,255,0.7)" stroke="none"/></>),
  xcircle:   (<><circle {...sp} cx="0" cy="0" r="5"/><line {...sp} x1="-2.5" y1="-2.5" x2="2.5" y2="2.5"/><line {...sp} x1="2.5" y1="-2.5" x2="-2.5" y2="2.5"/></>),
  wifi:      (<><path {...sp} d="M-5,-2 A7,7 0 0,1 5,-2"/><path {...sp} d="M-3,1.5 A4,4 0 0,1 3,1.5"/><circle cx="0" cy="5" r="1" fill="rgba(255,255,255,0.7)" stroke="none"/></>),
  gear:      (<><circle {...sp} cx="0" cy="0" r="2.5"/><path {...sp} d="M0,-5 L0,-3.5 M0,3.5 L0,5 M-5,0 L-3.5,0 M3.5,0 L5,0 M-3.5,-3.5 L-2.5,-2.5 M2.5,2.5 L3.5,3.5 M3.5,-3.5 L2.5,-2.5 M-2.5,2.5 L-3.5,3.5"/></>),
  db:        (<><ellipse {...sp} cx="0" cy="-3.5" rx="5" ry="2"/><path {...sp} d="M-5,-3.5 L-5,3.5 A5,2 0 0,0 5,3.5 L5,-3.5"/><path {...sp} d="M-5,0 A5,2 0 0,0 5,0"/></>),
  users:     (<><circle {...sp} cx="-2" cy="-1.5" r="2.5"/><path {...sp} d="M-6,5 C-6,1.5 2,1.5 2,5"/><circle {...sp} cx="3" cy="-2" r="2"/><path {...sp} d="M3.5,0 C5.5,0 7,1.5 7,4"/></>),
  target:    (<><circle {...sp} cx="0" cy="0" r="5.5"/><circle {...sp} cx="0" cy="0" r="3"/><circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.7)" stroke="none"/></>),
  bell:      (<><path {...sp} d="M0,-5.5 A3,3 0 0,1 3,-2.5 L4,3 L-4,3 L-3,-2.5 A3,3 0 0,1 0,-5.5"/><path {...sp} d="M-1.5,3 A1.5,1.5 0 0,0 1.5,3"/></>),
  key:       (<><circle {...sp} cx="-2" cy="0" r="3.5"/><path {...sp} d="M1,0 L6,0 M5,-1.5 L5,0 M6.5,-1.5 L6.5,0"/></>),
  eye:       (<><path {...sp} d="M-5.5,0 C-3.5,-3.5 3.5,-3.5 5.5,0 C3.5,3.5 -3.5,3.5 -5.5,0"/><circle {...sp} cx="0" cy="0" r="1.5"/></>),
  code:      (<><polyline {...sp} points="-4,2.5 -6.5,0 -4,-2.5"/><polyline {...sp} points="4,2.5 6.5,0 4,-2.5"/><line {...sp} x1="-1.5" y1="4" x2="1.5" y2="-4"/></>),
  star:      (<><path {...sp} fill="rgba(255,255,255,0.12)" d="M0,-5.5 L1.6,-2 L5.5,-2 L2.5,0.8 L3.8,5 L0,2.5 L-3.8,5 L-2.5,0.8 L-5.5,-2 L-1.6,-2 Z"/></>),
  pulse:     (<><path {...sp} d="M-6,0 L-3,0 L-1,-4 L1,4 L3,0 L6,0"/></>),
  link:      (<><path {...sp} d="M-2,0 A3,3 0 0,0 2,0 M-1,-1.5 L-4,-4.5 A2,2 0 0,0 -1,-1.5 M1,1.5 L4,4.5 A2,2 0 0,0 1,1.5"/><path {...sp} d="M-5,5 L5,-5"/></>),
}

// 6 icons per category (layouts with fewer icons use the first N)
const ICON_SETS: Record<string, (keyof typeof IC)[]> = {
  Security:          ['lock',    'shield',    'eye',      'key',      'xcircle',  'alert'],
  Performance:       ['pulse',   'chart',     'lightning','gear',     'target',   'wifi'],
  Ecommerce:         ['cart',    'card',      'tag',      'star',     'db',       'bell'],
  WordPress:         ['gear',    'code',      'doc',      'db',       'cloud',    'server'],
  Guide:             ['doc',     'magnifier', 'pencil',   'chart',    'eye',      'star'],
  'Incident Report': ['alert',   'xcircle',   'bell',     'lightning','wifi',     'link'],
  Outage:            ['alert',   'xcircle',   'bell',     'lightning','wifi',     'link'],
  Agency:            ['users',   'target',    'chart',    'star',     'key',      'doc'],
  Hosting:           ['server',  'cloud',     'globe',    'wifi',     'db',       'gear'],
  Default:           ['globe',   'wifi',      'pulse',    'chart',    'server',   'star'],
}

// 5 layout types — icon bg shape changes to match
type IconBg = 'circle' | 'triangle' | 'square' | 'hexagon'

interface LayoutDef {
  positions: Array<[number, number]>
  iconBg: IconBg
  connecting: React.ReactElement
}

function makeLayout(seed: number): LayoutDef {
  const idx = seed % 5

  switch (idx) {
    case 0: { // Hexagon ring — 6 icons, dashed circle
      const pos = ringPos(6, 40)
      return {
        positions: pos,
        iconBg: 'circle',
        connecting: (
          <circle cx={CX} cy={CY} r={40} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4"/>
        ),
      }
    }
    case 1: { // Triangle — 3 icons, dashed triangle outline
      const pos = ringPos(3, 42, -90)
      return {
        positions: pos,
        iconBg: 'triangle',
        connecting: (
          <polygon
            points={pos.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 5"/>
        ),
      }
    }
    case 2: { // Square — 4 icons at corners, dashed square outline
      const pos = ringPos(4, 38, -45)
      return {
        positions: pos,
        iconBg: 'square',
        connecting: (
          <rect x={CX - 33} y={CY - 33} width="66" height="66" rx="4"
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 5"/>
        ),
      }
    }
    case 3: { // Diamond — 4 icons at cardinal points, dashed diamond outline
      const pos = ringPos(4, 38, -90)
      return {
        positions: pos,
        iconBg: 'circle',
        connecting: (
          <polygon
            points={`${CX},${CY - 38} ${CX + 38},${CY} ${CX},${CY + 38} ${CX - 38},${CY}`}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 5"/>
        ),
      }
    }
    case 4: { // Pentagon — 5 icons, dashed pentagon outline
      const pos = ringPos(5, 40, -90)
      return {
        positions: pos,
        iconBg: 'hexagon',
        connecting: (
          <polygon
            points={pos.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 5"/>
        ),
      }
    }
    default:
      return makeLayout(0)
  }
}

function IconBackground({ type }: { type: IconBg }): React.ReactElement {
  switch (type) {
    case 'triangle':
      return <polygon points="0,-10 9,5 -9,5" fill="rgba(255,255,255,0.1)" stroke="none"/>
    case 'square':
      return <rect x="-8" y="-8" width="16" height="16" rx="2" fill="rgba(255,255,255,0.1)" stroke="none"/>
    case 'hexagon':
      return <polygon points="0,-9 7.8,-4.5 7.8,4.5 0,9 -7.8,4.5 -7.8,-4.5" fill="rgba(255,255,255,0.1)" stroke="none"/>
    case 'circle':
    default:
      return <circle cx="0" cy="0" r="9" fill="rgba(255,255,255,0.1)" stroke="none"/>
  }
}

// Center pill text:
// — Outage / Incident Report: "Is Twitter down?" → "Twitter ↓"
// — All others: first word of title
function getCenterText(category: string, title: string): string {
  if (category === 'Outage' || category === 'Incident Report') {
    const m = title.match(/^Is\s+(\S+)\s+down/i)
    if (m) {
      const name = m[1].replace(/\.(com|io|net|org|co\.uk|app|dev|ai|co)$/i, '')
      return name + ' \u2193'
    }
  }
  return (title.trim().split(/\s+/)[0] ?? '').replace(/[^a-zA-Z0-9]/g, '')
}

function pillFontSize(text: string): number {
  const len = text.replace(/\s/g, '').length
  if (len <= 4)  return 20
  if (len <= 7)  return 16
  if (len <= 10) return 13
  return 10
}

function pillWidth(text: string, fs: number): number {
  return Math.round(text.length * fs * 0.62 + 20)
}

interface BlogCardImageProps {
  category: string
  title: string
  className?: string
  style?: React.CSSProperties
}

export function BlogCardImage({ category, title, className, style }: BlogCardImageProps): React.ReactElement {
  const [c1, c2] = GRADIENTS[category] ?? GRADIENTS.Default
  const gradId = `bcg-${category.replace(/[^a-z0-9]/gi, '').toLowerCase()}`
  const iconKeys = ICON_SETS[category] ?? ICON_SETS.Default

  const layout = makeLayout(hashStr(title))
  const centerText = getCenterText(category, title)
  const fs = pillFontSize(centerText)
  const pillW = pillWidth(centerText, fs)
  const pillH = fs + 12

  // Use only as many icons as the layout has positions
  const activeIcons = iconKeys.slice(0, layout.positions.length)

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'block', ...style }}
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1}/>
            <stop offset="100%" stopColor={c2}/>
          </linearGradient>
          <radialGradient id={`${gradId}-vgn`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)"/>
          </radialGradient>
        </defs>

        {/* Background gradient */}
        <rect x="0" y="0" width={W} height={H} fill={`url(#${gradId})`}/>
        {/* Vignette overlay */}
        <rect x="0" y="0" width={W} height={H} fill={`url(#${gradId}-vgn)`}/>

        {/* Connecting shape (circle / triangle / square / diamond / pentagon) */}
        {layout.connecting}

        {/* Icons at layout positions */}
        {layout.positions.map(([px, py], i) => (
          <g key={i} transform={`translate(${px}, ${py})`}>
            <IconBackground type={layout.iconBg}/>
            {IC[activeIcons[i] ?? 'globe']}
          </g>
        ))}

        {/* Center pill */}
        <rect
          x={CX - pillW / 2}
          y={CY - pillH / 2}
          width={pillW}
          height={pillH}
          rx={pillH / 2}
          fill="rgba(0,0,0,0.32)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs}
          fontWeight="700"
          fill="rgba(255,255,255,0.95)"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.3"
        >
          {centerText}
        </text>
      </svg>
    </div>
  )
}
