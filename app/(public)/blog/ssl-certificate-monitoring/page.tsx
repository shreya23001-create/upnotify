import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
  description:
    'Auto-renew sounds foolproof, but SSL certificates still fail in production every day. Learn what goes wrong, see real examples, and discover why SSL monitoring catches what automation misses.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/ssl-certificate-monitoring' },
  openGraph: {
    title: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
    description:
      'Auto-renew sounds foolproof, but SSL certificates still fail in production every day. Learn why monitoring catches what automation misses.',
    url: 'https://upnotify-monitoring.vercel.app/blog/ssl-certificate-monitoring',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
    description:
      'Auto-renew sounds foolproof, but SSL certificates still fail in production. Learn why monitoring catches what automation misses.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why do SSL certificates expire even with auto-renew enabled?',
    answer:
      'Auto-renew can fail for many reasons: the domain validation email goes to an inbox nobody checks, the DNS records have changed and validation fails, the hosting provider\'s automation has a bug, the credit card on file has expired, or the renewal process completes but the new certificate is not deployed to the server. Auto-renew is a best-effort automation, not a guarantee.',
  },
  {
    question: 'What happens when an SSL certificate expires?',
    answer:
      'When an SSL certificate expires, web browsers display a full-page security warning to visitors — typically saying "Your connection is not private" or "This site is not secure." Most visitors will not click through this warning. For ecommerce sites, this effectively stops all transactions. Search engines may also temporarily remove the site from search results, and any APIs using HTTPS will fail with certificate errors.',
  },
  {
    question: 'How often should I check my SSL certificate?',
    answer:
      'Check your SSL certificate at least once daily. Most monitoring tools can check more frequently without any performance impact on your site. You should configure alerts at multiple thresholds — 30 days, 14 days, 7 days, and 1 day before expiry — so you have plenty of time to act. For critical sites (ecommerce, SaaS, banking), check every few hours and alert starting at 60 days before expiry.',
  },
]

export default function SslCertificateMonitoringPage(): React.ReactElement {
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
          headline: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
          description: 'Why auto-renew fails and how SSL monitoring catches what automation misses.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-08',
          dateModified: '2026-03-08',
          url: 'https://upnotify-monitoring.vercel.app/blog/ssl-certificate-monitoring',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Security</span>
          <span>8 March 2026</span>
          <span>10 min read</span>
        </div>
        <h1 className="blog-article-title">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</h1>
        <p className="blog-article-subtitle">
          You set up auto-renew and forgot about it. Here is why that is a mistake — and what to do instead.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The false security of auto-renew</h2>

        <p>
          Let us start with the uncomfortable truth: auto-renew for SSL certificates fails more
          often than you think. Not most of the time — but often enough that relying on it
          exclusively is a gamble you probably should not be making.
        </p>

        <p>
          The promise of auto-renew is simple. You set it up once, and your certificate renews
          automatically before it expires. Tools like Let&apos;s Encrypt and Certbot have made this
          almost effortless. And when it works, it is brilliant.
        </p>

        <p>
          The problem is the &quot;when it works&quot; part. Because when auto-renew fails — and it will,
          eventually — the failure mode is one of the worst in web hosting. Your site does not
          just go down. It goes down with a big scary browser warning that tells your visitors
          the site is not safe. Most of them will never come back.
        </p>

        <h2>How SSL certificates actually work (in plain English)</h2>

        <p>
          Before we get into what goes wrong, let us quickly cover what SSL certificates do.
          When someone visits your site over HTTPS, their browser and your server perform a
          handshake. Your server presents its SSL certificate, which proves two things: that the
          server is who it claims to be, and that the connection is encrypted.
        </p>

        <p>
          The certificate has an expiry date — typically 90 days for Let&apos;s Encrypt or up to 1
          year for paid certificates. After that date, browsers refuse to trust it. They show a
          full-page warning. Users see &quot;Your connection is not private.&quot; And your site is
          effectively offline, even though the server itself is running perfectly fine.
        </p>

        <p>
          This is why SSL failures are so insidious. Your server health checks pass. Your HTTP
          monitoring might even pass (depending on how it is configured). Everything looks fine
          from the inside. But from the outside, every visitor sees a security warning.
        </p>

        <h2>Seven reasons auto-renew fails in production</h2>

        <p>
          These are not theoretical scenarios. Every one of these happens regularly in production
          environments.
        </p>

        <h3>1. DNS record changes break validation</h3>
        <p>
          Most auto-renew systems use domain validation — they verify you control the domain by
          checking a DNS record or serving a specific file. If your DNS records change (maybe you
          switched to a CDN, changed hosting, or updated your nameservers), the validation
          step fails silently. The old certificate expires, and the renewal never completes.
        </p>

        <h3>2. Web server configuration changes</h3>
        <p>
          Certbot and similar tools need to serve validation files from a specific path on your
          web server. If someone updates the nginx or Apache config — adds a redirect, changes the
          document root, or blocks certain paths — the validation request gets a 404 and the
          renewal fails. It works fine for months, then an unrelated config change breaks it.
        </p>

        <h3>3. Hosting provider automation has bugs</h3>
        <p>
          Managed hosting platforms often handle SSL renewal themselves. But their automation is
          software, and software has bugs. Platform updates, infrastructure changes, or edge cases
          in your specific configuration can cause the auto-renewal to fail. You trust the
          platform, and the platform lets you down — silently.
        </p>

        <h3>4. Rate limits on certificate authorities</h3>
        <p>
          Let&apos;s Encrypt has rate limits. If you are managing many certificates (common for
          agencies or SaaS platforms), you can hit these limits. When that happens, renewals
          queue up and some might not complete before expiry.
        </p>

        <h3>5. The credit card on file expired</h3>
        <p>
          For paid SSL certificates, auto-renew charges your card annually. When that card
          expires, the charge fails. Most certificate providers send an email, but if it goes to
          a shared inbox or a former employee&apos;s email, nobody sees it. The certificate expires
          a year later, and you find out from a customer screenshot.
        </p>

        <h3>6. Certificate is renewed but not deployed</h3>
        <p>
          This is the sneakiest failure. The renewal succeeds — the new certificate is generated
          and sitting on the server. But the web server is still using the old one because it
          was not reloaded. Depending on your setup, you might need to restart nginx, reload
          Apache, or update a CDN configuration. If that step is not automated or fails, you
          have a valid certificate that is not being used.
        </p>

        <h3>7. Intermediate certificate chain breaks</h3>
        <p>
          An SSL certificate is not just one file — it is a chain. Your certificate, plus one or
          more intermediate certificates, linking up to a trusted root certificate. If the
          intermediate certificate changes (which happens when certificate authorities update
          their infrastructure) and your server still has the old chain, some browsers will show
          warnings even though your certificate is technically valid.
        </p>

        <h2>Real-world SSL failures</h2>

        <p>
          These are not hypotheticals. Major companies have been caught by SSL failures.
        </p>

        <p>
          In 2020, <strong>Microsoft Teams</strong> went down for hours because an authentication
          certificate expired. The auto-renewal process failed, and the outage affected millions
          of users globally. The root cause? A certificate that was supposed to be automatically
          managed.
        </p>

        <p>
          In 2021, <strong>Spotify</strong> experienced an outage when an expired TLS certificate
          broke their backend services. The certificate was internal, used for service-to-service
          communication — not something most monitoring tools would catch.
        </p>

        <p>
          In 2023, several <strong>UK government websites</strong> displayed security warnings after
          certificates expired. These were managed by enterprise-grade hosting providers with
          auto-renewal in place.
        </p>

        <p>
          If it happens to Microsoft, Spotify, and government agencies with dedicated
          infrastructure teams, it can happen to you.
        </p>

        <h2>What SSL monitoring actually checks</h2>

        <p>
          SSL monitoring goes beyond just checking the expiry date. Here is what a proper SSL
          monitor should verify.
        </p>

        <h3>Certificate expiry date</h3>
        <p>
          The most obvious check. How many days until your certificate expires? You want
          alerts at 30, 14, 7, and 1 day before expiry — giving you multiple chances to fix
          the issue before it affects users.
        </p>

        <h3>Certificate chain validity</h3>
        <p>
          Is the full certificate chain (your cert, intermediate certs, root cert) valid and
          correctly configured? A broken chain can cause warnings on some browsers and devices
          even if your main certificate is fine.
        </p>

        <h3>Certificate issuer</h3>
        <p>
          Who issued your certificate? If it changes unexpectedly — say, from DigiCert to an
          unknown issuer — that could indicate a misconfiguration or, in rare cases, a security
          issue.
        </p>

        <h3>TLS version and cipher strength</h3>
        <p>
          Is your server using TLS 1.2 or 1.3? Or is it still allowing older, insecure
          protocols? Modern SSL monitoring checks the actual encryption being used, not just
          whether a certificate exists.
        </p>

        <h3>Certificate matches the domain</h3>
        <p>
          The certificate must match the exact domain being served. A certificate for
          example.com does not automatically cover www.example.com or api.example.com. Monitoring
          verifies this match every time it checks.
        </p>

        <h2>How to set up SSL monitoring properly</h2>

        <h3>Step 1: List all your SSL-protected domains</h3>
        <p>
          Not just your main domain. Subdomains (api.yoursite.com, app.yoursite.com,
          staging.yoursite.com), CDN domains, and any third-party domains you manage. Each
          one needs its own SSL monitor.
        </p>

        <h3>Step 2: Set up monitoring with multiple alert thresholds</h3>
        <p>
          Configure alerts at 30 days, 14 days, 7 days, and 1 day before expiry. The 30-day
          alert is your comfortable warning. The 1-day alert is your emergency siren. Most
          issues should be resolved before the 14-day mark.
        </p>

        <h3>Step 3: Check your score now</h3>
        <p>
          Before waiting for alerts, check your current SSL status. A free health check will
          tell you if your certificates are configured correctly, when they expire, and whether
          your certificate chain is valid.
        </p>

        <div className="blog-cta-section">
          <h3>Check your SSL health for free</h3>
          <p>
            Instant SSL analysis — expiry date, chain validity, TLS version, and cipher
            strength. No account required.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your SSL Score
          </Link>
        </div>

        <h3>Step 4: Do not just monitor — alert the right people</h3>
        <p>
          Your SSL alert should go to whoever can actually fix the issue. If your hosting
          provider manages SSL, loop in their support team. If your DevOps engineer handles it,
          make sure they get the alert directly — not buried in a shared inbox.
        </p>

        <h3>Step 5: Test the renewal process</h3>
        <p>
          Every few months, manually trigger a certificate renewal (in staging, obviously) and
          verify the full chain: renewal, deployment, server reload. Treat it like a fire drill.
          The time to discover your renewal process is broken is not when the certificate is
          about to expire.
        </p>

        <h2>SSL monitoring for agencies</h2>

        <p>
          If you manage multiple client sites, SSL monitoring is even more critical. You are
          responsible for dozens or hundreds of certificates, each with its own renewal process
          and potential failure mode.
        </p>

        <p>
          The smart approach is to monitor every client&apos;s SSL certificate from day one — not as
          an afterthought, but as part of your standard client onboarding. When a client&apos;s SSL
          certificate is about to expire, you want to be the one who fixes it proactively, not
          the one who explains why their site showed a security warning for 6 hours.
        </p>

        <p>
          For more on agency-specific monitoring needs, see our{' '}
          <Link href="/blog/uptime-monitoring-agencies">agency monitoring guide</Link>.
        </p>

        <h2>The bottom line</h2>

        <p>
          Auto-renew is a great first line of defence. But it is not the last line. SSL
          monitoring is the safety net that catches the failures auto-renew misses — before they
          become scary browser warnings that drive your customers away.
        </p>

        <p>
          It takes less than a minute to set up. The peace of mind lasts as long as your site
          is online.
        </p>

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
            <li><Link href="/blog/uptime-monitoring-agencies">Uptime Monitoring for Agencies: Managing 100+ Client Sites</Link></li>
            <li><Link href="/blog/competitor-analysis-ecommerce">Website Competitor Analysis Tools for Ecommerce in 2026</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
