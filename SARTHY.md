# Copyright © Bizcircle Technologies Ltd. All rights reserved.
# Product: Sarthy — AI-native operating system — sarthy.io
# Project: {{PROJECT_NAME}} | License: {{LICENSE_KEY}} | Installed: {{INSTALL_DATE}}

# {{PROJECT_NAME}} — Engineering: Application
> Dev, code review, and QA. All three engineering repos share ONE project board.

---

## CURRENT STATUS
> Sarthy: Update after every session.

### In Progress
- 🚧

### Completed
- ✅

### Blocked
- 🔴

---

## RULES — NON-NEGOTIABLE

1. **No spec = no build.** Product must provide an approved spec before development starts
2. **No direct commits to main.** All changes via merge requests
3. **Tests must pass** before any MR is approved
4. **Minimum {{MR_APPROVERS}} approver(s)** on every MR
5. **No WIP MRs merged** — draft flag must be removed before review
6. **Security issues are blockers** — no deployment while Critical or High vulnerabilities are open

---

## BRANCH STRATEGY

```
main          ← production-ready only, protected
staging       ← pre-production, auto-deploys to staging env
feature/*     ← new features (branch from main)
fix/*         ← bug fixes (branch from main)
hotfix/*      ← urgent production fixes (branch from main, merge to main + staging)
```

---

## MERGE REQUEST CHECKLIST

Every MR must have:
- [ ] Linked to a task or issue
- [ ] Approved spec (link in MR description)
- [ ] Tests written and passing
- [ ] TypeScript: 0 errors
- [ ] Build succeeds
- [ ] `npm audit` — no critical vulnerabilities
- [ ] Minimum {{MR_APPROVERS}} approval(s)
- [ ] Code reviewer approval

---

## QA PROCESS

Before any MR is merged to main:
1. Developer self-tests all acceptance criteria
2. Code reviewer checks logic, security, and standards
3. QA runs test suite — happy path, edge cases, error cases
4. Security check — no new vulnerabilities introduced
5. Owner approval required for production infrastructure changes

---

## CODE STANDARDS

### Must Follow
- No hardcoded secrets, URLs, or config values — all from environment variables
- Parameterised queries — no SQL injection risk
- All user inputs validated server-side
- Error handling on every async operation
- No console.log or debug statements in committed code

### Naming Conventions
- Functions and variables: `camelCase`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case`

---

## ESCALATION RULES

Escalate to Owner immediately if:
- A security vulnerability is found in production
- A build has been broken for more than 2 hours
- A critical bug is affecting live users
- A cost decision in infrastructure exceeds £10

---

## PRODUCT → ENGINEERING HANDOFF

1. Product raises spec → commits to `specs/` folder in the product repo
2. Sarthy creates feasibility review task here
3. Engineering responds within 48 hours:
   - **Feasible** → development branch created
   - **Concerns** → Product + Engineering discuss → spec updated
   - **Not feasible** → escalates to Owner
4. No approved spec = development does NOT start

---

## SARTHY BEHAVIOUR IN THIS REPO

- Always reference the linked spec before writing any code
- Run impact analysis before touching shared modules
- Flag any scope creep to the Owner before proceeding
- Never deploy to production without Owner sign-off

---

*Managed by Sarthy — sarthy.io*
