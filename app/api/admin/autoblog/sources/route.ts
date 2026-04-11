import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAutoblogSources, createAutoblogSource } from '@/lib/db/autoblog'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const sources = await getAutoblogSources()
  return NextResponse.json({ sources })
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    name: string
    url: string
    type?: string
    category?: string
  }

  if (!body.name?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: 'name and url are required' }, { status: 400 })
  }

  // Basic URL validation
  try {
    new URL(body.url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const source = await createAutoblogSource({
    name: body.name.trim(),
    url: body.url.trim(),
    type: body.type ?? 'rss',
    category: body.category ?? 'other',
  })

  if (!source) return NextResponse.json({ error: 'Failed to create source. URL may already exist.' }, { status: 500 })
  return NextResponse.json({ source }, { status: 201 })
}
