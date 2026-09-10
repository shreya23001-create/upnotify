# Uptrue — Decisions Log
# ============================================================
# Every significant decision made about the product, business
# model, technical architecture, and legal compliance.
# Includes what was rejected and why.
# Last updated: April 2026
# ============================================================

---

## HOW TO USE THIS FILE

Each entry includes:
- **Decision** — what was decided
- **Rationale** — why this decision was made
- **Alternatives considered** — what was rejected
- **Date** — when the decision was made
- **Status** — Active / Superseded / Under review

---

## BUSINESS MODEL DECISIONS

### 1. Agency Pricing: £149 One-Time + 75/25 Revenue Split
**Decision:** Agencies pay £149 once and never again. Uptrue earns 75% of all agency client billing revenue. Agency keeps 25%.

**Rationale:**
- £149 removes payment friction / churners — agencies who can't afford £149 can't run an agency
- 75/25 splits scales with agency success — as agency grows, Uptrue earns more without more work
- Agencies WANT zero recurring fees — easier to sell to their accounting teams
- 200+ client agencies: reviewed under custom enterprise agreement

**Alternatives rejected:**
- Monthly agency fee (e.g. £149/mo) — too easy to churn, no long-term lock-in
- Per-client-workspace billing direct to Uptrue — removes agency control over their margins
- Flat unlimited (e.g. £499/mo) — doesn't scale with agency size

**Status:** ✅ Active

---

### 2. Direct User Pricing: 4-Tier Subscription (Free / Lite / Builder / Scale)
**Decision:**
| Plan | Price | Monitors | Interval |
|---|---|---|---|
| Free | £0 | 3 | 10 min |
| Lite | £10/yr | 5 | 1 min |
| Builder | £15/mo | 50 | 1 min |
| Scale | £39/mo | 250 | 30 sec |

**Rationale:**
- Free → Lite gap is tiny (£10/yr = 83p/month) — removes "price objection" on first upgrade
- Builder is the main commercial plan — strong monitor limit at accessible price
- Scale targets power users and small agencies
- Annual option gives Lite users a "deal" and locks in commitment

**Alternatives rejected:**
- Original plan names (Usage-based / Starter / Pro): renamed to Free / Lite / Builder / Scale for clearer positioning
- Usage-based pricing (pay per monitor): too complex, unpredictable costs put customers off

**Status:** ✅ Active — prices in DB, admin-editable

---

### 3. No Free Trials — Ever
**Decision:** Free plan is the entry point. No time-limited trials.

**Rationale:**
- Trials create artificial urgency then churn — Free plan creates genuine habit
- Support overhead of trial users who never convert is high
- Lite at £10/yr is low enough that price is never the barrier

**Status:** ✅ Active

---

### 4. No Validation Needed — Founder IS the Market
**Decision:** Start building immediately, no customer discovery phase.

**Rationale:**
- Founder runs a UK web agency monitoring hundreds of client sites on UptimeRobot
- He is the exact ICP (ideal customer profile) — building for his own pain
- Every feature decision can be validated against his own real use case

**Status:** ✅ Active

---

## PRODUCT SCOPE DECISIONS

### 5. V1 = Direct Users Only. Agency Model is Phase 2.
**Decision:** V1 targets direct users (developers, site owners, small teams). Agency model (multi-client dashboard, Stripe Connect, white-label) is Phase 2.

**Rationale:**
- Agency model requires UK fintech lawyer sign-off on Stripe Connect platform payments
- Multi-workspace architecture is a significant build — not needed to reach first 500 users
- Direct user validation comes first, then agency layer on top

**V1 scope hard boundaries:**
- ❌ Agency multi-client dashboard
- ❌ Stripe Connect / revenue split
- ❌ White-label
- ❌ Multi-workspace
- ❌ Team invite flow (moved to Phase 1.5)

**Status:** ✅ Active

---

### 6. Webhook-First Integrations (No Native Jira/Linear/etc.)
**Decision:** Universal outbound webhook + code snippets for popular tools, not native integrations.

**Rationale:**
- Building native integrations for 10+ tools is 6+ months of maintenance work
- Universal webhook handles 100% of use cases
- Ready-made code snippets (deployable Next.js API routes) = 80% of the convenience, 5% of the cost
- n8n / Zapier / Make templates cover the no-code audience

**Status:** ✅ Active

---

### 7. Competitor Page Tracking in V1
**Decision:** Include "Page Change Detection" monitor type in V1 — competitor tracking.

**Rationale:**
- Built on existing HTTP checker with hash comparison — minimal extra effort
- Real differentiator for agencies wanting to track competitor website changes
- Strong marketing hook: "Watch your competitors silently"

**Status:** ✅ Active

---

### 8. AI Voice Calling Architecture (Phase 2)
**Decision:** ElevenLabs (voice synthesis) + Twilio (call placement). 100 calls/month cap on Agency plan.

**Rationale:**
- 100 calls/month cap: "If you're getting 100 incident calls, there's something seriously wrong with your infrastructure" — natural limit
- ElevenLabs free tier first, upgrade quickly once voice calls launch
- Max overage: £0.10/call, capped at £50/month (protects Uptrue from runaway costs)

**Status:** 📋 Phase 2 (architecture decided, not yet built)

---

### 9. Mobile Responsive Web Only (No Native Apps at Launch)
**Decision:** Mobile-responsive web at launch. No iOS or Android apps.

**Rationale:**
- App Store review cycles add unpredictable delay to releases
- Responsive web covers 80% of mobile use case (checking status, viewing incidents)
- Revisit after launch based on user demand

**Status:** ✅ Active — revisit post-launch

---

### 10. English First, i18n Architecture from Day One
**Decision:** UI in English at launch. Architecture built to support i18n. Add languages based on where signups come from.

**Rationale:**
- i18n retrofit is painful — bake in the architecture early
- Which languages to add depends on actual signup geography — don't guess

**Status:** ✅ Active

---

### 11. Starter Plan Has No Support (Self-Serve Only)
**Decision:** Builder plan: no SLA, self-serve docs only. Scale: 1 business day priority email + AI chat.

**Rationale:**
- Builder at £15/mo cannot economically support 1:1 human support
- AI chatbot deflects 40–60% — remaining tickets handled by Scale+ priority
- Docs + chatbot must be exceptional to make Builder self-serve viable

**Note:** Original plan was named "Starter" — renamed to "Builder" in final pricing.

**Status:** ✅ Active

---

### 12. AI Predictive Alerts in Scale (Not Agency-Only)
**Decision:** AI predictive alerts available on Scale plan, not restricted to Agency.

**Rationale:**
- Makes Scale a strong upgrade from Builder — not just "more monitors" but smarter monitoring
- Predictive alerts require 90 days minimum data — naturally filters out new/trial users

**Status:** ✅ Active

---

## TECHNICAL ARCHITECTURE DECISIONS

### 13. Two-Confirmation Down Detection
**Decision:** Site "down" only confirmed after two consecutive failed checks from two regions.

**Rationale:**
- False positives from transient network blips destroy user trust
- Single-region check failure rate is ~2-3% even for healthy sites
- Second check from different region essentially eliminates false positives
- Flap events (first fail, second pass) logged separately for debugging

**Status:** ✅ Active — in check runner

---

### 14. Service Abstraction Layer Required
**Decision:** All third-party SDK calls go through `/lib/services/` wrappers. No direct SDK imports in pages or API routes.

**Rationale:**
- Migration from Vercel → AWS or Supabase → RDS becomes "change service file + env vars"
- Testability: mock service layer in unit tests, real in integration tests
- Prevents vendor lock-in leaking into business logic

**Status:** ✅ Active — enforced in code review

---

### 15. No `console.log` — Structured Logger Only
**Decision:** All logging via `lib/utils/logger.ts`. No direct `console.log` anywhere.

**Rationale:**
- Structured logs (JSON) are searchable in Sentry and log aggregators
- Prevents sensitive data leaking into logs accidentally
- Consistent format across all modules

**Status:** ✅ Active

---

### 16. Pricing Never Hardcoded
**Decision:** All prices, limits, and feature flags live in the `plans` table in Supabase. Admin-editable. Landing page, dashboard, and enforcement all read from the same source.

**Rationale:**
- Price changes without code deploy = instant
- A/B testing pricing is possible
- Single source of truth — pricing page can never drift from enforcement

**Status:** ✅ Active

---

### 17. External Check Runner for Vercel IP Blocks (Pre-Launch)
**Decision:** Before go-live, route Vercel-blocked monitors to an external runner on Railway or Hetzner VPS.

**Rationale:**
- Vercel's egress IPs are well-known and frequently blocked by budget hosting providers (cPanel, Plesk)
- HTTP, Ping, Page Size, robots.txt, Security Headers checkers can all return "fetch failed" on Vercel
- External runner has clean IP

**Implementation planned:**
- `preferred_runner` column on `monitors` table (default: `'vercel'`)
- Check runner route reads `?runner=vercel|external` query param
- External deployment: same codebase, same Supabase credentials, cron calls `/api/cron/check-runner?runner=external`

**Status:** ❌ Not yet built — pre-launch task. No Railway account yet.

---

### 18. OTP Required for Live/Test Mode Switch
**Decision:** Every switch from Test to Live mode in production requires a 6-digit OTP sent to sachindiwaker@gmail.com.

**Rationale:**
- Prevents catastrophic accidental activation of production payment keys in test context
- 3 wrong attempts = 30-minute lockout (prevents brute force)
- If OTP email fails: mode switch blocked entirely (fail secure)

**Status:** ✅ Active

---

### 19. White-Label Domain Verification Required
**Decision:** Custom domains for Agency status pages require DNS TXT verification before activation.

**Rationale:**
- Protects platform legally — prevents using Uptrue to host phishing sites
- Prevents domain squatting on other brands' domains
- Same verification also required before white-label email sending (prevents email spoofing)

**Status:** ✅ Architecture decided — Phase 2 implementation

---

## LEGAL & COMPLIANCE DECISIONS

### 20. Outage Blog — Harvey's Legal Safeguards
**Decision:** Auto-generated outage blog posts must always include:
1. Disclaimer box (auto_generated flag in DB)
2. Hedged language in prompt ("reportedly", "appears to be" — never "is down")
3. Reddit usernames and X handles stripped from content
4. Takedown/corrections contact: shreya23001@gmail.com
5. AI Disclaimer policy page with corrections process
6. LinkedIn posts from organization account (not personal) when `LINKEDIN_ORGANIZATION_ID` is set

**All of the above shipped in v1.0.0. ✅**

**Dropped decision:** 15-minute delay before approval notification — human approval gate is sufficient on its own.

**Status:** ✅ Active

---

### 21. Stripe Connect Requires UK Fintech Lawyer Sign-Off
**Decision:** Stripe Connect platform payments (75/25 split) CANNOT go live without written confirmation from a UK fintech lawyer.

**Rationale:**
- Stripe Connect is designed to avoid FCA registration in many cases
- But Uptrue's specific model (processing and splitting third-party payments) needs explicit legal confirmation
- Risk: operating as an unlicensed payment intermediary is a criminal offence in the UK

**Status:** 🔴 Blocked — Phase 2. Legal consultation before any code ships.

---

### 22. Impersonation is Read-Only + Audit Logged
**Decision:** Super admin impersonation of any user account is always read-only and always audit logged.

**Rationale:**
- Read-only prevents accidental data changes on behalf of users
- Audit log creates legal trail — if user disputes action, can prove it wasn't admin
- Payment changes during impersonation explicitly blocked

**Status:** ✅ Active

---

## MARKETING / POSITIONING DECISIONS

### 23. Category Creation: "Website Monitoring Suite"
**Decision:** Never say "uptime monitoring." We are a "Website Monitoring Suite."

**Rationale:**
- Competitors own "uptime monitoring" — competing in that category means being the 10th uptime monitor
- Uptrue's moat is breadth — 23 monitor types covering uptime, security, DNS, content, performance, compliance
- Category creation = no direct comparison, premium positioning

**Positioning line:** "Your website has 23 things that can go wrong. Most tools check one. Uptrue monitors all of them."

**Status:** ✅ Active — applied to all copy

---

### 24. Free Domain Health Scan as Primary Homepage CTA
**Decision:** Homepage hero drives visitors to scan their own domain — no signup required.

**Rationale:**
- Shows users their own real problems — highest-converting proof of value
- Removal of signup friction = more conversions before asking for commitment
- Scan results have natural CTA: "Save and continue monitoring" → signup

**Checks to run in scan:** SSL, security headers, SPF/DMARC, blacklist, redirect chain, robots.txt

**Status:** 📋 Phase 1.5 — planned

---

### 25. Autoblog SaaS as Potential Spin-Off
**Decision:** Uptrue's autoblogging pipeline (feed fetcher + Claude generator + approval gate) could be packaged as a standalone BYOK SaaS.

**Rationale:**
- BYOK (bring your own Claude API key) removes API cost from COGS entirely
- Reuses existing Uptrue code with minimal new build
- Distinct market: content agencies, niche publishers, SaaS companies wanting a blog

**Status:** 📋 Idea — run Donna's intake interview before any build work starts

---

### 26. Hosting Company Comparison Pages (SEO Play)
**Decision:** Scan major hosting companies (Fastcomet, Bluehost, SiteGround, etc.) and create public Uptrue monitoring pages for each.

**Rationale:**
- Data-driven SEO content: "Bluehost vs SiteGround uptime comparison 2026"
- Uptrue's own product generates the data — zero incremental content cost
- High-intent search traffic: people comparing hosting companies are actively evaluating services

**Status:** 📋 Planned — pairs with public tracker/leaderboard feature already in v1.0.0

---

## REJECTED IDEAS

| Idea | Rejected because |
|---|---|
| Build native Jira/Linear integrations | 6 months maintenance, webhook + snippets achieves same goal |
| Custom auth (not Supabase) | Massive security risk, no value over Supabase Auth |
| iOS/Android apps at launch | App Store friction, responsive web covers MVP |
| Shopify plugin | Locked SaaS, 20% rev to Shopify, no server-side internal access |
| Wix/Webflow/Squarespace plugins | Fully hosted, no internal server access possible |
| Joomla plugin | Declining install base |
| Free trials | Creates churn, Free plan achieves the same goal without pressure |
| Google Safe Browsing check | External API key cost, niche use case |
| Screenshot visual diff at V1 | High storage cost, complex diff logic |
| Transaction monitoring at V1 | Requires headless browser (Playwright), high infra cost |
| Server resource monitoring at V1 | Requires installed agent — different distribution model |

---

*Last updated: April 2026*
*Owner: Sachin Diwaker*
