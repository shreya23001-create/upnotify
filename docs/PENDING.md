# Uptrue — Pending Items & Backlog
# ============================================================
# Everything outstanding: pre-launch blockers, backlog items,
# deferred features, blocked tasks, and technical debt.
# Update this after every session.
# Last updated: April 2026
# ============================================================

---

## 🔴 PRE-LAUNCH BLOCKERS (Must ship before go-live)

| Item | Why It's Blocking | Owner | Status |
|---|---|---|---|
| External check runner (Railway/VPS) | Vercel IPs are blocked by shared hosting — HTTP/Ping/Page Size checks return "fetch failed" | Alex | Not started — no Railway account yet |
| X (Twitter) credentials | Social posting for outage blog is wired, just needs live env vars | Boss | Credentials needed |
| LinkedIn credentials | Same as above | Boss | Credentials needed |
| Email alerts end-to-end test (Resend) | Alert delivery wired but not confirmed working in production | Alex | Needs prod test |
| Audit logging implementation | Immutable audit trail required per security spec | Alex | Not started |

### External Check Runner — What's needed to unblock
1. Boss creates Railway account (or Hetzner/DigitalOcean VPS)
2. Alex runs migration: add `preferred_runner varchar DEFAULT 'vercel'` to `monitors` table
3. Alex updates `getDueMonitors()` to accept runner filter
4. Deploy same codebase to Railway pointing to same Supabase
5. Set up Railway cron: `GET /api/cron/check-runner?runner=external` every minute
6. Admin UI: assign runner per monitor (or auto-detect by type)

---

## 🟡 V1 BACKLOG (Post-launch, pre-Phase 1.5)

### Landing Pages for Original 10 Monitor Types
The 13 new monitor types got landing pages in v1.0.0. The original 10 still need theirs.

| Page | URL | Status |
|---|---|---|
| HTTP Uptime | `/monitoring/http-uptime` | ❌ Missing |
| SSL Certificate | `/monitoring/ssl-certificate` | ❌ Missing |
| Domain Expiry | `/monitoring/domain-expiry` | ❌ Missing |
| DNS Records | `/monitoring/dns-records` | ❌ Missing |
| Keyword Detection | `/monitoring/keyword-detection` | ❌ Missing |
| Port Check | `/monitoring/port-check` | ❌ Missing |
| Ping / Reachability | `/monitoring/ping-reachability` | ❌ Missing |
| API Endpoint | `/monitoring/api-endpoint` | ❌ Missing |
| Heartbeat | `/monitoring/heartbeat` | ❌ Missing |
| Page Change Detection | `/monitoring/page-change-detection` | ❌ Missing |

**Implementation:** Use existing `app/monitoring/[slug]/page.tsx` pattern. AI-generate content via Claude API. Static generation with `generateStaticParams`.

### SQL Query Library
Any working SQL query must be saved to `knowledge-base/technical/sql-queries.md` with:
- What it does
- When to use it
- What columns/values to watch for

**Status:** Ongoing — save after every session that runs a confirmed-working SQL query.

### GitHub Org Setup
- `uptrue-io/agent-workspace` — create and populate
- `uptrue-io/knowledge-base` — create and populate
- `uptrue-io/marketing` — create
- VS Code multi-root workspace file

---

## 🔵 PHASE 1.5 BACKLOG

### Free Domain Health Scan
- **What:** Homepage CTA scan — no signup, runs 5–6 checks, shows results, drives signup
- **Files to create:** `app/scan/page.tsx`
- **Reuses:** `lib/checkers/http.ts`, `ssl.ts`, `security-headers.ts`, `spf-dmarc.ts`, `blacklist.ts`, `redirect-chain.ts`
- **Priority:** High — primary conversion mechanic on homepage
- **Estimate:** ~1 day

### NOC Wallboard View (Builder/Scale)
- **What:** Grid view of all monitors, colour-coded by status, auto-refreshes, designed for TV/second screen
- **Files to create:** `app/(dashboard)/noc/page.tsx`, `components/noc/` 
- **Estimate:** ~4 hours

### Mobile Responsiveness QA Pass
- **What:** Full QA on all dashboard pages on iOS Safari + Android Chrome
- **Priority pages:** Monitor list, create monitor form, status page management, billing
- **No code expected** — mostly CSS fixes

### Team Invite Flow
- **What:** Invite team members by email, role selection, accept via email link
- **Files:** `lib/db/team.ts`, `app/api/v1/team/invite/route.ts`, invite email template
- **Deferred from V1 — moved to Phase 1.5**
- **Estimate:** ~1 day

### Reddit Auto-Reply Engine (Approval-Gated)
- **What:** Monitor Reddit for mentions → generate draft replies via Claude → human approval gate → post
- **Constraint:** NEVER auto-post. Approval always required.
- **Files to create:** Monitoring script, approval inbox UI in admin
- **Estimate:** ~2 days

### Pricing Fix
- Verify Stripe + Razorpay annual pricing correctly reflected everywhere
- Test full upgrade/downgrade/cancel cycle with real test cards

---

## 🟢 PHASE 1.75 BACKLOG — AI Search Console

All of the below are Phase 1.75. Do not start until Phase 1.5 ships.

- [ ] LLM Citation Checker — ChatGPT, Gemini, Perplexity, Claude, Mistral, Cohere
- [ ] Citation trending dashboard
- [ ] Competitor citation benchmarking
- [ ] Citation drop alert
- [ ] LLM.xml / llms.txt writer (auto-generate AI sitemaps)
- [ ] Citation public leaderboard
- [ ] BYOK API key encryption (`AI_ENGINE_ENCRYPTION_SECRET`)

---

## ⚪ PHASE 2 BACKLOG (Not started — waiting for 500 paying customers)

### Legal
- [ ] UK fintech lawyer consultation — Stripe Connect platform payments sign-off
- [ ] Written legal confirmation before any Stripe Connect code ships

### Architecture
- [ ] Agency multi-client dashboard
- [ ] Stripe Connect wiring (after legal)
- [ ] White-label (custom domain, branding removal)
- [ ] Multi-workspace support

### Developer Platform
- [ ] Public REST API (CRUD for monitors, incidents, reports)
- [ ] Node.js SDK
- [ ] Python SDK
- [ ] Go SDK
- [ ] PHP SDK
- [ ] OpenAPI docs
- [ ] Custom metric ingestion API
- [ ] Heartbeat SDK (drop-in for cron jobs)

### Webhook Engine v2
- [ ] Filter by event type + monitor type
- [ ] Retry with exponential backoff + dead letter queue
- [ ] Webhook logs in dashboard (last 100 events)

### Integrations
- [ ] Zapier native triggers
- [ ] Make (Integromat) templates
- [ ] n8n templates

### Support Ticketing + AI Chatbot
- [ ] Full helpdesk (tickets, SLA timers, canned responses)
- [ ] Claude-powered deflection chatbot
- [ ] White-label helpdesk for Agency plan

### AI Voice Calling
- [ ] ElevenLabs voice synthesis integration
- [ ] Twilio call placement integration
- [ ] 100 calls/month pool on Agency
- [ ] Call outcome logging
- [ ] Over-limit fallback to email

---

## ⚫ PHASE 2.5 BACKLOG — WordPress Plugin

All of the below are Phase 2.5. Do not start until core product has paying customers.

- [ ] WordPress plugin scaffold (runs on target WP site)
- [ ] Keyword monitoring module
- [ ] Security module (malicious code, new admin users, plugin changes)
- [ ] Content health module (broken links, missing alt, thin content)
- [ ] SEO integrity module
- [ ] WooCommerce module
- [ ] Access & integrity module
- [ ] Community keyword pool (opt-in) — Builder/Scale only
- [ ] Uptrue API endpoint to receive plugin signals
- [ ] WordPress.org plugin submission

---

## 🛠️ TECHNICAL DEBT

| Issue | Priority | Notes |
|---|---|---|
| Stripe Connect platform payments | 🔴 High | Requires UK fintech lawyer sign-off before any code ships |
| External check runner | 🔴 High | Vercel IPs blocked by shared hosting — pre-launch blocker |
| Multi-region check runner | 🟡 Medium | Single region at launch. Add EU + US in Phase 2. |
| Email alert delivery test in prod | 🔴 High | Wired but unconfirmed in production |
| Audit logging implementation | 🔴 High | Required per security spec — not yet built |
| ElevenLabs free tier limit | 🟢 Low | Very limited — upgrade quickly once voice calls launch |
| Agency blog / landing pages | 🟢 Low | Deferred to V2 — market as "coming soon" |

---

## 🔐 ENV VARS STILL NEEDED (Production)

These are in `.env.example` but the real values have not been confirmed in Vercel production env vars:

| Var | Status | Notes |
|---|---|---|
| `X_CONSUMER_KEY` | ❌ Missing | Boss to provide |
| `X_CONSUMER_SECRET` | ❌ Missing | Boss to provide |
| `X_ACCESS_TOKEN` | ❌ Missing | Boss to provide |
| `X_ACCESS_SECRET` | ❌ Missing | Boss to provide |
| `X_BEARER_TOKEN` | ❌ Missing | Boss to provide |
| `LINKEDIN_ACCESS_TOKEN` | ❌ Missing | Boss to provide |
| `LINKEDIN_MEMBER_ID` | ❌ Missing | Boss to provide |
| `LINKEDIN_ORGANIZATION_ID` | ❌ Missing | Boss to provide (for org posting) |
| `SPAMHAUS_DQS_KEY` | ❌ Missing | Needed for blacklist checker |
| `RESEND_WEBHOOK_SECRET` | ❓ Confirm | Email delivery confirmation webhook |

---

## 📋 NICE TO HAVE (No Phase Assigned)

- Monitor groups / tags for bulk management
- Maintenance window scheduling via API
- Status page custom CSS
- Custom notification templates (user-editable)
- Export check results as CSV
- Monitor duplication (copy settings to new monitor)
- Bulk import monitors from CSV
- Zapier / Make integration (Phase 2, but spec the events now)
- Referral programme (+5 monitors per referral)

---

*Last updated: April 2026*
*Owner: Sachin Diwaker*
*Update this file at the start and end of every work session.*
