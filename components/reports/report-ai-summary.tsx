'use client'

export function ReportAiSummary({ summary }: { summary: string }) {
  return (
    <div className="report-ai-card" style={{ marginBottom: 24 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            AI Executive Summary
          </div>
        </div>
        <div className="card-content">
          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#475569', whiteSpace: 'pre-wrap' }}>
            {summary}
          </div>
        </div>
      </div>
    </div>
  )
}
