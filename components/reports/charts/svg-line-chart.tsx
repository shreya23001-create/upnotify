interface LinePoint {
  label: string
  value: number
}

interface SvgLineChartProps {
  data: LinePoint[]
  color?: string
  unit?: string
  height?: number
}

export function SvgLineChart({ data, color = '#3b82f6', unit = 'ms', height = 200 }: SvgLineChartProps): React.ReactElement {
  if (data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        Not enough data for trend chart
      </div>
    )
  }

  const W = 600
  const H = height
  const PT = 16, PR = 16, PB = 36, PL = 52
  const plotW = W - PL - PR
  const plotH = H - PT - PB

  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const sx = (i: number): number => PL + (i / (data.length - 1)) * plotW
  const sy = (v: number): number => PT + plotH - ((v - minV) / range) * plotH

  const points = data.map((d, i) => `${sx(i)},${sy(d.value)}`).join(' L ')
  const linePath = `M ${points}`
  const areaPath = `M ${sx(0)},${PT + plotH} L ${points} L ${sx(data.length - 1)},${PT + plotH} Z`

  // 4 horizontal grid lines
  const gridLines = [0, 1, 2, 3].map(i => {
    const v = minV + (range * i) / 3
    return { y: sy(v), label: Math.round(v) }
  })

  // x-axis labels: show at most 7, evenly spaced
  const step = Math.max(1, Math.ceil(data.length / 7))
  const xLabels = data
    .map((d, i) => ({ x: sx(i), label: d.label, i }))
    .filter(({ i }) => i % step === 0 || i === data.length - 1)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {gridLines.map(({ y, label }) => (
        <g key={label}>
          <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth={1} />
          <text x={PL - 6} y={y + 4} fontSize={10} fill="#94a3b8" textAnchor="end">
            {label}{unit}
          </text>
        </g>
      ))}

      <line x1={PL} y1={PT + plotH} x2={W - PR} y2={PT + plotH} stroke="#e2e8f0" strokeWidth={1} />

      <path d={areaPath} fill={color} fillOpacity={0.08} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {data.map((d, i) => (
        <circle key={i} cx={sx(i)} cy={sy(d.value)} r={2.5} fill="white" stroke={color} strokeWidth={1.5} />
      ))}

      {xLabels.map(({ x, label }) => (
        <text key={label} x={x} y={H - 8} fontSize={10} fill="#94a3b8" textAnchor="middle">
          {label.length > 6 ? label.slice(5) : label}
        </text>
      ))}
    </svg>
  )
}
