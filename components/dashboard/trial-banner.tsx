'use client'

import Link from 'next/link'

interface TrialBannerProps {
  trialEndsAt: string
  planName: string
}

/**
 * Shows a banner when the user is on a reverse trial.
 * Displays remaining days and a CTA to upgrade.
 */
export function TrialBanner({ trialEndsAt, planName }: TrialBannerProps): React.ReactElement | null {
  const endDate = new Date(trialEndsAt)
  const now = new Date()
  const diffMs = endDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  if (daysRemaining <= 0) return null

  return (
    <div className="trial-banner">
      <span className="trial-banner-text">
        You&apos;re on a 14-day {planName} trial.{' '}
        <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining.</strong>
      </span>
      <Link href="/dashboard/settings" className="btn btn-sm btn-primary trial-banner-cta">
        Upgrade Now
      </Link>
    </div>
  )
}
