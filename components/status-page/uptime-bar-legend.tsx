'use client'

export function UptimeBarLegend() {
  return (
    <div className="uptime-legend">
      <span className="uptime-legend-item"><span className="uptime-legend-dot" style={{ background: '#22c55e' }} /> Up</span>
      <span className="uptime-legend-item"><span className="uptime-legend-dot" style={{ background: '#ef4444' }} /> Down</span>
      <span className="uptime-legend-item"><span className="uptime-legend-dot" style={{ background: '#f59e0b' }} /> Degraded</span>
      <span className="uptime-legend-item"><span className="uptime-legend-dot" style={{ background: '#e2e8f0' }} /> No Data</span>
    </div>
  )
}
