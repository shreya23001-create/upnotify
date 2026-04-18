interface SvgGaugeProps {
  value: number   // 0–100
  size?: number
  label?: string
}

export function SvgGauge({ value, size = 120, label }: SvgGaugeProps): React.ReactElement {
  const r = 44
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const filled = (value / 100) * circ
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444'
  const riskLabel = value >= 90 ? 'Low Risk' : value >= 70 ? 'Medium Risk' : 'High Risk'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>
          {value}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#94a3b8">
          {label ?? 'Score'}
        </text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{riskLabel}</span>
    </div>
  )
}
