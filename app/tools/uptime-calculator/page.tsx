import type { Metadata } from 'next'
import { UptimeCalculatorTool } from '@/components/tools/uptime-calculator-tool'

export const metadata: Metadata = {
  title: 'Free Uptime & SLA Downtime Calculator | Calculate 99.9% SLA Allowed Downtime | Uptrue',
  description:
    'Free uptime calculator and SLA downtime tool. Calculate how much downtime 99%, 99.9%, 99.95%, 99.99%, and 99.999% SLA levels allow per year, month, week, and day. Estimate downtime costs and compare SLA tiers instantly.',
  alternates: { canonical: 'https://uptrue.io/tools/uptime-calculator' },
  openGraph: {
    title: 'Free Uptime & SLA Downtime Calculator | Uptrue',
    description:
      'Calculate allowed downtime for any uptime SLA percentage. Compare SLA tiers, estimate downtime costs, and understand what 99.9% uptime really means.',
    url: 'https://uptrue.io/tools/uptime-calculator',
    type: 'website',
  },
  keywords: [
    'uptime calculator', 'SLA calculator', 'downtime calculator', 'SLA downtime',
    '99.9 uptime', '99.99 uptime', 'five nines uptime', 'SLA percentage',
    'uptime percentage calculator', 'allowed downtime', 'downtime cost calculator',
    'service level agreement calculator', 'availability calculator',
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Uptrue Uptime & SLA Calculator',
  url: 'https://uptrue.io/tools/uptime-calculator',
  description: 'Free uptime and SLA downtime calculator. Calculate allowed downtime for any SLA percentage.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  author: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
}

export default function UptimeCalculatorPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">Uptime &amp; SLA Downtime Calculator</h1>
        <p className="tools-hero-subtitle">
          Calculate exactly how much downtime each SLA level allows. Enter an uptime percentage
          or a downtime budget to see the conversion. Used by DevOps teams, SREs, and IT managers
          to plan SLA commitments and estimate downtime costs.
        </p>
      </div>

      <div className="tools-container">
        <UptimeCalculatorTool />

        {/* What does 99.9% uptime mean? */}
        <section className="tools-seo-section">
          <h2>What Does 99.9% Uptime Mean?</h2>
          <p>
            An uptime SLA (Service Level Agreement) of 99.9% &mdash; often called &ldquo;three nines&rdquo; &mdash; means
            your service is allowed a maximum of <strong>8 hours and 46 minutes of downtime per year</strong>,
            or roughly <strong>43 minutes per month</strong>. This is one of the most common SLA tiers offered
            by cloud providers, hosting companies, and SaaS platforms.
          </p>
          <p>
            While 99.9% sounds nearly perfect, the allowed downtime can be significant for
            mission-critical applications. E-commerce sites, payment processors, and healthcare
            platforms often require 99.99% or higher to avoid revenue loss and user trust erosion.
          </p>
        </section>

        {/* SLA tiers comparison */}
        <section className="tools-seo-section">
          <h2>Common SLA Uptime Tiers Compared</h2>
          <p>
            Different industries and service types require different levels of availability. Here is
            what each common SLA tier means in practical terms:
          </p>
          <div className="tools-sla-comparison">
            <table className="tools-sla-table">
              <thead>
                <tr>
                  <th>SLA Level</th>
                  <th>Common Name</th>
                  <th>Downtime / Year</th>
                  <th>Downtime / Month</th>
                  <th>Typical Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>99%</strong></td>
                  <td>Two nines</td>
                  <td>3d 15h 36m</td>
                  <td>7h 18m</td>
                  <td>Internal tools, dev environments</td>
                </tr>
                <tr>
                  <td><strong>99.9%</strong></td>
                  <td>Three nines</td>
                  <td>8h 46m</td>
                  <td>43m 50s</td>
                  <td>SaaS apps, business websites</td>
                </tr>
                <tr>
                  <td><strong>99.95%</strong></td>
                  <td>Three and a half nines</td>
                  <td>4h 23m</td>
                  <td>21m 55s</td>
                  <td>E-commerce, customer portals</td>
                </tr>
                <tr>
                  <td><strong>99.99%</strong></td>
                  <td>Four nines</td>
                  <td>52m 36s</td>
                  <td>4m 23s</td>
                  <td>Financial services, healthcare</td>
                </tr>
                <tr>
                  <td><strong>99.999%</strong></td>
                  <td>Five nines</td>
                  <td>5m 16s</td>
                  <td>26s</td>
                  <td>Emergency services, critical infrastructure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Downtime cost section */}
        <section className="tools-seo-section">
          <h2>How Much Does Downtime Cost?</h2>
          <p>
            The cost of downtime varies dramatically by industry and company size. According to
            industry research, the average cost of IT downtime is estimated at <strong>$5,600 per
            minute</strong> for large enterprises. For small and mid-sized businesses, even a few
            hours of downtime can result in thousands of pounds in lost revenue, damaged reputation,
            and reduced customer trust.
          </p>
          <h3>Factors That Affect Downtime Cost</h3>
          <ul>
            <li><strong>Lost revenue</strong> &mdash; direct sales lost during outage</li>
            <li><strong>Productivity loss</strong> &mdash; employees unable to work</li>
            <li><strong>SLA penalties</strong> &mdash; contractual credits owed to customers</li>
            <li><strong>Recovery costs</strong> &mdash; engineering time to diagnose and fix</li>
            <li><strong>Reputation damage</strong> &mdash; customer churn and negative reviews</li>
            <li><strong>Data loss</strong> &mdash; potential data corruption during unplanned outages</li>
          </ul>
          <p>
            This is why monitoring your uptime continuously and catching issues early is critical.
            A proactive monitoring setup can reduce mean time to detect (MTTD) from hours to seconds.
          </p>
        </section>

        {/* FAQ section */}
        <section className="tools-seo-section">
          <h2>Frequently Asked Questions</h2>

          <div className="tools-faq">
            <details className="tools-faq-item">
              <summary>What is an SLA (Service Level Agreement)?</summary>
              <p>
                An SLA is a contract between a service provider and a customer that defines the
                expected level of service, including uptime guarantees, response times, and
                remedies (such as service credits) if those targets are not met. SLAs are standard
                in cloud computing, web hosting, and SaaS.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>What is the difference between uptime and availability?</summary>
              <p>
                Uptime measures the total time a system is operational, while availability measures
                the percentage of time a system is accessible and functioning correctly. In practice,
                these terms are often used interchangeably, but availability also accounts for
                planned maintenance windows that may not count as downtime in an SLA.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>How is uptime percentage calculated?</summary>
              <p>
                Uptime percentage is calculated as: <code>(Total time - Downtime) / Total time x 100</code>.
                For example, if a service was down for 43 minutes in a 30-day month (43,200 minutes),
                the uptime would be (43,200 - 43) / 43,200 x 100 = 99.9%.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>What does &ldquo;five nines&rdquo; (99.999%) availability mean?</summary>
              <p>
                Five nines availability means a service can only be down for approximately 5 minutes
                and 16 seconds per year, or about 26 seconds per month. This level of availability
                is extremely difficult and expensive to achieve, typically requiring redundant
                infrastructure, automatic failover, and multi-region deployments.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>How do I monitor my website uptime?</summary>
              <p>
                You can monitor website uptime using a service like Uptrue that checks your website
                at regular intervals (as frequently as every minute) from multiple locations. When
                your site goes down, you receive instant alerts via email, Slack, SMS, or webhook
                so you can respond quickly.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>What is MTTR and MTTD?</summary>
              <p>
                <strong>MTTD</strong> (Mean Time to Detect) is the average time it takes to discover
                a problem. <strong>MTTR</strong> (Mean Time to Recover) is the average time it takes
                to restore service after a failure is detected. Reducing both metrics is key to
                maintaining high uptime percentages.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>Does planned maintenance count against SLA uptime?</summary>
              <p>
                This depends on the specific SLA agreement. Many providers exclude scheduled
                maintenance windows from their uptime calculations, provided they give advance
                notice (typically 24-72 hours). Always check the fine print of your provider&apos;s SLA.
              </p>
            </details>

            <details className="tools-faq-item">
              <summary>What uptime SLA should I offer my customers?</summary>
              <p>
                The right SLA depends on your infrastructure, budget, and customer expectations.
                Most SaaS platforms start with 99.9% and upgrade to 99.95% or 99.99% as they
                mature. Offering an SLA you cannot consistently meet will erode trust faster than
                not having one at all.
              </p>
            </details>
          </div>
        </section>

        <div className="tools-cta">
          <h2>Monitor your uptime automatically</h2>
          <p>
            Stop calculating downtime manually. Let Uptrue track your uptime 24/7
            and alert you the moment something goes wrong. Get started in under 2 minutes.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}
