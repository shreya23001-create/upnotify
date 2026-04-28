import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getWpMonitorByMonitorId, getWpFindings, getLatestWpSnapshot, getWpSnapshotHistory } from '@/lib/db/wp-monitors'
import { WpReportClient } from './wp-report-client'

export default async function WordPressMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [monitor, wpMonitor] = await Promise.all([
    getMonitorById(id),
    getWpMonitorByMonitorId(id),
  ])

  if (!monitor || monitor.org_id !== user.org_id) notFound()
  if (!wpMonitor) notFound()

  const [findings, latestSnapshot, history] = await Promise.all([
    getWpFindings(wpMonitor.id),
    getLatestWpSnapshot(wpMonitor.id),
    getWpSnapshotHistory(wpMonitor.id, 30),
  ])

  return (
    <WpReportClient
      monitor={monitor}
      wpMonitor={wpMonitor}
      findings={findings}
      latestSnapshot={latestSnapshot}
      history={history}
    />
  )
}
