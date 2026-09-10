# Comparison Page Guardrails

**Version:** 1.0  
**Approved by:** Harvey (Legal)  
**Date:** 6 May 2026  
**Applies to:** All blog posts where `post_type = 'commercial'` — head-to-head comparisons, alternatives listicles, and best-of roundups.

---

## 1. Purpose

Comparison and commercial pages that name competitors carry legal risk if they contain inaccurate pricing claims, unverified feature assertions, or evaluative language that could constitute unfair commercial practice under UK/EU law. These guardrails define the minimum legal requirements for every such page.

---

## 2. Factual accuracy

- **Every factual claim** (price, feature availability, uptime SLA, limitation) must be traceable to a **primary source** — the competitor's own website, official documentation, or public press release.
- Cite the source inline using the format: `(Source: [title](URL), dd MMM yyyy)`.
- If a fact cannot be verified to a primary source **at generation time**, omit the claim entirely. Do not invent or estimate.
- Pricing claims must include the date: `"£X/month as of dd MMM yyyy"`. Stale pricing (>90 days) must be refreshed before publication.

---

## 3. Language requirements

- **Neutral comparative language only.** State features and prices; do not evaluate them with adjectives like "inferior", "overpriced", "clunky", "outdated", "poor".
- Permissible: `"UptimeRobot's free plan checks every 5 minutes; Uptrue's Lite plan checks every 1 minute."`
- Not permissible: `"UptimeRobot's free plan is too slow for serious monitoring."`
- Performance claims (`"Uptrue is faster"`) require a reproducible test methodology and dated source. When in doubt, omit.

---

## 4. Trade mark usage

- Use ™ or ® on the **first occurrence per page** for each competitor brand (e.g. `UptimeRobot™`, `Pingdom®`).
- Nominative use only — naming a competitor to identify the subject of a comparison. Do not use their marks to suggest affiliation, sponsorship, or endorsement.
- Do not use competitor logos without explicit permission.

---

## 5. Corrections footer (required on every commercial page)

Every comparison/commercial page **must** include the following footer verbatim, placed before the final CTA:

> Spotted something out of date or incorrect? Email [shreya23001@gmail.com](mailto:shreya23001@gmail.com) and we will review within 5 working days.

---

## 6. Watchdog / competitor monitoring disclosure (if mentioned)

If the page mentions Uptrue's Watchdog feature, include:

> Watchdog monitors publicly accessible URLs using standard HTTP requests, the same way any web visitor would. Data reflects Uptrue's independent observations and is not provided by, endorsed by, or affiliated with any of the services mentioned on this page.

---

## 7. Prohibited content

- Do not mention `Watchdog` anywhere under `app/(public)/` except on legal pages (`/terms`, `/privacy`) and via the disclosure clause above.
- Do not claim Uptrue detects "all" outages or offers guaranteed accuracy.
- Do not reproduce competitor content (screenshots, testimonials) without permission.
- Do not make claims about competitors' internal security, infrastructure, or engineering practices unless sourced to their own published statements.

---

## 8. Approval gate

All `commercial` post_type pages **must** pass through the `/admin/legal-review` queue before publication. They may not be auto-published via the boss-digest email token flow. Harvey (or a designated legal reviewer) must explicitly approve each page before it goes live.

- Approved: `legal_review_outcome = 'approved'` → page publishes on its calendar `publish_date`
- Rejected: `legal_review_outcome = 'rejected'` → draft deleted, calendar row reset to `planned`
- Needs changes: `legal_review_outcome = 'needs_changes'` → draft returned to generator queue with notes

Pages not reviewed within **90 days** trigger an automated overdue alert to `shreya23001@gmail.com`.

---

## 9. CI guard

The script `scripts/check-watchdog-not-public.ts` runs in CI and fails the build if any file under `app/(public)/` (excluding `/terms/page.tsx` and `/privacy/page.tsx`) contains the string "watchdog" (case-insensitive). This prevents Watchdog from appearing in public-facing pages before the Phase 2 launch.
