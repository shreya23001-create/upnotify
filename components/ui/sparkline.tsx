'use client'

interface SparklineProps {
  values: number[]
  color?: string
  width?: number
  height?: number
}

/** Compact inline trend line — same raw-SVG approach as line-chart.tsx, sized
 *  for a table/list row rather than a full chart card. No axes, no grid,
 *  no tooltips — purely a glanceable shape. */
export function Sparkline({ values, color = 'var(--color-up)', width = 64, height = 22 }: SparklineProps): React.ReactElement | null {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
