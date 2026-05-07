=== Uptrue Monitor ===
Contributors: sachindiwaker
Tags: security, monitoring, malware, file scan, uptime
Requires at least: 5.0
Tested up to: 6.9
Stable tag: 1.2.4
Requires PHP: 7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Monitor your site from the inside — file injections, rogue admin users, foreign-language content, brute force attacks, and security misconfigurations.

== Description ==

**Uptrue Monitor** keeps an eye on your WordPress site from the inside, detecting threats and misconfigurations that external uptime monitors will never catch.

It works by running scheduled checks on your server and either sending findings to your Uptrue dashboard or emailing you a free monthly health report — no Uptrue account required to get started.

**No inbound ports. No firewall changes. Works behind Cloudflare.**

= What it monitors =

**File Security**
* PHP files injected into your /uploads/ directory
* JavaScript files injected into /uploads/
* Executable files (.sh, .exe, .py, .bat) in /uploads/
* WordPress core file modifications (wp-login.php, wp-settings.php, wp-admin/admin.php)
* Active theme file changes (functions.php)
* .htaccess and wp-config.php modification detection
* World-writable directory permissions

**User & Access Security**
* New administrator and editor accounts
* Login failure tracking (brute force detection)
* REST API user enumeration exposure
* Application passwords in use
* XML-RPC enabled status
* Two-factor authentication plugin detection

**Content Integrity**
* Foreign-language content injection — detects Chinese, Russian, Arabic, Hindi, Thai, Japanese, Korean, Hebrew, Bengali, and Georgian characters in page titles, slugs, and content (SEO spam detection)
* New pages and posts published since last check

**Configuration & Health**
* Plugin updates available
* Theme updates available
* WordPress core auto-update status
* Backup plugin presence
* Debug mode (WP_DEBUG) status
* Spam comment volume
* Database size
* Disk usage

= Two ways to use it =

**Standalone (free, no account needed)**
Install the plugin and get a free monthly health report delivered to your WordPress admin email. No signup required.

**Connected to Uptrue (real-time alerts)**
Add your Uptrue API token to get real-time alerts, a live security dashboard, AI-powered fix suggestions, and full historical reports. Create a free account at [uptrue.io](https://uptrue.io).

= How it works =

The plugin runs on a schedule using WordPress cron (every 60–240 minutes, configurable). On each run it collects site health data and either pushes it to Uptrue or stores it locally for the monthly report. There are no inbound connections — your server always initiates the outbound request.

= Privacy =

This plugin does not contact any external service until you explicitly opt in by saving an Uptrue API token in **Uptrue → Settings**. With no token saved, the plugin runs only local checks on your server and (optionally) emails the monthly health report to your WordPress admin email. No data leaves your server in standalone mode. Saving a token is treated as your explicit consent for the plugin to begin transmitting site health data to Uptrue. Clearing the token field stops all transmission immediately. See the Third Party Services section below for the full list of fields sent.

== Installation ==

1. Upload the `uptrue-monitor` folder to `/wp-content/plugins/` or install directly through the WordPress plugin screen.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Uptrue → Settings** in your WordPress admin menu.
4. **Optional:** Paste your Uptrue API token to connect to your Uptrue dashboard and enable real-time alerts. Get a free token at [uptrue.io](https://uptrue.io/signup).
5. Leave the token blank to use standalone mode — you will receive a free monthly health report by email with no account required.
6. Click **Save Settings**. The plugin will run its first check within a few minutes.

== Frequently Asked Questions ==

= Do I need an Uptrue account? =

No. Without an API token the plugin runs in standalone mode and sends a free monthly health report to your WordPress admin email address. An Uptrue account adds real-time alerts, a live dashboard, AI-powered fix suggestions, and full history.

= Does it work behind Cloudflare? =

Yes. The plugin pushes data from your server to Uptrue — there are no inbound connections, no open ports, and no changes needed to your firewall or Cloudflare settings.

= Will it slow down my site? =

No. All checks run in the background via WordPress cron and are not triggered by visitor requests. The main data push is a lightweight HTTP request. File scans run on a staggered daily schedule to distribute any server load.

= What WordPress version does it require? =

WordPress 5.0 or higher. The plugin is tested up to WordPress 6.9.

= What PHP version does it require? =

PHP 7.0 or higher.

= How often does it check my site? =

Every 120 minutes by default. You can change this to 60, 120, 180, or 240 minutes in the plugin settings, or set it to daily, weekly, or monthly.

= What happens if WP Cron is disabled? =

If `DISABLE_WP_CRON` is set to `true` in your wp-config.php the plugin will not run automatically. Set up a real server cron job to trigger wp-cron.php on schedule. The Cron Status page in the plugin shows the exact command to use.

= What data is sent to Uptrue? =

Data is only sent when an API token is saved. See the Third Party Services section of this readme for the full list.

= Can I disable specific checks? =

Yes. Go to **Uptrue → Settings → Advanced — Enable / Disable Checks** to toggle individual checks on or off.

= How do I disconnect from Uptrue? =

Clear the API token field in **Uptrue → Settings** and save. No data will be sent to Uptrue after that.

= Is the plugin compatible with multisite? =

The current version is designed for single-site installations. Multisite support is planned for a future release.

== Third Party Services ==

This plugin transmits data to **Uptrue** (https://uptrue.io), a website monitoring service operated by Vision Software Solutions Limited, Brentford, United Kingdom.

**When data is transmitted:**

1. When you save an API token — a one-time connectivity self-test is performed to verify the connection. This only runs after you have entered a token and clicked Save.
2. On each scheduled cron run (every 60–240 minutes) — site health data is pushed to Uptrue.

No data is transmitted if no API token is saved. The plugin makes no outbound connections on activation or deactivation.

**Data transmitted includes:**

* WordPress version and PHP version
* List of active and inactive plugins with version numbers and available update status
* Active theme name, version, and available update status
* Admin and editor user accounts: login name, email address, roles, and registration date
* Recently published pages and posts: title, slug, status, and author ID
* Results of file scans: PHP, JavaScript, and executable files found in /uploads/; .htaccess and wp-config.php modification flags; core file modification flags; theme file modification flags; world-writable directory paths
* Security configuration: XML-RPC status, REST API user enumeration exposure, application passwords in use, auto-update settings, two-factor authentication plugin presence, backup plugin presence, daily login failure count, spam comment count, disk usage percentage and free space
* Foreign-language content detection: post IDs, titles, slugs, detected language, and URLs of any pages with non-Latin content
* Site URL, database size, and basic site statistics (total pages, posts, users by role)

**Uptrue Terms of Service:** https://uptrue.io/terms
**Uptrue Privacy Policy:** https://uptrue.io/privacy

== Screenshots ==

1. Plugin settings page — paste your API token and configure check frequency.
2. Plugin dashboard — connection status, last push time, and API reachability at a glance.
3. Cron status page — see all scheduled jobs and reschedule any that have dropped.
4. Uptrue dashboard — live security findings, health score, and AI-powered fix suggestions.

== Changelog ==

= 1.2.4 =
* Updated readme Contributors to author's WordPress.org username
* Moved admin menu to position 81 (below Settings) to avoid collision with WP core menu items

= 1.2.3 =
* Hardened settings form: $_POST['settings'] now sanitised with array_map(sanitize_text_field, wp_unslash(...)) and is_array() guard before use, satisfying Plugin Check's unsanitised-input rule. Behaviour unchanged.

= 1.2.2 =
* File scanner now ignores WordPress directory-listing protection stubs (small "Silence is golden" index.php/index.html files dropped by core and many plugins) — eliminates false positives in /uploads/
* Pricing link updated to homepage anchor
* Plugin row on Plugins screen now shows Dashboard / Settings / Go Premium quick links
* Removed user-facing reference to internal API URL — plugin always talks to https://uptrue.io

= 1.2.1 =
* Plugin renamed from "Uptrue WordPress Monitor" to "Uptrue Monitor" (slug unchanged)
* No outbound connections are now made on plugin activation or deactivation — the plugin only contacts Uptrue after you save an API token (explicit opt-in)
* Standalone mode is fully self-sufficient: file scans, security checks, and the monthly email report run with or without an Uptrue account
* Hardened admin nonce validation (sanitize and unslash before verify)
* REST API authorisation moved into permission_callback with hash_equals comparison
* Added uninstall.php to clean up all plugin options and scheduled crons on plugin deletion
* Added explicit capability checks (manage_options) to all admin page handlers

= 1.2.0 =
* Added foreign-language content detection — 10 scripts: Chinese, Russian, Arabic, Hindi, Thai, Japanese, Korean, Hebrew, Bengali, Georgian
* Added security configuration checks: 2FA detection, backup plugin detection, XML-RPC status, REST API user enumeration, application passwords
* Added brute force detection via login failure tracking (wp_login_failed hook)
* Added file permission scanning for world-writable directories
* Added monthly standalone email health report — no Uptrue account required
* Added disk usage monitoring
* Added staggered daily file scans to reduce server load
* Added Cron Status admin page with reschedule controls

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.2.4 =
Addresses WP.org review feedback: contributor username corrected, admin menu repositioned to coexist with WordPress core navigation.

= 1.2.3 =
Defensive sanitisation on the settings form to satisfy WordPress.org Plugin Check. No functional change.

= 1.2.2 =
Eliminates false-positive "PHP file in /uploads/" findings caused by WordPress's own directory-protection stubs. Recommended upgrade.

= 1.2.1 =
Compliance and security hardening release. No outbound connections happen until you explicitly connect by saving an API token. Plugin renamed to "Uptrue Monitor" — slug and settings unchanged.

= 1.2.0 =
Major update — adds 10-language content injection detection, security configuration checks, brute force detection, and a free standalone monthly health report. No configuration changes required.
