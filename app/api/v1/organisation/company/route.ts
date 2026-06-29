import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateCompanyDetails } from '@/lib/db/organisations'
import { logger } from '@/lib/utils/logger'
import { companyDetailsSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'organisation-company')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw: unknown = await request.json()
    // Strip empty strings so optional shortTextSchema fields (min(1)) don't
    // reject blank form inputs — empty = "leave unchanged" not "clear field".
    const body: unknown = typeof raw === 'object' && raw !== null
      ? Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([, v]) => v !== ''))
      : raw
    const parsed = validateInput(companyDetailsSchema, body, 'company-details-update')
    if (!parsed.success) return parsed.response

    const org = await updateCompanyDetails(user.org_id, parsed.data)
    if (!org) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    logger.info('Company details updated', { orgId: user.org_id })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
