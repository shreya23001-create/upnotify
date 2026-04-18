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

- All work goes to `dev` only: `git push origin dev`
- If you are about to run any command containing `origin master` — STOP. Ask first.
- "Deploy it", "push it", "ship it" = `dev` only. Not master.
- The only words that authorise a master push: **"deploy to prod"** or **"push to master"** — explicit, in that session, for that commit.
- One approval does NOT carry forward to future commits or sessions.

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

## TECH STACK

Next.js 16.2.1 · TypeScript · Supabase · Vercel Pro · Plain CSS · Stripe · Razorpay · Claude API · Resend

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
