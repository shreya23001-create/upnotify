'use client'

interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  color?: string
  gradientId?: string
  yLabel?: string
  yMin?: number
  yMax?: number
  formatValue?: (value: number) => string
  height?: number
}

export function LineChart({
  data,
  color = '#22c55e',
  gradientId = 'lineGradient',
  yLabel = '',
  yMin,
  yMax,
  formatValue,
  height = 220,
}: LineChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data yet</p>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = 600
  const chartHeight = height
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const values = data.map((d) => d.value)
  const minVal = yMin ?? Math.min(...values)
  const maxVal = yMax ?? Math.max(...values)
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
    const y = padding.top + innerHeight - ((d.value - minVal) / range) * innerHeight
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks }, (_, i) => minVal + (range / (yTicks - 1)) * i)

  const xTickStep = Math.max(1, Math.floor(data.length / 6))
  const displayFormat = formatValue ?? ((v: number): string => v.toFixed(1))

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="chart-svg"
      role="img"
      aria-label={`Line chart showing ${yLabel}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTickValues.map((tick, i) => {
        const y = padding.top + innerHeight - ((tick - minVal) / range) * innerHeight
        return (
          <g key={`ytick-${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + innerWidth}
              y2={y}
              stroke="var(--border-primary)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="chart-axis-label"
            >
              {displayFormat(tick)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={`point-${i}`}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill="var(--bg-card)"
          stroke={color}
          strokeWidth="2"
        >
          <title>{`${p.label}: ${displayFormat(p.value)}${yLabel ? ` ${yLabel}` : ''}`}</title>
        </circle>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % xTickStep !== 0 && i !== data.length - 1) return null
        const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
        return (
          <text
            key={`xlabel-${i}`}
            x={x}
            y={chartHeight - 8}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
