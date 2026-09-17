'use client'

interface ReportPrintWrapperProps {
  title: string
  period: string
  generatedAt: string
  hasWhiteLabel?: boolean
  children: React.ReactNode
}

export function ReportPrintWrapper({ title, period, generatedAt, hasWhiteLabel = false, children }: ReportPrintWrapperProps): React.ReactElement {
  const formatted = new Date(generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="report-a4">
      {/* Download button — hidden when printing */}
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          Download PDF
        </button>
      </div>

      {/* Printable page */}
      <div className="report-page">
        {/* Page header */}
        <div className="report-page-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo_2.png" alt="Upnotify" style={{ display: 'block', height: 34, width: 'auto', maxWidth: 160, objectFit: 'contain', objectPosition: 'left center' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{period}</div>
          </div>
        </div>

        {/* Content */}
        <div className="report-page-body">
          {children}
        </div>

        {/* Footer */}
        <div className="report-page-footer">
          <span>Generated {formatted}</span>
          {!hasWhiteLabel && (
            <span style={{ fontWeight: 500 }}>Powered by Upnotify · upnotify-monitoring.vercel.app</span>
          )}
        </div>
      </div>
    </div>
  )
}
