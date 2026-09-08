import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

const STORE_CAUSES = [
  {
    question: 'Custom domain DNS failure',
    answer: (
      <>
        <p>Shopify stores with custom domains (rather than .myshopify.com) rely on your domain&apos;s DNS records pointing to Shopify&apos;s servers. If your domain has expired, your registrar has changed DNS settings, or your domain was transferred without properly moving the DNS records, your custom domain becomes unreachable while your .myshopify.com URL continues to work.</p>
        <p>Check your domain&apos;s DNS settings in your registrar&apos;s control panel. Shopify requires specific CNAME or A record configurations. Go to Shopify admin &gt; Settings &gt; Domains and verify your domain shows as &quot;Connected.&quot; If it shows an error, follow Shopify&apos;s instructions to update your DNS records. DNS changes take up to 48 hours to propagate globally, though most changes are visible within a few hours.</p>
      </>
    ),
  },
  {
    question: 'A broken app or app conflict',
    answer: (
      <>
        <p>Shopify apps extend your store&apos;s functionality, but they also add code that runs on every page load. A recently updated app, or a newly installed app that conflicts with an existing one, can break your storefront or checkout in ways that are difficult to spot.</p>
        <p>To diagnose an app conflict: go to your Shopify admin, navigate to Apps, and disable recently added or updated apps one at a time. After disabling each app, reload your store and test the affected functionality. When the problem disappears, the last app you disabled is the cause. Contact that app&apos;s support team with details of the conflict.</p>
      </>
    ),
  },
  {
    question: 'Theme code error',
    answer: (
      <>
        <p>If you or a developer recently edited your theme files — via the Shopify admin Theme Editor or via a code editor — a syntax error in Liquid, JavaScript, or CSS can break your storefront. Even a misplaced comma or bracket in a JavaScript file can prevent the entire script from running, breaking interactive elements like the cart drawer, product image gallery, or checkout buttons.</p>
        <p>Check your theme&apos;s recent edits in the Shopify admin under Online Store &gt; Themes &gt; Edit Code. Review any files modified in the last few days. If you are unsure what changed, unpublishing your current theme and publishing a backup copy (Shopify automatically creates backups when you duplicate a theme) is the fastest way to restore a working store.</p>
      </>
    ),
  },
  {
    question: 'Shopify Payments account issue',
    answer: (
      <>
        <p>If customers can browse your store but cannot complete checkout, and status.shopify.com shows Shopify Payments as operational, the problem may be with your specific Shopify Payments account rather than the platform.</p>
        <p>Shopify Payments accounts can be placed on hold or require additional verification — particularly for new stores, stores with sudden spikes in sales volume, or after chargebacks. When this happens, Shopify sends an email notification, but it can easily be missed. Check your Shopify admin under Settings &gt; Payments for any notices about your Shopify Payments status.</p>
      </>
    ),
  },
  {
    question: 'SSL certificate issue on your custom domain',
    answer: (
      <>
        <p>Shopify automatically provisions and renews SSL certificates for your store&apos;s .myshopify.com subdomain, but for custom domains, the SSL certificate is tied to your domain configuration. If your custom domain&apos;s DNS was recently changed, the SSL certificate may need to be reprovisioned. This can cause browser security warnings that prevent customers from accessing your store.</p>
        <p>In Shopify admin &gt; Settings &gt; Domains, check whether your domain shows an SSL error. Shopify usually provisions the SSL certificate within a few hours of domain connection, but if your DNS is misconfigured, the certificate cannot be issued.</p>
      </>
    ),
  },
]

export const metadata: Metadata = {
  title: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',
  description:
    'Wondering if Shopify is down? Learn how to check the official Shopify status page, tell the difference between a Shopify platform outage and a problem with your own theme or apps, what to do during an outage, and how uptime monitoring protects your store.',
  alternates: { canonical: 'https://uptrue.io/blog/shopify-down' },
  openGraph: {
    title: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',
    description:
      'How to check if Shopify is down, distinguish platform outages from store-specific issues, and protect your store revenue with uptime monitoring.',
    url: 'https://uptrue.io/blog/shopify-down',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',
    description:
      'How to check if Shopify is down, distinguish platform outages from store-specific issues, and protect your store revenue with uptime monitoring.',
  },
}

const FAQ_DATA = [
  {
    question: 'Where do I check if Shopify is down right now?',
    answer:
      'The official Shopify status page is at status.shopify.com. It shows the current operational status of all major Shopify services — storefront, checkout, admin, API, payments, and third-party integrations. Subscribe to status updates on that page to receive email or SMS notifications when Shopify reports an incident. For real-time user reports, Twitter/X (search "Shopify down") and Downdetector often show community reports faster than Shopify\'s own status page during major outages.',
  },
  {
    question: 'How do I tell if it is Shopify that is down or just my store?',
    answer:
      'Visit status.shopify.com first. If Shopify reports an active incident affecting storefronts or checkout, that is your answer. If Shopify shows all green, the problem is store-specific — your theme, a broken app, a custom code snippet in your theme files, or a DNS misconfiguration. Test by browsing other Shopify stores (any .myshopify.com domain). If those load normally but yours does not, the problem is with your store specifically. Also check your custom domain DNS settings — if your domain has expired or DNS records have changed, your store becomes unreachable even though Shopify itself is running perfectly.',
  },
  {
    question: 'What happens to my store during a Shopify outage?',
    answer:
      'During a Shopify platform outage, depending on which services are affected, visitors may see error pages, checkout may fail while browsing works, payment processing may be unavailable, your Shopify admin may be inaccessible, or order confirmations may be delayed. Shopify maintains a high availability infrastructure with redundancy, so full storefront outages are rare — partial outages affecting checkout or the admin panel are more common. You cannot do much during a platform-level outage except communicate with customers and wait for Shopify to resolve it.',
  },
  {
    question: 'My Shopify checkout is not working but the rest of the store seems fine. Is this a Shopify problem?',
    answer:
      'Not necessarily. Checkout-specific failures are often caused by: a payment app that has broken or whose credentials have expired, a recently installed app that conflicts with checkout, a custom checkout script that has an error, or a specific Shopify Payment issue rather than a full platform outage. Go to your Shopify admin > Settings > Payments and verify all payment methods are active. Check your installed apps for any that affect checkout and temporarily disable recently added ones. If you have added custom code to your checkout via the Checkout Editor, review those changes.',
  },
  {
    question: 'Can I monitor my Shopify store uptime independently of Shopify?',
    answer:
      'Yes, and you should. Monitoring your store URL independently of Shopify\'s own status page tells you what your actual customers experience — not what Shopify\'s infrastructure reports. A Shopify platform issue might be resolved at the infrastructure level while your store is still showing errors due to a CDN caching problem, a custom domain DNS issue, or an app that has not recovered correctly. External monitoring checks your actual storefront URL every 60 seconds and alerts you when customers cannot reach it, regardless of what Shopify\'s status page shows.',
  },
]

export default function ShopifyDownPage(): React.ReactElement {
  return (
    <article className="blog-article">
      <ScrollReveal />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_DATA.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',
          description: 'How to check if Shopify is down, tell a platform outage from a store problem, and protect your store with uptime monitoring.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-06',
          dateModified: '2026-04-06',
          url: 'https://uptrue.io/blog/shopify-down',
        }}
      />

      <header className="blog-article-header reveal-title">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Ecommerce</span>
          <span>6 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">Is Shopify Down? How to Check Shopify Status and Protect Your Store</h1>
        <p className="blog-article-subtitle">
          Your Shopify store is not loading. Before you panic, here is how to find out in 60 seconds whether it is a Shopify platform issue or something specific to your store — and what to do in either case.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Step one: check the official Shopify status page</h2>

        <p>
          The first thing to do when your Shopify store is not working is visit{' '}
          <a href="https://status.shopify.com" target="_blank" rel="noopener noreferrer">status.shopify.com</a>.
          This is Shopify&apos;s official status page, updated in near-real-time when Shopify engineers detect or respond to an incident.
        </p>

        <p>
          The page shows the operational status of all major Shopify services:
        </p>

        <ul>
          <li><strong>Storefront</strong> — the public-facing pages customers browse</li>
          <li><strong>Checkout</strong> — the payment and order completion flow</li>
          <li><strong>Shopify admin</strong> — your merchant dashboard</li>
          <li><strong>Shopify API</strong> — affects apps and integrations</li>
          <li><strong>Shopify Payments</strong> — Shopify&apos;s built-in payment processor</li>
          <li><strong>Point of Sale</strong> — in-person retail systems</li>
        </ul>

        <p>
          If status.shopify.com shows a yellow &quot;Degraded Performance&quot; or red &quot;Major Outage&quot; for any service affecting your store, you have your answer: Shopify has a platform-level problem, and you are one of many thousands of merchants affected. There is no fix on your end — you wait for Shopify to resolve it.
        </p>

        <p>
          Subscribe to status updates on that page. You will receive an email when Shopify opens an incident, when they provide updates, and when the incident is resolved. This is far better than repeatedly refreshing the status page yourself.
        </p>

        <h2>If Shopify shows all green — the problem is your store</h2>

        <p>
          If status.shopify.com shows all services operational but your store is not working, the problem is specific to your store — not the Shopify platform. This is actually good news: it means you can fix it.
        </p>

        <h3>Quick confirmation test</h3>

        <p>
          Open an incognito browser window and visit several other Shopify stores. Try a few .myshopify.com domains (every Shopify store has one, even if they also have a custom domain). If those load fine, the Shopify infrastructure is healthy and the problem is isolated to your store.
        </p>

        <p>
          Also try visiting your store&apos;s .myshopify.com subdomain directly (e.g., <code>yourstore.myshopify.com</code>) rather than your custom domain. If your .myshopify.com URL works but your custom domain does not, the problem is with your custom domain&apos;s DNS configuration, not your Shopify store.
        </p>

      </div>

      <div className="reveal">
        <Faq items={STORE_CAUSES} headline="Common causes of store-specific Shopify problems" />
      </div>

      <div className="blog-article-body">
        <h2>What to do during an actual Shopify outage</h2>

        <p>
          When Shopify is experiencing a genuine platform outage, you cannot fix it yourself. But you can minimise the business impact:
        </p>

        <h3>Communicate with your customers</h3>

        <p>
          Post a notice on your social media channels explaining that your store is experiencing technical difficulties due to a platform issue and that you are monitoring the situation. Customers who understand the problem is out of your control are far more likely to return and try again than those who just see a broken store with no explanation.
        </p>

        <p>
          If you have a public status page for your store (a page that shows your store&apos;s operational status), update it. If you do not have one, consider setting one up — it is one of the most effective trust signals for ecommerce stores and essential during incidents. Our <Link href="/blog/public-status-page-guide">guide to creating a public status page</Link> covers how to set one up for free.
        </p>

        <h3>Monitor Shopify&apos;s incident updates</h3>

        <p>
          Status.shopify.com provides regular updates during incidents. Major outages typically have updates every 30 to 60 minutes. Follow these updates so you know when the issue is resolved and can verify your store is back to normal.
        </p>

        <h3>Document the outage duration for business records</h3>

        <p>
          Record the start and end time of the outage, the services affected, and the estimated revenue impact. This is important for insurance purposes, customer refund requests, and understanding the true cost of depending on a single platform. External uptime monitoring tools provide this data automatically with timestamped incident logs.
        </p>

        <h3>Prepare alternative checkout options</h3>

        <p>
          If you regularly experience checkout failures during Shopify outages, consider setting up an alternative checkout path — for example, a PayPal direct checkout link or a manual order process via email for high-value customers. These should be prepared in advance, not scrambled together during an outage.
        </p>

        <h2>How uptime monitoring helps Shopify merchants</h2>

        <p>
          You might assume that monitoring is unnecessary for a hosted platform like Shopify — after all, Shopify monitors their own infrastructure. But there is an important gap between what Shopify monitors and what actually matters to your business.
        </p>

        <p>
          Shopify monitors their servers. They do not monitor your specific store URL, your custom domain, your app integrations, or whether your checkout completes successfully. When your store breaks due to a DNS misconfiguration, a broken app, or a custom domain SSL issue, Shopify&apos;s status page shows all green because the infrastructure is fine — your store is the problem.
        </p>

        <p>
          External uptime monitoring checks your actual store URL every 60 seconds. It does not care whether the problem is Shopify&apos;s infrastructure or your own store configuration. If customers cannot reach your store, you get an alert. Period.
        </p>

        <h3>Set up monitoring for your Shopify store</h3>

        <p>
          In <Link href="https://uptrue.io/signup">Upnotify</Link>, set up the following monitors for your Shopify store:
        </p>

        <ol>
          <li><strong>Homepage monitor</strong> — HTTP check on your custom domain, 1-minute interval, expect 200</li>
          <li><strong>Shop/collections page</strong> — Confirms product browsing is working</li>
          <li><strong>Checkout URL</strong> — <code>/checkout</code> should return 200 or a redirect to the cart, never an error</li>
          <li><strong>SSL certificate monitor</strong> — Alerts 30 days before expiry on your custom domain</li>
          <li><strong>Keyword monitor</strong> — Check that your homepage contains your store name or a key product phrase — catches cases where a broken app renders an empty page that still returns 200</li>
        </ol>

        <div className="blog-cta-section reveal">
          <h3>Know when your Shopify store is down before your customers do</h3>
          <p>
            Free uptime monitoring for your store URL, checkout, and SSL certificate. Get alerted in 60 seconds when something breaks. No credit card required.
          </p>
          <Link href="https://uptrue.io/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </Link>
        </div>

        <h2>Shopify vs self-hosted ecommerce: the availability trade-off</h2>

        <p>
          One of the main reasons merchants choose Shopify over self-hosted alternatives like WooCommerce is the promise of managed reliability. Shopify&apos;s infrastructure is robust, with multiple redundancy layers and a dedicated reliability engineering team. Most months, Shopify&apos;s uptime for core services exceeds 99.9%.
        </p>

        <p>
          But 99.9% uptime still means roughly 8.7 hours of downtime per year. For a store generating £10,000 per month, that is potentially £1,200 or more in lost sales — and that figure does not account for customers who tried to buy during the outage and never returned.
        </p>

        <p>
          The additional sources of downtime that are not Shopify&apos;s fault — DNS failures, app conflicts, theme errors — mean your actual availability is lower than Shopify&apos;s platform availability. Monitoring your store independently gives you the real number: how available is your store to actual customers, accounting for all failure modes.
        </p>

      </div>

      <div className="reveal">
        <Faq items={FAQ_DATA} headline="Frequently asked questions" />
      </div>

      <footer className="blog-article-footer reveal">
        <div className="blog-author">
          <div className="blog-author-info">
            <span className="blog-author-name">Upnotify Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Is Not Enough</Link></li>
            <li><Link href="/blog/public-status-page-guide">How to Create a Public Status Page for Your Website</Link></li>
            <li><Link href="/blog/website-response-time">What Is a Good Website Response Time?</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
