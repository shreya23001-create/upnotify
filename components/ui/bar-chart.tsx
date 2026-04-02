'use client'

interface BarData {
  label: string
  value: number
  color: string
}

interface BarChartProps {
  bars: BarData[]
  maxValue?: number
}

export function BarChart({ bars, maxValue }: BarChartProps): React.ReactElement {
  if (bars.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data yet</p>
      </div>
    )
  }

  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className="bar-chart" role="img" aria-label="Horizontal bar chart">
      {bars.map((bar, i) => {
        const widthPercent = max > 0 ? (bar.value / max) * 100 : 0
        return (
          <div key={`bar-${i}`} className="bar-chart-row">
            <div className="bar-chart-label">{bar.label}</div>
            <div className="bar-chart-track">
              <div
                className="bar-chart-fill"
                style={{
                  width: `${widthPercent}%`,
                  background: bar.color,
                  transition: 'width 0.6s ease',
                }}
              >
                <title>{`${bar.label}: ${bar.value}`}</title>
              </div>
            </div>
            <div className="bar-chart-value">{bar.value}</div>
          </div>
        )
      })}
    </div>
  )
}
