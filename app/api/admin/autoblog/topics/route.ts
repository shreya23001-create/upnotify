import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAutoblogTopics, createAutoblogTopic } from '@/lib/db/autoblog'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const topics = await getAutoblogTopics()
  return NextResponse.json({ topics })
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    name: string
    prompt: string
    schedule: string
    keywords?: string[]
    post_to_social?: boolean
  }

  if (!body.name?.trim() || !body.prompt?.trim() || !body.schedule) {
    return NextResponse.json({ error: 'name, prompt, and schedule are required' }, { status: 400 })
  }

  const topic = await createAutoblogTopic({
    name: body.name.trim(),
    prompt: body.prompt.trim(),
    schedule: body.schedule,
    keywords: body.keywords ?? [],
    post_to_social: body.post_to_social ?? true,
  })

  if (!topic) return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  return NextResponse.json({ topic }, { status: 201 })
}
