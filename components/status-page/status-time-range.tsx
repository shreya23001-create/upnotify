'use client'

interface Props {
  value: string
  onChange: (range: string) => void
}

export function StatusTimeRange({ value, onChange }: Props) {
  const ranges = [
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ]

  return (
    <div className="status-time-range">
      {ranges.map(r => (
        <button
          key={r.key}
          className={`status-time-range-btn ${value === r.key ? 'active' : ''}`}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
