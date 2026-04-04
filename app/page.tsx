import type { Metadata } from 'next'
import Link from 'next/link'
import PricingTable from '@/components/landing/pricing-table'
import CompetePricing from '@/components/landing/compete-pricing'
import Faq from '@/components/landing/faq'
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
  FaqPageJsonLd,
} from '@/components/seo/json-ld'
import { FAQ_ITEMS } from '@/lib/constants/faq'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { TrustedLogos } from '@/components/landing/trusted-logos'

export const metadata: Metadata = {
  title: 'Uptrue — Uptime Monitoring for Agencies & Teams',
  description:
    'Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, multi-channel alerts, and agency white-label — all in one platform. Free plan available.',
  alternates: {
    canonical: 'https://uptrue.io',
  },
  openGraph: {
    title: 'Uptrue — Uptime Monitoring for Agencies & Teams',
    description:
      'Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, and multi-channel alerts.',
    url: 'https://uptrue.io',
  },
}

const FEATURES = [
  {
    icon: '\u{1F50D}',
    title: 'Uptime Monitoring',
    subtitle: '10 monitor types',
    description:
      'HTTP, SSL, DNS, keyword, domain, port, ping, API endpoint, heartbeat, and competitor tracking. Every angle covered.',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    title: 'Two-Confirmation Detection',
    subtitle: 'Zero false alarms',
    description:
      'Every downtime alert is verified from a second region before firing. No more 3am wake-ups for nothing.',
  },
  {
    icon: '\u{1F514}',
    title: 'Multi-Channel Alerts',
    subtitle: 'Email, Slack, Teams & more',
    description:
      'Email, Slack, Microsoft Teams, and webhooks with HMAC-signed payloads. Route alerts to the right people instantly.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Public Status Pages',
    subtitle: 'Branded & real-time',
    description:
      'Give your customers transparency. Automatic incident updates, uptime bars, and subscription notifications.',
  },
  {
    icon: '\u{1F9E0}',
    title: 'AI-Powered Reports',
    subtitle: 'Claude AI analysis',
    description:
      'Uptime, performance, incident, and SLA reports with AI-generated executive summaries. Share with clients in one click.',
  },
  {
    icon: '\u{2B50}',
    title: 'Uptrue Score',
    subtitle: 'Free site health check',
    description:
      'Score any website on uptime, SSL, DNS, performance, and security. Instant results, no signup required.',
  },
  {
    icon: '\u{1F310}',
    title: 'Public Tracker',
    subtitle: 'Free uptime profiles',
    description:
      'Every tracked site gets a public profile with real-time status, uptime history, and embeddable badge — free for everyone.',
  },
  {
    icon: '\u{1F3C1}',
    title: 'Competitor Intelligence',
    subtitle: 'Benchmark your uptime',
    description:
      'Monitor competitor websites and compare uptime side by side. Know when they go down and prove your reliability edge.',
  },
  {
    icon: '\u{1F4B0}',
    title: 'Uptrue Compete',
    subtitle: 'Price & stock tracking',
    description:
      'Track competitor prices, detect stock changes, and get alerts when prices drop. Automatic extraction from any ecommerce site — no code needed.',
  },
  {
    icon: '\u{1F9F0}',
    title: 'Free SSL & Uptime Tools',
    subtitle: 'No signup required',
    description:
      'Check any SSL certificate, calculate SLA downtime budgets, or score your site health — all free, instantly.',
  },
  {
    icon: '\u{1F3C6}',
    title: 'Public Uptime Leaderboard',
    subtitle: 'Show off your reliability',
    description:
      'The most reliable websites ranked by real uptime data. Opt in your monitors and earn trust from visitors.',
  },
  {
    icon: '\u{1F3F7}\uFE0F',
    title: 'Badge & Credits Program',
    subtitle: 'Earn while you monitor',
    description:
      'Embed a badge on your site, refer friends, write reviews, or report bugs. Earn up to \u00A310/month off your subscription.',
  },
  {
    icon: '\u{1F3F7}\uFE0F',
    title: 'Agency White-Label',
    subtitle: 'Your brand, our engine',
    description:
      'Full white-label for agencies. Custom branding, your own analytics on client pages, and revenue sharing built in.',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Add a Monitor',
    description:
      'Enter a URL, IP, or domain. Choose from 10 monitor types. Set your check interval — as low as 30 seconds.',
  },
  {
    number: '2',
    title: 'Get Alerted Instantly',
    description:
      'When something goes wrong, Uptrue confirms from a second region and alerts you via your preferred channel.',
  },
  {
    number: '3',
    title: 'Share Status & Reports',
    description:
      'Publish branded status pages for your customers. Generate AI-powered reports for stakeholders.',
  },
]

export default function LandingPage(): React.ReactElement {
  return (
    <div className="landing">
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={FAQ_ITEMS} />

      {/* ================================================================
          Navigation
          ================================================================ */}
      <PublicNav />

      {/* ================================================================
          Hero
          ================================================================ */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Monitoring that never sleeps
            </div>
            <h1 className="hero-title">
              Know when your sites go down.
              <br />
              <span className="hero-title-accent">Before your customers do.</span>
            </h1>
            <p className="hero-subtitle">
              Uptime, performance &amp; infrastructure monitoring for agencies and
              teams. 10 monitor types, AI-powered reports, public status pages,
              and multi-channel alerts — all in one platform.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="btn btn-primary btn-lg">
                Start Monitoring Free
              </a>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                See How It Works
              </a>
            </div>
            <div className="hero-secondary-actions">
              <Link href="/score" className="btn btn-ghost btn-sm">
                Score Your Site Free
              </Link>
              <Link href="/tools" className="btn btn-ghost btn-sm">
                Free Tools
              </Link>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <span className="hero-trust-number">10</span>
                <span className="hero-trust-label">Monitor types</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">99.9%</span>
                <span className="hero-trust-label">Uptime detection</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">AI</span>
                <span className="hero-trust-label">Powered reports</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">30s</span>
                <span className="hero-trust-label">Check interval</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-dashboard-mock">
              <div className="mock-header">
                <div className="mock-dots">
                  <span className="mock-dot mock-dot-red" />
                  <span className="mock-dot mock-dot-yellow" />
                  <span className="mock-dot mock-dot-green" />
                </div>
                <span className="mock-url">uptrue.io/dashboard</span>
              </div>
              <div className="mock-body">
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">api.example.com</span>
                  <span className="mock-badge-up">Up</span>
                  <span className="mock-ms">124ms</span>
                </div>
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">app.clientsite.io</span>
                  <span className="mock-badge-up">Up</span>
                  <span className="mock-ms">89ms</span>
                </div>
                <div className="mock-row mock-row-down">
                  <span className="mock-status-dot mock-status-down" />
                  <span className="mock-site">store.brand.co</span>
                  <span className="mock-badge-down">Down</span>
                  <span className="mock-ms">--</span>
                </div>
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">cdn.fastload.net</span>
                  <span className="mock-badge-up">Up</span>
                  <span className="mock-ms">42ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          Social Proof Bar
          ================================================================ */}
      <section className="landing-social-proof">
        <div className="landing-container">
          <p className="social-proof-text">
            Trusted by developers and agencies worldwide
          </p>
          <TrustedLogos />
        </div>
      </section>

      {/* ================================================================
          Features Grid
          ================================================================ */}
      <section className="landing-section landing-features" id="features">
        <div className="landing-container">
          <h2 className="landing-section-title">
            Everything you need to monitor with confidence
          </h2>
          <p className="landing-section-subtitle">
            From uptime checks to AI-generated reports, Uptrue covers every
            aspect of site reliability.
          </p>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <span className="feature-subtitle">{feature.subtitle}</span>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          How It Works
          ================================================================ */}
      <section className="landing-section landing-steps" id="how-it-works">
        <div className="landing-container">
          <h2 className="landing-section-title">Up and running in 60 seconds</h2>
          <p className="landing-section-subtitle">
            Three steps. No complex setup. No credit card required.
          </p>
          <div className="steps-grid">
            {STEPS.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          Pricing
          ================================================================ */}
      <PricingTable />
      <CompetePricing />

      {/* ================================================================
          Agency Section
          ================================================================ */}
      <section className="landing-section landing-agency" id="agency">
        <div className="landing-container">
          <div className="agency-grid">
            <div className="agency-content">
              <div className="agency-label-row">
                <span className="agency-label">Built for Agencies</span>
                <span className="agency-coming-soon-badge">Coming Soon</span>
              </div>
              <h2 className="agency-title">
                Monitor hundreds of client sites under your brand
              </h2>
              <p className="agency-description">
                White-label everything, manage multi-client workspaces, and
                unlock revenue sharing. Built from the ground up for agencies
                managing dozens — or hundreds — of client websites.
              </p>
              <ul className="agency-features">
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Full white-label — your brand, your domain
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Multi-tenant workspaces for each client
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Revenue sharing via Stripe Connect
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Your own analytics on every client page
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  AI reports branded with your agency name
                </li>
              </ul>
              <a
                href="mailto:agencies@uptrue.io?subject=Agency%20Waitlist%20%E2%80%94%20Early%20Access"
                className="btn btn-primary btn-lg"
              >
                Join the Waitlist for Early Access
              </a>
            </div>
            <div className="agency-visual">
              <div className="agency-mock">
                <div className="agency-mock-header">
                  <div className="agency-mock-logo">YourAgency</div>
                  <span className="agency-mock-badge">White-labelled</span>
                </div>
                <div className="agency-mock-clients">
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Client A — 12 monitors</span>
                    <span className="agency-mock-uptime">99.98%</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Client B — 8 monitors</span>
                    <span className="agency-mock-uptime">100%</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-yellow" />
                    <span>Client C — 23 monitors</span>
                    <span className="agency-mock-uptime">99.87%</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Client D — 5 monitors</span>
                    <span className="agency-mock-uptime">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <Faq />

      {/* ================================================================
          CTA Footer
          ================================================================ */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="cta-title">Start monitoring in 60 seconds</h2>
          <p className="cta-subtitle">
            Free plan available. No credit card required. Cancel any time.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Get Started Free
          </a>
        </div>
      </section>

      {/* ================================================================
          Footer
          ================================================================ */}
      <PublicFooter />
    </div>
  )
}
