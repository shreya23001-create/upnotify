interface BarItem {
  label: string
  value: number
  sublabel?: string
  color?: string
}

interface SvgBarChartProps {
  data: BarItem[]
  max?: number
  unit?: string
  colorFn?: (value: number) => string
}

function defaultColor(value: number): string {
  if (value >= 99.9) return '#10b981'
  if (value >= 99) return '#f59e0b'
  return '#ef4444'
}

export function SvgBarChart({ data, max = 100, unit = '%', colorFn = defaultColor }: SvgBarChartProps): React.ReactElement {
  const ROW = 40
  const LABEL = 148
  const VALUE = 52
  const W = 600
  const PAD = 12
  const BAR_W = W - LABEL - VALUE - PAD * 2
  const svgH = data.length * ROW + PAD * 2

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${svgH}`} style={{ display: 'block' }}>
      {data.map((item, i) => {
        const y = PAD + i * ROW
        const barH = 22
        const barY = y + (ROW - barH) / 2
        const fill = item.color ?? colorFn(item.value)
        const barWidth = Math.max(2, (Math.min(item.value, max) / max) * BAR_W)
        const label = item.label.length > 20 ? item.label.slice(0, 19) + '…' : item.label

        return (
          <g key={`${item.label}-${i}`}>
            <text x={0} y={barY + 15} fontSize={12} fill="#475569">{label}</text>
            {item.sublabel && (
              <text x={0} y={barY + 28} fontSize={10} fill="#94a3b8">{item.sublabel}</text>
            )}
            <rect x={LABEL} y={barY} width={BAR_W} height={barH} rx={4} fill="#f1f5f9" />
            <rect x={LABEL} y={barY} width={barWidth} height={barH} rx={4} fill={fill} />
            <text x={LABEL + BAR_W + 6} y={barY + 15} fontSize={12} fill="#1e293b" fontWeight={600}>
              {item.value.toFixed(1)}{unit}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
