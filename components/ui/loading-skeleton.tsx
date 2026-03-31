'use client'

export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'table' | 'page' }) {
  if (type === 'table') {
    return (
      <div style={{ padding: 20 }}>
        <div className="skeleton skeleton-title" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    )
  }

  if (type === 'page') {
    return (
      <div style={{ padding: 32 }}>
        <div className="skeleton skeleton-title" style={{ width: '40%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
      </div>
    )
  }

  return (
    <div className="skeleton skeleton-card" />
  )
}
