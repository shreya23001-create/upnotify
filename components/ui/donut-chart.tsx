'use client'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 32,
}: DonutChartProps): React.ReactElement {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return (
      <div className="chart-empty">
        <p>No data yet</p>
      </div>
    )
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<Array<{ label: string; value: number; color: string; percentage: number; dashArray: string; dashOffset: number }>>((acc, segment) => {
      const prevOffset = acc.length > 0 ? acc.reduce((sum, a) => sum + circumference * a.percentage, 0) : 0
      const percentage = segment.value / total
      const dashLength = circumference * percentage
      const dashOffset = circumference - prevOffset
      acc.push({
        ...segment,
        percentage,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset,
      })
      return acc
    }, [])

  return (
    <div className="donut-chart-wrapper">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="chart-svg donut-chart-svg"
        role="img"
        aria-label="Donut chart showing distribution"
        style={{ maxWidth: size, maxHeight: size }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth={strokeWidth}
          opacity="0.3"
        />

        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={`arc-${i}`}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
          >
            <title>{`${arc.label}: ${arc.value} (${(arc.percentage * 100).toFixed(1)}%)`}</title>
          </circle>
        ))}

        {/* Center text */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          className="donut-center-value"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="donut-center-label"
        >
          Total
        </text>
      </svg>

      {/* Legend */}
      <div className="donut-legend">
        {segments.map((segment, i) => (
          <div key={`legend-${i}`} className="donut-legend-item">
            <span
              className="donut-legend-dot"
              style={{ background: segment.color }}
            />
            <span className="donut-legend-label">{segment.label}</span>
            <span className="donut-legend-value">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
