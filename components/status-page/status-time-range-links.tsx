import Link from 'next/link'

const ranges = [
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
]

export function StatusTimeRangeLinks({ slug, currentRange }: { slug: string; currentRange: string }) {
  return (
    <div className="status-time-range">
      {ranges.map(r => (
        <Link
          key={r.key}
          href={`/status/${slug}?range=${r.key}`}
          className={`status-time-range-btn ${currentRange === r.key ? 'active' : ''}`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  )
}
