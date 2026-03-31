import { GenerateReportForm } from '@/components/reports/generate-report-form'

export default function NewReportPage() {
  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Generate Report</h1>
      <div className="card">
        <div className="card-content">
          <GenerateReportForm />
        </div>
      </div>
    </div>
  )
}
