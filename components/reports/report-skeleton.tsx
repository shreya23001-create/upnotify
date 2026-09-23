export function ReportSkeleton(): React.ReactElement {
  return (
    <div className="rpt-a4">
      <div className="rpt-page rpt-skel">
        <div className="rpt-skel-header">
          <div className="rpt-skel-block" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <div style={{ flex: 1 }}>
            <div className="rpt-skel-block" style={{ width: 160, height: 16, marginBottom: 6 }} />
            <div className="rpt-skel-block" style={{ width: 90, height: 11 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div className="rpt-skel-block" style={{ width: 110, height: 14 }} />
            <div className="rpt-skel-block" style={{ width: 150, height: 11 }} />
          </div>
        </div>

        <div className="rpt-skel-hero">
          <div className="rpt-skel-block" style={{ width: 168, height: 128, borderRadius: 12 }} />
          <div className="rpt-skel-hero-stats">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rpt-skel-block" style={{ height: 58, borderRadius: 10 }} />
            ))}
          </div>
        </div>

        <div className="rpt-skel-block" style={{ height: 90, borderRadius: 10 }} />
        <div className="rpt-skel-block" style={{ height: 180, borderRadius: 10 }} />
        <div className="rpt-skel-block" style={{ height: 140, borderRadius: 10 }} />
      </div>
    </div>
  )
}
