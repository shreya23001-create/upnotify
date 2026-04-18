import Link from 'next/link'

const ranges = [
  { key: '24h', label: '24 hours' },
  { key: '7d',  label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

export function StatusTimeRangeLinks({ slug, currentRange }: { slug: string; currentRange: string }) {
  return (
    <div className="sp-range-filter">
      {ranges.map(r => (
        <Link
          key={r.key}
          href={`/status/${slug}?range=${r.key}`}
          className={`sp-range-btn${currentRange === r.key ? ' active' : ''}`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  )
}
