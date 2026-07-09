import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly',
  description:
    'Hackers can replace your WordPress homepage with their own message in seconds. Compromised admin credentials, vulnerable plugins, and theme file injection are the most common attack vectors. Learn how defacement works, how to recover, and how keyword monitoring detects the attack within minutes.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-site-hacked' },
  openGraph: {
    title: 'WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly',
    description:
      'How WordPress site defacement works, how to recover from it, and how keyword monitoring detects the attack before your customers see a hacker\'s message instead of your homepage.',
    url: 'https://uptrue.io/blog/wordpress-site-hacked',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly',
    description:
      'How WordPress site defacement works, how to recover from it, and how keyword monitoring detects the attack before your customers see a hacker\'s message instead of your homepage.',
  },
}

const FAQ_DATA = [
  {
    question: 'How do hackers change my WordPress homepage?',
    answer:
      'The most common method is compromising an administrator account through brute force attacks, credential stuffing from leaked password databases, or phishing. Once inside wp-admin, the attacker can change the homepage content directly through the page editor. The second most common method is exploiting a vulnerability in a plugin or theme that allows arbitrary file upload or remote code execution. The attacker uploads a web shell or modifies theme files like index.php or header.php directly on the server, bypassing WordPress entirely. The third method is SQL injection through a vulnerable plugin, which lets the attacker modify page content directly in the database.',
  },
  {
    question: 'How can I tell if my WordPress site has been hacked?',
    answer:
      'Visible signs include your homepage content being replaced with a hacker message, unexpected redirects to other websites, new admin users you did not create, unknown files in your WordPress directory, and Google showing "This site may be hacked" in search results. Less visible signs include your site sending spam emails, new pages you did not create appearing in Google search results, your server using unusually high CPU, and your hosting provider suspending your account. The most reliable method is external keyword monitoring that checks whether your brand name and expected content still appear on your homepage.',
  },
  {
    question: 'What should I do immediately if my WordPress site is defaced?',
    answer:
      'First, take a screenshot for evidence. Then take the site offline by enabling maintenance mode or asking your host to temporarily suspend it — this prevents visitors from seeing the defacement and prevents the attacker from doing more damage. Change all passwords immediately: WordPress admin passwords, database password, FTP and SFTP passwords, hosting control panel password, and any API keys. Do not try to clean the hack while the site is live. Restore from a known clean backup if you have one. If you do not have a clean backup, you will need to manually clean every modified file.',
  },
  {
    question: 'Can monitoring detect a WordPress site defacement?',
    answer:
      'Standard uptime monitoring cannot detect defacement because the hacked homepage still returns a 200 status code. The page loads — it just shows the wrong content. Keyword monitoring is the solution. If you monitor for your brand name, your company name, or a specific heading on your homepage, and the hacker replaces the page content, the keyword disappears and you are alerted within minutes. This is significantly faster than finding out from a customer, a Google search result, or a social media post about your hacked site.',
  },
]

export default function WordPressSiteHackedPage(): React.ReactElement {
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
          headline: 'WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly',
          description: 'How WordPress defacement attacks work, how to recover, and how keyword monitoring catches the attack before your customers see a hacker\'s message.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-31',
          dateModified: '2026-03-31',
          url: 'https://uptrue.io/blog/wordpress-site-hacked',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>31 March 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly</h1>
        <p className="blog-article-subtitle">
          You wake up on a Monday morning and check your phone. A customer has texted a screenshot of your website. Instead of your homepage, there is a black background with green text: &quot;Hacked by [name].&quot; Your company name is gone. Your products are gone. Your credibility is gone. And you have no idea how long it has been like this — because your uptime monitor says the site is up.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>How WordPress site defacement actually works</h2>

        <p>
          A defacement attack replaces your visible website content with the attacker&apos;s message. It is the digital equivalent of someone spray-painting over your shop front. The site still loads. The server still responds with a 200 status code. Every uptime monitor in the world says your site is fine. But your visitors see a hacker&apos;s message where your business used to be.
        </p>

        <p>
          There are three primary ways attackers replace your WordPress homepage, and understanding each one is critical to knowing how to prevent and detect them.
        </p>

        <h2>Attack vector 1: Admin credential compromise</h2>

        <p>
          The most straightforward defacement method. The attacker gains access to a WordPress administrator account and simply edits the homepage content through the WordPress editor. They can change text, replace images, modify the theme, or switch the homepage to a completely different page.
        </p>

        <p>
          How they get your credentials:
        </p>

        <ul>
          <li><strong>Brute force</strong> — automated scripts try thousands of password combinations against your <code>wp-login.php</code>. If your admin password is &quot;admin123&quot; or &quot;password2026,&quot; they are in within minutes.</li>
          <li><strong>Credential stuffing</strong> — data breaches from other services leak email and password combinations. If your WordPress admin uses the same email and password as a service that was breached, attackers try those credentials on your site.</li>
          <li><strong>Phishing</strong> — you receive an email that looks like a WordPress update notification or a hosting provider alert. You click the link, enter your credentials on a fake login page, and the attacker now has your password.</li>
          <li><strong>Weak or shared hosting</strong> — on poorly configured shared hosting, another compromised site on the same server can sometimes access your files or database credentials.</li>
        </ul>

        <p>
          Once inside, the attacker does not need any technical skill. They open the WordPress page editor, delete your content, paste their message, and click Publish. The entire attack takes less than 30 seconds after login.
        </p>

        <h2>Attack vector 2: File injection via vulnerable plugins</h2>

        <p>
          This is the most common attack vector for WordPress defacement. A vulnerable plugin allows the attacker to upload files to your server or execute arbitrary code without ever logging into wp-admin. The attacker does not need your password. They exploit the plugin directly.
        </p>

        <p>
          The attack typically works like this: a plugin has a file upload vulnerability — it does not properly validate the file type, or it allows unauthenticated uploads. The attacker uploads a PHP web shell — a small PHP file that gives them full control of your server through a browser. From the web shell, they can modify any file on your server, including your theme&apos;s <code>index.php</code>, <code>header.php</code>, or <code>front-page.php</code>.
        </p>

        <p>
          Some recent examples of plugin vulnerabilities that have been used for defacement:
        </p>

        <ul>
          <li>Arbitrary file upload in contact form plugins that do not validate file types</li>
          <li>Remote code execution in page builder plugins through unsanitised shortcode attributes</li>
          <li>SQL injection in analytics or SEO plugins that allow writing to the database</li>
          <li>Unauthenticated REST API endpoints in plugins that expose write access to posts and pages</li>
        </ul>

        <p>
          The WordPress REST API itself was the target of a mass defacement campaign in 2017 when a privilege escalation vulnerability allowed unauthenticated users to modify any post or page. Over 1.5 million pages were defaced before the patch was widely applied. Similar vulnerabilities continue to appear in third-party plugins.
        </p>

        <h2>Attack vector 3: Theme file modification</h2>

        <p>
          Instead of modifying content through the WordPress database, some attackers modify your theme&apos;s template files directly on the server. This is harder to detect because the WordPress page editor still shows your original content — the defacement is happening at the PHP template level.
        </p>

        <p>
          The attacker modifies <code>index.php</code>, <code>header.php</code>, or <code>front-page.php</code> in your active theme directory. They add a PHP block at the top of the file that outputs their defacement message and calls <code>die()</code>, which prevents the rest of the template from executing. Your WordPress admin panel shows the correct page content, but when visitors load the homepage, the modified PHP file executes first and displays the hacker&apos;s message.
        </p>

        <p>
          This type of defacement is particularly dangerous because:
        </p>

        <ul>
          <li>Checking the page content in wp-admin shows the original, correct content</li>
          <li>The modification survives cache clears because it is in the PHP source, not the cache</li>
          <li>Restoring the page content through WordPress does not fix it — the theme file is still modified</li>
          <li>If you do not check your theme files specifically, you might assume the defacement is in the database and waste hours looking in the wrong place</li>
        </ul>

        <h2>Why you usually discover a defacement from a customer</h2>

        <p>
          Here is the painful truth about most WordPress defacement attacks. The site owner is the last person to find out. The discovery timeline usually looks like this:
        </p>

        <ol>
          <li>The attacker defaces the site at 2 AM when no one is watching.</li>
          <li>Early morning visitors see the defacement but most do not contact you — they just leave and go to a competitor.</li>
          <li>A few hours later, a loyal customer, a business partner, or a friend texts or emails to ask if your site has been hacked.</li>
          <li>You panic, check the site, confirm the defacement, and begin trying to fix it.</li>
          <li>By this point, the defacement has been live for 6 to 12 hours. Every visitor during that time saw the hacker&apos;s message instead of your business.</li>
        </ol>

        <p>
          Your uptime monitor did not alert you because the site was technically up. The server returned a 200 status code. The page loaded in a normal amount of time. The SSL certificate was valid. By every metric that standard monitoring checks, your site was healthy. It just was not yours anymore.
        </p>

        <h2>How Uptrue keyword monitoring detects defacement in minutes</h2>

        <p>
          The logic is simple: if your brand name disappears from your homepage, something is very wrong. <Link href="/signup">Uptrue&apos;s keyword monitoring</Link> checks whether a specific word or phrase exists on your page. If a hacker replaces your homepage content, your brand name, your headline, your product names — they all disappear. Uptrue detects the missing keyword and alerts you immediately.
        </p>

        <h3>Step 1: Set up a keyword monitor for your brand name</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your <strong>brand name</strong> or <strong>company name</strong></li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          If a hacker replaces your homepage with their own message, your brand name disappears from the page. Uptrue detects this within 60 seconds and alerts you. Instead of discovering the defacement from a customer 8 hours later, you know about it within a minute.
        </p>

        <h3>Step 2: Add a negative keyword monitor for hacker signatures</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong></li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;hacked&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Most defacement attacks include the word &quot;hacked&quot; in the message. This monitor catches any defacement that includes that keyword. You can add additional negative keyword monitors for common defacement terms like &quot;pwned,&quot; &quot;defaced,&quot; or &quot;owned by.&quot;
        </p>

        <h3>Step 3: Monitor your key inner pages</h3>

        <p>
          Defacement does not always target the homepage only. Some attackers modify multiple pages, or target your most visited pages according to your sitemap. Set up keyword monitors on your top pages:
        </p>

        <ul>
          <li>Homepage — monitor for your brand name</li>
          <li>About page — monitor for your company description</li>
          <li>Contact page — monitor for your email address or phone number</li>
          <li>Product pages — monitor for product names</li>
          <li>Any page receiving significant organic traffic</li>
        </ul>

        <h3>Step 4: Add HTTP monitoring as a safety net</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>HTTP/HTTPS</strong></li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Some attackers take the site offline entirely after defacement, either intentionally or because their modifications cause PHP errors. HTTP monitoring catches complete outages that keyword monitoring cannot.
        </p>

        <h3>Step 5: Configure alerts for 24/7 coverage</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification in a security-focused channel</li>
          <li><strong>Email</strong> — documented record for incident response</li>
          <li><strong>Microsoft Teams</strong> — visibility for the full team</li>
          <li><strong>Webhook</strong> — trigger automated incident response workflows</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check if your WordPress site is compromised</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See vulnerabilities before attackers exploit them.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>How to harden WordPress against defacement attacks</h2>

        <p>
          Detection is critical, but prevention reduces the risk in the first place. The{' '}
          <a href="https://wordpress.org/documentation/article/hardening-wordpress/" target="_blank" rel="noopener noreferrer">WordPress hardening guide</a>
          {' '}is the definitive reference. Here are the most impactful measures:
        </p>

        <h3>Secure your admin credentials</h3>
        <ul>
          <li>Use a unique, randomly generated password of at least 20 characters</li>
          <li>Enable two-factor authentication on every admin account</li>
          <li>Never reuse a password from any other service</li>
          <li>Limit login attempts — lock out IPs after 5 failed attempts</li>
          <li>Change the default <code>wp-login.php</code> URL with a login URL plugin</li>
          <li>Disable XML-RPC if you do not use it — it is a common brute force target</li>
        </ul>

        <h3>Keep everything updated</h3>
        <ul>
          <li>Update WordPress core as soon as security patches are released</li>
          <li>Update all plugins within 24 hours of a security update</li>
          <li>Update your theme — even if you use a child theme, the parent theme&apos;s vulnerabilities still apply</li>
          <li>Delete any plugins and themes you are not actively using — deactivated plugins can still be exploited</li>
        </ul>

        <h3>Harden file permissions</h3>
        <ul>
          <li>Set directory permissions to 755 and file permissions to 644</li>
          <li>Set <code>wp-config.php</code> to 440 or 400</li>
          <li>Disable the WordPress theme and plugin file editor by adding <code>define(&apos;DISALLOW_FILE_EDIT&apos;, true);</code> to <code>wp-config.php</code></li>
          <li>Prevent PHP execution in the <code>wp-content/uploads/</code> directory</li>
        </ul>

        <h3>Install a security plugin</h3>
        <p>
          A security plugin like Wordfence, Sucuri, or iThemes Security adds a firewall, malware scanning, and login protection. These are not perfect — determined attackers can bypass them — but they significantly raise the bar for opportunistic attacks. Use them as one layer of defence, not the only layer.
        </p>

        <h2>How to recover from a WordPress defacement</h2>

        <h3>Immediate response — first 30 minutes</h3>

        <ol>
          <li>Take a screenshot of the defacement for your records and potential law enforcement report.</li>
          <li>Take the site offline. Enable maintenance mode through your hosting panel (not through WordPress, since the attacker controls WordPress).</li>
          <li>Change every password: WordPress admin, database, FTP/SFTP, hosting panel, and any connected API keys or third-party services.</li>
          <li>Check your user list for unknown administrator accounts. Delete any you did not create.</li>
        </ol>

        <h3>Restore and clean — next 2 to 4 hours</h3>

        <ol>
          <li>If you have a known clean backup from before the attack, restore it. This is the fastest and most reliable recovery method.</li>
          <li>If you do not have a clean backup, you need to manually inspect and clean every file. Compare your WordPress core files against a fresh download. Check every plugin and theme file against the official versions. Look for unfamiliar PHP files, especially in <code>wp-content/uploads/</code>, which should only contain media files.</li>
          <li>Check the database for injected content. Look at the <code>wp_posts</code> table for modified page content. Check <code>wp_options</code> for modified site URL, admin email, or active plugins. Check <code>wp_users</code> for rogue admin accounts.</li>
          <li>Update all plugins, themes, and WordPress core to the latest versions.</li>
        </ol>

        <h3>Verification — before going live</h3>

        <ol>
          <li>Set up Uptrue keyword monitoring <strong>before</strong> bringing the site back online.</li>
          <li>Bring the site online and verify the homepage shows correct content.</li>
          <li>Check 5 to 10 inner pages to confirm they are clean.</li>
          <li>Monitor Uptrue for the next 48 hours — attackers often have backdoors and may re-deface the site after you clean it.</li>
        </ol>

        <h2>The reputation damage you cannot undo</h2>

        <p>
          The technical damage of a defacement is fixable. Restore a backup, change passwords, patch the vulnerability. But the reputation damage lingers. Every visitor who saw the hacker&apos;s message now associates your brand with being insecure. Every customer who screenshots your hacked site and shares it on social media is amplifying that association. Google may flag your site with &quot;This site may be hacked&quot; in search results, which can persist for weeks after you clean the site.
        </p>

        <p>
          The difference between a defacement lasting 60 seconds and 12 hours is the difference between a minor security incident and a brand crisis. Uptrue keyword monitoring gives you that 60-second detection window. Your brand name disappears from your homepage, and you know about it before the first customer screenshot hits Twitter.
        </p>

        <div className="blog-cta-section">
          <h3>Detect defacement in 60 seconds, not 12 hours</h3>
          <p>
            Free plan available. Keyword monitoring that alerts you the instant your homepage content changes. Slack, email, Teams, and webhook alerts. No credit card required.
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
            <span className="blog-author-name">Uptrue Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/wordpress-japanese-keyword-hack">Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don&apos;t Even Know</Link></li>
            <li><Link href="/blog/wordpress-malware-redirect">WordPress Malware Redirect: Why Your Visitors Are Being Sent to Spam Sites</Link></li>
            <li><Link href="/blog/wordpress-pharma-hack">WordPress Pharma Hack: Hidden Viagra Links in Your Site That Only Google Sees</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
