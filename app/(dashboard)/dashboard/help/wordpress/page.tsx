'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

export default function WordPressHelpPage(): React.ReactElement {
  const pathname = usePathname()

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>WordPress Plugin</span>
        </nav>

        <article className="help-article">
          <h1 className="help-article-title">WordPress Site Monitor Plugin</h1>
          <p className="help-article-intro">
            The Uptrue WordPress plugin monitors your site from the inside — detecting file injections,
            rogue admin users, security misconfigurations, and foreign-language spam content. It runs
            on WordPress Cron and pushes findings to Uptrue via HTTPS. No inbound ports required.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">Installation (2 minutes)</h2>
            <ol className="help-steps">
              <li>
                In your Uptrue dashboard, go to <strong>Monitors → Add Monitor → WordPress</strong>.
                You will be given a secure API token for this site.
              </li>
              <li>
                Download <a href="/downloads/uptrue-monitor.zip" style={{ color: 'var(--color-primary)' }}>uptrue-monitor.zip</a> from the setup page.
              </li>
              <li>
                In your WordPress Admin, go to <strong>Plugins → Add New → Upload Plugin</strong>,
                select the zip, and click <strong>Install Now</strong>, then <strong>Activate</strong>.
              </li>
              <li>
                Go to <strong>Uptrue → Settings</strong> in your WordPress Admin sidebar. Paste your
                API token into the <strong>Uptrue API Token</strong> field and click <strong>Save Settings</strong>.
              </li>
              <li>
                The plugin will immediately run a connection test and schedule the first data push.
                Your monitor will show <strong>Connected</strong> within a few seconds.
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">What the plugin checks</h2>
            <p>
              Every push includes 25+ data points across three categories:
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>File &amp; integrity checks</h3>
            <ul className="help-list">
              <li>PHP files in wp-content/uploads (critical — common malware vector)</li>
              <li>JavaScript files in wp-content/uploads</li>
              <li>Executable files in uploads (.sh, .exe, .py, .pl)</li>
              <li>.htaccess modifications since baseline</li>
              <li>wp-config.php modifications since baseline</li>
              <li>WordPress core file changes</li>
              <li>Active theme file changes</li>
              <li>Plugin files modified in the last 24 hours</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>User &amp; content checks</h3>
            <ul className="help-list">
              <li>New administrator or editor accounts created</li>
              <li>Recently published pages and posts (last 7 days)</li>
              <li>
                Foreign-language content injection — scans all published pages for <strong>10 scripts</strong>:{' '}
                Chinese, Russian, Korean, Arabic, Hindi, Japanese, Thai, Hebrew, Bengali, Georgian.
                Checks the title, slug, and first 300 characters of content.
              </li>
              <li>Outdated plugins with available updates</li>
              <li>Outdated active theme</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Security configuration checks</h3>
            <ul className="help-list">
              <li>Failed login attempts in the last 24 hours (brute force detection)</li>
              <li>World-writable directories (wp-admin, wp-includes, wp-content/plugins)</li>
              <li>XML-RPC enabled (attack surface for brute force and DDoS)</li>
              <li>REST API user enumeration exposed publicly</li>
              <li>Application passwords in use</li>
              <li>WordPress auto-update settings (minor / major / disabled)</li>
              <li>Spam comment volume</li>
              <li>2FA plugin active</li>
              <li>Backup plugin present</li>
              <li>Disk usage percentage and free space (GB)</li>
              <li>PHP version (flags end-of-life versions)</li>
              <li>WordPress debug mode (WP_DEBUG)</li>
              <li>Memory limit and database size</li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Health score</h2>
            <p>
              Every push computes a <strong>health score from 0 to 100</strong>. Points are deducted
              for findings based on severity:
            </p>
            <ul className="help-list">
              <li>PHP shell in uploads: <strong>−30</strong></li>
              <li>JS file in uploads: <strong>−15</strong></li>
              <li>World-writable directory: <strong>−10 each</strong></li>
              <li>No 2FA active: <strong>−8</strong></li>
              <li>EOL PHP version: <strong>−10</strong></li>
              <li>Brute force (&gt;20 failures/day): <strong>−10</strong></li>
              <li>Disk usage &gt;90%: <strong>−10</strong></li>
              <li>Modified plugin files: <strong>−5 each</strong> (max −15)</li>
              <li>XML-RPC enabled: <strong>−5</strong></li>
              <li>REST user enumeration: <strong>−5</strong></li>
              <li>No backup plugin: <strong>−5</strong></li>
              <li>Auto-updates disabled: <strong>−5</strong></li>
              <li>Debug mode on: <strong>−10</strong></li>
            </ul>
            <p>
              A score of 70–100 shows as <strong style={{ color: '#10b981' }}>Good</strong>.
              40–69 shows as <strong style={{ color: '#f59e0b' }}>Fair</strong>.
              Below 40 shows as <strong style={{ color: '#ef4444' }}>At Risk</strong>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Uptrue App URL setting</h2>
            <p>
              In <strong>Uptrue → Settings</strong> you will see an <strong>Uptrue App URL</strong> field.
              Leave this blank to use the default (production). If you are testing against
              the Uptrue dev environment, set it to <code>https://dev.uptrue.io/api/v1/wp-agent</code>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Push frequency</h2>
            <p>
              The plugin pushes data on the schedule you set in <strong>Uptrue → Settings → Check Frequency</strong>
              (default: every 120 minutes). File scans run on staggered daily crons to avoid server load spikes —
              results are cached and included in the next scheduled push.
            </p>
            <p>
              You can trigger an immediate push at any time from <strong>Uptrue → Settings → Force push now</strong>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Troubleshooting</h2>
            <ul className="help-list">
              <li>
                <strong>401 — Invalid API token:</strong> Copy the token from the Uptrue WordPress monitor
                setup page and re-paste it. Tokens are site-specific.
              </li>
              <li>
                <strong>405 — Wrong URL:</strong> Set the <strong>Uptrue App URL</strong> field in plugin
                settings to match the Uptrue environment where your monitor was created.
              </li>
              <li>
                <strong>Network error:</strong> Your hosting provider may block outbound HTTPS requests.
                Contact your host and ask them to whitelist outbound connections to uptrue.io.
              </li>
              <li>
                <strong>Monitor shows Stale:</strong> The plugin has not pushed within 3× its check interval.
                Go to <strong>Uptrue → Settings</strong> and click <strong>Force push now</strong> to
                re-establish the connection.
              </li>
              <li>
                <strong>Connection test passed but no data:</strong> WordPress Cron may be disabled on
                your host. Add <code>define(&apos;DISABLE_WP_CRON&apos;, false);</code> to wp-config.php,
                or set up a real cron job calling <code>wp-cron.php</code>.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">AI Security Report</h2>
            <p>
              From the WordPress monitor dashboard page, click <strong>Generate AI Report</strong> to get
              a plain-English summary of all open findings — ranked by severity with numbered step-by-step
              fix instructions. The report is generated by Claude AI and written for site owners, not developers.
            </p>
          </section>

          <div style={{ marginTop: 32, padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 14 }}>
            <strong>Need help?</strong> Email <a href="mailto:support@uptrue.io" style={{ color: 'var(--color-primary)' }}>support@uptrue.io</a> or
            visit the <Link href="/monitoring/wordpress-site-monitor" style={{ color: 'var(--color-primary)' }}>WordPress Monitor landing page</Link> for
            full documentation.
          </div>
        </article>
      </div>
    </div>
  )
}
