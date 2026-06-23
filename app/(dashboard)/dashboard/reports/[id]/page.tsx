import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getReportById } from '@/lib/db/reports'
import { ReportViewer } from '@/components/reports/report-viewer'

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const report = await getReportById(id)
  if (!report) notFound()

  return <ReportViewer report={report} />
}
