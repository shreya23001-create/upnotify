import type { Metadata } from 'next'
import Link from 'next/link'
import {
  OrganizationJsonLd,
} from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'About Uptrue — Website Monitoring for Agencies & Teams',
  description:
    'Uptrue is built by Vision Software Solutions Limited in Brentford, UK. Our mission is to make uptime monitoring accessible and intelligent for agencies and businesses worldwide.',
  alternates: {
    canonical: 'https://uptrue.io/about',
  },
  openGraph: {
    title: 'About Uptrue — Website Monitoring for Agencies & Teams',
    description:
      'Uptrue is built by Vision Software Solutions Limited in Brentford, UK. Our mission is to make uptime monitoring accessible and intelligent for agencies and businesses worldwide.',
    url: 'https://uptrue.io/about',
    type: 'website',
  },
}

const VALUES = [
  {
    icon: '\u{1F50D}',
    title: 'Transparency',
    description:
      'We believe every business deserves clear, honest visibility into how their infrastructure performs. Our public status pages and open scoring methodology reflect that commitment.',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    title: 'Reliability',
    description:
      'Our two-confirmation detection system ensures you only get alerted when something genuinely needs attention. No false alarms, no noise.',
  },
  {
    icon: '\u26A1',
    title: 'Simplicity',
    description:
      'Powerful monitoring should not require a PhD in DevOps. We design every feature to be intuitive, fast, and accessible to teams of all sizes.',
  },
]

export default function AboutPage(): React.ReactElement {
  return (
    <div className="landing">
      <OrganizationJsonLd />

      {/* Navigation */}
      

      {/* Hero */}
      <section className="about-hero">
        <div className="landing-container">
          <h1 className="about-hero-title">About Uptrue</h1>
          <p className="about-hero-subtitle">
            Making uptime monitoring accessible and intelligent for agencies and businesses worldwide.
          </p>
        </div>
      </section>

      {/* Company */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="about-grid">
            <div className="about-block">
              <h2 className="about-section-title">Who We Are</h2>
              <p className="about-text">
                Uptrue is built and operated by <strong>Vision Software Solutions Limited</strong>,
                a UK company incorporated in 1992 (Company No. 02710980), headquartered in Brentford, United Kingdom.
              </p>
              <p className="about-text">
                We set out to solve a problem we experienced first-hand: monitoring dozens of
                client websites across different tools, dashboards, and alert channels. The result
                was fragmented, noisy, and expensive. Uptrue brings it all together into one
                intelligent platform.
              </p>
            </div>
            <div className="about-block">
              <h2 className="about-section-title">What We Do</h2>
              <p className="about-text">
                Uptrue provides comprehensive website and infrastructure monitoring for agencies
                and direct businesses. Our platform covers:
              </p>
              <ul className="about-list">
                <li><strong>24 monitor types</strong> covering <Link href="/monitoring/http-uptime-monitoring">HTTP uptime</Link>, <Link href="/monitoring/ssl-certificate-monitoring">SSL certificates</Link>, DNS, performance, security headers, SPF/DMARC, redirect chains, sitemaps, blacklists, cookie consent, WordPress agent monitoring, and more</li>
                <li><strong>Public status pages</strong> with branded pages, real-time incident feed, and subscriber notifications</li>
                <li><strong>AI-powered reports</strong> that turn raw monitoring data into executive-ready insights</li>
                <li><strong>Multi-channel alerting</strong> via email, Slack, Microsoft Teams, Telegram, and signed webhooks</li>
                <li><strong>Free <Link href="/tools">website monitoring tools</Link></strong> — SSL checker, DNS lookup, security headers checker, and more, no signup required</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="landing-section" style={{ background: 'var(--bg-muted)' }}>
        <div className="landing-container">
          <h2 className="landing-section-title">Our Values</h2>
          <p className="landing-section-subtitle">
            Three principles guide every decision we make.
          </p>
          <div className="features-grid" style={{ maxWidth: 900, margin: '0 auto' }}>
            {VALUES.map((value) => (
              <div key={value.title} className="feature-card">
                <div className="feature-icon">{value.icon}</div>
                <h3 className="feature-title">{value.title}</h3>
                <p className="feature-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="landing-section">
        <div className="landing-container" style={{ textAlign: 'center', maxWidth: 640 }}>
          <h2 className="landing-section-title">Our Team</h2>
          <p className="about-text" style={{ fontSize: 17, lineHeight: 1.8 }}>
            Uptrue is built by a small team passionate about reliability. We combine deep
            experience in web infrastructure, SaaS development, and agency operations to create
            monitoring tools that genuinely make a difference.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section">
        <div className="landing-container" style={{ maxWidth: 760 }}>
          <h2 className="landing-section-title">Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            {[
              {
                q: 'Who builds and operates Uptrue?',
                a: 'Uptrue is built and operated by Vision Software Solutions Limited, a UK company incorporated in 1992 (Company No. 02710980), registered at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, TW8 9DW. Indian customers are billed by Crozent TechLabs Private Limited (GST 09AAMCC8947M1ZP) for Razorpay payments.',
              },
              {
                q: 'What monitor types does Uptrue support?',
                a: 'Uptrue covers 24 monitor types including HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.',
              },
              {
                q: 'Where is my monitoring data stored?',
                a: 'All customer data is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. Row-level security ensures complete data isolation between organisations.',
              },
              {
                q: 'Is there a free plan?',
                a: 'Yes. The Free plan includes 3 monitors with email alerts. No credit card required to start. We also publish over a dozen free website monitoring tools — SSL checker, DNS lookup, blacklist checker, and more — that anyone can use without signing up.',
              },
              {
                q: 'How does Uptrue prevent false alerts?',
                a: 'Two-confirmation detection: when a check detects a potential issue, Uptrue waits and runs a second check. An incident is only created if both checks confirm the problem. This eliminates false alarms caused by temporary network blips. We also recently shipped Smart Digest — first event in a window goes instant, subsequent events collect into a single digest email so customers get the signal without the noise.',
              },
              {
                q: 'How do I contact Uptrue?',
                a: 'Email billing@uptrue.io for billing questions, support@uptrue.io for product support, or use the contact form. We are GDPR compliant and have a published Data Processing Agreement available for Agency customers.',
              },
            ].map((item, i) => (
              <div key={i} style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.q}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD FAQPage schema for the FAQ above (mirrors the items array). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'Who builds and operates Uptrue?', acceptedAnswer: { '@type': 'Answer', text: 'Uptrue is built and operated by Vision Software Solutions Limited, a UK company incorporated in 1992 (Company No. 02710980), registered at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, TW8 9DW. Indian customers are billed by Crozent TechLabs Private Limited (GST 09AAMCC8947M1ZP) for Razorpay payments.' } },
              { '@type': 'Question', name: 'What monitor types does Uptrue support?', acceptedAnswer: { '@type': 'Answer', text: 'Uptrue covers 24 monitor types including HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.' } },
              { '@type': 'Question', name: 'Where is my monitoring data stored?', acceptedAnswer: { '@type': 'Answer', text: 'All customer data is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. Row-level security ensures complete data isolation between organisations.' } },
              { '@type': 'Question', name: 'Is there a free plan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Free plan includes 3 monitors with email alerts. No credit card required to start. We also publish over a dozen free website monitoring tools that anyone can use without signing up.' } },
              { '@type': 'Question', name: 'How does Uptrue prevent false alerts?', acceptedAnswer: { '@type': 'Answer', text: 'Two-confirmation detection: when a check detects a potential issue, Uptrue runs a second check. An incident is only created if both checks confirm. We also ship Smart Digest — first event goes instant, subsequent events collect into one digest email.' } },
              { '@type': 'Question', name: 'How do I contact Uptrue?', acceptedAnswer: { '@type': 'Answer', text: 'Email billing@uptrue.io for billing questions, support@uptrue.io for product support, or use the contact form. We are GDPR compliant and have a published Data Processing Agreement available for Agency customers.' } },
            ],
          }),
        }}
      />

      {/* Contact CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="cta-title">Get in Touch</h2>
          <p className="cta-subtitle">
            Have questions, partnership ideas, or just want to say hello? Or just{' '}
            <Link href="/signup">start monitoring free</Link> in under 2 minutes.
          </p>
          <Link href="/contact" className="btn btn-primary btn-lg">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  )
}
