import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Automated Pricing Policy | Uptrue',
  description: 'Uptrue Compete automated pricing rules disclaimer. Understand the risks, limitations, and your responsibilities when using automatic price updates.',
  alternates: { canonical: 'https://uptrue.io/automated-pricing-policy' },
}

export default function AutomatedPricingPolicyPage(): React.ReactElement {
  return (
    <>
      <PublicNav />
      <div className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">Automated Pricing Policy</h1>
          <p className="legal-updated">Last updated: 4 April 2026</p>

          <div className="legal-content">
            <section>
              <h2>1. Overview</h2>
              <p>
                Uptrue Compete (&quot;the Service&quot;) includes an optional automated pricing feature that allows
                users to set rules that automatically adjust product prices on their connected ecommerce stores
                based on competitor price changes. This policy explains how automated pricing works, its limitations,
                and your responsibilities as a user.
              </p>
            </section>

            <section>
              <h2>2. How Automated Pricing Works</h2>
              <p>When you enable automated pricing rules in Uptrue Compete:</p>
              <ul>
                <li>Uptrue monitors competitor product prices at regular intervals using web scraping techniques.</li>
                <li>When a competitor price change matches your rule conditions (e.g., price drops by more than 5%), the rule is triggered.</li>
                <li>If the rule is set to &quot;Alert Only&quot; (default), you receive a notification via your chosen channels.</li>
                <li>If you have enabled &quot;Auto-Update&quot;, Uptrue sends a webhook to your ecommerce store with the calculated new price. Your store must have a compatible webhook receiver to process the update.</li>
              </ul>
            </section>

            <section>
              <h2>3. Disclaimer of Responsibility</h2>
              <p><strong>
                Uptrue does not accept any responsibility, liability, or obligation for pricing decisions made
                by automated rules, whether those decisions result in financial loss, reduced margins, pricing
                errors, competitive harm, legal issues, or any other consequence.
              </strong></p>
              <p>Specifically, Uptrue is not responsible for:</p>
              <ul>
                <li><strong>Incorrect competitor prices:</strong> Web scraping may occasionally extract incorrect prices due to page structure changes, dynamic pricing, regional pricing variations, or temporary promotional prices.</li>
                <li><strong>Price cascading:</strong> If multiple competitors use similar automated pricing tools, prices may spiral downward (a &quot;race to the bottom&quot;) or upward in ways that are economically harmful.</li>
                <li><strong>Webhook failures:</strong> Your ecommerce store may not correctly process the price update webhook, resulting in prices not being changed or being changed incorrectly.</li>
                <li><strong>Timing issues:</strong> There is always a delay between a competitor&apos;s price change, Uptrue detecting it, and the webhook reaching your store. During this window, prices may be out of sync.</li>
                <li><strong>Legal compliance:</strong> Automated pricing may violate laws in certain jurisdictions (e.g., predatory pricing, price-fixing implications, or minimum advertised price policies). You are solely responsible for ensuring your pricing practices comply with all applicable laws.</li>
                <li><strong>Margin erosion:</strong> Rules that undercut competitors without adequate safety limits may cause you to sell products below cost.</li>
              </ul>
            </section>

            <section>
              <h2>4. Safety Limits</h2>
              <p>Uptrue provides safety mechanisms to reduce risk:</p>
              <ul>
                <li><strong>Minimum price:</strong> Set a floor price below which automated updates will not go.</li>
                <li><strong>Maximum price:</strong> Set a ceiling price above which automated updates will not go.</li>
                <li><strong>Maximum change per update:</strong> Limit how much the price can change in a single update (e.g., no more than 20% per change).</li>
                <li><strong>Maximum updates per day:</strong> Limit the number of automated price changes per day (e.g., maximum 3 per day).</li>
                <li><strong>Execution log:</strong> Every rule execution is logged with the action taken, prices involved, and webhook response.</li>
              </ul>
              <p>
                <strong>These safety limits reduce but do not eliminate risk.</strong> It is your responsibility
                to configure appropriate safety limits for your business. Uptrue does not validate whether your
                safety limits are commercially sensible.
              </p>
            </section>

            <section>
              <h2>5. Your Responsibilities</h2>
              <p>By enabling automated pricing, you agree that:</p>
              <ul>
                <li>You have read and understood this policy in its entirety.</li>
                <li>You are solely responsible for all pricing decisions made by your automated rules.</li>
                <li>You will set appropriate safety limits (minimum price, maximum change, daily limits).</li>
                <li>You will regularly review your rule execution history to verify correct operation.</li>
                <li>You will ensure your ecommerce store&apos;s webhook receiver correctly handles price updates.</li>
                <li>You will comply with all applicable laws regarding pricing practices in your jurisdiction.</li>
                <li>You will not use automated pricing for any illegal purpose, including but not limited to price-fixing, predatory pricing, or violation of minimum advertised price (MAP) policies.</li>
                <li>You accept full financial responsibility for any losses resulting from automated price changes.</li>
              </ul>
            </section>

            <section>
              <h2>6. Data Accuracy</h2>
              <p>
                Uptrue extracts competitor prices using automated web scraping. While we use multiple extraction
                methods (JSON-LD, Open Graph, Microdata, CSS selectors) and confidence scoring, we cannot guarantee
                100% accuracy. Prices displayed on competitor websites may be:
              </p>
              <ul>
                <li>Region-specific (showing different prices to different visitors)</li>
                <li>Dynamically generated (changing based on demand, time, or user profile)</li>
                <li>Temporarily promotional (flash sales, coupons, or member pricing)</li>
                <li>Incorrectly displayed due to website errors on the competitor&apos;s side</li>
              </ul>
              <p>
                You should not rely solely on automated pricing for critical business decisions without manual
                verification and oversight.
              </p>
            </section>

            <section>
              <h2>7. Disabling Auto-Update</h2>
              <p>
                You can disable automated price updates at any time from your Compete dashboard. Disabling
                auto-update immediately stops all future automated price changes. It does not reverse any
                price changes that have already been made.
              </p>
            </section>

            <section>
              <h2>8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Uptrue (Vision Software Solutions Limited) shall not
                be liable for any direct, indirect, incidental, special, consequential, or exemplary damages
                arising from or related to your use of automated pricing rules, including but not limited to
                loss of revenue, loss of profit, loss of customers, or damage to business reputation.
              </p>
            </section>

            <section>
              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this policy at any time. If we make material changes, we will notify you via
                in-app message and email. Continued use of automated pricing rules after notification constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2>10. Contact</h2>
              <p>
                If you have questions about this policy or automated pricing, contact us at{' '}
                <a href="mailto:support@uptrue.io">support@uptrue.io</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  )
}
