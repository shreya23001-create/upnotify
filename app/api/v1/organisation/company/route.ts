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
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Only admins can update company details' }, { status: 403 })
    }

    const raw: unknown = await request.json()
    // Strip empty/absent values so optional shortTextSchema fields (min(1))
    // don't reject blank or missing form inputs — that means "leave
    // unchanged", not "clear field". FormData.get() returns null for a field
    // that isn't present in the form at all, which must be treated the same
    // way as an empty string here. logo_url is the one exception: null there
    // is an explicit "remove the logo" signal from the client, not "absent".
    const body: unknown = typeof raw === 'object' && raw !== null
      ? Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([key, v]) =>
          key === 'logo_url' ? v !== '' && v !== undefined : v !== '' && v !== null && v !== undefined
        ))
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
