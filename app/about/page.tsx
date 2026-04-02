import { UptrueLogo } from '@/components/ui/uptrue-logo'
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
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo" aria-label="Uptrue home">
            <UptrueLogo />
          </Link>
          <div className="landing-nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/signup" className="btn btn-primary">Start Free</Link>
          </div>
        </div>
      </nav>

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
                a UK company founded in 2026 and headquartered in Brentford, United Kingdom.
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
                <li><strong>Uptime monitoring</strong> across 10 check types including HTTP, SSL, DNS, keyword, port, ping, API endpoint, and heartbeat</li>
                <li><strong>Competitive intelligence</strong> to track competitor pricing, stock levels, and performance</li>
                <li><strong>Public status tracking</strong> with branded status pages and real-time incident updates</li>
                <li><strong>AI-powered reports</strong> that turn raw monitoring data into executive-ready insights</li>
                <li><strong>Multi-channel alerting</strong> via email, Slack, Microsoft Teams, and webhooks</li>
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

      {/* Contact CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="cta-title">Get in Touch</h2>
          <p className="cta-subtitle">
            Have questions, partnership ideas, or just want to say hello?
          </p>
          <Link href="/contact" className="btn btn-primary btn-lg">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <UptrueLogo />
              <p className="footer-tagline">
                Uptime, performance &amp; infrastructure monitoring for agencies
                and teams.
              </p>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/status">Status</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/cookies">Cookie Policy</Link>
              <Link href="/dpa">Data Processing Agreement</Link>
              <Link href="/acceptable-use">Acceptable Use Policy</Link>
              <Link href="/agency-agreement">Agency Agreement</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              {'\u00A9'} {new Date().getFullYear()} Vision Software Solutions
              Limited. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
