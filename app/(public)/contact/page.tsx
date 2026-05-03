import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  OrganizationJsonLd,
} from '@/components/seo/json-ld'
import { ContactForm } from '@/components/contact-form'

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
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
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
      
    </div>
  )
}
