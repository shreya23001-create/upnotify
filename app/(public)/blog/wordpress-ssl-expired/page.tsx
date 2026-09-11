import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress SSL Certificate Expired? Here\'s How to Never Let It Happen Again',
  description:
    'Let\'s Encrypt auto-renew fails silently more often than you think. DNS changes, server misconfigurations, and hosting migrations all break automatic renewal. Learn what happens when your SSL expires, how to fix it, and how Upnotify warns you 30, 14, and 7 days before expiry.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-ssl-expired' },
  openGraph: {
    title: 'WordPress SSL Certificate Expired? Here\'s How to Never Let It Happen Again',
    description:
      'Why Let\'s Encrypt auto-renew fails silently, what visitors see when SSL expires, and how SSL monitoring warns you weeks before it happens.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-ssl-expired',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress SSL Certificate Expired? Here\'s How to Never Let It Happen Again',
    description:
      'Why Let\'s Encrypt auto-renew fails silently, what visitors see when SSL expires, and how SSL monitoring warns you weeks before it happens.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why did my Let\'s Encrypt certificate expire if auto-renew is enabled?',
    answer:
      'Let\'s Encrypt certificates are valid for 90 days and auto-renew typically runs at day 60. But auto-renewal can fail silently for several reasons: DNS records were changed and the HTTP-01 or DNS-01 challenge can no longer verify domain ownership, the server\'s cron job or systemd timer that triggers certbot was disabled or broken, file permissions on the certificate directory changed, the web server configuration was modified and the .well-known/acme-challenge path is no longer accessible, or the hosting provider migrated your site to a new server without carrying over the renewal configuration. Certbot logs these failures to /var/log/letsencrypt/letsencrypt.log but almost nobody checks that log proactively.',
  },
  {
    question: 'What do visitors see when an SSL certificate expires?',
    answer:
      'Every modern browser displays a full-page security warning. Chrome shows "Your connection is not private" with error code NET::ERR_CERT_DATE_INVALID. Firefox shows "Warning: Potential Security Risk Ahead." Safari shows "This Connection Is Not Private." The visitor must actively click through multiple warnings to reach your site — and most will not. They leave immediately. If you run an ecommerce store, no transactions can be completed because payment processors require a valid SSL certificate.',
  },
  {
    question: 'Does an expired SSL certificate affect SEO?',
    answer:
      'Yes. Google has used HTTPS as a ranking signal since 2014. When your SSL expires and your site serves security warnings, Google cannot crawl your pages properly. If the expiry lasts long enough for Google to recrawl, your pages may be deindexed or demoted. Recovering rankings after an SSL outage can take days to weeks depending on how long the certificate was expired and how frequently Google crawls your site.',
  },
  {
    question: 'Can Upnotify monitor my SSL certificate expiry date?',
    answer:
      'Yes. Upnotify\'s SSL monitor checks your certificate on every scan and tracks the expiry date. It sends alerts at 30 days, 14 days, and 7 days before expiry — giving you multiple warnings before anything breaks. It also detects certificate chain issues, mismatched domains, and revoked certificates. You can also use the free SSL Checker tool at upnotify-monitoring.vercel.app/tools/ssl-checker to check any domain instantly without signing up.',
  },
]

export default function WordPressSSLExpiredPage(): React.ReactElement {
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
          headline: 'WordPress SSL Certificate Expired? Here\'s How to Never Let It Happen Again',
          description: 'Why Let\'s Encrypt auto-renew fails silently, what visitors see when SSL expires, and how SSL monitoring warns you weeks before it happens.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-ssl-expired',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>3 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress SSL Certificate Expired? Here&apos;s How to Never Let It Happen Again</h1>
        <p className="blog-article-subtitle">
          Your SSL certificate was supposed to renew automatically. It did not. Now every visitor sees a full-page browser warning telling them your site is not safe. And you had no idea until a customer told you.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The warning your visitors see before they leave</h2>

        <p>
          You open your WordPress site on your phone. Instead of your homepage, you see a full-screen warning from Chrome:
        </p>

        <p>
          <strong>&quot;Your connection is not private. Attackers might be trying to steal your information from yourdomain.com.&quot;</strong>
        </p>

        <p>
          Below it, the error code: <code>NET::ERR_CERT_DATE_INVALID</code>. There is an &quot;Advanced&quot; link that technically lets visitors proceed, but it requires clicking through two more warnings. Almost nobody does. They close the tab and go to your competitor instead.
        </p>

        <p>
          Firefox is even more dramatic. It shows &quot;Warning: Potential Security Risk Ahead&quot; with a large yellow warning icon. Safari tells visitors &quot;This Connection Is Not Private.&quot; Every modern browser treats an expired SSL certificate as a serious security issue — because it is.
        </p>

        <p>
          If you run a WooCommerce store, the damage goes further. Payment gateways like Stripe and PayPal refuse to process transactions on a site without a valid SSL certificate. Your checkout is completely broken. Not slow, not glitchy — completely non-functional. Every minute your SSL is expired, you are losing orders.
        </p>

        <p>
          And here is what makes this particular outage so frustrating: you set up auto-renewal. You were told it would handle itself. You trusted the automation. The automation failed silently, and nobody told you.
        </p>

        <h2>Why Let&apos;s Encrypt auto-renew fails silently</h2>

        <p>
          <a href="https://letsencrypt.org/" target="_blank" rel="noopener noreferrer">Let&apos;s Encrypt</a> is the certificate authority behind the majority of WordPress SSL certificates. It issues free certificates that are valid for 90 days and are designed to renew automatically around day 60. The renewal process works through a tool called Certbot (or a similar ACME client) that runs on your server.
        </p>

        <p>
          When everything is configured correctly, renewal is invisible. Certbot runs, verifies you still own the domain, downloads the new certificate, and restarts the web server. You never notice.
        </p>

        <p>
          The problem is that this process depends on multiple things going right simultaneously. When any one of them breaks, the renewal fails — and Certbot does not send you a push notification. It logs the failure to a file on your server that you probably never check.
        </p>

        <h3>1. DNS records changed after initial setup</h3>

        <p>
          Let&apos;s Encrypt verifies domain ownership through a challenge. The most common is HTTP-01, which places a temporary file on your server and then checks that it can access it via your domain. If you changed your DNS provider, moved to Cloudflare, pointed your domain to a new server, or changed your A record for any reason, the challenge can fail because the request goes to the wrong server.
        </p>

        <p>
          The DNS-01 challenge has its own version of this problem. If you switched DNS providers and the API credentials Certbot uses to create the TXT record are now wrong, the challenge fails silently.
        </p>

        <h3>2. Server migration broke the renewal cron job</h3>

        <p>
          You migrated your WordPress site to a new hosting provider. Your theme, plugins, database, and files all transferred correctly. But the Certbot installation, its cron job, and the renewal configuration did not come with them. Your old server was handling the renewal. Your new server has no idea it needs to.
        </p>

        <p>
          This is one of the most common causes of unexpected SSL expiry. The site works perfectly for 90 days — however long the existing certificate has left — and then the certificate expires because nothing on the new server is configured to renew it.
        </p>

        <h3>3. File permissions changed on the certificate directory</h3>

        <p>
          Certbot needs write access to the directory where it stores certificates — typically <code>/etc/letsencrypt/</code>. A security hardening script, a hosting provider update, or a manual permission change can remove Certbot&apos;s ability to write to this directory. Renewal fails with a permission denied error that sits in the log file unread.
        </p>

        <h3>4. Web server configuration blocks the ACME challenge</h3>

        <p>
          The HTTP-01 challenge requires that <code>/.well-known/acme-challenge/</code> is accessible via HTTP on port 80. A security plugin, an .htaccess rule, a firewall rule, or a redirect-everything-to-HTTPS configuration can block this path. Your site works perfectly on HTTPS, but the renewal challenge cannot complete because port 80 is blocked or redirected before the challenge file can be served.
        </p>

        <p>
          This is particularly common after installing security plugins that add blanket redirect rules to .htaccess, or after enabling Cloudflare&apos;s &quot;Always Use HTTPS&quot; setting which redirects the HTTP challenge request to HTTPS before Certbot can verify it.
        </p>

        <h3>5. Hosting provider managed SSL broke without notice</h3>

        <p>
          Many managed WordPress hosts handle SSL automatically through their own systems. You never installed Certbot — the host takes care of it. But hosting providers have their own infrastructure problems. Their SSL provisioning system can break, their automation can have bugs, or their renewal process can fail during scheduled maintenance.
        </p>

        <p>
          You assumed the host was handling it. The host assumed their automation was working. Nobody checked. The certificate expired.
        </p>

        <h2>What an expired SSL does to your SEO</h2>

        <p>
          Google has used HTTPS as a ranking signal since 2014. When your SSL expires, the impact on search visibility depends on how long it stays expired and how frequently Google crawls your site.
        </p>

        <p>
          If Google&apos;s crawler hits your site during the SSL outage, it cannot establish a secure connection. The crawl fails. If the outage lasts long enough for Google to retry and fail again, your pages may be temporarily deindexed. Even after you renew the certificate, it can take days for Google to recrawl and restore your rankings.
        </p>

        <p>
          For high-traffic sites that Google crawls frequently, even a few hours of SSL expiry can cause a noticeable ranking drop. For smaller sites that Google crawls less often, the impact may be delayed but it still arrives. The longer the expiry, the longer the recovery.
        </p>

        <p>
          Beyond Google, browsers like Chrome will mark your site as &quot;Not Secure&quot; in the address bar even after you renew the certificate — at least until the visitor clears their browser cache. The trust damage lingers.
        </p>

        <h2>How to check if your SSL certificate is about to expire</h2>

        <p>
          Before setting up monitoring, check your current certificate status. There are two ways to do this.
        </p>

        <h3>Check manually via your browser</h3>

        <p>
          Click the padlock icon in your browser&apos;s address bar. In Chrome, click &quot;Connection is secure&quot; then &quot;Certificate is valid.&quot; You will see the expiry date under &quot;Valid to.&quot; If the date is within 30 days, you should investigate whether auto-renewal is working.
        </p>

        <h3>Check instantly with Upnotify&apos;s free SSL Checker</h3>

        <p>
          Go to <Link href="/tools/ssl-checker">upnotify-monitoring.vercel.app/tools/ssl-checker</Link> and enter your domain. The tool shows your certificate issuer, expiry date, certificate chain status, and any configuration issues — all in a single scan. No signup required.
        </p>

        <h2>How to fix an expired SSL certificate on WordPress</h2>

        <h3>Option 1: Force renewal via Certbot</h3>

        <p>
          If you have SSH access to your server, run:
        </p>

        <p>
          <code>sudo certbot renew --force-renewal</code>
        </p>

        <p>
          This forces Certbot to request a new certificate immediately, regardless of the expiry date. If the renewal fails, Certbot will print the specific error — usually a challenge failure, a DNS issue, or a permission problem. Fix the reported error and run the command again.
        </p>

        <p>
          After successful renewal, restart your web server:
        </p>

        <p>
          <code>sudo systemctl restart nginx</code> or <code>sudo systemctl restart apache2</code>
        </p>

        <h3>Option 2: Reinstall SSL through your hosting panel</h3>

        <p>
          If you are on shared hosting without SSH access, log into your hosting control panel — cPanel, Plesk, or your host&apos;s custom panel. Look for &quot;SSL/TLS&quot; or &quot;Let&apos;s Encrypt&quot; in the security section. Most panels have a button to issue or reissue a certificate for your domain. Click it, wait for the verification to complete, and your certificate should be active within minutes.
        </p>

        <p>
          If the panel shows an error during issuance, it is usually because the domain&apos;s DNS is not pointing to the server. Verify your A record points to your hosting server&apos;s IP address.
        </p>

        <h3>Option 3: Cloudflare Universal SSL</h3>

        <p>
          If your site is behind Cloudflare, you can use their Universal SSL certificate. In the Cloudflare dashboard, go to SSL/TLS and ensure the mode is set to &quot;Full (strict).&quot; Cloudflare issues and renews the edge certificate automatically. You still need a valid origin certificate on your server — Cloudflare offers free origin certificates valid for up to 15 years.
        </p>

        <p>
          Be careful with the &quot;Flexible&quot; mode. It encrypts the connection between the visitor and Cloudflare but sends unencrypted traffic from Cloudflare to your server. This can also cause redirect loops with WordPress — see our guide on{' '}
          <Link href="/blog/wordpress-too-many-redirects">WordPress redirect loops</Link> for details.
        </p>

        <h2>How to detect SSL expiry before it happens with Upnotify</h2>

        <p>
          Fixing an expired certificate is straightforward. The problem is knowing it expired in the first place. Most site owners find out from a customer complaint, a drop in Google Search Console, or stumbling onto their own site on a phone. By then, the damage is done.
        </p>

        <p>
          <Link href="/signup">Upnotify&apos;s SSL monitoring</Link> checks your certificate on every scan and warns you well before it expires — so you fix the renewal problem before your visitors ever see a warning.
        </p>

        <h3>Step 1: Add an SSL monitor for your domain</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>SSL Certificate</strong> as the monitor type</li>
          <li>Enter your domain name</li>
          <li>Set the check interval to <strong>every hour</strong></li>
          <li>Configure alert thresholds: <strong>30 days</strong>, <strong>14 days</strong>, and <strong>7 days</strong> before expiry</li>
          <li>Choose your alert channels — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          Upnotify checks the certificate on every scan and tracks the days remaining until expiry. When the count hits your thresholds, you get an alert. Three separate warnings — at 30, 14, and 7 days — give you plenty of time to investigate and fix the renewal issue.
        </p>

        <h3>Step 2: Add an HTTP monitor as a safety net</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL with <code>https://</code></li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set check interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If the SSL certificate expires despite the warnings and your site starts returning errors, the HTTP monitor catches it immediately. Browsers and HTTP clients refuse to complete HTTPS connections with expired certificates, so the monitor detects the failure within 60 seconds.
        </p>

        <h3>Step 3: Monitor certificate chain and configuration issues</h3>

        <p>
          Upnotify&apos;s SSL monitor does not just check the expiry date. It also validates:
        </p>

        <ul>
          <li><strong>Certificate chain completeness</strong> — missing intermediate certificates cause warnings in some browsers but not others, making the problem intermittent and hard to diagnose</li>
          <li><strong>Domain name mismatch</strong> — the certificate was issued for a different domain or is missing a www variant</li>
          <li><strong>Certificate revocation</strong> — the certificate was revoked by the issuing authority</li>
          <li><strong>Protocol support</strong> — the server is using outdated TLS versions</li>
        </ul>

        <h3>Step 4: Set up alerts that reach you immediately</h3>

        <p>
          SSL expiry warnings are only useful if you see them in time. Configure alerts to go where you will act on them:
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification in your ops channel</li>
          <li><strong>Microsoft Teams</strong> — same idea, different platform</li>
          <li><strong>Email</strong> — fine for the 30-day warning, too slow for the 7-day warning</li>
          <li><strong>Webhook</strong> — integrate with PagerDuty, Opsgenie, or your own incident management system</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your SSL certificate right now</h3>
          <p>
            Instant scan showing your certificate issuer, expiry date, chain status, and configuration issues. Free, no signup required.
          </p>
          <Link href="/tools/ssl-checker" className="btn btn-primary btn-lg">
            Free SSL Checker
          </Link>
        </div>

        <h2>Preventing SSL expiry permanently</h2>

        <p>
          Monitoring catches the problem before it affects visitors. But these steps reduce the chances of it happening in the first place.
        </p>

        <h3>Verify your renewal cron job is running</h3>
        <p>
          On most Linux servers, Certbot installs a cron job or systemd timer to handle renewal. Check that it exists and is active. Run <code>sudo systemctl status certbot.timer</code> for systemd-based systems or check <code>/etc/cron.d/certbot</code> for cron-based setups. If neither exists, auto-renewal is not configured and your certificate will expire in 90 days.
        </p>

        <h3>Test renewal without actually renewing</h3>
        <p>
          Run <code>sudo certbot renew --dry-run</code> to simulate the renewal process. This tests the entire chain — domain verification, certificate generation, web server restart — without actually changing your certificate. If the dry run fails, the real renewal will fail too. Fix the issue now while you have time.
        </p>

        <h3>Ensure port 80 is accessible for HTTP-01 challenges</h3>
        <p>
          Even though your site runs on HTTPS, the Let&apos;s Encrypt HTTP-01 challenge needs to access <code>/.well-known/acme-challenge/</code> on port 80. Make sure your firewall, .htaccess rules, and security plugins do not block or redirect this path. Check the{' '}
          <a href="https://letsencrypt.org/docs/challenge-types/" target="_blank" rel="noopener noreferrer">Let&apos;s Encrypt challenge types documentation</a>{' '}
          for details on how each verification method works.
        </p>

        <h3>After every migration, verify SSL renewal works</h3>
        <p>
          Every time you move your WordPress site to a new server, add &quot;verify SSL renewal&quot; to your migration checklist. Run the dry-run test on the new server. Set up monitoring before you consider the migration complete. The certificate from the old server might have weeks left, giving you a false sense of security.
        </p>

        <h3>Consider longer-validity certificates for critical sites</h3>
        <p>
          Let&apos;s Encrypt certificates are free but expire every 90 days. For business-critical sites, a paid certificate from a commercial CA valid for one year reduces the frequency of renewals and the number of opportunities for renewal to fail. The cost is minimal compared to the revenue lost during an SSL outage.
        </p>

        <h2>Stop trusting auto-renew blindly</h2>

        <p>
          Auto-renewal is a sensible default. But it is not a guarantee. DNS changes, server migrations, permission changes, hosting updates, and firewall rules can all break the renewal process without any visible sign that anything went wrong.
        </p>

        <p>
          You will not see the failure in your WordPress dashboard. You will not see it in your hosting panel. You will see it when a customer tells you they got a security warning — or when your Google rankings drop because the crawler could not access your site.
        </p>

        <p>
          Upnotify monitors your SSL certificate on every check. It warns you 30, 14, and 7 days before expiry. It validates your certificate chain, checks for configuration issues, and alerts you on Slack, Teams, email, or webhook. If auto-renewal fails, you know about it weeks before your visitors do.
        </p>

        <div className="blog-cta-section">
          <h3>Never let your SSL certificate expire again</h3>
          <p>
            Free plan available. SSL monitoring with 30/14/7 day expiry warnings. Certificate chain validation. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/tools/ssl-checker" className="btn btn-primary btn-lg">
              Check Your SSL Free
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
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
            <li><Link href="/blog/wordpress-too-many-redirects">WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
