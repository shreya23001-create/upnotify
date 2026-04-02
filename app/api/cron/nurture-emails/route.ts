import { NextResponse } from 'next/server'
import { getUsersForNurture } from '@/lib/db/email-nurture'
import {
  sendTrialEndingEmail,
  sendWelcomeToFreeEmail,
  sendMonthlyDigest,
} from '@/lib/services/email-nurture'
import { getEmailRateStatus } from '@/lib/services/email'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Maximum nurture emails per cron run (preserve budget for alerts)
const NURTURE_BUDGET = 30

interface CronResult {
  processed: number
  sent: number
  skipped: number
  errors: number
  budgetRemaining: number
}

function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay)
}

export async function GET(request: Request): Promise<NextResponse> {
  // Auth check — same pattern as check-runner
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()
  const cronSecret = cron.secret

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const rateStatus = getEmailRateStatus()
    const availableBudget = Math.min(NURTURE_BUDGET, rateStatus.remaining)

    if (availableBudget <= 0) {
      logger.warn('Nurture cron skipped: no email budget remaining', {
        sent: rateStatus.sent,
        limit: rateStatus.limit,
      })
      return NextResponse.json({
        ok: true,
        message: 'No email budget remaining',
        processed: 0,
        sent: 0,
      })
    }

    const users = await getUsersForNurture()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const isFirstOfMonth = now.getDate() === 1

    const result: CronResult = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      budgetRemaining: availableBudget,
    }

    for (const user of users) {
      // Stop if budget exhausted
      if (result.sent >= availableBudget) {
        logger.info('Nurture cron budget exhausted', { sent: result.sent, budget: availableBudget })
        break
      }

      result.processed++

      try {
        // Trial ending emails
        if (user.trial_ends_at) {
          const trialEnd = new Date(user.trial_ends_at)
          const daysLeft = daysBetween(trialEnd, today)

          if (daysLeft === 4) {
            const res = await sendTrialEndingEmail(user.id, user.email, user.full_name ?? 'there', 4)
            if (res.skipped) result.skipped++
            else if (res.success) result.sent++
            else result.errors++
            continue
          }

          if (daysLeft === 2) {
            const res = await sendTrialEndingEmail(user.id, user.email, user.full_name ?? 'there', 2)
            if (res.skipped) result.skipped++
            else if (res.success) result.sent++
            else result.errors++
            continue
          }

          if (daysLeft === 0) {
            const res = await sendTrialEndingEmail(user.id, user.email, user.full_name ?? 'there', 0)
            if (res.skipped) result.skipped++
            else if (res.success) result.sent++
            else result.errors++
            continue
          }
        }

        // Welcome to Free — trial ended yesterday and no paid subscription
        if (user.trial_ends_at && !user.subscription_status) {
          const trialEnd = new Date(user.trial_ends_at)
          const daysSinceEnd = daysBetween(today, trialEnd)

          if (daysSinceEnd === 1) {
            const res = await sendWelcomeToFreeEmail(user.id, user.email, user.full_name ?? '')
            if (res.skipped) result.skipped++
            else if (res.success) result.sent++
            else result.errors++
            continue
          }
        }

        // Monthly digest — 1st of the month for users with monitors
        if (isFirstOfMonth) {
          const res = await sendMonthlyDigest(user.id, user.email, user.full_name ?? 'there', user.org_id)
          if (res.skipped) result.skipped++
          else if (res.success) result.sent++
          else result.errors++
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error('Nurture email error for user', { userId: user.id, error: message })
        result.errors++
      }
    }

    logger.info('Nurture cron completed', {
      processed: result.processed,
      sent: result.sent,
      skipped: result.skipped,
      errors: result.errors,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Nurture cron error', { error: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
