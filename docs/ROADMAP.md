# Uptrue — Product Roadmap
# ============================================================
# All phases, versions, and agreed features.
# What's in V1, what's in V1.5, V2, V2.5, and V3.
# Go/no-go decisions for scope included.
# Last updated: April 2026
# ============================================================

---

## CURRENT STATE — V1.0.0 (Shipped April 2026)

The first public release. Monitoring Suite with 23 monitor types, alerting, status pages, AI reports, and Stripe billing.

**Core shipped features:**
- ✅ 23 monitor types (10 core + 13 advanced)
- ✅ Two-confirmation down detection (false positive prevention)
- ✅ 4 alert channels (Email, Slack, Teams, Webhook)
- ✅ Public status pages with custom domain (Scale plan)
- ✅ AI executive reports (Claude API)
- ✅ 4 billing plans (Free / Lite / Builder / Scale) via Stripe
- ✅ Razorpay (India) wired up
- ✅ Dark mode + mobile responsive
- ✅ 23 SEO landing pages at `/monitoring/[slug]`
- ✅ Auto-publish outage blog + social posting (X, LinkedIn) — human approval gate
- ✅ Admin panel — users, plans, feature flags, CMS
- ✅ Legal pages (ToS, Privacy, AUP, DPA, AI Disclaimer)
- ✅ Cookie consent banner
- ✅ Dynamic sitemap
- ✅ 27 DB tables with full RLS, 72 migrations
- ✅ Email nurture system
- ✅ Public tracker / leaderboard

**Not yet done (V1 backlog — pre-launch):**
- ❌ Email alert delivery (Resend wired but not fully tested in prod)
- ❌ Audit logging implementation
- ❌ External check runner (Railway/VPS) for Vercel-blocked fetches
- ❌ X/LinkedIn credentials for social posting

---

## PHASE 1.5 — Polish + Power Features

**Trigger:** After V1 go-live. Target: May–June 2026.

### Stripe/Razorpay Pricing Fix
- Ensure annual pricing correctly reflected in all plan comparison tables
- Test full upgrade/downgrade/cancel cycle with real test cards

### Free Domain Health Scan
- Homepage CTA: scan any domain, no signup, 5–6 instant checks
- Results shown inline, CTA to save + continue with signup
- Files: `app/scan/page.tsx`, reuses `lib/checkers/`
- **Priority:** High — primary conversion tool on homepage

### NOC View (Builder/Scale)
- Network Operations Centre wallboard view
- All monitors displayed as grid — colour coded by status
- Auto-refreshes, no interaction needed
- Designed for TV/second screen in agency or operations team

### Mobile Responsiveness Polish
- Full QA pass on all dashboard pages on iOS Safari + Android Chrome
- Priority: Monitor list, create monitor form, status page management

### X/LinkedIn Social Posting (Credentials needed)
- Credentials blocked: Boss to provide `X_*` and `LINKEDIN_*` env vars
- Feature code is complete — just needs live credentials

### Team Invite Flow
- Invite team members by email
- Role selection at invite time (Admin, Manager, Viewer)
- Files: `lib/db/team.ts`, `app/api/v1/team/invite/route.ts`
- Email: Resend team invite template

### Reddit Auto-Reply Engine (Approval-gated)
- Monitors Reddit for mentions of monitored services/keywords
- Generates draft replies via Claude API
- Human approval gate before any post goes live
- **Constraint:** Approval-gated always — never auto-post to Reddit

---

## PHASE 1.75 — AI Search Console

**Trigger:** After Phase 1.5 ships. ~500 users target to start this.

**What it is:** Standalone module within Uptrue for LLM citation tracking.

### LLM Engine Citation Checker
- Queries: ChatGPT, Gemini, Perplexity, Claude, Mistral, Cohere
- User defines target keywords / questions
- System checks whether each LLM engine cites user's site in its response
- Results: citation rate per engine, trending, competitor benchmarking
- Alerts: citation dropped / new competitor mentioned

### LLM.xml / llms.txt Writer
- Auto-generates LLM-readable sitemaps so search AI engines index client sites correctly
- Format: `llms.txt` (plain English site description) + `llms-full.txt` (content detail)

### Citation Leaderboard
- Public leaderboard: which sites are most cited by AI engines for which topics
- SEO and social media play — drives organic discovery of Uptrue

### AI Engine Encryption
- User can supply their own API keys for LLM engines
- Keys encrypted at rest: AES-256
- **Env var:** `AI_ENGINE_ENCRYPTION_SECRET`

### Strategic Play
- Target: pitch this module to LLM companies at 500+ users
- Position Uptrue as the infrastructure for AI-era SEO

---

## PHASE 2 — Developer Platform + Agency Model

**Trigger:** After 500 paying customers. ~Q3 2026 estimate.

### REST API + SDKs
- Full public REST API for all monitor CRUD, incidents, reports
- SDKs: Node.js, Python, Go, PHP
- OpenAPI docs (auto-generated)
- Custom metric ingestion endpoint
- Heartbeat SDK — drop-in for cron jobs

### Webhook Engine v2
- Filtering by event type + monitor type
- Retry with exponential backoff + dead letter queue
- Webhook logs visible in dashboard (last 100 events)

### Zapier / Make / n8n Integrations
- Native triggers for all Uptrue webhook events
- Pre-built templates for common automations

### Agency Multi-Client Dashboard
- Monitor multiple client sites from one login
- Client workspace management
- Per-client billing configuration
- **V1 scope: NOT included — Phase 2 only**

### Stripe Connect (Agency Revenue Split)
- ALL client payments flow through Uptrue Stripe account
- Stripe Connect: automatic 75/25 split
- Weekly payouts to agencies
- Agency connects their Stripe via Connect OAuth
- **Legal requirement:** UK fintech lawyer sign-off before go-live

### White-Label
- Custom domain for agency dashboard and status pages
- Custom branding — remove Uptrue branding
- White-label billing emails
- White-label support helpdesk
- Google Tag Manager per agency (GTM, GA4, Meta Pixel)
- **V1 scope: NOT included — Phase 2 only**

### Multi-Workspace
- Single org with multiple workspaces (e.g. agency with separate client workspaces)
- **V1 scope: NOT included — Phase 2 only**

### Support Ticketing + AI Chatbot
- Full helpdesk with SLA timers
- Claude-powered deflection chatbot (target: 40–60% deflection)
- White-label helpdesk for Agency plan customers

### Custom Metric Ingestion
- SDK/API to push custom metrics into Uptrue
- Alert on custom metric threshold

---

## PHASE 2.5 — Platform Plugins (WordPress First)

**Trigger:** After core product has paying customers. Network effect only works with scale.

### WordPress Site Health Agent Plugin

**Architecture:**
- Plugin runs ON the target WordPress site (not Uptrue servers)
- Authenticated access — sees drafts, private posts, users, plugins
- Daily cron scan — sends signal to Uptrue only when something is found
- Uptrue handles alerting via existing channels

**Modules to build:**
1. **Keyword monitoring** — user-defined + Uptrue curated list + opt-in community pool
2. **Security** — malicious code injection, new admin users, plugin/theme changes, WP core version, failed logins, suspicious outbound links
3. **Content health** — broken internal links, missing alt text, thin content, stale content, duplicate meta, orphaned pages
4. **SEO integrity** — keyword cannibalisation, broken external links, redirect chains, missing schema
5. **WooCommerce** — out-of-stock products published, no-image products, price anomalies, abandoned products
6. **Access & integrity** — user role changes, silent content drift, broken embeds, database bloat

**Keyword Pool (community intelligence):**
- User-defined lists = always private
- Uptrue global curated list = all users
- Opt-in community pool = keyword patterns (never content snippets) shared across opted-in sites
- Pool access = Builder/Scale tier only
- Network effect: more sites → smarter detection

**Positioning:** "Uptrue sees what your visitors see. The WordPress plugin sees what your visitors don't."

**Competitor benchmark:** WP Umbrella (€1.99/site/mo, 60K installs) — match or exceed on price, win on breadth

### Platform Priority (in order)
1. WordPress — Phase 2.5 (1.5B sites, 43% of the web)
2. Magento / Adobe Commerce — evaluate after WP traction
3. Drupal — evaluate after WP traction

### Ruled Out
- Shopify — locked SaaS, 20% rev to Shopify, unreliable app store
- Webflow / Wix / Squarespace — fully hosted, no server-side access possible
- Joomla — declining install base

---

## PHASE 3 — Physical World

**Trigger:** After Phase 2 is established. ~2027+.

### IoT & Physical Infrastructure Monitoring
- Device SDKs: Rust / C++
- Sub-second check intervals
- MQTT protocol support
- Geofencing alerts
- Anomaly detection (ML-based)
- Use cases: drone fleets, vehicle monitoring, robotics, smart infrastructure

---

## V1 SCOPE BOUNDARIES — CONFIRMED NO-GOs

The following are **never to be included in V1** — do not suggest, build, reference, or mention in V1 marketing:

| Feature | Reason | Phase |
|---|---|---|
| Agency multi-client dashboard | Needs Stripe Connect legal sign-off, Phase 2 architecture | Phase 2 |
| Stripe Connect / agency revenue split | UK fintech lawyer consultation required | Phase 2 |
| White-label status pages & branding | Phase 2 architecture + legal | Phase 2 |
| Multi-workspace support | Phase 2 architecture | Phase 2 |
| Team invite flow | Phase 1.5 (moved from V1) | Phase 1.5 |
| Google Safe Browsing check | External API key cost, not worth it for V1 | V2 |
| Certificate Transparency monitor | Niche use case, low demand | V2 |
| Core Web Vitals monitor | Needs headless browser, high infra cost | V2 |
| Visual regression monitor | Screenshot diffing, high storage cost | V2 |
| Transaction monitor (Playwright) | High infra cost, complex setup | V2 |
| Server resource monitoring | Requires installed agent | V2 |
| Database connectivity check | Security/firewall complexity | V2 |
| Voice calls | ElevenLabs + Twilio, Phase 1.5 evaluation | Phase 2 |

---

## FEATURE FLAG STATUS (at V1.0.0)

| Feature | Flag | Status |
|---|---|---|
| AI Reports | `ai_reports` | On for Scale, off for Free/Lite/Builder |
| Predictive Alerts | `predictive_alerts` | On for Scale only |
| Custom Domain Status Pages | `custom_domain_status` | On for Scale only |
| API Access | `api_access` | On for Scale only |
| Webhook Push | `webhook_push` | On for Builder+ |
| Slack Alerts | `slack_alerts` | On for Builder+ |
| Teams Alerts | `teams_alerts` | On for Builder+ |

---

## DEFINITION OF DONE — NEW MONITOR TYPE

Before any new monitor type is marked done:
- [ ] `lib/checkers/[type].ts` — checker implementation
- [ ] `lib/services/checker.ts` — added to dispatcher map
- [ ] Supabase migration — type added to CHECK constraint
- [ ] `lib/types/database.types.ts` — union type updated
- [ ] `components/monitors/create-monitor-form.tsx` — in type selector
- [ ] `components/monitors/monitor-type-icon.tsx` — icon added
- [ ] `components/monitors/edit-monitor-form.tsx` — type-specific config fields
- [ ] `app/monitoring/[slug]/page.tsx` — SEO landing page
- [ ] `lib/utils/alert-copy.ts` — alert copy for all channels
- [ ] `components/monitors/monitor-type-insight.tsx` — insight component
- [ ] Help docs updated

---

*Last updated: April 2026*
*Owner: Sachin Diwaker*
