# DEPENDENCY MAP — Uptrue
# ================================================
# Living document. Updated every time a module is added or changed.
# Owner: Vikas (CTO). Enforced by: Donna (COO).
# Last updated: 2026-04-03
# ================================================

## QUICK REFERENCE — If You Change X, Test Y

| If You Change | Test These |
|---|---|
| `config.ts` | **EVERYTHING** — all services, clients, API routes |
| `supabase/server.ts` or `admin.ts` | All DB modules, all authenticated pages |
| `db/users.ts` | Auth, dashboard, admin, billing, team, impersonation |
| `db/monitors.ts` | Check runner, monitor pages, stats, status pages |
| `db/incidents.ts` | Check runner, incident pages, status pages, reports |
| `db/subscriptions.ts` | Plan limits, billing, Stripe webhook, feature gates |
| `db/check-results.ts` | Uptime bars, status pages, reports, score |
| `db/organisations.ts` | Org settings, billing, team management |
| `db/status-pages.ts` | Public status pages, badges, subscriber notifications |
| `services/checker.ts` | ALL monitor types, check runner cron |
| `services/alert-dispatcher.ts` | ALL alert channels, check runner |
| `services/email.ts` | ALL emails — alerts, nurture, team invites |
| `services/stripe.ts` | Billing, checkout, webhook, portal |
| `utils/plan-limits.ts` | Monitors, workspaces, team invite, billing UI, Compete access |
| `db/ecom-products.ts` | Compete dashboard, compete API routes, compete webhook |
| `services/price-extraction.ts` | Compete extract API route |
| `auth/helpers.ts` | Route protection — public vs protected vs admin |
| `proxy.ts` | ALL routing, auth redirects, admin access |
| `types/database.types.ts` | ALL DB queries — type errors everywhere |

---

## RED FLAGS — Change With Extreme Caution

1. **config.ts** — entire app dies if broken
2. **supabase/server.ts & admin.ts** — all database access fails
3. **db/users.ts** — auth broken, nobody can log in
4. **db/monitors.ts** — monitor system broken
5. **services/checker.ts** — no checks run
6. **services/alert-dispatcher.ts** — users never notified

## SAFE TO REFACTOR

- `lib/checkers/*` (individual checker implementations)
- `lib/services/score.ts` (isolated feature)
- `lib/services/ai.ts` (not critical yet)
- `lib/services/price-extraction.ts` (Compete feature — isolated)
- `lib/db/ecom-products.ts` (Compete data layer — isolated)
- UI components in `/components` (visual only)
- UI components in `/components/compete` (Compete feature UI — isolated)

---

## CORE INFRASTRUCTURE (Changes break everything)

### config.ts
- **Purpose:** Centralized env var management
- **Depends on:** process.env (only file allowed to)
- **Used by:** 25+ files — supabase clients, stripe, email, AI, plan-limits, proxy
- **Impact:** App cannot start

### logger.ts
- **Purpose:** Structured logging
- **Depends on:** environment.ts
- **Used by:** 40+ files — virtually everything
- **Impact:** All error handling silent

### supabase/server.ts, admin.ts, client.ts, proxy.ts
- **Purpose:** Create Supabase clients for different contexts
- **Depends on:** config.ts, database.types.ts
- **Used by:** All db/ modules, API routes
- **Impact:** All database access fails

### database.types.ts
- **Purpose:** TypeScript types for DB schema
- **Depends on:** Nothing (generated)
- **Used by:** All supabase clients, all db modules
- **Impact:** Schema changes break entire type system

### plan-limits.ts
- **Purpose:** Plan limit enforcement
- **Depends on:** supabase/admin.ts
- **Used by:** Monitor creation, workspace creation, team invite, feature gates
- **Impact:** Users can exceed plan limits

---

## DATA LAYER

### db/users.ts
- **Depends on:** supabase/server, supabase/admin, logger, impersonation
- **Used by:** proxy.ts, dashboard layout, admin layout, all API routes, email-nurture
- **Exports:** getCurrentUser(), getUserProfile(), getUsersByOrg()
- **Impact:** ALL auth broken

### db/organisations.ts
- **Depends on:** supabase/server, logger
- **Used by:** plan-limits, stripe, dashboard layout, API routes
- **Impact:** Org settings, billing, team broken

### db/monitors.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Monitor pages, check-runner cron, checker service
- **Impact:** Monitor creation, checking, status displays broken

### db/incidents.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Check-runner, dashboard, status pages
- **Impact:** Downtime not recorded

### db/alerts.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Alert pages, alert-dispatcher
- **Impact:** Alert creation and dispatch broken

### db/check-results.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Monitor detail, check-runner, status pages, reports, badges
- **Impact:** Uptime tracking broken

### db/subscriptions.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** plan-limits, billing checkout, stripe webhook
- **Impact:** Billing and plan enforcement broken

### db/status-pages.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Status page management, public status pages, badges
- **Impact:** Public status pages broken

### db/public-monitors.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Tracker pages, public-checks cron, badge API
- **Impact:** Public tracker broken

### db/plans.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Admin plans page, billing pricing table
- **Impact:** Plan management broken

### db/team.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Team API routes, settings page
- **Impact:** Team invites broken

### db/admin-roles.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Admin layout, proxy.ts, admin team page
- **Impact:** Admin access control broken

### db/email-nurture.ts
- **Depends on:** supabase/admin, logger
- **Used by:** Email nurture service, nurture cron
- **Impact:** Nurture emails broken

### db/competitor-monitors.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Competitors dashboard page, competitors API route
- **Impact:** Competitor monitoring feature broken (isolated)

### db/ecom-products.ts
- **Depends on:** supabase/server, supabase/admin, logger
- **Used by:** Compete dashboard page, compete API routes, compete webhook
- **Impact:** Compete feature broken (isolated)

### db/leaderboard.ts
- **Depends on:** supabase/admin, logger, public_monitors, public_check_results
- **Used by:** Leaderboard public page
- **Impact:** Leaderboard page broken (isolated)

### db/audit.ts, api-keys.ts, gdpr.ts, credit-rules.ts, reports.ts, maintenance-windows.ts, workspaces.ts
- Feature-specific modules with limited blast radius

---

## SERVICES LAYER

### services/checker.ts → ALL checkers
- **Depends on:** All lib/checkers/*.ts
- **Used by:** check-runner cron
- **Impact:** No monitors get checked

### services/alert-dispatcher.ts → email, slack, webhook
- **Depends on:** email.ts, slack.ts, webhook.ts, supabase/admin
- **Used by:** check-runner cron
- **Impact:** Users never notified

### services/email.ts → Resend
- **Depends on:** config.ts, logger
- **Used by:** alert-dispatcher, email-nurture, team invite
- **Impact:** All emails fail

### services/email-nurture.ts → email.ts + db/email-nurture.ts
- **Depends on:** email.ts, db/email-nurture.ts, config, logger
- **Used by:** nurture cron, onboarding API
- **Impact:** Nurture campaigns broken

### services/stripe.ts → Stripe SDK
- **Depends on:** config.ts, supabase/admin, logger
- **Used by:** billing checkout, stripe webhook
- **Impact:** Billing broken

### services/price-extraction.ts → fetch + HTML parsing
- **Depends on:** logger
- **Used by:** Compete extract API, Compete products API
- **Impact:** Compete price extraction broken (isolated)

### services/score.ts → checkers
- **Depends on:** checkers/http, ssl, dns, security-headers
- **Used by:** Score pages
- **Impact:** Score feature broken (isolated)

---

## CRON JOBS

### check-runner (daily)
- monitors.ts → checker.ts → check-results.ts → incidents.ts → alert-dispatcher.ts
- **Chain:** Fetch monitors → run checks → write results → create/resolve incidents → dispatch alerts

### public-checks (disabled on Hobby, needs external cron)
- public-monitors.ts → checkers/http.ts → public check results → public incidents

### nurture-emails (daily 8am)
- db/email-nurture.ts → services/email-nurture.ts → services/email.ts

---

## TESTING TIERS

### Tier 1: Core (test first)
config, supabase clients, logger, database types

### Tier 2: Auth (test second)
users.ts, proxy.ts, layouts, getCurrentUser

### Tier 3: Features (test next)
monitors, incidents, alerts, check-runner, plan-limits

### Tier 4: Integrations (test after)
Stripe, Resend email, Slack, webhooks

### Tier 5: Pages (end-to-end)
Dashboard, admin, public pages, score, tracker
