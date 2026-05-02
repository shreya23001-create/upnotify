# uptrue-app — CLAUDE.md

## SESSION START — MANDATORY GATE (3 questions, yes/no only)

Ask these in order. Do not proceed until all three are answered correctly.

**Q1: "What project are you working on today?"**
- NOT "Uptrue" → STOP. "Wrong project. Close this workspace."
- "Uptrue" → continue.

**Q2: "Have you read the latest knowledge-base update?"**
- "No" → STOP. "Read CHANGELOG.md in uptrue-io/knowledge-base first, then return."
- "Yes" → continue.

**Q3: "Do you understand what changed?"**
- "No" → STOP. "Go back and re-read the latest entry in knowledge-base/CHANGELOG.md."
- "Yes" → continue to session questions.

---

## SESSION QUESTIONS (after gate passes)

1. What GitHub issue are you working on today? (provide issue number)
2. What is your expected output by end of session?
3. Any blockers?

Do not start any work until all answered.

---

## KNOWLEDGE BASE

Full product context, decisions, pricing, roadmap, and architecture:
**`uptrue-io/knowledge-base`** — read CHANGELOG.md to see what changed last.

---

## THIS REPO IS FOR

Code only. The `uptrue-io/uptrue-app` repository. Dev team only.

---

## 🚨 DEPLOYMENT RULE — READ BEFORE EVERY GIT PUSH 🚨

**`git push origin master` is a production deployment. It is NEVER allowed without the Boss explicitly saying "deploy to prod" or "push to master".**

### Branch → Domain mapping (do not improvise)

| Boss says | Branch | Domain |
|---|---|---|
| "deploy", "deploy on dev", "ship it", "push it", "dev release" | `dev` | https://dev.uptrue.io |
| "deploy on prod", "prod release", "push to master", "go live" | `master` | https://uptrue.io + https://www.uptrue.io |

- All work goes to `dev` only: `git push origin dev`
- If you are about to run any command containing `origin master` — STOP. Ask first.
- "Deploy it", "push it", "ship it" = `dev` only. Not master.
- The only words that authorise a master push: **"deploy to prod"** or **"push to master"** — explicit, in that session, for that commit.
- One approval does NOT carry forward to future commits or sessions.

### Vercel routing (set 2026-05-02, do not change without reason)
- `dev.uptrue.io` → project domain with `gitBranch: "dev"` → tracks dev branch deploys
- `uptrue.io` → 307 redirect to `www.uptrue.io`
- `www.uptrue.io` → production branch alias (master)
- `uptrue-app.vercel.app` → Vercel default

GitLab CI handles routing automatically: `.gitlab-ci.yml` runs `vercel deploy` (preview + alias) on dev, `vercel deploy --prod` on master.

**Before every `git push`, state out loud which branch you are pushing to and why.**

---

## CORE RULES

- TypeScript strict mode always — no `any`, no exceptions
- No inline DB calls — always through `/lib/db/`
- No inline SDK calls — always through `/lib/services/`
- No `process.env` in feature code — use `getServerConfig()`
- No `console.log` — use `lib/utils/logger.ts`
- No direct Supabase calls in pages or routes
- Feature branches only — never commit to `master` or `dev` directly
- Always merge to `dev` first, test, then `master` for production

## PRODUCT USP — MONITORING SUITE

Uptrue is a **Monitoring Suite** — not a single-purpose uptime tool. No competitor offers this combination:

| Feature | What it does |
|---|---|
| **23-type Monitor Engine** | HTTP, SSL, DNS, port, keyword, API, blacklist, DMARC, headers, sitemaps, redirects, cookie consent + more |
| **AI Checker** | Claude-powered analysis of monitor results — plain-English health summaries, root cause hints |
| **LLM.xml / llms.txt Writer** | Auto-generates LLM-readable sitemaps so search AI engines can index client sites correctly |
| **AI Engine Citation Checker** | Queries ChatGPT, Gemini, Perplexity, Claude, Mistral, Cohere — checks whether each LLM cites the user's site for their target keywords |

**Always frame Uptrue as a suite.** Never describe it as just "uptime monitoring."

**V1 scope reminder — do NOT reference these in any V1 marketing, copy, or features:**
- Agency multi-client dashboard — Phase 2
- Stripe Connect / agency revenue split — Phase 2
- White-label — Phase 2
- Multi-workspace — Phase 2

---

## PRODUCTION READINESS CHECKLIST

Before go-live, every item below must be confirmed set in Vercel production env vars:

### Core
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL=https://uptrue.io`
- [ ] `ADMIN_EMAILS` + `ADMIN_REPORT_EMAIL`
- [ ] `CRON_SECRET`

### AI & LLM Engine Citation Checker
- [ ] `ANTHROPIC_API_KEY` — Claude API (AI reports, AI checker, LLM.xml writer)
- [ ] `OPENAI_API_KEY` — ChatGPT citation checks
- [ ] `GEMINI_API_KEY` — Google Gemini citation checks
- [ ] `PERPLEXITY_API_KEY` — Perplexity citation checks
- [ ] `MISTRAL_API_KEY` — Mistral citation checks
- [ ] `COHERE_API_KEY` — Cohere citation checks
- [ ] `AI_ENGINE_ENCRYPTION_SECRET` — AES-256 key for encrypting user engine keys in DB

### Billing
- [ ] `STRIPE_SECRET_KEY` (live key, not test)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `RAZORPAY_WEBHOOK_SECRET`

### Email & Alerts
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_FROM_NAME`
- [ ] `RESEND_WEBHOOK_SECRET`
- [ ] `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`

### Social & Blog
- [ ] `X_CONSUMER_KEY/SECRET` + `X_ACCESS_TOKEN/SECRET` + `X_BEARER_TOKEN`
- [ ] `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_MEMBER_ID` + `LINKEDIN_ORGANIZATION_ID`
- [ ] `BLOG_APPROVAL_SECRET`

### Analytics (production only)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] `NEXT_PUBLIC_GTM_ID`

---

## TECH STACK

Next.js 16.2.1 · TypeScript · Supabase · Vercel Pro · Plain CSS · Stripe · Razorpay · Claude API · OpenAI · Gemini · Perplexity · Mistral · Cohere · Resend

## NEXT.JS 16 WARNING

- `cookies()` from `next/headers` is **async**
- `middleware.ts` → `proxy.ts`, export is `proxy`
- Turbopack is default bundler
- Plain CSS only — no Tailwind

## DEFINITION OF DONE

Before marking any task complete:
- [ ] Works on localhost
- [ ] TypeScript: 0 errors
- [ ] Unit test written
- [ ] Devon code review passed
- [ ] Sam QA passed
- [ ] Help doc written
- [ ] SEO page updated if user-facing
- [ ] Deployed to dev branch
