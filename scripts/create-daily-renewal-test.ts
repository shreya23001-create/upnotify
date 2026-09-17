/**
 * ONE-OFF DEV UTILITY — not part of the app's regular billing flow.
 *
 * Creates a throwaway Razorpay TEST plan with period='daily', interval=7
 * (Razorpay's real minimum for the 'daily' period is 7 — interval=1 is
 * rejected server-side, so the fastest a real Razorpay plan can renew is
 * once every 7 days; there is no hourly or single-day billing option),
 * plus a real subscription against it, so you can verify Razorpay's real
 * auto-renewal engine end-to-end: Razorpay auto-charges after ~7 days, your
 * /api/webhooks/razorpay route receives `subscription.charged`, and your
 * DB (subscriptions/invoices) gets updated.
 *
 * This talks to real Razorpay TEST-mode APIs. Do NOT run against live keys.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/create-daily-renewal-test.ts your@email.com "Test Org"
 *
 * After running:
 *   1. Open the printed `short_url` in a browser.
 *   2. Pay with a Razorpay test card (e.g. 4111 1111 1111 1111, any future
 *      expiry, any CVV) to activate the subscription.
 *   3. Wait ~7 days. Razorpay will auto-charge and fire `subscription.charged`
 *      at your webhook URL (must be publicly reachable — use ngrok if testing
 *      against localhost, or just check it against your deployed dev/prod URL).
 *   4. Check the Razorpay dashboard (Test Mode → Subscriptions → this sub)
 *      for a second charge, and check your `invoices` table for a new row.
 *
 * This subscription is tagged with notes.org_id below, so when Razorpay's
 * real renewal charge fires `subscription.charged`, your real webhook
 * handler (handleSubscriptionCharged) will insert a real row into your
 * `invoices` table for that org — proving the full pipeline, not just that
 * Razorpay's billing engine fired. It won't match any existing subscription/
 * website_subscription row (this test sub_id is new), so it'll show up as
 * an invoice with subscription_id/website_subscription_id both null —
 * easy to spot and delete afterward (filter invoices by
 * stripe_invoice_id LIKE 'rzp_%' created around the test time).
 *
 * Cancel the subscription from the Razorpay dashboard once you're done so
 * it doesn't keep auto-charging your test card forever.
 */

import Razorpay from 'razorpay'

const TEST_ORG_ID = '92eb0b02-3498-4a05-ad34-29af0c665ae1'

async function main(): Promise<void> {
  const [, , email, name] = process.argv
  if (!email) {
    console.error('Usage: npx tsx scripts/create-daily-renewal-test.ts your@email.com "Test Org"')
    process.exit(1)
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in your environment.')
    process.exit(1)
  }
  if (!keyId.startsWith('rzp_test_')) {
    console.error(`Refusing to run: RAZORPAY_KEY_ID (${keyId.slice(0, 12)}...) is not a test key.`)
    process.exit(1)
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })

  console.log('Creating weekly test plan (₹1 — smallest valid charge, renews every 7 days)...')
  const plan = await rzp.plans.create({
    period: 'daily',
    interval: 7, // Razorpay's actual minimum — period:'daily' interval:1 is rejected server-side
    item: {
      name: 'Renewal Test Plan (7-day)',
      amount: 100, // ₹1.00 in paise — smallest sensible test amount
      currency: 'INR',
      description: 'Throwaway plan for testing auto-renewal',
    },
    notes: { purpose: 'renewal-test' },
  })
  console.log('Plan created:', plan.id)

  console.log('Creating/reusing Razorpay customer...')
  let customerId: string
  try {
    const customer = await rzp.customers.create({ email, name: name ?? 'Renewal Test', fail_existing: 0 })
    customerId = customer.id
  } catch {
    const existing = await rzp.customers.all({ count: 100 })
    const match = existing.items.find(c => c.email?.toLowerCase() === email.toLowerCase())
    if (!match) throw new Error('Could not create or find a matching Razorpay customer')
    customerId = match.id
  }
  console.log('Customer:', customerId)

  console.log('Creating subscription (total_count=5 charges: 1 activation + up to 4 renewals)...')
  const createBody = {
    plan_id: plan.id,
    customer_id: customerId,
    total_count: 5,
    quantity: 1,
    customer_notify: 1,
    notes: { purpose: 'renewal-test', org_id: TEST_ORG_ID },
  }
  const subscription = await rzp.subscriptions.create(
    createBody as Parameters<typeof rzp.subscriptions.create>[0]
  ) as unknown as { id: string; status: string; short_url: string }

  console.log('\nSubscription created:', subscription.id)
  console.log('Status:', subscription.status)
  console.log('Tagged with org_id:', TEST_ORG_ID)
  console.log('\nOpen this checkout link and pay with a Razorpay test card to activate it:')
  console.log(subscription.short_url)
  console.log('\nAfter paying, wait ~7 days and check:')
  console.log('  - Razorpay Dashboard (Test Mode) → Subscriptions →', subscription.id, '→ should show 2+ charges')
  console.log('  - Your `invoices` table → a new row for org_id', TEST_ORG_ID, 'with stripe_invoice_id starting "rzp_" and subscription_id/website_subscription_id both null')
  console.log('  - This only works if your webhook URL registered in the Razorpay dashboard is reachable — check Settings → Webhooks there')
  console.log('\nRemember to cancel this subscription from the Razorpay dashboard once you\'re done testing,')
  console.log('and delete the test invoice row(s) it creates afterward.')
}

main().catch(err => {
  console.error('Failed:', err?.error?.description ?? err)
  process.exit(1)
})
