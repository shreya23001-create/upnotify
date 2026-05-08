# Uptrue — Changelog

## Unreleased — dev branch

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
