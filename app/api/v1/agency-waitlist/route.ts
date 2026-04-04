import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      name: string
      email: string
      phone?: string
      country?: string
      city?: string
      businessName: string
      website?: string
      numClients?: number
    }

    if (!body.name || !body.email || !body.businessName) {
      return NextResponse.json(
        { error: 'Name, email, and business name are required' },
        { status: 400 }
      )
    }

    if (!body.email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('agency_waitlist')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You are already on the waitlist. We will be in touch soon!' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('agency_waitlist').insert({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      country: body.country?.trim() || null,
      city: body.city?.trim() || null,
      business_name: body.businessName.trim(),
      website: body.website?.trim() || null,
      num_clients: body.numClients ?? null,
    })

    if (error) {
      logger.error('Agency waitlist insert failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    logger.info('New agency waitlist signup', { email: body.email, business: body.businessName })

    return NextResponse.json({ success: true, message: 'You are on the list! We will contact you soon.' })
  } catch (err) {
    logger.error('Agency waitlist error', { error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
