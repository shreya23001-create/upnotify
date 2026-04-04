import type { Metadata } from 'next'
import Link from 'next/link'
import CompetePricing from '@/components/landing/compete-pricing'
import { JsonLd } from '@/components/seo/json-ld'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import CompeteFaqClient from './compete-faq-client'

/* ================================================================
   SEO Metadata
   ================================================================ */

export const metadata: Metadata = {
  title:
    'Uptrue Compete — Track Competitor Prices & Stock in Real Time',
  description:
    'Monitor competitor prices, detect stock changes, and get instant alerts when prices drop. Automatic extraction from any ecommerce site. From \u00A39/month.',
  alternates: {
    canonical: 'https://uptrue.io/compete',
  },
  openGraph: {
    title: 'Uptrue Compete — Competitor Price & Stock Tracking',
    description:
      'Track competitor prices, detect stock changes, and get alerts when prices drop. Automatic extraction from any ecommerce site — no code needed.',
    url: 'https://uptrue.io/compete',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uptrue Compete — Track Competitor Prices & Stock',
    description:
      'Monitor competitor prices and stock availability. Automatic extraction, real-time alerts, historical charts. From \u00A39/month.',
  },
}

/* ================================================================
   FAQ Data
   ================================================================ */

const COMPETE_FAQ_ITEMS = [
  {
    question: 'What is Uptrue Compete?',
    answer:
      'Uptrue Compete is a price and stock tracking add-on that monitors competitor product pages automatically. It extracts prices, detects stock availability changes, and sends you alerts when something changes \u2014 so you can react before your competitors outprice you.',
  },
  {
    question: 'How does automatic price extraction work?',
    answer:
      'You paste in any product URL from an ecommerce site. Uptrue visits the page on a schedule, extracts the current price and stock status using intelligent selectors, and stores the data. No code, no browser extensions, no manual checks.',
  },
  {
    question: 'Which ecommerce sites does it work with?',
    answer:
      'Uptrue Compete works with virtually any ecommerce site that displays a price on its product pages \u2014 including Shopify, WooCommerce, BigCommerce, Magento, Squarespace, Amazon, eBay, and custom-built stores.',
  },
  {
    question: 'Can I get alerts when a competitor changes their price?',
    answer:
      'Yes. You can set up alerts via email, Slack, Microsoft Teams, and webhooks. You choose the conditions \u2014 for example, alert me when a product drops below a specific price, or when any tracked product goes out of stock.',
  },
  {
    question: 'Do I need a paid Uptrue monitoring plan to use Compete?',
    answer:
      'Yes. Uptrue Compete is an add-on that requires any paid monitoring plan (Lite, Builder, or Scale). It cannot be purchased standalone.',
  },
  {
    question: 'How often are prices checked?',
    answer:
      'Check frequency depends on your Compete plan. Starter checks every 12 hours, Pro every 6 hours, and Business plans get custom intervals \u2014 as frequent as every hour.',
  },
  {
    question: 'Can I export price history data?',
    answer:
      'Yes. All plans include CSV export. Pro and Business plans also include price history charts in the dashboard and webhook integrations so you can push data into your own systems automatically.',
  },
  {
    question: 'What happens if I exceed my product limit?',
    answer:
      'You can add extra products in bundles of 5 or 10 at \u00A31 per product per month. There is no hard ceiling \u2014 you scale as you need.',
  },
]

/* ================================================================
   Static Data
   ================================================================ */

const BENEFITS = [
  {
    icon: '\u{1F514}',
    title: 'Real-Time Price Alerts',
    description:
      'Get notified the moment a competitor changes their price. Set thresholds, choose your channel \u2014 email, Slack, Teams, or webhook.',
  },
  {
    icon: '\u{1F4E6}',
    title: 'Stock Availability Monitoring',
    description:
      'Know instantly when a competitor runs out of stock \u2014 or restocks a popular product. Capture demand they cannot fulfil.',
  },
  {
    icon: '\u{2699}\uFE0F',
    title: 'Automatic Extraction (No Code)',
    description:
      'Paste a URL. Uptrue handles the rest. Intelligent selectors extract price, stock status, and product name automatically.',
  },
  {
    icon: '\u{1F310}',
    title: 'Works With Any Ecommerce Site',
    description:
      'Shopify, WooCommerce, BigCommerce, Magento, Amazon, eBay \u2014 if it has a price on the page, Uptrue can track it.',
  },
  {
    icon: '\u{1F4C8}',
    title: 'Historical Price Charts',
    description:
      'See how competitor prices have changed over weeks and months. Spot patterns, identify seasonal trends, and time your moves.',
  },
  {
    icon: '\u{1F517}',
    title: 'Webhook Integrations',
    description:
      'Push price and stock data directly into WooCommerce, Shopify, BigCommerce, or your own backend via signed webhooks.',
  },
]

const STEPS_HOW_TO = [
  {
    number: '1',
    title: 'Add Product URLs',
    description:
      'Paste the URLs of competitor products you want to track. One URL per product. Bulk import supported on Business plans.',
  },
  {
    number: '2',
    title: 'Automatic Extraction',
    description:
      'Uptrue visits each page on a schedule, extracts the current price and stock status using intelligent selectors. No code needed.',
  },
  {
    number: '3',
    title: 'Get Alerts & Act',
    description:
      'When a price drops, a product goes out of stock, or a threshold is hit \u2014 you get an instant alert on your preferred channel.',
  },
]

const COMPARISON_ROWS = [
  { feature: 'Automatic price extraction', compete: true, manual: false, others: 'Some' },
  { feature: 'Stock availability alerts', compete: true, manual: false, others: 'Rare' },
  { feature: 'No browser extensions needed', compete: true, manual: true, others: 'No' },
  { feature: 'Historical price charts', compete: true, manual: false, others: 'Some' },
  { feature: 'Webhook integrations', compete: true, manual: false, others: 'Rare' },
  { feature: 'Works with any ecommerce site', compete: true, manual: true, others: 'Limited' },
  { feature: 'Combined with uptime monitoring', compete: true, manual: false, others: 'No' },
  { feature: 'No per-check pricing surprises', compete: true, manual: true, others: 'No' },
]

const CASE_STUDIES = [
  {
    title: 'Ecommerce Store',
    subtitle: 'Fashion retailer tracking 200+ competitor SKUs',
    description:
      'Automated price matching across three competitors. Reduced manual checking from 4 hours per week to zero.',
    metric: '200+ SKUs tracked',
  },
  {
    title: 'Dropshipper',
    subtitle: 'Multi-supplier dropshipping operation',
    description:
      'Monitors supplier stock levels and prices across 8 suppliers. Automatically pauses listings when suppliers run out.',
    metric: '8 suppliers monitored',
  },
  {
    title: 'Price Comparison Site',
    subtitle: 'Niche electronics comparison platform',
    description:
      'Tracks 500 products across 12 retailers. Feeds live pricing data into their comparison engine via webhooks.',
    metric: '500 products, 12 retailers',
  },
]

const BLOG_CARDS = [
  {
    slug: 'competitor-analysis-ecommerce',
    title: 'Website Competitor Analysis Tools for Ecommerce in 2026',
    excerpt:
      'Your competitors\' website performance directly affects your bottom line. Learn what to track and which tools help.',
    category: 'Ecommerce',
    readTime: '11 min read',
  },
  {
    slug: 'website-monitoring-guide',
    title: 'Website Monitoring in 2026: The Complete Guide',
    excerpt:
      'Everything you need to know about monitoring your website \u2014 from basic uptime checks to advanced performance tracking.',
    category: 'Guide',
    readTime: '12 min read',
  },
  {
    slug: 'website-downtime-warning-signs',
    title: '10 Warning Signs Your Website Is About to Go Down',
    excerpt:
      'Websites rarely crash without warning. Slow TTFB, expiring SSL, rising error rates \u2014 here are the 10 signs.',
    category: 'Guide',
    readTime: '13 min read',
  },
  {
    slug: 'woocommerce-checkout-not-working',
    title: 'WooCommerce Checkout Not Working: Fix It Before You Lose Sales',
    excerpt:
      'A broken WooCommerce checkout silently costs you sales. Learn why it breaks and how monitoring catches it.',
    category: 'WordPress',
    readTime: '14 min read',
  },
  {
    slug: 'woocommerce-payment-gateway-error',
    title: 'WooCommerce Payment Gateway Error: Your Customers Cannot Pay',
    excerpt:
      'Payment gateway errors block every sale on your store. Learn what causes them and how to detect them.',
    category: 'WordPress',
    readTime: '14 min read',
  },
  {
    slug: 'what-is-uptime-monitoring',
    title: 'What Is Uptime Monitoring and Why Every Website Needs It',
    excerpt:
      'Uptime monitoring checks your website every 60 seconds and alerts you when it goes down. Here is why you need it.',
    category: 'Guide',
    readTime: '11 min read',
  },
]

/* ================================================================
   Page Component
   ================================================================ */

export default function CompeteLandingPage(): React.ReactElement {
  return (
    <div className="landing">
      {/* JSON-LD: Product */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Uptrue Compete',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://uptrue.io/compete',
          description:
            'Track competitor prices, detect stock changes, and get alerts when prices drop. Automatic extraction from any ecommerce site.',
          offers: [
            {
              '@type': 'Offer',
              name: 'Starter',
              price: '9',
              priceCurrency: 'GBP',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '9',
                priceCurrency: 'GBP',
                billingDuration: 'P1M',
              },
              description: '10 products, automatic extraction, stock alerts',
            },
            {
              '@type': 'Offer',
              name: 'Pro',
              price: '29',
              priceCurrency: 'GBP',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '29',
                priceCurrency: 'GBP',
                billingDuration: 'P1M',
              },
              description: '500 products, webhooks, price history, AI brief',
            },
            {
              '@type': 'Offer',
              name: 'Business',
              price: '99',
              priceCurrency: 'GBP',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '99',
                priceCurrency: 'GBP',
                billingDuration: 'P1M',
              },
              description: '2,500 products, priority support, bulk import',
            },
          ],
        }}
      />
      {/* JSON-LD: FAQ */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: COMPETE_FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://uptrue.io',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Uptrue Compete',
              item: 'https://uptrue.io/compete',
            },
          ],
        }}
      />

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
              Competitive pricing intelligence
            </div>
            <h1 className="hero-title">
              Stop guessing what your
              <br />
              <span className="hero-title-accent">competitors are charging.</span>
            </h1>
            <p className="hero-subtitle">
              Track competitor prices, detect stock changes, and get instant alerts
              when prices drop. Automatic extraction from any ecommerce site &mdash;
              no code, no browser extensions, no manual checks.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="btn btn-primary btn-lg">
                Start Tracking
              </a>
              <a href="#compete-pricing" className="btn btn-secondary btn-lg">
                See Pricing
              </a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <span className="hero-trust-number">500+</span>
                <span className="hero-trust-label">Products tracked</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">Any</span>
                <span className="hero-trust-label">Ecommerce site</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">0</span>
                <span className="hero-trust-label">Code required</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <span className="hero-trust-number">{'\u00A3'}9</span>
                <span className="hero-trust-label">Per month from</span>
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
                <span className="mock-url">uptrue.io/compete</span>
              </div>
              <div className="mock-body">
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">Nike Air Max 90</span>
                  <span className="mock-badge-up">{'\u00A3'}119.99</span>
                  <span className="mock-ms" style={{ color: '#ef4444' }}>{'\u2193 \u00A3'}10</span>
                </div>
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">Sony WH-1000XM5</span>
                  <span className="mock-badge-up">{'\u00A3'}279.00</span>
                  <span className="mock-ms">No change</span>
                </div>
                <div className="mock-row mock-row-down">
                  <span className="mock-status-dot mock-status-down" />
                  <span className="mock-site">Samsung Galaxy S25</span>
                  <span className="mock-badge-down">Out of stock</span>
                  <span className="mock-ms">--</span>
                </div>
                <div className="mock-row mock-row-up">
                  <span className="mock-status-dot mock-status-up" />
                  <span className="mock-site">Dyson V15 Detect</span>
                  <span className="mock-badge-up">{'\u00A3'}529.99</span>
                  <span className="mock-ms" style={{ color: '#22c55e' }}>{'\u2191 \u00A3'}20</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          Problem Section
          ================================================================ */}
      <section className="landing-section" id="problem">
        <div className="landing-container">
          <h2 className="landing-section-title">
            Your competitors are changing prices right now
          </h2>
          <p className="landing-section-subtitle">
            And unless you are checking manually every day, you have no idea.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number" style={{ background: '#fef2f2', color: '#ef4444' }}>!</div>
              <h3 className="step-title">Competitors undercut you</h3>
              <p className="step-description">
                A competitor drops their price by 10% and you do not find out for a week.
                By then, you have already lost the sales.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: '#fef2f2', color: '#ef4444' }}>!</div>
              <h3 className="step-title">Stock runs out silently</h3>
              <p className="step-description">
                A competitor runs out of stock on a high-demand product. That demand goes somewhere &mdash;
                it could go to you, if you knew in time.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: '#fef2f2', color: '#ef4444' }}>!</div>
              <h3 className="step-title">Manual checking does not scale</h3>
              <p className="step-description">
                Checking 50 products across 5 competitors means 250 page visits.
                Every single day. It is not sustainable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          How It Works — 3 Steps
          ================================================================ */}
      <section className="landing-section landing-steps" id="how-it-works">
        <div className="landing-container">
          <h2 className="landing-section-title">How it works</h2>
          <p className="landing-section-subtitle">
            Three steps. No code. No browser extensions.
          </p>
          <div className="steps-grid">
            {STEPS_HOW_TO.map((step) => (
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
          Benefits — 6 Cards
          ================================================================ */}
      <section className="landing-section landing-features" id="benefits">
        <div className="landing-container">
          <h2 className="landing-section-title">
            Everything you need for competitive pricing intelligence
          </h2>
          <p className="landing-section-subtitle">
            From price alerts to webhook integrations, Uptrue Compete gives you
            the edge.
          </p>
          <div className="features-grid">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="feature-card">
                <div className="feature-icon">{benefit.icon}</div>
                <h3 className="feature-title">{benefit.title}</h3>
                <p className="feature-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          Cost vs Benefit (ROI)
          ================================================================ */}
      <section className="landing-section" id="roi">
        <div className="landing-container">
          <div className="agency-grid">
            <div className="agency-content">
              <span className="agency-label">Cost vs Benefit</span>
              <h2 className="agency-title">
                One missed price change can cost you thousands
              </h2>
              <p className="agency-description">
                Track 500 products for {'\u00A3'}29/month. That is less than 6p per product.
                A single day of being overpriced on a high-traffic product can cost more
                than a year of Uptrue Compete.
              </p>
              <ul className="agency-features">
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  500 products monitored for {'\u00A3'}29/month
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Less than 6p per product per month
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Pays for itself with a single pricing decision
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Save 4+ hours per week vs manual checking
                </li>
                <li>
                  <span className="agency-check">{'\u2713'}</span>
                  Catch stock-out opportunities competitors miss
                </li>
              </ul>
              <a href="/signup" className="btn btn-primary btn-lg">
                Start Your Free Trial
              </a>
            </div>
            <div className="agency-visual">
              <div className="agency-mock">
                <div className="agency-mock-header">
                  <div className="agency-mock-logo">ROI Calculator</div>
                  <span className="agency-mock-badge">Pro Plan</span>
                </div>
                <div className="agency-mock-clients">
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Products tracked</span>
                    <span className="agency-mock-uptime">500</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Monthly cost</span>
                    <span className="agency-mock-uptime">{'\u00A3'}29</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-green" />
                    <span>Cost per product</span>
                    <span className="agency-mock-uptime">{'\u00A3'}0.06</span>
                  </div>
                  <div className="agency-mock-client">
                    <span className="agency-mock-dot agency-mock-dot-yellow" />
                    <span>Manual hours saved/week</span>
                    <span className="agency-mock-uptime">4h+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          Case Studies (Coming Soon)
          ================================================================ */}
      <section className="landing-section landing-features" id="case-studies">
        <div className="landing-container">
          <h2 className="landing-section-title">
            How businesses use Uptrue Compete
          </h2>
          <p className="landing-section-subtitle">
            Real-world use cases from ecommerce, dropshipping, and price comparison.
          </p>
          <div className="features-grid">
            {CASE_STUDIES.map((study) => (
              <div key={study.title} className="feature-card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Coming Soon overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    borderRadius: 'inherit',
                  }}
                >
                  <span
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      padding: '8px 20px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
                <div className="feature-icon">{'\u{1F4BC}'}</div>
                <h3 className="feature-title">{study.title}</h3>
                <span className="feature-subtitle">{study.subtitle}</span>
                <p className="feature-description">{study.description}</p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    marginTop: 8,
                  }}
                >
                  {study.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          How to Use It — Step-by-Step
          ================================================================ */}
      <section className="landing-section landing-steps" id="guide">
        <div className="landing-container">
          <h2 className="landing-section-title">Step-by-step guide</h2>
          <p className="landing-section-subtitle">
            From signup to your first price alert in under five minutes.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Sign up and choose a plan</h3>
              <p className="step-description">
                Create your Uptrue account and subscribe to any paid monitoring plan.
                Then add the Compete add-on from your dashboard settings.
              </p>
              {/* Screenshot placeholder */}
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                }}
              >
                Screenshot: Dashboard settings
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Add product URLs to track</h3>
              <p className="step-description">
                Paste in competitor product page URLs. Uptrue automatically detects
                the price, product name, and stock status. Review and confirm.
              </p>
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                }}
              >
                Screenshot: Add product URL
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Configure alerts and integrations</h3>
              <p className="step-description">
                Set your alert conditions &mdash; price drops, price increases, stock changes.
                Connect to Slack, email, or webhooks. You are done.
              </p>
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                }}
              >
                Screenshot: Alert configuration
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3 className="step-title">Monitor your dashboard</h3>
              <p className="step-description">
                View all tracked products, price trends, and stock statuses in one place.
                Filter by competitor, category, or alert status.
              </p>
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                }}
              >
                Screenshot: Compete dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          Why Uptrue Compete — Comparison Table
          ================================================================ */}
      <section className="landing-section" id="comparison">
        <div className="landing-container">
          <h2 className="landing-section-title">
            Why Uptrue Compete
          </h2>
          <p className="landing-section-subtitle">
            How it compares to manual tracking and other tools.
          </p>
          <div style={{ overflowX: 'auto', marginTop: 32 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
                minWidth: 600,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-primary)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Feature</th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                    }}
                  >
                    Uptrue Compete
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Manual Tracking</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Other Tools</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                  >
                    <td style={{ padding: '12px 16px' }}>{row.feature}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#22c55e' }}>
                      {row.compete === true ? '\u2713 Yes' : typeof row.compete === 'string' ? row.compete : '\u2717 No'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {row.manual === true ? '\u2713 Yes' : row.manual === false ? '\u2717 No' : String(row.manual)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {String(row.others)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================================================================
          Blog Cards
          ================================================================ */}
      <section className="landing-section" id="blog">
        <div className="landing-container">
          <h2 className="landing-section-title">
            Learn more about competitive intelligence
          </h2>
          <p className="landing-section-subtitle">
            Guides, tutorials, and insights on price tracking and ecommerce monitoring.
          </p>
          <div className="blog-posts-grid" style={{ marginTop: 32 }}>
            {BLOG_CARDS.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="blog-post-card"
              >
                <div className="blog-post-card-body">
                  <span className="blog-post-category">{post.category}</span>
                  <h3 className="blog-post-card-title">{post.title}</h3>
                  <p className="blog-post-card-excerpt">{post.excerpt}</p>
                  <div className="blog-post-card-meta">
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          Pricing
          ================================================================ */}
      <CompetePricing />

      {/* ================================================================
          FAQ
          ================================================================ */}
      <CompeteFaqClient items={COMPETE_FAQ_ITEMS} />

      {/* ================================================================
          Final CTA
          ================================================================ */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="cta-title">
            Start tracking competitor prices today
          </h2>
          <p className="cta-subtitle">
            Add Compete to any paid monitoring plan. No credit card required for your monitoring trial.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Tracking
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

