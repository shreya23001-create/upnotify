'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a public status page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A status page is a public web page that shows your customers whether your services are running normally. It displays real-time uptime data and incident history so users can check service health without contacting support.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use a custom domain for my status page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. On the Scale plan, you can point your own domain (e.g. status.yourcompany.com) to your Uptrue status page by adding a CNAME record to your DNS.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can visitors subscribe to status page updates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Visitors can enter their email address on your status page to receive automatic notifications when an incident is opened, updated, or resolved.',
      },
    },
  ],
}

export default function StatusPagesPage(): React.ReactElement {
  const pathname = usePathname()

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />

        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>Public Status Pages</span>
        </nav>

        <article className="help-article">
          <h1 className="help-article-title">Public Status Pages</h1>
          <p className="help-article-intro">
            When your site has a wobble, your inbox fills up with &ldquo;Is it down for everyone
            or just me?&rdquo; emails. A status page answers that question for you, automatically,
            24/7.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">What is a status page?</h2>
            <p>
              A status page is a public web page -- hosted by Uptrue or on your own domain -- that
              shows your customers the real-time health of your services. It pulls data directly
              from your monitors, so it is always accurate and always up to date.
            </p>
            <p>
              Think of it as a shop window for your reliability. When everything is green, it
              builds trust. When something is down, it shows you are on top of it.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to create one</h2>
            <ol className="help-steps">
              <li>Go to <strong>Status Pages</strong> in the sidebar.</li>
              <li>Click <strong>Create Status Page</strong>.</li>
              <li>Give it a name (e.g. &ldquo;Acme Corp Status&rdquo;).</li>
              <li>Choose which monitors to display. Only the ones you pick will be visible to the public.</li>
              <li>Customise the appearance -- upload your logo, pick your brand colours, add a custom message.</li>
              <li>Click <strong>Publish</strong>. Uptrue gives you a shareable link immediately.</li>
            </ol>
            <p>
              Your status page is live. Share the link in your documentation, footer, or support
              replies.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Subscriber notifications</h2>
            <p>
              Visitors to your status page can subscribe by entering their email address. When an
              incident is opened, updated, or resolved, subscribers get an automatic email
              notification. No action needed from your side.
            </p>
            <p>
              This is a huge time saver. Instead of manually emailing customers during an outage,
              Uptrue does it for you while you focus on fixing the problem.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Custom domains</h2>
            <p>
              On the <strong>Scale</strong> plan, you can use your own domain for the status page.
              For example, instead of <code>status.uptrue.io/your-company</code>, you can use
              <code>status.yourcompany.com</code>.
            </p>
            <ol className="help-steps">
              <li>Open your status page settings and enter your custom domain.</li>
              <li>Go to your DNS provider and add a CNAME record pointing to the address Uptrue gives you.</li>
              <li>Wait for DNS to propagate (usually a few minutes, sometimes up to 24 hours).</li>
              <li>Uptrue automatically provisions an SSL certificate for your domain.</li>
            </ol>
            <p>
              Custom domains make your status page feel like a natural extension of your product
              rather than a third-party tool.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Plan availability</h2>
            <ul className="help-list">
              <li><strong>Free</strong> -- Status pages are not available.</li>
              <li><strong>Lite</strong> -- 1 branded status page on an Uptrue subdomain.</li>
              <li><strong>Builder</strong> -- Up to 5 status pages with custom domain support.</li>
              <li><strong>Scale</strong> -- Unlimited status pages with custom domains.</li>
            </ul>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/billing" className="help-next-link">
              Plans &amp; Billing &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
