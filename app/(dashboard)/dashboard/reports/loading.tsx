export default function ReportsLoading(): React.ReactElement {
  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="skeleton skeleton-title" style={{ width: 160, height: 28 }} />
      </div>
      <div className="rpt-skeleton" style={{ height: 480 }} />
    </div>
  )
}
