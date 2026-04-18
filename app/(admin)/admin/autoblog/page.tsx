export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAutoblogChannels, getAutoblogTopics, getAutoblogSources, getAutoblogRuns, getCronHistoryForPaths, getAutoblogTodayDiag } from '@/lib/db/autoblog'
import { AutoblogClient } from './autoblog-client'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export default async function AutoblogPage(): Promise<React.ReactElement> {
  if (!(await isAdmin())) redirect('/admin')

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
