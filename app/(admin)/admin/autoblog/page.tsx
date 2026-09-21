export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAutoblogChannels, getAutoblogTopics, getAutoblogSources, getAutoblogRuns, getCronHistoryForPaths, getAutoblogTodayDiag } from '@/lib/db/autoblog'
import { AutoblogClient } from './autoblog-client'

export default async function AutoblogPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.is_super_admin) redirect('/admin')

  const [channels, topics, sources, runs, todayDiag] = await Promise.all([
    getAutoblogChannels(),
    getAutoblogTopics(),
    getAutoblogSources(),
    getAutoblogRuns(50),
    getAutoblogTodayDiag(),
  ])

  const cronPaths = [
    ...channels.map(c => c.cron_path).filter(Boolean) as string[],
    '/api/cron/autoblog/topic-runner',
  ]
  const cronHistory = await getCronHistoryForPaths(cronPaths, 5)

  return (
    <AutoblogClient
      initialChannels={channels}
      initialTopics={topics}
      initialSources={sources}
      initialRuns={runs}
      initialCronHistory={cronHistory}
      initialTodayDiag={todayDiag}
    />
  )
}
