import type { Metadata } from 'next'
import Link from 'next/link'
import {
  OrganizationJsonLd,
} from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'Contact Uptrue — Get in Touch',
  description:
    'Contact the Uptrue team for support, agency enquiries, or partnership opportunities. Vision Software Solutions Limited, Brentford, UK.',
  alternates: {
    canonical: 'https://uptrue.io/contact',
  },
  openGraph: {
    title: 'Contact Uptrue — Get in Touch',
    description:
      'Contact the Uptrue team for support, agency enquiries, or partnership opportunities.',
    url: 'https://uptrue.io/contact',
    type: 'website',
  },
}

const CONTACT_CHANNELS = [
  {
    icon: '\u{1F4E7}',
    title: 'General Support',
    description: 'Questions about your account, billing, or monitoring setup.',
    email: 'support@uptrue.io',
  },
  {
    icon: '\u{1F3E2}',
    title: 'For Agencies',
    description: 'White-label, multi-client workspaces, and revenue sharing enquiries.',
    email: 'agencies@uptrue.io',
  },
  {
    icon: '\u{1F91D}',
    title: 'Partnerships',
    description: 'Integration partnerships, reseller programmes, and collaboration.',
    email: 'partners@uptrue.io',
  },
]

export default function ContactPage(): React.ReactElement {
  return (
    <div className="landing">
      <OrganizationJsonLd />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo" aria-label="Uptrue home">
            <img
              src="/logo-concept-1.svg"
              alt="Uptrue"
              width={140}
              height={35}
              className="landing-logo-img"
            />
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
          <h1 className="about-hero-title">Contact Us</h1>
          <p className="about-hero-subtitle">
            We would love to hear from you. Choose the best way to reach us below.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="contact-channels">
            {CONTACT_CHANNELS.map((channel) => (
              <div key={channel.email} className="contact-channel-card">
                <div className="feature-icon">{channel.icon}</div>
                <h3 className="feature-title">{channel.title}</h3>
                <p className="feature-description">{channel.description}</p>
                <a href={`mailto:${channel.email}`} className="contact-email-link">
                  {channel.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="landing-section" style={{ background: 'var(--bg-muted)' }}>
        <div className="landing-container" style={{ maxWidth: 640 }}>
          <h2 className="landing-section-title">Send Us a Message</h2>
          <p className="landing-section-subtitle">
            Fill out the form below and we will get back to you as soon as possible.
          </p>
          <form
            className="contact-form"
            action="mailto:support@uptrue.io"
            method="POST"
            encType="text/plain"
          >
            <div className="contact-form-row">
              <label htmlFor="contact-name" className="contact-label">Your Name</label>
              <input
                type="text"
                id="contact-name"
                name="name"
                required
                className="contact-input"
                placeholder="Jane Smith"
              />
            </div>
            <div className="contact-form-row">
              <label htmlFor="contact-email" className="contact-label">Email Address</label>
              <input
                type="email"
                id="contact-email"
                name="email"
                required
                className="contact-input"
                placeholder="jane@company.com"
              />
            </div>
            <div className="contact-form-row">
              <label htmlFor="contact-subject" className="contact-label">Subject</label>
              <select
                id="contact-subject"
                name="subject"
                required
                className="contact-input"
                defaultValue=""
              >
                <option value="" disabled>Select a subject</option>
                <option value="General enquiry">General Enquiry</option>
                <option value="Agency enquiry">Agency Enquiry</option>
                <option value="Partnership">Partnership</option>
                <option value="Billing">Billing</option>
                <option value="Technical support">Technical Support</option>
                <option value="Bug report">Bug Report</option>
                <option value="Feature request">Feature Request</option>
              </select>
            </div>
            <div className="contact-form-row">
              <label htmlFor="contact-message" className="contact-label">Message</label>
              <textarea
                id="contact-message"
                name="message"
                required
                className="contact-input contact-textarea"
                placeholder="Tell us how we can help..."
                rows={6}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Company address */}
      <section className="landing-section">
        <div className="landing-container" style={{ textAlign: 'center', maxWidth: 540 }}>
          <h2 className="landing-section-title">Our Office</h2>
          <p className="about-text" style={{ fontSize: 16, lineHeight: 1.8 }}>
            <strong>Vision Software Solutions Limited</strong><br />
            Brentford, United Kingdom
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img
                src="/logo-concept-1.svg"
                alt="Uptrue"
                width={140}
                height={35}
                className="landing-logo-img"
              />
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
