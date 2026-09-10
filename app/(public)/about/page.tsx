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
    'Upnotify is built by Vision Software Solutions Limited in Brentford, UK. Our mission is to make uptime monitoring accessible and intelligent for agencies and businesses worldwide.',
  alternates: {
    canonical: 'https://upnotify-monitoring.vercel.app/about',
  },
  openGraph: {
    title: 'About Upnotify — Website Monitoring for Agencies & Teams',
    description:
      'Upnotify is built by Vision Software Solutions Limited in Brentford, UK. Our mission is to make uptime monitoring accessible and intelligent for agencies and businesses worldwide.',
    url: 'https://upnotify-monitoring.vercel.app/about',
    type: 'website',
  },
}

const VALUES = [
  {
    icon: Eye,
    title: 'Transparency',
    description:
      'We believe every business deserves clear, honest visibility into how their infrastructure performs. Our public status pages and open scoring methodology reflect that commitment.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliability',
    description:
      'Our two-confirmation detection system ensures you only get alerted when something genuinely needs attention. No false alarms, no noise.',
  },
  {
    icon: Zap,
    title: 'Simplicity',
    description:
      'Powerful monitoring should not require a PhD in DevOps. We design every feature to be intuitive, fast, and accessible to teams of all sizes.',
  },
]

const WHAT_WE_DO = [
  {
    icon: Radar,
    label: '24 monitor types',
    detail: 'HTTP uptime, SSL certificates, DNS, performance, security headers, SPF/DMARC, redirect chains, sitemaps, blacklists, cookie consent, WordPress agent monitoring, and more.',
  },
  {
    icon: Globe2,
    label: 'Public status pages',
    detail: 'Branded pages with a real-time incident feed and subscriber notifications.',
  },
  {
    icon: Bot,
    label: 'AI-powered reports',
    detail: 'Turn raw monitoring data into executive-ready insights automatically.',
  },
  {
    icon: Bell,
    label: 'Multi-channel alerting',
    detail: 'Email, Slack, Microsoft Teams, Telegram, and signed webhooks.',
  },
  {
    icon: Wrench,
    label: 'Free monitoring tools',
    detail: 'SSL checker, DNS lookup, security headers checker, and more — no signup required.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Who builds and operates Upnotify?',
    a: 'Upnotify is built and operated by Vision Software Solutions Limited, a UK company incorporated in 1992 (Company No. 02710980), registered at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, TW8 9DW. Indian customers are billed by Crozent TechLabs Private Limited (GST 09AAMCC8947M1ZP) for Razorpay payments.',
  },
  {
    q: 'What monitor types does Upnotify support?',
    a: 'Upnotify covers 24 monitor types including HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.',
  },
  {
    q: 'Where is my monitoring data stored?',
    a: 'All customer data is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. Row-level security ensures complete data isolation between organisations.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan includes 3 monitors with email alerts. No credit card required to start. We also publish over a dozen free website monitoring tools \u2014 SSL checker, DNS lookup, blacklist checker, and more \u2014 that anyone can use without signing up.',
  },
  {
    q: 'How does Upnotify prevent false alerts?',
    a: 'Two-confirmation detection: when a check detects a potential issue, Upnotify waits and runs a second check. An incident is only created if both checks confirm the problem. This eliminates false alarms caused by temporary network blips. We also recently shipped Smart Digest \u2014 first event in a window goes instant, subsequent events collect into a single digest email so customers get the signal without the noise.',
  },
  {
    q: 'How do I contact Upnotify?',
    a: 'Email shreya23001@gmail.com for billing questions, shreya23001@gmail.com for product support, or use the contact form. We are GDPR compliant and have a published Data Processing Agreement available for Agency customers.',
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
              We help agencies and businesses catch problems before their customers do.
            </p>
          </div>
          <div className="about-hero-image reveal">
            <img
              src="/about.png"
              alt="Team reviewing monitoring dashboards and analytics together"
              loading="lazy"
              width={914}
              height={519}
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
              Upnotify is built and operated by <strong>Vision Software Solutions Limited</strong>,
              a UK company incorporated in 1992 (Company No. 02710980), headquartered in Brentford, United Kingdom.
            </p>
            <p className="about-text">
              We set out to solve a problem we experienced first-hand: monitoring dozens of
              client websites across different tools, dashboards, and alert channels. The result
              was fragmented, noisy, and expensive. Upnotify brings it all together into one
              dashboard, so nothing slips through the cracks.
            </p>
          </div>

          <div className="about-block about-block-full reveal">
            <h2 className="about-section-title">What We Do</h2>
            <p className="about-text">
              Upnotify provides comprehensive website and infrastructure monitoring for agencies
              and direct businesses. Our platform covers:
            </p>
          </div>

          <div className="about-circle reveal">
            <div className="about-circle-ring" />
            {WHAT_WE_DO.map((item, i) => {
              const Icon = item.icon
              const angle = (i / WHAT_WE_DO.length) * 2 * Math.PI - Math.PI / 2
              const x = 50 + 46 * Math.cos(angle)
              const y = 50 + 46 * Math.sin(angle)
              return (
                <div
                  key={item.label}
                  className="about-circle-item"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="about-circle-node">
                    <Icon size={18} />
                  </div>
                  <div className="about-circle-label">{item.label}</div>
                  <div className="about-circle-detail">{item.detail}</div>
                </div>
              )
            })}
            <div className="about-circle-center">
              <span className="about-circle-center-title">What We Do</span>
              <span className="about-circle-center-sub">Hover a point to explore</span>
            </div>
          </div>

          {/* Mobile fallback — a connected vertical timeline instead of the circle */}
          <div className="about-circle-fallback">
            {WHAT_WE_DO.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="about-timeline-row" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="about-timeline-node"><Icon size={18} /></div>
                  <div className="about-timeline-body">
                    <div className="about-timeline-label">{item.label}</div>
                    <div className="about-timeline-detail">{item.detail}</div>
                  </div>
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
            Three principles guide every decision we make.
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
            Upnotify is built by a small team passionate about reliability. We combine deep
            experience in web infrastructure, SaaS development, and agency operations to create
            monitoring tools that genuinely make a difference.
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
              { '@type': 'Question', name: 'Who builds and operates Upnotify?', acceptedAnswer: { '@type': 'Answer', text: 'Upnotify is built and operated by Vision Software Solutions Limited, a UK company incorporated in 1992 (Company No. 02710980), registered at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, TW8 9DW. Indian customers are billed by Crozent TechLabs Private Limited (GST 09AAMCC8947M1ZP) for Razorpay payments.' } },
              { '@type': 'Question', name: 'What monitor types does Upnotify support?', acceptedAnswer: { '@type': 'Answer', text: 'Upnotify covers 24 monitor types including HTTP/HTTPS uptime, SSL certificate expiry, DNS records, keyword detection, domain expiry, ports, ping, API endpoints, heartbeat, page change detection, security headers, response time, robots.txt, IP changes, MX health, WHOIS/registrar changes, sitemaps, redirect chains, SPF/DMARC, blacklists, page size, cookie consent, nameservers, and a WordPress site monitor plugin.' } },
              { '@type': 'Question', name: 'Where is my monitoring data stored?', acceptedAnswer: { '@type': 'Answer', text: 'All customer data is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. Row-level security ensures complete data isolation between organisations.' } },
              { '@type': 'Question', name: 'Is there a free plan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Free plan includes 3 monitors with email alerts. No credit card required to start. We also publish over a dozen free website monitoring tools that anyone can use without signing up.' } },
              { '@type': 'Question', name: 'How does Upnotify prevent false alerts?', acceptedAnswer: { '@type': 'Answer', text: 'Two-confirmation detection: when a check detects a potential issue, Upnotify runs a second check. An incident is only created if both checks confirm. We also ship Smart Digest — first event goes instant, subsequent events collect into one digest email.' } },
              { '@type': 'Question', name: 'How do I contact Upnotify?', acceptedAnswer: { '@type': 'Answer', text: 'Email shreya23001@gmail.com for billing questions, shreya23001@gmail.com for product support, or use the contact form. We are GDPR compliant and have a published Data Processing Agreement available for Agency customers.' } },
            ],
          }),
        }}
      />

      {/* Contact CTA */}
      <section className="landing-cta">
        <div className="landing-container reveal">
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
