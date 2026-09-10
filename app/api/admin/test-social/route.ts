import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/utils/config'
import { postOutageBlogToSocial } from '@/lib/services/social-poster'

export async function POST(request: NextRequest) {
  // Admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const config = getConfig()

  if (!user || !config.admin.emails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const result = await postOutageBlogToSocial({
    siteDisplayName: 'GitHub',
    blogTitle: 'Is GitHub Down? Current Status and Outage Updates',
    blogUrl: 'https://upnotify-monitoring.vercel.app/blog/is-github-down-test',
    excerpt: 'Uptrue detected a GitHub outage. Here is the latest status and incident timeline.',
  })

  return NextResponse.json(result)
}
