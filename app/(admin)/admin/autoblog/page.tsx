export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAutoblogChannels, getAutoblogTopics, getAutoblogSources, getAutoblogRuns } from '@/lib/db/autoblog'
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

  const [channels, topics, sources, runs] = await Promise.all([
    getAutoblogChannels(),
    getAutoblogTopics(),
    getAutoblogSources(),
    getAutoblogRuns(50),
  ])

  return (
    <AutoblogClient
      initialChannels={channels}
      initialTopics={topics}
      initialSources={sources}
      initialRuns={runs}
    />
  )
}
