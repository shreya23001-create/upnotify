import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, ShieldCheck, Zap, Users, Radar, Globe2, Bot, Bell, Wrench } from 'lucide-react'
import {
  OrganizationJsonLd,
} from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'About Upnotify — Website Monitoring for Agencies & Teams',
  description:
    'Upnotify comes from Crozent Techlabs Private Limited in Noida, India, built to make smart uptime monitoring simple to reach for agencies and businesses everywhere.',
  alternates: {
    canonical: 'https://upnotify-monitoring.vercel.app/about',
  },
  openGraph: {
    title: 'About Upnotify — Website Monitoring for Agencies & Teams',
    description:
      'Upnotify comes from Crozent Techlabs Private Limited in Noida, India, built to make smart uptime monitoring simple to reach for agencies and businesses everywhere.',
    url: 'https://upnotify-monitoring.vercel.app/about',
    type: 'website',
  },
}

const VALUES = [
  {
    icon: Eye,
    title: 'Transparency',
    description:
      'Every business deserves an honest, clear view of how its infrastructure is actually performing. That belief shows up directly in our public status pages and an open scoring methodology anyone can inspect.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliability',
    description:
      'Our two-confirmation detection means an alert only reaches you when something genuinely needs your attention — no noise, no false alarms wasting your time.',
  },
  {
    icon: Zap,
    title: 'Simplicity',
    description:
      "Real monitoring shouldn't demand a DevOps degree to operate. Every feature we ship is built to feel intuitive and fast, whatever the size of the team using it.",
  },
]

const WHAT_WE_DO = [
  {
    icon: Radar,
    label: '24 monitor types',
    detail: 'HTTP uptime, SSL certificates, DNS, performance metrics, security headers, SPF/DMARC, redirect chains, sitemaps, blacklists, cookie consent, a WordPress monitoring agent, and more besides.',
  },
  {
    icon: Globe2,
    label: 'Public status pages',
    detail: 'Branded pages that show a live incident feed and let visitors subscribe to updates.',
  },
  {
    icon: Bot,
    label: 'AI-powered reports',
    detail: 'Raw monitoring data becomes an executive-ready summary automatically, no manual work involved.',
  },
  {
    icon: Bell,
    label: 'Multi-channel alerting',
    detail: 'Email, Slack, Microsoft Teams, Telegram, and signed webhooks, whichever fits your workflow.',
  },
  {
    icon: Wrench,
    label: 'Free monitoring tools',
    detail: 'An SSL checker, DNS lookup, security headers checker, and more, none of it gated behind a signup.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Who builds and operates Upnotify?',
    a: 'Upnotify is built and run by Crozent Techlabs Private Limited, registered at B-59, B-Block, Chipyana, Noida – 201009, Uttar Pradesh, India (GST 09AAMCC8947M1ZP).',
  },
  {
    q: 'What monitor types does Upnotify support?',
    a: 'There are 24 in total: HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.',
  },
  {
    q: 'Where is my monitoring data stored?',
    a: 'Everything lives in the EU, on Supabase infrastructure in the Frankfurt region, encrypted both at rest and in transit. Row-level security keeps every organisation\u2019s data fully isolated from every other.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes \u2014 3 monitors with email alerts, no credit card needed to get started. We also publish over a dozen free website monitoring tools, an SSL checker, DNS lookup, blacklist checker, and more, that anyone can use without an account.',
  },
  {
    q: 'How does Upnotify prevent false alerts?',
    a: 'That job falls to two-confirmation detection: the moment a check flags a possible issue, Upnotify runs a second check before doing anything else, and only opens an incident if both agree. Temporary network blips never make it through. We\u2019ve also shipped Smart Digest more recently \u2014 the first event in a window goes out instantly, and anything after that gets folded into a single digest email so you get the signal without the noise.',
  },
  {
    q: 'How do I contact Upnotify?',
    a: 'Reach us at shreya23001@gmail.com for billing questions, shreya23001@gmail.com for product support, or through the contact form. We\u2019re GDPR compliant, and a Data Processing Agreement is available for Agency customers.',
  },
]

export default function AboutPage(): React.ReactElement {
  return (
    <div className="landing">
      <OrganizationJsonLd />
      <ScrollReveal />

      {/* Hero */}
      <section className="about-hero">
        <div className="landing-container about-hero-inner">
          <div className="about-hero-copy">
            <h1 className="about-hero-title reveal-title">
              About <span className="gradient-text about-title-gradient">Upnotify</span>
            </h1>
            <p className="about-hero-subtitle reveal-title">
              We help agencies and businesses find problems before their customers ever do.
            </p>
          </div>
          <div className="about-hero-image reveal">
            <img
              src="/image.png"
              alt="Illustration of the Upnotify team reviewing a monitoring dashboard together"
              loading="lazy"
              width={458}
              height={346}
            />
          </div>
        </div>
      </section>

      {/* Company */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="about-block about-block-full reveal">
            <h2 className="about-section-title">Who We Are</h2>
            <p className="about-text">
              Upnotify is built and operated by <strong>Crozent Techlabs Private Limited</strong>,
              headquartered in Noida, Uttar Pradesh, India.
            </p>
            <p className="about-text">
              This started as a problem we ran into ourselves — tracking dozens of client
              websites scattered across separate tools, dashboards, and alert channels. It was
              noisy, expensive, and things still slipped through. Upnotify pulls all of that
              into one dashboard so nothing gets missed.
            </p>
          </div>

          <div className="about-block about-block-full reveal">
            <h2 className="about-section-title">What We Do</h2>
            <p className="about-text">
              Upnotify handles full website and infrastructure monitoring for agencies and
              businesses alike. Here's what's under the hood:
            </p>
          </div>

          <div className="about-do-grid reveal-stagger">
            {WHAT_WE_DO.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="about-do-card">
                  <div className="about-do-number">{String(i + 1).padStart(2, '0')}</div>
                  <div className="about-do-icon"><Icon size={20} /></div>
                  <div className="about-do-label">{item.label}</div>
                  <div className="about-do-detail">{item.detail}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="landing-section about-values-section">
        <div className="landing-container">
          <h2 className="landing-section-title reveal-title">What We Stand For</h2>
          <p className="landing-section-subtitle reveal-title">
            Three things shape every call we make.
          </p>
          <div className="about-values-grid reveal-stagger">
            {VALUES.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="about-value-card">
                  <div className="about-value-icon"><Icon size={24} /></div>
                  <h3 className="about-value-title">{value.title}</h3>
                  <p className="about-value-desc">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="landing-section">
        <div className="landing-container about-team reveal">
          <div className="about-team-icon"><Users size={28} /></div>
          <h2 className="landing-section-title">Our Team</h2>
          <p className="about-text about-team-text">
            A small team that cares a lot about reliability builds Upnotify. Between us we bring
            deep experience across web infrastructure, SaaS development, and agency operations —
            and we put it toward monitoring tools that actually earn their keep.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section">
        <div className="landing-container" style={{ maxWidth: 760 }}>
          <Faq
            items={FAQ_ITEMS.map(item => ({ question: item.q, answer: item.a }))}
            headline="Frequently asked questions"
          />
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
              { '@type': 'Question', name: 'Who builds and operates Upnotify?', acceptedAnswer: { '@type': 'Answer', text: 'Upnotify is built and run by Crozent Techlabs Private Limited, registered at B-59, B-Block, Chipyana, Noida – 201009, Uttar Pradesh, India (GST 09AAMCC8947M1ZP).' } },
              { '@type': 'Question', name: 'What monitor types does Upnotify support?', acceptedAnswer: { '@type': 'Answer', text: 'There are 24 in total: HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.' } },
              { '@type': 'Question', name: 'Where is my monitoring data stored?', acceptedAnswer: { '@type': 'Answer', text: 'Everything lives in the EU, on Supabase infrastructure in the Frankfurt region, encrypted both at rest and in transit. Row-level security keeps every organisation’s data fully isolated from every other.' } },
              { '@type': 'Question', name: 'Is there a free plan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — 3 monitors with email alerts, no credit card needed to get started. We also publish over a dozen free website monitoring tools that anyone can use without an account.' } },
              { '@type': 'Question', name: 'How does Upnotify prevent false alerts?', acceptedAnswer: { '@type': 'Answer', text: 'That job falls to two-confirmation detection: the moment a check flags a possible issue, Upnotify runs a second check before doing anything else, and only opens an incident if both agree. We also ship Smart Digest — the first event goes out instantly, and later events fold into a single digest email.' } },
              { '@type': 'Question', name: 'How do I contact Upnotify?', acceptedAnswer: { '@type': 'Answer', text: 'Reach us at shreya23001@gmail.com for billing questions, shreya23001@gmail.com for product support, or through the contact form. We’re GDPR compliant, and a Data Processing Agreement is available for Agency customers.' } },
            ],
          }),
        }}
      />

      {/* Contact CTA */}
      <section className="landing-cta">
        <div className="landing-container reveal">
          <h2 className="cta-title">Get in Touch</h2>
          <p className="cta-subtitle">
            Got questions, a partnership idea, or just want to say hi? Or skip straight to{' '}
            <Link href="/signup">monitoring for free</Link> — takes under 2 minutes.
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
