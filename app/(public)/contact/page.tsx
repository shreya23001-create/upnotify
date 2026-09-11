import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Mail, Building2, Handshake, MapPin } from 'lucide-react'
import {
  OrganizationJsonLd,
} from '@/components/seo/json-ld'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contact Upnotify — Get in Touch',
  description:
    'Reach the Upnotify team for support, agency enquiries, or partnership opportunities. Crozent Techlabs Private Limited, Noida, India.',
  alternates: {
    canonical: 'https://upnotify-monitoring.vercel.app/contact',
  },
  openGraph: {
    title: 'Contact Upnotify — Get in Touch',
    description:
      'Reach the Upnotify team for support, agency enquiries, or partnership opportunities.',
    url: 'https://upnotify-monitoring.vercel.app/contact',
    type: 'website',
  },
}

const CONTACT_EMAIL = 'info@upnotify.com'

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: 'General Support',
    description: 'Anything about your account, billing, or getting monitoring set up.',
  },
  {
    icon: Building2,
    title: 'For Agencies',
    description: 'White-label setup, multi-client workspaces, or revenue-sharing questions.',
  },
  {
    icon: Handshake,
    title: 'Partnerships',
    description: 'Integration partnerships, reseller programmes, or collaboration ideas.',
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
            We'd genuinely like to hear from you — pick whichever way below suits you best.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="contact-channels">
            {CONTACT_CHANNELS.map((channel) => {
              const Icon = channel.icon
              return (
                <div key={channel.title} className="contact-channel-card">
                  <div className="contact-channel-icon"><Icon size={22} /></div>
                  <h3 className="feature-title">{channel.title}</h3>
                  <p className="feature-description">{channel.description}</p>
                </div>
              )
            })}
          </div>
          <div className="contact-shared-email">
            Whatever the topic, reach us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact-email-link">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="landing-section" style={{ background: 'var(--bg-muted)' }}>
        <div className="landing-container" style={{ maxWidth: 640 }}>
          <h2 className="landing-section-title">Send Us a Message</h2>
          <p className="landing-section-subtitle">
            Drop a note in the form below and we'll get back to you quickly.
          </p>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </section>

      {/* Company address */}
      <section className="landing-section">
        <div className="landing-container contact-office">
          <div className="contact-office-icon"><MapPin size={22} /></div>
          <h2 className="landing-section-title">Our Office</h2>
          <p className="about-text">
            <strong>Crozent Techlabs Private Limited</strong><br />
            Noida, Uttar Pradesh, India
          </p>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  )
}
