import { GenerateReportForm } from '@/components/reports/generate-report-form'

export default function NewReportPage() {
  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Generate Report</div>
      </div>
      <div className="card">
        <div className="card-content">
          <GenerateReportForm />
        </div>
      </div>
    </div>
  )
}
