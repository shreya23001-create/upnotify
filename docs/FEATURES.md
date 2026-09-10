# Uptrue — Feature Reference
# ============================================================
# Every implemented feature: what it does, which plan it's on,
# which files own it, and what it depends on.
# Last updated: April 2026 (v1.0.0)
# ============================================================

---

## HOW TO USE THIS FILE

Each feature entry includes:
- **What it does** — plain English description
- **Plans** — which plans include this feature
- **Status** — shipped / partial / Phase 2+ / deferred
- **Code** — primary files that own this feature
- **Depends on** — modules that must work for this to work
- **Notes** — edge cases, known gaps, decisions

---

## 1. AUTHENTICATION & ACCOUNTS

### Magic Link + Google OAuth Sign-in
- **What:** Passwordless login via email magic link or Google OAuth
- **Plans:** All
- **Status:** ✅ Shipped v1.0.0
- **Code:**
  - `app/(auth)/login/page.tsx`
  - `lib/auth/helpers.ts`
  - `app/proxy.ts` (route protection middleware)
- **Depends on:** Supabase Auth, `lib/supabase/server.ts`
- **Notes:** Admin panel requires Google OAuth only (Gmail whitelist via `ADMIN_EMAILS` env var)

### Organisation Multi-Tenancy
- **What:** Every user belongs to an org. All data is scoped to org. RLS enforced at DB level.
- **Plans:** All
- **Status:** ✅ Shipped v1.0.0
- **Code:**
  - `lib/db/organisations.ts`
  - `lib/db/users.ts`
  - `supabase/migrations/` (RLS policies)
- **Depends on:** Supabase RLS, `lib/supabase/admin.ts`

### Session Management
- **What:** Auto-logout after 24h inactivity. Session scoped to org.
- **Plans:** All
- **Status:** ✅ Shipped v1.0.0
- **Code:** `app/proxy.ts`, `lib/auth/helpers.ts`

---

## 2. MONITORING ENGINE

### Check Runner (Cron)
- **What:** Vercel Cron job that fetches due monitors, runs checks, writes results, creates/resolves incidents, dispatches alerts
- **Plans:** All (interval varies by plan)
- **Status:** ✅ Shipped v1.0.0
- **Code:**
  - `app/api/cron/check-runner/route.ts`
  - `lib/services/checker.ts` (dispatcher — routes to correct checker)
  - `lib/checkers/` (individual checker implementations)
- **Depends on:** `lib/db/monitors.ts`, `lib/db/check-results.ts`, `lib/db/incidents.ts`, `lib/services/alert-dispatcher.ts`
- **Chain:** `getDueMonitors()` → `dispatchChecker()` → `writeCheckResult()` → `createIncident()` / `resolveIncident()` → `dispatchAlert()`

### Two-Confirmation Down Detection
- **What:** First check fails → wait 30s → re-check from secondary region. Both fail = incident. Second passes = log flap, no alert.
- **Plans:** All
- **Status:** ✅ Shipped v1.0.0
- **Code:** `app/api/cron/check-runner/route.ts` (runCheck function)
- **Notes:** Prevents false positive alerts from transient network issues

### Check Intervals (plan-gated)
| Interval | Plans |
|---|---|
| 30 seconds | Scale |
| 1 minute | Lite, Builder, Scale |
| 3 minutes | Builder, Scale |
| 5 minutes | Builder, Scale |
| 10 minutes | Free |
| 30 minutes | Free |
| 1 hour | All |

---

## 3. MONITOR TYPES — INDIVIDUAL CHECKERS

> **Definition of Done for every monitor type:**
> 1. `lib/checkers/[type].ts` — checker implementation
> 2. `lib/services/checker.ts` — wired into dispatcher map
> 3. Supabase migration — type added to CHECK constraint
> 4. `lib/types/database.types.ts` — union type updated
> 5. `components/monitors/create-monitor-form.tsx` — type in selector
> 6. `components/monitors/monitor-type-icon.tsx` — icon added
> 7. `components/monitors/edit-monitor-form.tsx` — type-specific config
> 8. `app/monitoring/[slug]/page.tsx` — SEO landing page
> 9. `lib/utils/alert-copy.ts` — alert copy for all channels
> 10. `components/monitors/monitor-type-insight.tsx` — insight component

### HTTP/HTTPS Uptime
- **Code:** `lib/checkers/http.ts`
- **Checks:** Status code, response time, SSL validity
- **Config:** URL, expected status, timeout, follow redirects, custom headers
- **Alert copy:** "is down" / "is back up"

### SSL Certificate
- **Code:** `lib/checkers/ssl.ts`
- **Checks:** Certificate expiry date, validity, domain match
- **Config:** Domain, alert thresholds (7 days = P2, 30 days = P3)
- **Alert copy:** "SSL expires in X days" / "SSL has expired"

### Domain Expiry
- **Code:** `lib/checkers/domain.ts`
- **Checks:** WHOIS/RDAP registrar expiry date
- **Config:** Domain, alert thresholds
- **Alert copy:** "Domain expires in X days"

### DNS Records
- **Code:** `lib/checkers/dns.ts`
- **Checks:** A, MX, NS, TXT record change vs stored baseline
- **Config:** Domain, record types to watch
- **Alert copy:** "DNS records changed"

### Keyword Detection
- **Code:** `lib/checkers/keyword.ts`
- **Checks:** Word/phrase present or absent on page
- **Config:** URL, keyword, mode (must-exist / must-not-exist)
- **Alert copy:** "Keyword appeared" / "Keyword disappeared"

### Port Check
- **Code:** `lib/checkers/port.ts`
- **Checks:** TCP port open/closed
- **Config:** Host, port number, protocol
- **Alert copy:** "Port X is closed" / "Port X is open again"

### API Endpoint
- **Code:** `lib/checkers/api-endpoint.ts`
- **Checks:** HTTP request with custom method, headers, body — asserts response status / body
- **Config:** URL, method, headers, body, expected status, body assertion (JSONPath)
- **Alert copy:** "API endpoint failing" / "API endpoint recovered"

### Ping / Reachability
- **Code:** `lib/checkers/ping.ts`
- **Checks:** ICMP ping, host reachability
- **Config:** Host/IP
- **Alert copy:** "Host is unreachable" / "Host is reachable again"

### Heartbeat
- **Code:** `lib/checkers/heartbeat.ts`
- **Checks:** Cron job pings a unique URL — alert if no ping received in expected window
- **Config:** Expected interval, grace period
- **Alert copy:** "Heartbeat missed" / "Heartbeat resumed"
- **Notes:** URL generated at monitor creation, user adds to their cron job

### Page Change Detection
- **Code:** `lib/checkers/competitor.ts`
- **Checks:** Fetches page, hashes content, alert on any diff vs baseline
- **Config:** URL, ignore whitespace option
- **Alert copy:** "Page content changed"

### Security Headers
- **Code:** `lib/checkers/security-headers.ts`
- **Checks:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy scoring
- **Config:** URL, minimum score threshold
- **Alert copy:** "Security headers score dropped"

### Response Time Threshold
- **What:** Extension of HTTP checker — adds configurable response time alert
- **Code:** `lib/checkers/http.ts` (threshold config added)
- **Config:** URL + threshold in ms
- **Alert copy:** "Response time exceeded Xms"

### robots.txt Change
- **Code:** `lib/checkers/robots.ts`
- **Checks:** Fetches /robots.txt, hashes vs baseline, flags if Googlebot blocked
- **Config:** Domain
- **Alert copy:** "robots.txt changed" / "Googlebot is now blocked"

### IP Address Change
- **Code:** `lib/checkers/ip-change.ts`
- **Checks:** `dns.resolve4()` vs stored baseline A record
- **Config:** Domain, "Update baseline" button in UI
- **Alert copy:** "IP address changed to X.X.X.X"

### MX Health
- **Code:** `lib/checkers/mx-health.ts`
- **Checks:** MX record lookup + TCP port 25/587 check on each MX host
- **Config:** Domain
- **Alert copy:** "MX record broken — mail delivery at risk"

### WHOIS Registrar Change
- **Code:** `lib/checkers/whois-registrar.ts`
- **Checks:** RDAP API — store baseline registrar, alert on change
- **Config:** Domain
- **Alert copy:** "Registrar changed — possible domain hijack risk"

### Sitemap Validity
- **Code:** `lib/checkers/sitemap.ts`
- **Checks:** Fetches sitemap.xml, validates `<urlset>` or `<sitemapindex>` present
- **Config:** Sitemap URL
- **Alert copy:** "Sitemap is invalid or unreachable"

### Redirect Chain
- **Code:** `lib/checkers/redirect-chain.ts`
- **Checks:** Follows redirect hops, stores baseline chain + final URL, alerts on change
- **Config:** URL
- **Alert copy:** "Redirect chain changed"

### SPF / DMARC Validity
- **Code:** `lib/checkers/spf-dmarc.ts`
- **Checks:** TXT record lookups — validates `v=spf1` and `v=DMARC1` format
- **Config:** Domain
- **Alert copy:** "SPF record broken" / "DMARC record broken"

### Blacklist Check
- **Code:** `lib/checkers/blacklist.ts`
- **Checks:** DNS-based queries to Spamhaus ZEN/DBL, Barracuda, SpamCop, SORBS
- **Config:** Domain/IP, blacklist zones to check
- **Env var required:** `SPAMHAUS_DQS_KEY`
- **Alert copy:** "Domain/IP is blacklisted on [zone]"

### Page Size / Content Size
- **Code:** `lib/checkers/page-size.ts`
- **Checks:** HTTP GET, stores baseline size, alerts on >30% deviation
- **Config:** URL, deviation threshold (%)
- **Alert copy:** "Page size changed significantly — possible malware or content deletion"

### Cookie Consent Presence
- **Code:** `lib/checkers/cookie-consent.ts`
- **Checks:** GET page, scans for GDPR consent library signatures (OneTrust, Cookiebot, CookieYes, Usercentrics etc.)
- **Config:** URL
- **Alert copy:** "Cookie consent banner missing — GDPR compliance risk"

### Nameserver Change
- **Code:** `lib/checkers/nameserver.ts`
- **Checks:** NS record vs stored baseline — default P1 severity, 1hr minimum interval
- **Config:** Domain
- **Alert copy:** "Nameservers changed — possible DNS hijack"

---

## 4. ALERTING

### Alert Dispatcher
- **What:** Routes incidents to configured alert channels
- **Code:** `lib/services/alert-dispatcher.ts`
- **Depends on:** `lib/services/email.ts`, `lib/services/slack.ts`, `lib/services/webhook.ts`
- **Triggered by:** Check runner after incident creation/resolution

### Alert Copy System
- **What:** Type-specific alert messages for every channel
- **Code:** `lib/utils/alert-copy.ts`
- **Contains:** `subject`, `headline`, `detail`, `shortText`, `voiceScript` for every monitor type × every channel
- **CRITICAL:** Every new monitor type MUST add entries here before shipping

### Email Alerts
- **Code:** `lib/services/email.ts`, `lib/services/alert-dispatcher.ts`
- **Provider:** Resend
- **Plans:** All
- **Features:** Per-contact per-severity routing, incident detail, recovery emails

### Slack Alerts
- **Code:** `lib/services/slack.ts`
- **Plans:** Builder+
- **Config:** Incoming webhook URL, channel per severity level
- **Format:** Rich Slack Block Kit message

### Microsoft Teams Alerts
- **Code:** `lib/services/teams.ts`
- **Plans:** Builder+
- **Format:** Adaptive card

### Webhook (HTTP Push)
- **Code:** `lib/services/webhook.ts`
- **Plans:** Builder+
- **Security:** HMAC-SHA256 signed — `X-Uptrue-Signature: sha256=<hex>`
- **Payload:** JSON, all incident fields

### Incident Lifecycle
- **Code:** `lib/db/incidents.ts`
- **States:** `detecting` → `confirmed` → `resolved`
- **Rule:** Two-confirmation required before `confirmed`
- **Auto-resolve:** Next successful check resolves open incident and fires recovery alert

---

## 5. STATUS PAGES

### Public Status Page
- **What:** Publicly accessible page showing monitor health, uptime bars, incident history
- **Code:**
  - `app/status/[slug]/page.tsx` (public page)
  - `lib/db/status-pages.ts` (data layer)
  - `components/status-page/` (UI components)
- **Plans:** All
- **Features:** 30/60/90 day selector, incident log, email subscribe, active incident banner
- **Security:** Public, no auth. Never exposes internal IDs.

### Email Subscribe
- **What:** Visitor subscribes to status page updates via email
- **Code:** `app/api/v1/status-pages/[id]/subscribe/route.ts`
- **Depends on:** `lib/services/email.ts`

### Custom Domains (Scale plan)
- **What:** CNAME-based custom domain for status pages
- **Code:** `lib/db/status-pages.ts`, domain verification logic
- **Process:** DNS TXT verification → SSL via Let's Encrypt
- **Status:** ✅ Shipped v1.0.0

### Status Page Badges
- **What:** Embeddable SVG badge showing current monitor status
- **Code:** `app/api/v1/badge/[monitorId]/route.ts`
- **Depends on:** `lib/db/public-monitors.ts`

---

## 6. AI REPORTS

### Report Generation
- **What:** Generates executive summary using Claude API + per-monitor stats
- **Code:**
  - `lib/services/ai.ts` (Claude API wrapper)
  - `lib/services/admin-reports.ts`
  - `lib/db/reports.ts`
  - `app/(dashboard)/reports/` (UI)
- **Plans:** All paid (on-demand); Scale+ (scheduled)
- **Model:** Claude API (Anthropic)
- **Env var:** `ANTHROPIC_API_KEY`

### AI Predictive Alerts
- **What:** Pattern recognition in check history — warns about recurring issues
- **Plans:** Scale+
- **Requires:** 90 days of check history minimum
- **Examples:** "Site down every Monday morning", "Response time spikes Friday evenings"

---

## 7. BILLING

### Stripe Subscriptions
- **What:** Monthly/annual subscription management
- **Code:**
  - `lib/services/stripe.ts`
  - `lib/services/payments-stripe.ts`
  - `app/api/webhooks/stripe/route.ts`
  - `app/(dashboard)/settings/billing/` (UI)
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Features:** Checkout, Customer Portal, webhook-driven plan enforcement

### Razorpay (India)
- **What:** INR + UPI payments for Indian customers
- **Code:** `lib/services/payments-razorpay.ts`
- **Env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- **Status:** ✅ Wired, pending go-live testing

### Plan Limits Enforcement
- **What:** Checks plan limits before allowing monitor creation, workspace creation, team invites
- **Code:** `lib/utils/plan-limits.ts`
- **Depends on:** `lib/db/subscriptions.ts`, `lib/supabase/admin.ts`
- **CRITICAL:** Never bypass — always check before creating any metered resource

### Subscription Lifecycle
```
Signup → Free (no subscription record)
  ↓ Upgrade → Stripe checkout → webhook → subscription active → limits enforced → user notified
  ↓ Cancel → Free limits enforced → excess resources paused → user notified
  ↓ Delete → Stripe canceled → all data cascade deleted → auth user removed
```

---

## 8. DASHBOARD UX

### Monitor List
- **Code:** `app/(dashboard)/monitors/` (pages), `components/monitors/` (UI)
- **Features:** Filter by type/status/severity, bulk actions (pause/delete/change severity), sort

### Bulk Actions
- **Code:** `components/monitors/monitor-list.tsx` (or similar)
- **Actions:** Pause, resume, delete, change severity — applies to selection

### Dark Mode
- **Code:** Root layout, CSS variables in global styles
- **Features:** System preference detection on first load, manual toggle, persisted in localStorage

### Toast Notifications
- **Code:** `components/ui/toast.tsx` (or similar)
- **Used by:** All create/edit/delete actions

### Breadcrumb Navigation
- **Code:** `components/ui/breadcrumbs.tsx`

### Create Monitor Form
- **Code:** `components/monitors/create-monitor-form.tsx`
- **Layout:** 50/50 split — form on left, contextual help panel on right
- **Help panel:** Description, how to use, FAQs per monitor type

### Monitor Type Insight
- **Code:** `components/monitors/monitor-type-insight.tsx`
- **What:** Type-specific plain-English interpretation of the latest check result
- **CRITICAL:** Every new monitor type must add an insight sub-component here

---

## 9. SEO / CONTENT FEATURES

### Monitor Landing Pages
- **What:** One public SEO page per monitor type at `/monitoring/[slug]`
- **Code:** `app/monitoring/[slug]/page.tsx`, `app/monitoring/page.tsx` (index)
- **Content sections (required for every page):**
  1. Hero — value prop
  2. What is [type]?
  3. Why does it matter?
  4. Risks if you don't monitor
  5. How Uptrue monitors it
  6. How to set it up
  7. FAQs (5–8 questions)
  8. CTA → signup
- **Status:** ✅ All 23 pages live v1.0.0
- **Generation:** Static (`generateStaticParams`)

### Dynamic Sitemap
- **Code:** `app/sitemap.ts`
- **What:** Auto-generates on every request — includes all static pages, blog posts, monitoring pages, free tools, public trackers
- **Excluded:** Dashboard pages, status pages (customer-owned), admin pages

### robots.ts / robots.txt
- **Code:** `app/robots.ts` (dynamic, env-aware), `public/robots.txt` (static, AI-crawler rules)
- **Notes:** AI crawler rules in static file; `robots.ts` adjusts based on environment (staging = noindex)

### JSON-LD Structured Data
- **Code:** Homepage and key landing pages
- **Types:** Organization, WebSite, SoftwareApplication

---

## 10. OUTAGE BLOG (AUTO-PUBLISH)

### Blog Post Generation
- **What:** Monitors third-party services via RSS/status pages, generates outage blog posts using Claude API, holds for human approval, then publishes
- **Code:**
  - `lib/services/outage-researcher.ts` (fetches outage data)
  - `lib/services/blog-generator.ts` (Claude API post generation)
  - `lib/services/social-poster.ts` (X + LinkedIn posting)
  - `lib/db/blog-posts.ts` (data layer)
  - `app/blog/[slug]/page.tsx` (public blog post page)
- **Env vars:** `ANTHROPIC_API_KEY`, `X_*`, `LINKEDIN_*`, `BLOG_APPROVAL_SECRET`

### Legal Safeguards (Harvey's requirements — all shipped)
- ✅ Disclaimer box on every auto-generated post (flag: `auto_generated = true`)
- ✅ Hedged language in AI prompt ("reportedly", "appears to be", not "is down")
- ✅ Reddit usernames and X handles stripped from generated content
- ✅ Takedown/corrections email in disclaimer: shreya23001@gmail.com
- ✅ AI Disclaimer policy page — Section 9: monitoring reports, corrections process
- ✅ LinkedIn posts from organization account when `LINKEDIN_ORGANIZATION_ID` is set

### Human Approval Gate
- All auto-generated posts held in `draft` status
- Approval notification sent to admin
- Admin reviews and approves/rejects in admin CMS
- Only approved posts publish to blog + social

---

## 11. ADMIN PANEL

### Super Admin Panel
- **Access:** sachindiwaker@gmail.com only, Google OAuth, Gmail whitelist
- **Code:** `app/(dashboard)/admin/` (all admin pages)
- **Auth:** `lib/db/admin-roles.ts`, `app/proxy.ts` (middleware check)
- **Features:**
  - User management (deactivate, delete, change plan)
  - Organisation management
  - Plan pricing control (edit prices, limits, features)
  - Feature flags
  - Live/Test mode toggle (OTP-protected)
  - Blog CMS (create/edit/approve posts)
  - Landing page CMS (hero, features, pricing sections)
  - Admin reports (MRR, churn, signups, monitor growth, alert volume)

### Admin Reports
- **Code:** `lib/services/admin-reports.ts`
- **Metrics:** MRR/ARR, signups by plan, churn, conversion, top orgs, monitor growth, alert volume, AI cost per customer, feature flag usage

### Feature Flags
- **Code:** `lib/db/feature-flags.ts`
- **Rule:** Never disable a feature that is actively being used by paying customers

### Impersonation
- **Code:** `lib/db/users.ts` (impersonation helpers)
- **Rules:** Read-only always, audit-logged, payment changes blocked during impersonation

---

## 12. COOKIE CONSENT & LEGAL

### Cookie Consent Banner
- **Code:** Root layout component, localStorage persistence
- **Categories:** Necessary, Analytics, Marketing
- **Behaviour:** Shown on all public pages, persisted in localStorage, GDPR compliant

### Legal Pages (all live)
- Terms of Service: `app/terms/page.tsx`
- Privacy Policy: `app/privacy/page.tsx`
- Cookie Policy: `app/cookies/page.tsx`
- Acceptable Use Policy: `app/aup/page.tsx`
- Data Processing Agreement: `app/dpa/page.tsx`
- AI Content Disclaimer: `app/ai-disclaimer/page.tsx`

---

## 13. EMAIL NURTURE SYSTEM

### Drip Campaigns
- **What:** Automated email sequences triggered by user actions (signup, first monitor, upgrade)
- **Code:**
  - `lib/services/email-nurture.ts`
  - `lib/db/email-nurture.ts`
  - `app/api/cron/nurture-emails/route.ts` (daily 8am)
- **Depends on:** `lib/services/email.ts` (Resend)

---

## 14. PUBLIC TRACKER / LEADERBOARD

### Public Tracker
- **What:** Public pages showing uptime stats for tracked domains (e.g. hosting company uptime)
- **Code:**
  - `lib/db/public-monitors.ts`
  - `app/tracker/[domain]/page.tsx`
  - `app/api/cron/public-checks/route.ts`

### Leaderboard
- **What:** Publicly ranked leaderboard of monitored domains by uptime
- **Code:** `lib/db/leaderboard.ts`, `app/leaderboard/page.tsx`
- **Use case:** Hosting company comparison pages (SEO strategy)

---

## 15. FREE DOMAIN HEALTH SCAN (Planned — Phase 1.5)

### What it does
- Homepage CTA: "Scan your website free →"
- No signup required
- Runs 5–6 instant checks: SSL, security headers, SPF/DMARC, blacklist, redirect chain, robots.txt
- Shows results inline, offers to save + monitor with signup CTA
- **Code:** `app/scan/page.tsx` (planned), uses existing `lib/checkers/`
- **Status:** 📋 Planned for Phase 1.5 — not yet built

---

## 16. MONITORING SUITE SCORE (Partial)

### Website Score
- **What:** Aggregate health score from running multiple checks
- **Code:** `lib/services/score.ts`
- **Depends on:** `lib/checkers/http.ts`, `ssl.ts`, `dns.ts`, `security-headers.ts`
- **Status:** ✅ Partial — score service exists, full UI planned

---

*Last updated: April 2026 (v1.0.0)*
*Owner: Sachin Diwaker*
