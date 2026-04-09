import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { deleteUserAccount } from '@/lib/db/gdpr'
import { writeAuditLog } from '@/lib/db/audit'
import { getSubscription } from '@/lib/db/subscriptions'
import { getStripe } from '@/lib/services/stripe'
import { accountDeletionSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

/** Account deletion: 1 attempt per hour per IP. */
const DELETE_RATE_LIMIT = {
  maxRequests: 1,
  windowMs: 60 * 60 * 1000,
} as const

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // ── Authentication ──────────────────────────────────────────────
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // ── Rate limiting ───────────────────────────────────────────────
    const rateLimit = checkRateLimit(
      request,
      DELETE_RATE_LIMIT,
      `gdpr-delete:${user.id}`,
    )
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetAt - Date.now()) / 1000,
      )
      return NextResponse.json(
        { error: 'Too many requests. Account deletion can only be requested once per hour.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }

    // ── Parse and validate confirmation body ────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON' },
        { status: 400 },
      )
    }

    const parsed = validateInput(
      accountDeletionSchema,
      body,
      'account-deletion',
    )
    if (!parsed.success) return parsed.response

    // ── Extract request metadata for audit log ──────────────────────
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip')?.trim() ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    // ── Audit log the deletion request ──────────────────────────────
    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'account.deletion_requested',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    })

    // ── Cancel active Stripe subscription ───────────────────────────
    const subscription = await getSubscription(user.org_id)
    if (subscription?.stripe_subscription_id) {
      try {
        const stripe = getStripe()
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        logger.info('Stripe subscription cancelled before account deletion', {
          userId: user.id,
          orgId: user.org_id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
        })
      } catch (stripeError) {
        logger.error('Failed to cancel Stripe subscription during account deletion', {
          userId: user.id,
          orgId: user.org_id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          error: String(stripeError),
        })
        return NextResponse.json(
          { error: 'Failed to cancel your active subscription. Please contact support.' },
          { status: 500 },
        )
      }
    }

    // ── Perform cascading deletion ──────────────────────────────────
    const result = await deleteUserAccount(user.id, user.org_id)

    if (!result.success) {
      logger.error('GDPR account deletion failed', {
        userId: user.id,
        orgId: user.org_id,
        failedStep: result.failedStep,
        error: result.error,
      })
      return NextResponse.json(
        {
          error: 'Account deletion failed. Please contact support.',
          failedStep: result.failedStep,
        },
        { status: 500 },
      )
    }

    logger.info('GDPR account deletion completed successfully', {
      userId: user.id,
      orgId: user.org_id,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Your account and all associated data have been permanently deleted.',
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error('Account deletion route threw an exception', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    )
  }
}
