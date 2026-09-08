import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think',
  description:
    'DNS records control where your website, email, and services point. Learn what DNS monitoring is, what can go wrong, and how to protect your domain from silent failures.',
  alternates: { canonical: 'https://uptrue.io/blog/dns-monitoring-explained' },
  openGraph: {
    title: 'DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think',
    description:
      'Learn what DNS monitoring is, what can go wrong with your domain records, and how monitoring catches changes before they become outages.',
    url: 'https://uptrue.io/blog/dns-monitoring-explained',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think',
    description:
      'Learn what DNS monitoring is, what can go wrong with your domain records, and how monitoring catches changes before they become outages.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is DNS monitoring?',
    answer:
      'DNS monitoring automatically checks your domain name records at regular intervals and alerts you when any record changes. It tracks A records, AAAA records, CNAME records, MX records, TXT records, and NS records. When a record changes unexpectedly — whether from an accidental edit, a misconfiguration, or a malicious attack — you are alerted immediately.',
  },
  {
    question: 'Why do DNS records matter for my website?',
    answer:
      'DNS records are the address book of the internet. Your A record tells browsers which server to connect to for your website. Your MX records tell email servers where to deliver your mail. If any of these records are wrong, your website is unreachable, your email stops working, or your domain points to the wrong server entirely. Everything depends on DNS being correct.',
  },
  {
    question: 'What happens if my DNS records change without me knowing?',
    answer:
      'If your A record changes, your domain points to a different server — possibly one that shows nothing, shows an error, or shows content controlled by someone else. If your MX records change, your email gets delivered to the wrong server. If your NS records change, someone else controls your entire domain. All of these can happen silently.',
  },
  {
    question: 'Can DNS records be changed by hackers?',
    answer:
      'Yes. DNS hijacking is a real attack vector. If an attacker gains access to your domain registrar account, they can change your DNS records to point your domain to their own server. They can intercept your email by changing MX records. They can even issue SSL certificates for your domain. This is why monitoring DNS records and securing your registrar account with two-factor authentication are both critical.',
  },
  {
    question: 'How often should DNS records be monitored?',
    answer:
      'DNS records should be checked at least every hour. Changes to DNS records propagate across the internet over 24 to 48 hours, so catching a change early gives you time to revert it before the incorrect records spread to all DNS resolvers worldwide. Upnotify checks DNS records on a regular schedule and alerts on any change.',
  },
  {
    question: 'What is DNS propagation and why does it make DNS problems worse?',
    answer:
      'When you change a DNS record, the change does not take effect instantly worldwide. DNS resolvers around the world cache records based on the TTL (Time to Live) setting. It can take 24 to 48 hours for the change to propagate to every resolver. This means a bad DNS change causes problems that get progressively worse over hours and affect different users at different times — making the issue very hard to diagnose without monitoring.',
  },
  {
    question: 'What DNS records should I monitor?',
    answer:
      'At minimum, monitor your A record (where your website points), MX records (where your email is delivered), NS records (who controls your DNS), and any CNAME records for subdomains. If you use SPF, DKIM, or DMARC for email authentication, monitor those TXT records as well — a broken SPF record means your emails start landing in spam.',
  },
  {
    question: 'Is DNS monitoring included in standard uptime monitoring?',
    answer:
      'Not always. Many uptime monitoring tools only check HTTP status codes and do not monitor DNS records separately. Upnotify includes DNS monitoring as a dedicated monitor type, checking your records independently from HTTP monitoring. This catches DNS-level failures that HTTP monitoring alone would attribute to a generic "site down" event.',
  },
]

export default function DnsMonitoringExplainedPage(): React.ReactElement {
  return (
    <article className="blog-article">
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
          headline: 'DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think',
          description: 'DNS records control where your website and email point. Learn what DNS monitoring catches and why it matters.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-30',
          dateModified: '2026-03-30',
          url: 'https://uptrue.io/blog/dns-monitoring-explained',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Guide</span>
          <span>30 March 2026</span>
          <span>12 min read</span>
        </div>
        <h1 className="blog-article-title">DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think</h1>
        <p className="blog-article-subtitle">
          Your DNS records are the foundation everything else sits on. When they break, your website vanishes, your email stops, and you have no idea why.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The invisible layer that controls everything</h2>

        <p>
          When someone types your domain name into a browser, the first thing that happens is a DNS lookup. Before any web server responds, before any page renders, before any content loads — the browser asks the Domain Name System: &quot;Where is this website?&quot;
        </p>

        <p>
          The DNS system returns an IP address. The browser connects to that IP address. Your website appears.
        </p>

        <p>
          If the DNS system returns the wrong IP address, the browser connects to the wrong server. Your website does not appear. If the DNS system returns nothing, the browser has nowhere to go. Your domain is dead.
        </p>

        <p>
          This is the invisible layer that almost nobody monitors — and when it breaks, it takes everything else with it.
        </p>

        <h2>What DNS records are and what each one does</h2>

        <p>
          DNS records are entries in your domain&apos;s configuration that tell the internet where to send traffic. Each record type serves a different purpose. Here are the ones that matter for your website and business.
        </p>

        <h3>A record — where your website lives</h3>

        <p>
          The A record maps your domain name to an IPv4 address. When someone visits <code>yourdomain.com</code>, the A record tells their browser which server to connect to. If this record is wrong, your website is unreachable.
        </p>

        <p>
          Example: <code>yourdomain.com → 203.0.113.50</code>
        </p>

        <p>
          The AAAA record does the same thing for IPv6 addresses. If you support IPv6, both need to be correct.
        </p>

        <h3>CNAME record — aliases and subdomains</h3>

        <p>
          A CNAME record points one domain name to another domain name. This is commonly used for subdomains like <code>www.yourdomain.com</code> pointing to <code>yourdomain.com</code>, or <code>blog.yourdomain.com</code> pointing to your blog hosting provider.
        </p>

        <p>
          If a CNAME record is deleted or changed, the subdomain stops working. If you use a CDN like{' '}
          <a href="https://www.cloudflare.com/learning/cdn/what-is-a-cdn/" target="_blank" rel="noopener noreferrer">Cloudflare</a>,{' '}
          your CNAME records often point to the CDN&apos;s edge servers. A misconfigured CNAME can bypass your CDN entirely, exposing your origin server.
        </p>

        <h3>MX record — where your email goes</h3>

        <p>
          MX (Mail Exchange) records tell email servers where to deliver mail for your domain. If your MX records are wrong, emails sent to <code>you@yourdomain.com</code> go nowhere — or worse, they go to a server controlled by someone else.
        </p>

        <p>
          This is one of the most dangerous DNS failures because it is completely silent. You do not get an error. You just stop receiving emails. Senders do not get a bounce message either — their email is &quot;delivered&quot; to whatever server the MX record points to.
        </p>

        <h3>TXT record — email authentication and verification</h3>

        <p>
          TXT records store text data for various purposes. The most important ones for your business are:
        </p>

        <ul>
          <li><strong>SPF</strong> — tells email servers which IPs are authorised to send email from your domain. A broken SPF record means your legitimate emails land in spam.</li>
          <li><strong>DKIM</strong> — a cryptographic signature that proves your emails were sent by you. If the DKIM TXT record is deleted, email authentication fails.</li>
          <li><strong>DMARC</strong> — a policy that tells receiving servers what to do with emails that fail SPF or DKIM. Without it, phishing emails from your domain are harder to detect.</li>
        </ul>

        <p>
          The{' '}
          <a href="https://support.google.com/a/answer/33786" target="_blank" rel="noopener noreferrer">Google Workspace documentation</a>{' '}
          explains SPF, DKIM, and DMARC setup in detail. A single character wrong in any of these records breaks your email deliverability.
        </p>

        <h3>NS record — who controls your DNS</h3>

        <p>
          NS (Name Server) records determine which DNS servers are authoritative for your domain. If someone changes your NS records, they control your entire domain. They can change any record, point your website anywhere, intercept your email, and even issue SSL certificates for your domain.
        </p>

        <p>
          NS record changes are the most dangerous DNS change and are a hallmark of domain hijacking attacks.
        </p>

        <h2>What can go wrong with DNS — and it goes wrong more often than you think</h2>

        <h3>Accidental changes during migration</h3>

        <p>
          The most common DNS failure is human error during a server migration, hosting change, or CDN setup. You update one record and accidentally delete another. You change the A record to the new server but forget to update the subdomain CNAMEs. You switch email providers and the old MX records linger.
        </p>

        <p>
          Because DNS propagation takes up to 48 hours, you might not notice the problem immediately. Your local DNS resolver still has the old records cached, so everything looks fine from your computer. Meanwhile, visitors in other regions are seeing errors or landing on the wrong server.
        </p>

        <h3>Domain registrar account compromise</h3>

        <p>
          If an attacker gains access to your domain registrar account — through a phished password, a brute force attack, or a social engineering call to the registrar — they can change any DNS record instantly. This is called DNS hijacking.
        </p>

        <p>
          In 2019, a campaign called{' '}
          <a href="https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/" target="_blank" rel="noopener noreferrer">Sea Turtle</a>{' '}
          targeted organisations by hijacking their DNS records, redirecting traffic to attacker-controlled servers, and intercepting credentials. The attacks were effective because DNS changes are silent — the victims did not know their records had changed until the damage was done.
        </p>

        <h3>DNS provider outage</h3>

        <p>
          Your DNS provider is a single point of failure. If their servers go down, your domain does not resolve. The most famous example was the{' '}
          <a href="https://www.theguardian.com/technology/2016/oct/26/ddos-attack-dyn-mirai-botnet" target="_blank" rel="noopener noreferrer">2016 Dyn attack</a>{' '}
          where a DDoS attack against a major DNS provider made Twitter, Netflix, Reddit, and hundreds of other sites unreachable for hours — even though their servers were running perfectly. The DNS layer was the single point of failure.
        </p>

        <h3>TTL misconfiguration</h3>

        <p>
          TTL (Time to Live) determines how long DNS resolvers cache your records. A low TTL (like 300 seconds) means changes propagate quickly but puts more load on your DNS servers. A high TTL (like 86400 seconds) means records are cached for a day — great for performance, terrible if you need to make an emergency change and it takes 24 hours to take effect.
        </p>

        <p>
          A common mistake is setting a low TTL during a migration and forgetting to increase it afterward. Your DNS servers handle unnecessary traffic indefinitely.
        </p>

        <h3>Expired domain</h3>

        <p>
          If your domain registration expires and you miss the renewal, your registrar typically holds it for a grace period and then releases it. During the grace period, your DNS records may stop resolving. After release, anyone can register your domain. Domain squatters actively monitor expiring domains and snap them up within seconds.
        </p>

        <h2>How DNS monitoring works</h2>

        <p>
          DNS monitoring is straightforward. A monitoring service performs DNS lookups for your domain at regular intervals and records the results. It compares each result against the previous one. If any record changes, you get an alert.
        </p>

        <p>
          With <Link href="/signup">Upnotify</Link>, you set up a DNS monitor by entering your domain and selecting which record types to track. The monitor checks your records on a regular schedule and alerts you via your chosen channel — email, Slack, or Teams — when any record changes.
        </p>

        <p>
          The alert tells you exactly what changed: which record type, what the old value was, and what the new value is. You can then verify whether the change was intentional or investigate if it was not.
        </p>

        <h2>What to monitor and how to set it up</h2>

        <h3>Step 1: Document your current records</h3>

        <p>
          Before you set up monitoring, know what your records should be. Use a tool like{' '}
          <a href="https://mxtoolbox.com/" target="_blank" rel="noopener noreferrer">MXToolbox</a>{' '}
          or <code>dig</code> on the command line to list your current A, AAAA, CNAME, MX, TXT, and NS records. Save these as your baseline. Any change from this baseline is worth investigating.
        </p>

        <h3>Step 2: Set up DNS monitoring</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>DNS</strong> as the monitor type</li>
          <li>Enter your domain name</li>
          <li>Select the record types to monitor — at minimum: A, MX, NS, and any CNAME records for subdomains you use</li>
          <li>Configure your alert channel</li>
        </ol>

        <h3>Step 3: Combine with HTTP monitoring</h3>

        <p>
          DNS monitoring tells you when records change. HTTP monitoring tells you when your site is actually down. Together, they give you complete coverage. If your site goes down and your DNS records have not changed, you know the problem is at the server level. If your site goes down and a DNS record just changed, you know exactly where to look.
        </p>

        <div className="blog-cta-section">
          <h3>Check your DNS records and site health right now</h3>
          <p>
            Instant health score covering DNS configuration, SSL, security headers, uptime, and performance. Free, no account required.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Protecting your DNS beyond monitoring</h2>

        <h3>Lock your domain at the registrar</h3>
        <p>
          Enable registrar lock (also called transfer lock or client transfer prohibited) on your domain. This prevents anyone from transferring your domain to another registrar without explicitly unlocking it first. Most registrars offer this as a free feature.
        </p>

        <h3>Enable two-factor authentication on your registrar account</h3>
        <p>
          Your domain registrar account is the keys to your kingdom. If someone gets in, they can change any DNS record, transfer your domain, or point your website and email anywhere. Enable two-factor authentication and use a strong, unique password. The{' '}
          <a href="https://www.icann.org/resources/pages/registrar-lock-2015-01-22-en" target="_blank" rel="noopener noreferrer">ICANN guidance on domain security</a>{' '}
          covers best practices.
        </p>

        <h3>Use DNSSEC where supported</h3>
        <p>
          DNSSEC (DNS Security Extensions) adds cryptographic signatures to DNS records, preventing attackers from forging DNS responses. It does not prevent changes at the registrar level, but it protects against man-in-the-middle DNS attacks. Not all registrars and hosting providers support it, but if yours does, enable it.
        </p>

        <h3>Set appropriate TTLs</h3>
        <p>
          For stable records that rarely change, set the TTL to 3600 seconds (1 hour) or higher. This reduces DNS lookup traffic and improves resolution speed. Before making a planned change, lower the TTL to 300 seconds a day in advance so the change propagates quickly when you make it.
        </p>

        <h2>DNS is your foundation — monitor it</h2>

        <p>
          Every other monitoring tool — HTTP, SSL, keyword — checks things that depend on DNS being correct. If your DNS records are wrong, your site is unreachable no matter how healthy your server is. Your email stops working no matter how well your mail server is running.
        </p>

        <p>
          DNS monitoring is the one check that protects the foundation everything else sits on. Set it up once, and you will know the moment anything changes.
        </p>

        <div className="blog-cta-section">
          <h3>Start monitoring your DNS records for free</h3>
          <p>
            Free plan. DNS, HTTP, keyword, and SSL monitoring. Alerts on Slack, email, or Teams. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/score" className="btn btn-primary btn-lg">
              Check Your Site Free
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-lg">
              Start Monitoring
            </Link>
          </div>
        </div>

        </div>

      <div className="reveal">
        <Faq items={FAQ_DATA} headline="Frequently asked questions" />
      </div>

      <footer className="blog-article-footer">
        <div className="blog-author">
          <div className="blog-author-info">
            <span className="blog-author-name">Upnotify Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
            <li><Link href="/blog/website-downtime-warning-signs">10 Warning Signs Your Website Is About to Go Down</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
