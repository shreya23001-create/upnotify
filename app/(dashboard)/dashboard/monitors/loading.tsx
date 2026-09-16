export default function MonitorsLoading(): React.ReactElement {
  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="skeleton skeleton-title" style={{ width: 140, height: 26 }} />
          <div className="skeleton skeleton-text" style={{ width: 280, height: 13, marginTop: 6 }} />
        </div>
        <div className="skeleton" style={{ width: 128, height: 38, borderRadius: 10 }} />
      </div>

      <div className="mon-stats-bar">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mon-stat-card">
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: 32, height: 18, marginBottom: 6, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 70, height: 11, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mon-list-wrap">
        <div className="mon-toolbar">
          <div className="skeleton" style={{ width: 260, height: 40, borderRadius: 10 }} />
        </div>
        <div className="mon-list" style={{ borderTop: '1px solid var(--border-primary)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mon-skeleton-row">
              <div className="skeleton" style={{ width: 15, height: 15, borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 6, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '25%', height: 11, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
              <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
