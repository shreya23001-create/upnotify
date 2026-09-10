import type { Metadata } from 'next'
import { IndustryLandingPage, type IndustryLandingData } from '@/components/landing/industry-landing'

const data: IndustryLandingData = {
  slug: 'ecommerce-uptime-monitoring',
  heroTitle: 'E-commerce Uptime Monitoring',
  heroSubtitle:
    'Catch broken carts, payment gateway errors and slow checkouts before customers abandon. Built for online retailers, Shopify stores, and headless commerce teams.',
  seoTitle: 'E-commerce Uptime Monitoring — Cart, Checkout & Payment Gateway | Upnotify',
  seoDescription:
    'E-commerce uptime monitoring built for online retailers: checkout flow keyword detection, payment gateway response time, SSL expiry, redirect chain monitoring, and Black Friday-grade alerting. Stop losing sales to silent failures.',
  whyItMatters: [
    'In e-commerce, every minute of downtime is measurable in lost orders. A 60-second outage on a peak Saturday afternoon is not an inconvenience — it is hundreds or thousands of pounds in revenue that walked away to a competitor. And yet most retailers still run on a single uptime check that only catches full outages, missing the partial failures that drain conversions all day.',
    'Modern commerce stacks fail in subtle ways: a payment gateway that times out only on Visa cards, a CDN that serves stale product images, a cart that returns 200 OK but silently drops items above £100. E-commerce uptime monitoring needs to look at the customer journey end-to-end, not just whether the homepage loads.',
  ],
  painPoints: [
    'Checkout returns 200 OK but the "Place Order" button is broken — homepage looks fine while sales bleed.',
    'Payment gateway responds slowly under peak load; customers abandon mid-checkout.',
    'SSL warning on checkout subdomain after a certificate auto-renewal failed silently.',
    'Product page redirects through 6 hops because of a CMS migration — Google starts dropping pages from index.',
    'Cookie consent banner missing after a deploy — silently violating GDPR for EU shoppers.',
    'Promo code validation endpoint returns errors during a campaign launch; conversion craters.',
  ],
  monitors: [
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify "Add to cart", "Checkout", "Place order" or any other critical button text is present on every check. Catches the broken-page-with-200-OK failure that destroys sales.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'Slow checkout is abandoned checkout. Alert when TTFB on /cart or /checkout exceeds your conversion threshold.',
    },
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'A browser SSL warning on checkout instantly drops conversion to zero. Get alerted 30, 14 and 3 days before expiry on every subdomain.',
    },
    {
      slug: 'redirect-chain-monitoring',
      label: 'Redirect chain monitoring',
      why: 'Excessive redirects after a CMS migration drop pages from Google index and slow every visitor. Catch chains over 3 hops or broken final destinations.',
    },
    {
      slug: 'security-headers-monitoring',
      label: 'Security headers monitoring',
      why: 'Headers like CSP and X-Frame-Options often disappear after CDN reconfiguration — opening you to compliance issues and Magecart-style attacks.',
    },
    {
      slug: 'cookie-consent-monitoring',
      label: 'Cookie consent monitoring',
      why: 'A missing consent banner is a GDPR/ePrivacy violation under European law. Catch it within minutes of a regression.',
    },
  ],
  slaCallout: [
    { label: 'Of carts abandoned at slow checkout', value: '70%' },
    { label: 'Of shoppers leave on SSL warning', value: '> 90%' },
    { label: 'Plans starting from', value: 'Free' },
  ],
  faq: [
    {
      q: 'How is e-commerce uptime monitoring different from a basic uptime check?',
      a: 'A basic uptime check tells you the homepage loads. E-commerce uptime monitoring tells you whether the cart, checkout, payment gateway and post-purchase flow actually work. A retailer can have 100% homepage uptime and still lose 20% of conversions to a broken cart endpoint that returns 200 OK with an error in the body.',
    },
    {
      q: 'Do you monitor Shopify, WooCommerce, BigCommerce stores?',
      a: 'Yes — Upnotify monitors any public URL regardless of the e-commerce platform. We additionally publish a WordPress plugin (free, on WordPress.org) that runs internal WooCommerce checks: payment gateway health, rogue admin accounts, plugin CVE detection, and order volume anomalies. The browser-side monitors and the plugin are complementary.',
    },
    {
      q: 'Can we run a smoke test of the full checkout flow?',
      a: 'For a full multi-step browser-based checkout test, you need browser automation (synthetic transaction monitoring) which is on the V1.5 roadmap. For now, the recommended pattern is to monitor each step independently: cart endpoint, checkout endpoint, /thank-you page presence after order. This catches 90% of real failures without the cost of full synthetic monitoring.',
    },
    {
      q: 'How do we handle Black Friday or peak campaign traffic?',
      a: 'Increase check frequency on critical paths (cart, checkout, payment) to 30 seconds in advance of the peak. Set tighter response-time thresholds. Connect alerts to Slack and a paging tool. Pre-publish a status page so customers see "we know" instead of refreshing in frustration. The Free plan includes 3 monitors — most retailers upgrade temporarily during peak season.',
    },
    {
      q: 'Will monitoring add load to our checkout?',
      a: 'Negligible. A monitor check is a single HTTP request from the edge — comparable to one bot crawl per check interval. At a 1-minute interval that is 1,440 requests per day from Upnotify, against typical checkout traffic of tens of thousands per day. Use HEAD requests or a dedicated /__health endpoint if you want zero-cost checks.',
    },
    {
      q: 'What about monitoring the payment gateway itself?',
      a: 'Use API Endpoint monitoring against your gateway test endpoint. Configure assertions on response status and body content (e.g. "status: \\"success\\"" must appear). Use Response Time monitoring with tight thresholds — gateway slowness is often the first sign of an upstream incident at Stripe, Adyen, or Braintree.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://upnotify-monitoring.vercel.app/monitoring/${data.slug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://upnotify-monitoring.vercel.app/monitoring/${data.slug}`,
    type: 'website',
  },
}

export default function EcommerceUptimeMonitoringPage(): React.ReactElement {
  return <IndustryLandingPage data={data} />
}
