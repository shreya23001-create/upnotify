# Uptrue — Changelog

## Unreleased — dev branch

### Security
- **Cron auth bypass closed (engineering-app#60, SEC-01 CRITICAL).** All 26 affected `/api/cron/*` routes were accepting any request carrying the spoofable `X-Vercel-Cron` HTTP header as proof of authenticity. Extracted a central `requireCronAuth()` helper in `lib/auth/cron-auth.ts` that requires a real `Authorization: Bearer <CRON_SECRET>` (the contract Vercel's native scheduler actually uses); removed the X-Vercel-Cron fallback from every route. Two crons (`monitor-health-report`, `health-scores`) already used a different safe pattern — left untouched. Tests updated: the legacy "Vercel cron header bypass" assertions are now regression tests asserting 401 on bypass attempts.
- **API rate limiting on 12 high-risk routes (engineering-app#71, #64).** `/api/contact` POST (5/hr, anti-spam-relay), `/api/contact/verify` GET (10 per 15-min, token brute-force guard), public form endpoints (`agency-waitlist`, `blog/subscribe`, two unsubscribes) and AI-cost endpoints (4 ai-visibility routes + `compete/extract` + `keyword-suggestions`) all now run `checkRateLimit()` before auth. Added `CONTACT_FORM_RATE_LIMIT` (5/hr) and `AI_EXPENSIVE_RATE_LIMIT` (10/hr) presets. ~35 authenticated-only routes remain uncovered — recommended as a separate follow-up.
- **CSP frame-ancestors directive (engineering-app#88).** `X-Frame-Options: DENY` was already shipping (from #70), but modern browsers prefer the CSP `frame-ancestors` directive when both are present. Added `frame-ancestors 'none'` so anti-clickjacking is consistent at both layers.
- **process-run auth fail-closed (engineering-app#80).** The `/api/ai-visibility/process-run` endpoint accepted an empty `x-internal-secret` header when `CRON_SECRET` was unset (`'' === ''` evaluated true). Auth now explicitly rejects missing/empty env var AND missing/empty header — both must be present + non-empty for the equality check to even run. 6 unit tests added.
- **security.txt added (engineering-app#93).** RFC 9116 responsible-disclosure file at `/.well-known/security.txt`. Points researchers at `security@uptrue.io` (Boss needs to confirm/set up the alias) and the existing `/security` policy page.

### SEO
- **Canonical AI crawler directives (engineering-app#84).** `app/robots.ts` now emits explicit allow rules for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Bingbot, cohere-ai, Amazonbot, and ia_archiver. The previous dynamic handler returned only the wildcard rule; AI crawlers had no per-bot acknowledgement. Removed `public/robots.txt` (dead code — Next.js App Router serves the dynamic `.ts` over the static file). 7 new unit tests under `tests/unit/app-robots.test.ts`.
- **Dev/preview noindex hardening (engineering-app#90).** Per the hard SEO rule that only `uptrue.io` is indexable, non-production environments now emit (1) `Disallow: /` robots.txt — shipped with #84, (2) `<meta name="robots" content="noindex,nofollow">` in `app/layout.tsx` gated on `process.env.VERCEL_ENV`, (3) `X-Robots-Tag: noindex, nofollow` HTTP response header from `next.config.ts`. Three-layer defence covers meta-tag rendering, 30x redirects, JSON/image responses, and any path the meta tag never reaches.
- **SaaSHub directory verification (engineering-app#37).** Added `<meta name="saashub-verification" content="l5obg5hu6ag6"/>` site-wide via the Next.js Metadata API on the root layout. Must remain permanently — SaaSHub re-validates periodically. Unblocks marketing repo issue #10.
- **Homepage a11y — main landmark, skip link, heading order, contrast (engineering-app#75).** Wrapped public-layout children in `<main id="main-content">`; added a focus-visible skip link as the first focusable element on every public page; demoted the AI Features per-item `<h4>` to `<h3>` to fix the post-h2 heading skip; replaced two contrast-failing classes (`.sp-label` switched from `--text-muted` to `--text-secondary`; `.sp-logo-item` opacity bumped from 0.55 → 0.85 to keep effective contrast above 4.5:1).

### Fixed
- **Status page uptime % accuracy (engineering-app#56).** `getUptimePercentage()` previously fetched all `check_results` rows for the window and counted in JS, but PostgREST silently caps unlimited `SELECT` queries at 1,000 rows. A 1-minute monitor over 30 days has ~43,200 rows, so the displayed uptime % was computed from only the first ~16 hours of data. Replaced with two HEAD `count='exact'` queries (one total, one filtered to `status='up'`) — no row payload, no cap risk, faster. `getUptimeBarDataForRange()` got a `.limit(50000)` safety bump. Pre-aggregation table is the proper long-term fix for very high-frequency monitors over the full 90-day range.
- **Public help + API docs routes (engineering-app#46, #47).** `/help` and `/api-docs` were 307-redirecting to `/login` because they weren't in the `PUBLIC_ROUTES` allowlist and no public-side pages existed. Added `app/(public)/help/page.tsx` (Help Centre landing mirroring the in-app topic grid) and `app/(public)/api-docs/page.tsx` (developer-platform "coming with Phase 3" stub with links to webhooks/integrations/WP plugin). Both added to `PUBLIC_ROUTES`.
- **'Uptrue score' badge capitalisation (engineering-app#48).** SVG badge label in `/api/badge/score/[domain]` corrected from `'uptrue score'` to `'Uptrue score'`. Same length, no layout shift. Badges cached for 1 hour, so embedded badges refresh on next request within an hour of prod deploy.
- **Citation detection word-boundary fix (engineering-app#82).** The naive `.includes()` check in `lib/services/citation-processor.ts` counted any substring match as a citation — `notuptrue.io` and `uptrue.io.evil.com` were inflating scores. Replaced with a host-token walker (`isCited()`) that matches only exact-host or `.target` suffix. Subdomains like `www.uptrue.io` still match correctly. 17 unit tests cover acceptance criteria + the false-positive cases. Applied across all 5 engine query functions (Perplexity / OpenAI-shape / Anthropic / Exa / Bing).
- **AI Visibility llms.txt empty-domain hardening (engineering-app#54).** Client-side `domain.trim()` + non-empty engine check before any network call (HTML5 `required` was letting whitespace through). `res.json()` now wrapped in its own try/catch so non-JSON 5xx bodies can't propagate as `Cannot read properties of undefined` and white-screen the dashboard.

### Chore
- **Pin Node engines floor (engineering-app#87).** Added `engines.node: ">=20.0.0"` to package.json. Next.js 16 already requires Node 20, and `AbortSignal.timeout()` (used in 23 places) requires Node 17.3+ — pinning at 20 covers both and lets `npm install` fail loud on older runtimes.

### Cost / Infra
- **Logger honours `LOG_LEVEL` env var.** Added an env-var override to `lib/utils/logger.ts` so production can be set to `LOG_LEVEL=warn` to drop routine info logs from Vercel Observability event volume (which bills per-event over the included pool). Default behaviour is unchanged: dev shows debug+, staging/prod show info+. Set `LOG_LEVEL=warn` in Vercel production env vars after deploy to take effect. Fully reversible — unset the env var or set `LOG_LEVEL=info` to restore the prior verbosity. Expected saving: $15-20/mo on the Observability Events line.
- **Vercel cost runaway — disabled redundant Git Integration auto-deploys.** Bill for ~25 days hit $120.84 against a $20 included credit; root cause was double-builds on every push (GitLab CI's `vercel deploy` AND Vercel's Git Integration both firing on `dev` and `master`, plus Vercel auto-building every feature branch). Fix: added `"git": { "deploymentEnabled": false }` to `vercel.json` so GitLab CI is the sole deployer. GitLab CI is already restricted to `dev` and `master` via `only:` blocks in `.gitlab-ci.yml`, so feature branches no longer trigger any Vercel build. Domain aliasing for `dev.uptrue.io` continues to work via the explicit `vercel alias set` step in `.gitlab-ci.yml`. Expected saving: ~50% of the build-minutes line, ~$35-50/mo.

### Fixed
- **Blog content corruption — permanent fix.** The May 2 calendar-generator regression that saved raw markdown into the JSONB content column has been closed off at four layers: (1) `normaliseContent` helper in `lib/db/blog-posts.ts` wraps every write into an object shape, (2) admin editor stops double-encoding via `JSON.stringify` and now sends CTA fields separately so they aren't silently dropped, (3) admin Publish button is disabled when body is empty + server-side guard rejects publish-with-no-content, (4) DB-level CHECK constraint in migration `00103` makes a non-object content value impossible regardless of caller. Calendar-generator orphan recovery and the public blog renderer were also hardened. Test plan: [docs/test-plans/2026-05-07-blog-content-shape-permanent-fix.md](docs/test-plans/2026-05-07-blog-content-shape-permanent-fix.md).

## v1.0.0 — 17 April 2026 — First Public Release

### What's in v1.0.0

This is the first stable release of Uptrue — a full-stack SaaS website monitoring platform.

---

### Authentication & Accounts
- Magic link + Google OAuth sign-in
- Organisation-based multi-tenancy with Row Level Security
- Session management, auto-logout after 24h inactivity
- Super admin panel (Google OAuth, whitelist-gated)

---

### Monitoring Suite — 23 Monitor Types

**Core (original 10):**
- HTTP/HTTPS Uptime
- SSL Certificate (expiry alerts, validity)
- DNS Records (change detection)
- Domain Expiry (renewal alerts)
- Keyword Detection (positive + negative keywords)
- Port Check
- API Endpoint (GET/POST/PUT/DELETE, custom headers)
- Ping / Reachability
- Heartbeat Monitor (cron job monitoring)
- Page Change Detection

**Advanced (new in v1.0.0 — 13 types):**
- Security Headers (CSP, HSTS, X-Frame-Options scoring)
- Response Time Threshold
- robots.txt Change Detection
- IP Address Change
- MX Health
- WHOIS Registrar Change
- Sitemap Validity
- Redirect Chain
- SPF / DMARC Validity
- Blacklist Check (4 DNSBL zones)
- Page Size
- Cookie Consent Presence
- Nameserver Change

**Check engine:**
- Two-confirmation down detection (prevents false positives)
- Multi-region ready (single region at launch)
- SSRF protection on all HTTP-based checkers
- Check intervals: 30s / 1m / 3m / 5m / 10m / 30m / 1h (plan-gated)

---

### Alerting
- Email alerts
- Slack integration
- Microsoft Teams integration
- Webhook (HMAC-SHA256 signed payloads)
- Severity levels: P1 Critical → P4 Low
- Incident creation, confirmation, and auto-resolution

---

### Status Pages
- Public status pages with custom slug
- Uptime history bars (30/60/90 day)
- Email subscribe for external stakeholders
- Time range selector
- Custom domain support (Scale plan)

---

### AI Reports
- Executive summary generation via Claude API
- Weekly and on-demand reports
- Plain English incident analysis

---

### Billing
- Stripe subscriptions (monthly + annual)
- Stripe Customer Portal (self-serve upgrade/downgrade/cancel)
- Webhook-driven plan enforcement

**Plans at v1.0.0:**
| Plan | Price | Monitors | Interval |
|---|---|---|---|
| Free | £0 | 3 | 10 min |
| Lite | £10/yr | 5 | 1 min |
| Builder | £15/mo | 50 | 1 min |
| Scale | £39/mo | 250 | 30 sec |

---

### Dashboard UX
- Responsive — works on mobile and desktop
- Dark mode with system preference detection
- Bulk actions (pause, delete, change severity)
- Toast notifications
- Breadcrumb navigation
- Monitor type icons for all 23 types
- 50/50 create monitor form with contextual help panel (description, how to use, FAQs)
- Monitor filter by type, status, severity

---

### SEO & Content
- 23 landing pages at `/monitoring/[slug]` — one per monitor type
- `/monitoring` index page — full suite showcase
- Static generation with `generateStaticParams`
- Per-page metadata and structured content

---

### Legal
- Terms of Service
- Privacy Policy
- Cookie Policy
- Acceptable Use Policy
- Data Processing Agreement (for Agency customers)
- AI Content Disclaimer (outage blog)

---

### Outage Blog (Auto-publish)
- Automated outage detection and blog generation
- Social posting (X, LinkedIn)
- Human approval gate before publish
- Legal disclaimer on all auto-generated posts
- Hedged language in AI prompts
- Takedown/corrections email: reports@uptrue.io

---

### Database
- 27 tables with full RLS policies
- Supabase PostgreSQL (Frankfurt region — EU data residency)
- Migrations: 00001 → 00072

---

### Infrastructure
- Next.js 16.2.1 (App Router, Turbopack)
- Deployed on Vercel Pro
- Vercel Cron for check runner
- TypeScript strict mode throughout

---

## Rollback Instructions

To roll back to v1.0.0:

```bash
git checkout v1.0.0
```

Database rollback: migrations are sequential — contact DB admin to reverse from current migration back to 00072.

The tag `v1.0.0` is pinned to the master branch commit at time of release.
