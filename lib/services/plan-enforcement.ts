/**
 * Plan enforcement — handles downstream consequences of plan changes,
 * user deactivation, and deletion. Every cause produces all required effects.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { sendUserMessage } from '@/lib/db/user-messages'
import { sendAlertEmail } from '@/lib/services/email'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// 1. Deactivation: pause all org monitors when no active users remain
// ---------------------------------------------------------------------------

export async function onUserDeactivated(userId: string): Promise<void> {
  const supabase = createAdminClient()

  // Get user's org
  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single()

  if (!user) return

  // Check if any active users remain in this org
  const { count: activeCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', user.org_id)
    .eq('is_active', true)

  if ((activeCount ?? 0) === 0) {
    // No active users — pause all monitors for this org
    const { data: monitors } = await supabase
      .from('monitors')
      .select('id')
      .eq('org_id', user.org_id)
      .eq('is_paused', false)

    if (monitors && monitors.length > 0) {
      await supabase
        .from('monitors')
        .update({ is_paused: true })
        .eq('org_id', user.org_id)
        .eq('is_paused', false)

      logger.info('Paused all monitors for deactivated org', {
        orgId: user.org_id,
        monitorCount: monitors.length,
      })
    }
  }
}

export async function onUserActivated(userId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single()

  if (!user) return

  // Unpause all monitors for this org (they were paused by deactivation)
  await supabase
    .from('monitors')
    .update({ is_paused: false })
    .eq('org_id', user.org_id)
    .eq('is_paused', true)

  logger.info('Unpaused monitors for reactivated org', { orgId: user.org_id })
}

// ---------------------------------------------------------------------------
// 2. Downgrade enforcement: pause/unpublish resources exceeding new plan limits
// ---------------------------------------------------------------------------

export async function enforceDowngradeLimits(
  orgId: string,
  notifyUserId?: string
): Promise<{ affected: string[] }> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)
  const affected: string[] = []

  // --- Monitors: pause newest ones beyond limit ---
  if (limits.monitors !== null) {
    const { data: monitors } = await supabase
      .from('monitors')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('is_paused', false)
      .order('created_at', { ascending: true })

    if (monitors && monitors.length > limits.monitors) {
      const toPause = monitors.slice(limits.monitors)
      const pauseIds = toPause.map(m => m.id)

      await supabase
        .from('monitors')
        .update({ is_paused: true })
        .in('id', pauseIds)

      const names = toPause.map(m => m.name).join(', ')
      affected.push(`${toPause.length} monitor(s) paused: ${names}`)
      logger.info('Downgrade: paused excess monitors', { orgId, count: toPause.length })
    }
  }

  // --- Status pages: unpublish newest beyond limit ---
  if (limits.statusPageLimit > 0) {
    const { data: pages } = await supabase
      .from('status_pages')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('is_published', true)
      .order('created_at', { ascending: true })

    if (pages && pages.length > limits.statusPageLimit) {
      const toUnpublish = pages.slice(limits.statusPageLimit)
      const unpubIds = toUnpublish.map(p => p.id)

      await supabase
        .from('status_pages')
        .update({ is_published: false })
        .in('id', unpubIds)

      const names = toUnpublish.map(p => p.name).join(', ')
      affected.push(`${toUnpublish.length} status page(s) unpublished: ${names}`)
      logger.info('Downgrade: unpublished excess status pages', { orgId, count: toUnpublish.length })
    }
  } else if (!limits.hasStatusPages) {
    // Plan doesn't include status pages at all — unpublish all
    const { count } = await supabase
      .from('status_pages')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_published', true)

    if ((count ?? 0) > 0) {
      await supabase
        .from('status_pages')
        .update({ is_published: false })
        .eq('org_id', orgId)
        .eq('is_published', true)

      affected.push(`All status pages unpublished (not included in plan)`)
    }
  }

  // --- Alert channels: disable types not in plan ---
  if (!limits.hasSlackTeams) {
    const { data: slackChannels } = await supabase
      .from('alert_channels')
      .select('id')
      .eq('org_id', orgId)
      .in('type', ['slack', 'teams'])
      .eq('is_enabled', true)

    if (slackChannels && slackChannels.length > 0) {
      await supabase
        .from('alert_channels')
        .update({ is_enabled: false })
        .in('id', slackChannels.map(c => c.id))

      affected.push(`${slackChannels.length} Slack/Teams channel(s) disabled`)
    }
  }

  if (!limits.hasWebhooks) {
    const { data: webhookChannels } = await supabase
      .from('alert_channels')
      .select('id')
      .eq('org_id', orgId)
      .eq('type', 'webhook')
      .eq('is_enabled', true)

    if (webhookChannels && webhookChannels.length > 0) {
      await supabase
        .from('alert_channels')
        .update({ is_enabled: false })
        .in('id', webhookChannels.map(c => c.id))

      affected.push(`${webhookChannels.length} webhook channel(s) disabled`)
    }
  }

  // --- Notify user about changes ---
  if (affected.length > 0 && notifyUserId) {
    await sendUserMessage({
      userId: notifyUserId,
      orgId,
      title: 'Plan limits adjusted',
      body: `Your plan has changed. The following resources were affected:\n\n${affected.map(a => `• ${a}`).join('\n')}\n\nYou can upgrade your plan anytime to restore them.`,
      type: 'warning',
      category: 'billing',
      actionUrl: '/dashboard/settings?tab=billing',
      actionLabel: 'View Plans',
    })
  }

  return { affected }
}

// ---------------------------------------------------------------------------
// 3. Deletion: cancel Stripe subscriptions before cascade delete
// ---------------------------------------------------------------------------

export async function cancelStripeOnDeletion(orgId: string): Promise<void> {
  const supabase = createAdminClient()

  // Get org's stripe customer ID
  const { data: org } = await supabase
    .from('organisations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  if (!org?.stripe_customer_id) return

  try {
    const { getStripe } = await import('@/lib/services/stripe')
    const stripe = getStripe()

    // List all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'active',
    })

    for (const sub of subscriptions.data) {
      await stripe.subscriptions.cancel(sub.id)
      logger.info('Canceled Stripe subscription on user deletion', { subId: sub.id, orgId })
    }

    // Also cancel trialing subscriptions
    const trialSubs = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'trialing',
    })

    for (const sub of trialSubs.data) {
      await stripe.subscriptions.cancel(sub.id)
    }
  } catch (err) {
    logger.error('Failed to cancel Stripe subscriptions on deletion', {
      orgId,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    // Don't block deletion — log and continue
  }
}

// ---------------------------------------------------------------------------
// 4. Plan change notification
// ---------------------------------------------------------------------------

export async function notifyPlanChange(
  orgId: string,
  planName: string,
  direction: 'upgraded' | 'changed' | 'downgraded'
): Promise<void> {
  const supabase = createAdminClient()

  // Find org owner to notify
  const { data: owner } = await supabase
    .from('users')
    .select('id')
    .eq('org_id', orgId)
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!owner) return

  await sendUserMessage({
    userId: owner.id,
    orgId,
    title: `Plan ${direction}: ${planName}`,
    body: direction === 'downgraded'
      ? `Your plan has been changed to ${planName}. Some features may have been adjusted to match your new plan limits.`
      : `Your plan has been ${direction} to ${planName}. All new features are available immediately.`,
    type: direction === 'downgraded' ? 'warning' : 'success',
    category: 'billing',
    actionUrl: '/dashboard/settings?tab=billing',
    actionLabel: 'View Plan',
  })
}

// ---------------------------------------------------------------------------
// 5. Pause subscription: stop monitoring, preserve data
// ---------------------------------------------------------------------------

export async function pauseSubscription(
  orgId: string,
  userId: string,
  stripeSubscriptionId: string,
  reason: string,
  reasonDetail?: string,
  planSlug?: string
): Promise<{ success: boolean; error?: string; pauseUntil?: string }> {
  const supabase = createAdminClient()
  const pauseUntil = new Date(Date.now() + 90 * 86400000)

  // ── 1. Pause Stripe billing — must succeed for pause to be valid ───────────
  try {
    const { getStripe } = await import('@/lib/services/stripe')
    const stripe = getStripe()
    await stripe.subscriptions.update(stripeSubscriptionId, {
      pause_collection: {
        behavior: 'void',
        resumes_at: Math.floor(pauseUntil.getTime() / 1000),
      },
    })
  } catch (stripeErr) {
    const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
    logger.error('Stripe pause API call failed', { orgId, error: msg })
    return { success: false, error: 'Failed to contact payment provider. Please try again.' }
  }

  // ── 2. Update DB + pause resources — these must all succeed ───────────────
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        pause_until: pauseUntil.toISOString(),
        pause_reason: reason,
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)

    await supabase
      .from('monitors')
      .update({ is_paused: true })
      .eq('org_id', orgId)
      .eq('is_paused', false)

    await supabase
      .from('alert_channels')
      .update({ is_enabled: false })
      .eq('org_id', orgId)
      .eq('is_enabled', true)

    await supabase
      .from('status_pages')
      .update({ is_published: false })
      .eq('org_id', orgId)
      .eq('is_published', true)
  } catch (dbErr) {
    logger.error('Failed to update DB after pause', {
      orgId,
      error: dbErr instanceof Error ? dbErr.message : String(dbErr),
    })
    return { success: false, error: 'Failed to update subscription. Please contact support.' }
  }

  // ── 3. Log reason — non-fatal ──────────────────────────────────────────────
  try {
    await supabase.from('cancellation_log').insert({
      org_id: orgId,
      user_id: userId,
      reason,
      reason_detail: reasonDetail ?? null,
      action_taken: 'paused',
      plan_slug: planSlug ?? null,
    })
  } catch (logErr) {
    logger.warn('Failed to write pause log — continuing', {
      orgId,
      error: logErr instanceof Error ? logErr.message : String(logErr),
    })
  }

  // ── 4. Notify user — non-fatal ─────────────────────────────────────────────
  try {
    await sendUserMessage({
      userId,
      orgId,
      title: 'Subscription paused',
      body: `Your subscription has been paused until ${pauseUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Your monitors are paused and no charges will be made. You can resume anytime from Settings > Billing.`,
      type: 'info',
      category: 'billing',
      actionUrl: '/dashboard/settings?tab=billing',
      actionLabel: 'Manage Subscription',
    })
  } catch (msgErr) {
    logger.warn('Failed to send pause notification — continuing', {
      orgId,
      error: msgErr instanceof Error ? msgErr.message : String(msgErr),
    })
  }

  logger.info('Subscription paused', { orgId, pauseUntil: pauseUntil.toISOString() })
  return { success: true, pauseUntil: pauseUntil.toISOString() }
}

// ---------------------------------------------------------------------------
// 6. Cancel subscription: downgrade to Free
// ---------------------------------------------------------------------------

export async function cancelSubscription(
  orgId: string,
  userId: string,
  stripeSubscriptionId: string,
  reason: string,
  reasonDetail?: string,
  planSlug?: string
): Promise<{ success: boolean; error?: string; cancelAt?: string }> {
  const supabase = createAdminClient()

  // ── 1. Read current DB state ───────────────────────────────────────────────
  const { data: subRow } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  const isPaused = subRow?.status === 'paused'
  let cancelAt: string | undefined

  // ── 2. Call Stripe — isolate so non-fatal errors don't block DB update ─────
  try {
    const { getStripe } = await import('@/lib/services/stripe')
    const stripe = getStripe()

    if (isPaused) {
      // Paused → cancel immediately (not being billed, no period to protect)
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    } else {
      // Active → schedule cancel at period end so user keeps access they paid for
      const updatedSub = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
      // Stripe API 2025+: current_period_end may be at item level
      const s = updatedSub as unknown as {
        current_period_end?: number
        items?: { data: Array<{ current_period_end?: number }> }
      }
      const periodEndTs = s.current_period_end ?? s.items?.data?.[0]?.current_period_end
      cancelAt = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : (subRow?.current_period_end ?? undefined)
    }
  } catch (stripeErr) {
    const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
    // If Stripe says the subscription no longer exists, treat it as already canceled
    // and continue updating our DB — do not surface this as a user-facing failure.
    if (msg.includes('No such subscription') || msg.includes('resource_missing')) {
      logger.warn('Stripe subscription not found — marking DB as canceled', {
        orgId,
        stripeSubscriptionId,
        error: msg,
      })
    } else {
      // Real Stripe error (auth failure, network, etc.) — abort
      logger.error('Stripe cancel API call failed', { orgId, error: msg })
      return { success: false, error: 'Failed to contact payment provider. Please try again.' }
    }
  }

  // ── 3. Update DB — always happens, even if Stripe was already gone ─────────
  try {
    if (isPaused) {
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('stripe_subscription_id', stripeSubscriptionId)
      await enforceDowngradeLimits(orgId, userId)
    } else {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelling' })
        .eq('stripe_subscription_id', stripeSubscriptionId)
    }
  } catch (dbErr) {
    logger.error('Failed to update subscription status after cancel', {
      orgId,
      error: dbErr instanceof Error ? dbErr.message : String(dbErr),
    })
    return { success: false, error: 'Failed to update subscription. Please contact support.' }
  }

  // ── 4. Log reason — non-fatal, never blocks cancel success ────────────────
  try {
    await supabase.from('cancellation_log').insert({
      org_id: orgId,
      user_id: userId,
      reason,
      reason_detail: reasonDetail ?? null,
      action_taken: 'canceled',
      plan_slug: planSlug ?? null,
    })
  } catch (logErr) {
    logger.warn('Failed to write cancellation log — continuing', {
      orgId,
      error: logErr instanceof Error ? logErr.message : String(logErr),
    })
  }

  // ── 5. Notify user — non-fatal, never blocks cancel success ───────────────
  try {
    const cancelDateStr = cancelAt
      ? new Date(cancelAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    await sendUserMessage({
      userId,
      orgId,
      title: isPaused ? 'Subscription canceled' : 'Subscription set to cancel',
      body: isPaused
        ? 'Your subscription has been canceled. You are now on the Free plan.'
        : `Your subscription will cancel on ${cancelDateStr ?? 'the end of your billing period'}. You keep full access until then. After that you will move to the Free plan.`,
      type: 'warning',
      category: 'billing',
      actionUrl: '/dashboard/settings?tab=billing',
      actionLabel: 'View Plans',
    })
  } catch (msgErr) {
    logger.warn('Failed to send cancellation notification — continuing', {
      orgId,
      error: msgErr instanceof Error ? msgErr.message : String(msgErr),
    })
  }

  logger.info('Subscription canceled by user', { orgId, reason, isPaused, cancelAt })
  return { success: true, cancelAt }
}

// ---------------------------------------------------------------------------
// 7. Resume paused subscription
// ---------------------------------------------------------------------------

export async function resumeSubscription(
  orgId: string,
  userId: string,
  stripeSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // 1. Resume Stripe billing
    const { getStripe } = await import('@/lib/services/stripe')
    const stripe = getStripe()
    await stripe.subscriptions.update(stripeSubscriptionId, {
      pause_collection: null,
    } as Record<string, unknown>)

    // 2. Fetch paused_at before clearing it — used to identify system-paused resources
    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('paused_at')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single()

    const pausedAt = subRow?.paused_at ?? new Date(0).toISOString()

    // 3. Update subscription in DB
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_at: null,
        pause_until: null,
        pause_reason: null,
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)

    // 4. Only unpause monitors the system paused (updated at or after paused_at).
    // Monitors the user manually paused before the subscription pause are left alone.
    await supabase
      .from('monitors')
      .update({ is_paused: false })
      .eq('org_id', orgId)
      .eq('is_paused', true)
      .gte('updated_at', pausedAt)

    // 5. Re-enable alert channels the system disabled (same timestamp guard)
    await supabase
      .from('alert_channels')
      .update({ is_enabled: true })
      .eq('org_id', orgId)
      .eq('is_enabled', false)
      .gte('updated_at', pausedAt)

    // 6. Republish status pages the system unpublished
    await supabase
      .from('status_pages')
      .update({ is_published: true })
      .eq('org_id', orgId)
      .eq('is_published', false)
      .gte('updated_at', pausedAt)

    // 6. Notify user
    await sendUserMessage({
      userId,
      orgId,
      title: 'Subscription resumed!',
      body: 'Welcome back! Your subscription is active again. All your monitors have been reactivated and your alert channels are live.',
      type: 'success',
      category: 'billing',
      actionUrl: '/dashboard',
      actionLabel: 'Go to Dashboard',
    })

    logger.info('Subscription resumed', { orgId })
    return { success: true }
  } catch (err) {
    logger.error('Failed to resume subscription', { orgId, error: err instanceof Error ? err.message : 'Unknown' })
    return { success: false, error: err instanceof Error ? err.message : 'Failed to resume' }
  }
}

// ---------------------------------------------------------------------------
// 8. Check for pause reminders (called by nurture cron daily)
// ---------------------------------------------------------------------------

export async function sendPauseReminders(): Promise<{ sent: number }> {
  const supabase = createAdminClient()
  let sent = 0

  // Get all paused subscriptions with pause_until
  const { data: pausedSubs } = await supabase
    .from('subscriptions')
    .select('org_id, pause_until, stripe_subscription_id')
    .eq('status', 'paused')
    .not('pause_until', 'is', null)

  if (!pausedSubs) return { sent: 0 }

  const now = Date.now()

  for (const sub of pausedSubs) {
    const resumeDate = new Date(sub.pause_until as string)
    const daysUntil = Math.ceil((resumeDate.getTime() - now) / 86400000)

    if (daysUntil !== 14 && daysUntil !== 3 && daysUntil !== 0) continue

    // Find org owner
    const { data: owner } = await supabase
      .from('users')
      .select('id, email')
      .eq('org_id', sub.org_id)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!owner) continue

    const dateStr = resumeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    if (daysUntil === 14) {
      await sendUserMessage({
        userId: owner.id,
        orgId: sub.org_id,
        title: 'Your subscription resumes in 14 days',
        body: `Your paused subscription will resume on ${dateStr}. Your monitors will be reactivated and billing will restart. If you don't want to continue, you can cancel before then.`,
        type: 'info',
        category: 'billing',
        actionUrl: '/dashboard/settings?tab=billing',
        actionLabel: 'Manage Subscription',
      })
      if (owner.email) {
        await sendAlertEmail({
          to: owner.email,
          subject: '[Uptrue] Your subscription resumes in 14 days',
          body: `Your paused subscription will resume on ${dateStr}. Your monitors will be reactivated and billing will restart.\n\nIf you don't want to continue, cancel from your billing settings before ${dateStr}.`,
        })
      }
      sent++
    } else if (daysUntil === 3) {
      await sendUserMessage({
        userId: owner.id,
        orgId: sub.org_id,
        title: 'Billing resumes in 3 days',
        body: `Your subscription resumes on ${dateStr}. You will be charged on that date. Cancel now if you don't want to continue.`,
        type: 'warning',
        category: 'billing',
        actionUrl: '/dashboard/settings?tab=billing',
        actionLabel: 'Manage Subscription',
      })
      if (owner.email) {
        await sendAlertEmail({
          to: owner.email,
          subject: '[Uptrue] Billing resumes in 3 days',
          body: `Your subscription resumes on ${dateStr}. You will be charged on that date.\n\nCancel from your billing settings if you don't want to continue.`,
        })
      }
      sent++
    } else if (daysUntil === 0) {
      // Auto-resume day — Stripe handles billing, we handle reactivation
      await resumeSubscription(sub.org_id, owner.id, sub.stripe_subscription_id ?? '')
      sent++
    }
  }

  return { sent }
}
