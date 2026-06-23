# Test Plan — Uptrue V1 Complete Module QA

**Date:** 2026-06-22  
**Assigned to:** @kritichawla (Kriti Chawla)  
**Environment:** https://dev.uptrue.io  
**Coverage:** All 18 modules shipped in V1  
**Total test cases:** 215  
**Automated gate:** `npx vitest run` — 569 / 569 must pass before any human QA run

---

## Pre-run automated checks

```bash
cd engineering-app
npx tsc --noEmit                  # exit 0 expected
npx vitest run                    # 569 / 569 pass
```

---

## How to run

1. Open each module section in order.
2. Follow **Given / When / Then** for each test case.
3. Mark result: ✅ Pass | ❌ Fail | ⚠️ Partial
4. On fail: screenshot + steps-to-reproduce → reopen the corresponding GitLab issue.
5. Every test is **independently runnable** — do not chain them unless noted.

---

## MODULE 1 — AUTHENTICATION & ACCOUNTS

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-AUTH-01 | Magic link — valid email | On /login, not logged in | Enter valid email, click "Send Magic Link" | Email arrives within 60s; clicking it logs user in → /dashboard | |
| TC-AUTH-02 | Magic link — invalid email format | On /login | Enter "notanemail" and submit | Inline validation error: "Please enter a valid email address" | Form must not submit |
| TC-AUTH-03 | Magic link — unknown email | On /login | Enter unregistered email | Shows "Check your email" — does NOT reveal if account exists | Security: no email enumeration |
| TC-AUTH-04 | Google OAuth — success | On /login | Click "Continue with Google", complete flow | Lands on /dashboard | |
| TC-AUTH-05 | Google OAuth — cancelled | On /login | Click "Continue with Google", cancel popup | Stays on /login, no error flash | |
| TC-AUTH-06 | Admin access — whitelisted email | Navigate to /admin | Login with sachindiwaker@gmail.com | Admin panel accessible | |
| TC-AUTH-07 | Admin access — non-whitelisted | Navigate to /admin | Login with any other Google account | 403 or redirect to /dashboard | |
| TC-AUTH-08 | Session auto-logout after 24h | Logged in, token manually expired | Attempt any dashboard action | Redirected to /login | Test in staging by expiring token in Supabase |
| TC-AUTH-09 | Session scoped to org | User A (org-1) logged in | Navigate any dashboard page | Only org-1 data visible | |
| TC-AUTH-10 | Logout clears session | Logged in | Click logout | Session cleared; /dashboard → /login | Check localStorage + cookies cleared |
| TC-AUTH-11 | Protected routes require auth | Logged-out browser | Navigate to /dashboard/monitors | Redirected to /login | |
| TC-AUTH-12 | Org auto-created on first login | Brand-new email address | Complete signup | Org created; user lands on empty dashboard | |

---

## MODULE 2 — MONITORING ENGINE

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-MON-01 | Single failure — no incident | HTTP monitor configured | URL returns 5xx on one check only | No incident created; logged as flap | Two-confirmation required |
| TC-MON-02 | Two consecutive failures — incident created | HTTP monitor | URL returns 5xx on two consecutive checks 30s apart | Incident created "confirmed"; alert dispatched | Core two-confirmation logic |
| TC-MON-03 | Incident auto-resolves on recovery | Open incident exists | URL returns 200 on next check | Incident → "resolved"; recovery alert sent | |
| TC-MON-04 | Check interval — Free (10 min) | Free plan org, HTTP monitor | Wait for cron | Checked every 10 min, not sooner | Verify check_results timestamp gaps |
| TC-MON-05 | Check interval — Scale (30 sec) | Scale plan org, 30s interval set | Wait for cron | Checked every 30 seconds | |
| TC-MON-06 | Check interval — Lite max 1 min | Lite plan org | Try to create monitor with 30s interval | Blocked server-side; 30s not allowed on Lite | |
| TC-MON-07 | Monitor limit — Free (3 max) | Free plan, 3 monitors | Create 4th monitor | Blocked: "Monitor limit reached for your plan" | |
| TC-MON-08 | Monitor limit — Lite (5 max) | Lite plan, 5 monitors | Create 6th | Blocked | |
| TC-MON-09 | Monitor limit — Builder (25 max) | Builder plan, 25 monitors | Create 26th | Blocked | |
| TC-MON-10 | Monitor limit — Scale (100 max) | Scale plan, 100 monitors | Create 101st | Blocked | Per KB; note: migration 00072 may show 250 — verify against DB |
| TC-MON-11 | Pause stops checks | Active monitor | Pause the monitor | No new check_results rows until resumed | |
| TC-MON-12 | Delete cascades data | Active monitor with history | Delete the monitor | Monitor + check_results + incidents all deleted | |
| TC-MON-13 | Flap: no incident on single-fail recovery | Monitor failed once, then recovered | Second check | No incident; flap logged | |
| TC-MON-14 | Past-due org retains plan limits (Bug #104) | Scale org, subscription status = past_due | Create monitor | Allowed up to Scale limit (100), NOT Free limit (3) | Critical regression |

---

## MODULE 3 — MONITOR TYPES (23 Types)

### 3A — HTTP/HTTPS Uptime

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-HTTP-01 | 200 response passes | HTTP monitor → example.com | Cron runs | Result: "up", response_time recorded | |
| TC-HTTP-02 | 404 triggers alert | Expected 200, returns 404 | Two consecutive checks | Incident created | |
| TC-HTTP-03 | Custom expected status | Expected 301 configured | URL returns 301 | Check passes | |
| TC-HTTP-04 | Response time threshold | Threshold: 2000ms | URL responds in 3500ms | Alert fired even though 200 | |
| TC-HTTP-05 | Custom headers sent | Custom header configured | Cron runs | Header present in outbound request | Verify via server access log |
| TC-HTTP-06 | Follow redirects ON | 301→200 chain | Check runs | Passes on final 200 | |
| TC-HTTP-07 | Follow redirects OFF | 301→200 chain | Check runs | Fails if 301 not expected status | |

### 3B — SSL Certificate

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SSL-01 | Valid cert, 90+ days | Cert expires in 120 days | Check | Pass, no alert | |
| TC-SSL-02 | Expiry within 30 days (P3) | Cert expires in 25 days | Check | P3 alert: "SSL expires in 25 days" | |
| TC-SSL-03 | Expiry within 7 days (P2) | Cert expires in 5 days | Check | P2 alert | |
| TC-SSL-04 | Expired cert | Cert already expired | Check | Critical alert: "SSL has expired" | |
| TC-SSL-05 | Domain mismatch | Cert for different domain | Check | Alert: domain mismatch | |

### 3C — Domain Expiry

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-DOM-01 | Expiry 90+ days | Domain expiring in 200 days | Check | No alert | |
| TC-DOM-02 | Expiry 30 days | Domain expiring in 28 days | Check | Alert: "Domain expires in 28 days" | |
| TC-DOM-03 | Unregistered domain | Domain not in WHOIS | Check | Error state, alert sent | |

### 3D — DNS Records

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-DNS-01 | No change from baseline | A record matches baseline | Check | Pass | |
| TC-DNS-02 | A record changed | Baseline 1.2.3.4; now 5.6.7.8 | Check | Alert: "DNS records changed" | |
| TC-DNS-03 | MX record changed | MX differs from baseline | Check | Alert | |
| TC-DNS-04 | Baseline set on creation | New DNS monitor created | Save | Baseline auto-captured | |

### 3E — Keyword Detection

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-KWD-01 | Must-exist — keyword present | "Buy Now" on page | Check | Pass | |
| TC-KWD-02 | Must-exist — keyword missing | "Buy Now" removed | Check | Alert: "Keyword disappeared" | |
| TC-KWD-03 | Must-not-exist — keyword absent | "Under Maintenance" not on page | Check | Pass | |
| TC-KWD-04 | Must-not-exist — keyword appears | "Under Maintenance" appears | Check | Alert: "Keyword appeared" | |

### 3F — Port Check

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-PORT-01 | Port open | Port 443 open | Check | Pass | |
| TC-PORT-02 | Port closed | Port 3306 closed | Check | Alert: "Port 3306 is closed" | |
| TC-PORT-03 | Port recovery | Was closed, now open | Check | Alert: "Port 3306 is open again" | |

### 3G — API Endpoint

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-API-01 | Expected 200 | GET /health returns 200 | Check | Pass | |
| TC-API-02 | JSONPath body assertion passes | `$.status == "ok"` matches | Check | Pass | |
| TC-API-03 | Body assertion fails | Response has `$.status = "degraded"` | Check | Alert: "API endpoint failing" | |
| TC-API-04 | POST with custom body | POST configured with JSON body | Check | Body sent correctly | |

### 3H — Ping / Reachability

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-PING-01 | Host reachable | 8.8.8.8 | Check | Pass | |
| TC-PING-02 | Host unreachable | 192.0.2.1 (RFC 5737 unroutable) | Check | Alert: "Host is unreachable" | |

### 3I — Heartbeat

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-HB-01 | Ping received in window | 5-min interval, ping arrives in time | Check window | No alert | |
| TC-HB-02 | Missed ping alert | No ping for 10 minutes | Check | Alert: "Heartbeat missed" | |
| TC-HB-03 | Unique URL generated on creation | New heartbeat monitor | Save | URL shown for cron job use | |
| TC-HB-04 | Resume after miss | Was missed; ping sent again | Check | Alert: "Heartbeat resumed" | |

### 3J — Page Change Detection

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-PCD-01 | No change | Content matches baseline | Check | Pass | |
| TC-PCD-02 | Content diff | Page content changed | Check | Alert: "Page content changed" | |
| TC-PCD-03 | Ignore whitespace ON | Only whitespace changed | Check | No alert | |

### 3K — Security Headers

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SH-01 | All headers present, high score | CSP + HSTS + X-Frame + X-Content-Type + Referrer-Policy | Check | Pass | |
| TC-SH-02 | Score below threshold | CSP and HSTS missing | Check | Alert: "Security headers score dropped" | |
| TC-SH-03 | Configurable threshold | Threshold 70%; URL scores 65% | Check | Alert fired | |

### 3L — robots.txt Change

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-ROB-01 | No change | robots.txt matches baseline | Check | Pass | |
| TC-ROB-02 | Googlebot blocked | Gains "Disallow: /" for Googlebot | Check | Alert: "Googlebot is now blocked" | Critical SEO |
| TC-ROB-03 | Non-Googlebot change | Other rule added | Check | Alert: "robots.txt changed" | |

### 3M — IP Address Change

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-IP-01 | No change | A record = baseline | Check | Pass | |
| TC-IP-02 | New IP detected | A record changed | Check | Alert: "IP address changed to X.X.X.X" | |
| TC-IP-03 | Update baseline | Click "Update baseline" | Save | Next check with same IP = pass | |

### 3N — MX Health

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-MX-01 | Valid MX, ports open | Port 25/587 reachable | Check | Pass | |
| TC-MX-02 | Port 25 closed | MX host unreachable on port 25 | Check | Alert: "MX record broken — mail delivery at risk" | |
| TC-MX-03 | No MX records | Domain has no MX | Check | Alert | |

### 3O — WHOIS Registrar Change

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-WHO-01 | No change | Registrar matches baseline | Check | Pass | |
| TC-WHO-02 | Registrar changed | GoDaddy → Namecheap | Check | Alert: "Registrar changed — possible domain hijack risk" | |

### 3P — Sitemap Validity

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SITE-01 | Valid XML | `<urlset>` present | Check | Pass | |
| TC-SITE-02 | Invalid XML | Malformed sitemap | Check | Alert: "Sitemap is invalid or unreachable" | |
| TC-SITE-03 | 404 sitemap | sitemap.xml returns 404 | Check | Alert | |

### 3Q — Redirect Chain

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-RED-01 | Same chain as baseline | A→B→C unchanged | Check | Pass | |
| TC-RED-02 | Chain changed | A→B now A→C→D | Check | Alert: "Redirect chain changed" | |
| TC-RED-03 | Final URL changed | Final URL differs | Check | Alert | |

### 3R — SPF/DMARC Validity

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SPF-01 | Valid SPF | `v=spf1` TXT present | Check | Pass | |
| TC-SPF-02 | SPF broken | Record removed/malformed | Check | Alert: "SPF record broken" | |
| TC-SPF-03 | Valid DMARC | `v=DMARC1` TXT present | Check | Pass | |
| TC-SPF-04 | DMARC broken | DMARC TXT missing | Check | Alert: "DMARC record broken" | |

### 3S — Blacklist Check

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-BL-01 | Domain clean | Not on any blacklist | Check | Pass | |
| TC-BL-02 | Domain listed | On Spamhaus ZEN | Check | Alert: "Domain/IP is blacklisted on [zone]" | Requires SPAMHAUS_DQS_KEY |
| TC-BL-03 | Missing env key | SPAMHAUS_DQS_KEY not set | Check | Graceful error, no crash | |

### 3T — Page Size

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-PS-01 | Within threshold | Within 30% of baseline | Check | Pass | |
| TC-PS-02 | Size spike >30% | 50% larger than baseline | Check | Alert: "Page size changed significantly" | |
| TC-PS-03 | Size collapse | 60% smaller than baseline | Check | Alert (possible content deletion) | |

### 3U — Cookie Consent Presence

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-COOK-01 | Banner present | OneTrust script on page | Check | Pass | |
| TC-COOK-02 | Banner missing | No consent library | Check | Alert: "Cookie consent banner missing — GDPR compliance risk" | |
| TC-COOK-03 | CookieYes detected | CookieYes script present | Check | Pass (recognised) | |

### 3V — Nameserver Change

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-NS-01 | No change | NS matches baseline | Check | Pass | |
| TC-NS-02 | Change detected | NS records changed | Check | P1 alert: "Nameservers changed — possible DNS hijack" | |
| TC-NS-03 | Min 1hr interval enforced | Nameserver monitor set to 1-min | Save | Interval auto-corrected to 1hr | Per KB |

---

## MODULE 4 — ALERTING

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-ALRT-01 | Email — incident confirmed | HTTP down, incident confirmed | Alert dispatcher runs | Email with "is down" copy arrives | |
| TC-ALRT-02 | Email — recovery | Incident resolved | Check passes | Recovery email: "is back up" | |
| TC-ALRT-03 | Email — per-severity routing | Contact: P1 only | P2 incident | Email NOT sent to P1-only contact | |
| TC-ALRT-04 | Email — P1+P2 contact gets P2 | Contact: P1+P2 | P2 incident | Email sent | |
| TC-ALRT-05 | Slack — Free plan blocked | Free org, Slack configured | Incident | No Slack message sent | |
| TC-ALRT-06 | Slack — Lite plan sends | Lite org, Slack webhook set | Incident | Slack message sent | Per KB: Lite gets Slack/Teams/Webhooks |
| TC-ALRT-07 | Slack — Block Kit format | Slack alert sent | Message arrives | Rich Block Kit format with monitor name, type, status, timestamp | |
| TC-ALRT-08 | Teams — Adaptive card | Teams alert sent | Message arrives | Adaptive card with correct fields | |
| TC-ALRT-09 | Webhook — HMAC signature | Webhook configured | Alert fires | `X-Uptrue-Signature: sha256=<hex>` header present | Validate with shared secret |
| TC-ALRT-10 | Webhook — JSON payload | Webhook fires | Inspect POST body | All incident fields in JSON | |
| TC-ALRT-11 | Alert copy — SSL type | SSL incident | Alert fires | Email subject references "SSL" | |
| TC-ALRT-12 | Alert copy — Nameserver type | Nameserver incident | Alert fires | Copy: "Nameservers changed — possible DNS hijack" | |
| TC-ALRT-13 | Alert copy — all 23 types | All monitor types | Any incident | No "undefined" or "unknown" in copy | Check each of the 23 types |
| TC-ALRT-14 | No duplicate alerts | Open incident exists | Second check also fails | No second "down" alert for same incident | |

---

## MODULE 5 — STATUS PAGES

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SP-01 | Public page accessible without login | Status page created | Navigate to /status/[slug] in incognito | Page loads, shows monitor health | |
| TC-SP-02 | No internal IDs exposed | Status page loaded | Inspect source + network | No org_id, user_id, or UUIDs | Security |
| TC-SP-03 | 30/60/90 day selector | Status page loaded | Click "90 days" | Uptime bars show 90-day history | |
| TC-SP-04 | Incident log visible | Resolved incidents exist | Load page | Incident history with dates shown | |
| TC-SP-05 | Active incident banner | Open incident exists | Load page | Red "Ongoing Incident" banner at top | |
| TC-SP-06 | Email subscribe | Page loaded | Subscribe with email | Confirmation email sent | |
| TC-SP-07 | Subscriber gets incident email | Subscriber exists | New incident confirmed | Email sent to subscriber | |
| TC-SP-08 | Free plan — 0 status pages | Free org | Create a status page | Blocked: "Status pages require a paid plan" | Per KB |
| TC-SP-09 | Lite plan — 1 max | Lite org, 1 status page | Create 2nd | Blocked | |
| TC-SP-10 | Builder plan — 5 max | Builder org, 5 status pages | Create 6th | Blocked | |
| TC-SP-11 | Scale — unlimited | Scale org, 10 status pages | Create another | Allowed | |
| TC-SP-12 | Custom domain — Scale only | Builder org | Try to configure custom domain | Blocked or field hidden | |
| TC-SP-13 | Custom domain — Scale | Scale org | Add CNAME + TXT verify | Custom domain resolves to status page | |
| TC-SP-14 | White-label — Scale: no "Powered by Uptrue" (Bug #113) | Scale org | Load status page | "Powered by Uptrue" NOT visible | Critical regression |
| TC-SP-15 | White-label — Builder: branding visible | Builder org | Load status page | "Powered by Uptrue" IS shown | |
| TC-SP-16 | White-label — Free/Lite: branding visible | Free/Lite org | Load status page | Branding shown | |
| TC-SP-17 | Badge — SVG returned | Valid monitor ID | GET /api/v1/badge/[monitorId] | SVG with correct status colour | |
| TC-SP-18 | Badge — no auth required | Logged-out browser | GET badge URL | SVG returned without 401 | |
| TC-SP-19 | Lite — branded page on uptrue.io domain | Lite org | Create status page | URL on uptrue.io, not custom domain | Per KB: "1 branded" |

---

## MODULE 6 — AI REPORTS

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-AIR-01 | Free plan — blocked | Free org | Generate AI report | Blocked: "AI Reports require Builder plan or above" | |
| TC-AIR-02 | Lite plan — blocked | Lite org | Generate AI report | Blocked | Per KB: Lite = no AI Reports |
| TC-AIR-03 | Builder — first report | Builder org, 0 reports this month | Generate | Report generated, count = 1 | Bug #111 fix: limit now enforced |
| TC-AIR-04 | Builder — at limit (5/mo) | Builder org, 5 reports this month | Generate 6th | Blocked: "Monthly AI report limit reached" | Bug #111 |
| TC-AIR-05 | Builder — counter resets monthly | 5 reports in May | June begins | Counter resets to 0 | |
| TC-AIR-06 | Scale — unlimited | Scale org, 10 reports this month | Generate another | Allowed (unlimited) | Bug #117 fix: migration 00104 set limit=-1 |
| TC-AIR-07 | Scale — NOT blocked by old limit=0 | Scale org | Generate any report | Not blocked (prior bug: was limit=0 = disabled) | Regression for Bug #117 |
| TC-AIR-08 | Report includes per-monitor stats | Report generated | View report | Uptime %, incidents, response time per monitor in report | |
| TC-AIR-09 | PDF downloadable | Report generated | Click "Download PDF" | PDF downloaded with report content | |
| TC-AIR-10 | Scale PDF — no Uptrue branding (Bug #113) | Scale org | Download PDF report | No "Powered by Uptrue" in PDF | Regression |
| TC-AIR-11 | Builder PDF — branding visible | Builder org | Download PDF | "Powered by Uptrue" visible | |
| TC-AIR-12 | Predictive alerts — Scale only | Scale org, 90+ days history | Enable predictive alerts | Pattern alerts surface | |
| TC-AIR-13 | Predictive alerts — Builder blocked | Builder org | Enable predictive alerts | Blocked or field hidden | |

---

## MODULE 7 — BILLING

### 7A — Stripe Checkout

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-BIL-01 | First-time Lite signup | New org, no subscription | Click upgrade to Lite monthly | Redirected to Stripe hosted checkout | |
| TC-BIL-02 | Webhook activates plan | Checkout completed | checkout.session.completed fires | Subscription created; plan limits update | |
| TC-BIL-03 | Upgrade Lite → Builder | Active Lite sub | Upgrade to Builder | Builder checkout; Lite cancelled on webhook | |
| TC-BIL-04 | Downgrade — UI blocks | Active Scale sub | Click downgrade to Builder | Button absent or disabled | |
| TC-BIL-05 | Downgrade — API blocked (Bug #119) | Active Scale sub | POST /api/v1/billing/checkout { planSlug: "builder" } | 403: "Plan downgrade is not available" | API-level enforcement |
| TC-BIL-06 | Scale → Lite via API | Active Scale | POST checkout planSlug: "lite" | 403 | |
| TC-BIL-07 | Builder → Lite via API | Active Builder | POST checkout planSlug: "lite" | 403 | |
| TC-BIL-08 | Upgrade Lite → Builder via API | Active Lite | POST checkout planSlug: "builder" | Checkout URL returned (not 403) | |
| TC-BIL-09 | Same plan re-subscribe | Active Builder | POST checkout planSlug: "builder" | Checkout URL returned | |
| TC-BIL-10 | Free plan checkout — blocked | Any org | POST checkout planSlug: "free" | 400: "Free plan does not require payment" | |
| TC-BIL-11 | Annual billing cycle | Upgrading org | Select "Annual" | Annual Stripe price ID used | |
| TC-BIL-12 | No sub, first signup | New org | POST checkout any paid plan | Checkout created (no downgrade check triggers) | |
| TC-BIL-13 | Impersonation blocks payment | Admin impersonating | Attempt checkout | 403: "Payment changes not allowed during impersonation" | |
| TC-BIL-14 | Rate limit — checkout | 11 rapid requests | 11th request | 429 Too Many Requests | |

### 7B — Razorpay Checkout

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-RZP-01 | INR checkout shown for India | IP = India (x-vercel-ip-country: IN) | Load pricing page | INR prices + Razorpay button shown | |
| TC-RZP-02 | INR hidden outside India | IP = UK | Load pricing page | GBP prices + Stripe button | |
| TC-RZP-03 | First Lite subscription | New Indian org | Select Lite monthly, complete Razorpay | Subscription active | |
| TC-RZP-04 | Upgrade allowed | Active Lite INR sub | Upgrade to Builder | Checkout allowed | |
| TC-RZP-05 | UI downgrade blocked (Bug #106) | Active Scale INR sub | Click Lite plan | Button absent (isInrMode && isHigherTier fix) | |
| TC-RZP-06 | API downgrade blocked (Bug #118) | Active Scale INR | POST /api/v1/billing/razorpay/checkout planSlug: "lite" | 403: "Plan downgrade is not available" | Critical regression |
| TC-RZP-07 | Builder → Lite via API blocked | Active Builder INR | POST razorpay checkout planSlug: "lite" | 403 | |
| TC-RZP-08 | Same plan allowed | Active Builder INR | POST razorpay checkout planSlug: "builder" | Success, checkout created | |
| TC-RZP-09 | Mock mode (no real keys) | RAZORPAY_KEY_ID not set | Attempt checkout | Returns mockMode: true with fake sub ID | Dev/staging |
| TC-RZP-10 | Free plan blocked | Any org | POST razorpay checkout planSlug: "free" | 400 | |
| TC-RZP-11 | Annual = monthly × 12, no discount | Indian org | View annual Lite price | ₹399 × 12 = ₹4,788 (no discount) | Per KB |
| TC-RZP-12 | 18% GST added | Indian org at Razorpay checkout | View total | GST added automatically by Razorpay | |
| TC-RZP-13 | No "Save 20%" badge for INR (Bug #115) | Indian org | View pricing page | No "Save 20%" badge shown | |
| TC-RZP-14 | "Save up to 20%" for GBP (Bug #115) | UK org | Toggle annual | Badge reads "Save up to 20%" | Not "Save 20%" |

### 7C — Payment Failure & Past-Due

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-PAY-01 | First failure — no past_due (Bug #110) | Active sub | invoice.payment_failed, attempt_count=1 | Status stays "active" — no past_due update | Critical regression |
| TC-PAY-02 | Second failure — marks past_due | Active sub | invoice.payment_failed, attempt_count=2 | Status → past_due | |
| TC-PAY-03 | Third failure — marks past_due | Sub | attempt_count=3 | Status → past_due | |
| TC-PAY-04 | Past-due retains plan limits (Bug #104) | Scale sub, status=past_due | Any usage action | Gets Scale limits, NOT Free limits | Critical regression |
| TC-PAY-05 | Payment recovered | Past-due sub, payment succeeds | invoice.payment_succeeded fires | Status → active | |
| TC-PAY-06 | Cancelled → Free limits | Stripe sub cancelled | Org takes any action | Gets Free plan limits | |

### 7D — Plan Limits

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-LIM-01 | Team member — Free (0) | Free org, 1 member | Invite team member | Blocked | KB: Free = 0 additional members |
| TC-LIM-02 | Team member — Lite (2 total) | Lite org, 2 members | Invite 3rd | Blocked | |
| TC-LIM-03 | Team member — Builder (10 total) | Builder org, 10 members | Invite 11th | Blocked | |
| TC-LIM-04 | Team member — Scale (20 total) | Scale org, 20 members | Invite 21st | Blocked | |
| TC-LIM-05 | Workspace — Free (1) | Free org, 1 workspace | Create another | Blocked | |
| TC-LIM-06 | Workspace — Builder (3) | Builder org, 3 workspaces | Create 4th | Blocked | |
| TC-LIM-07 | Workspace — Scale (10) | Scale org, 10 workspaces | Create 11th | Blocked | |
| TC-LIM-08 | API access — Scale only | Scale org | GET /api/v1/monitors | 200 | |
| TC-LIM-09 | API access — Free blocked | Free org | GET /api/v1/monitors | 403 | |
| TC-LIM-10 | API access — Builder blocked (Bug #114) | Builder org | GET /api/v1/monitors | 403 (Builder must NOT have API) | Regression |
| TC-LIM-11 | API access — Lite blocked | Lite org | GET /api/v1/monitors | 403 | |

### 7E — Data Retention

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-RET-01 | Free — 7-day retention (Bug #116) | Free org | Data-retention cron | Results > 7 days deleted (was wrongly 30) | Regression |
| TC-RET-02 | Lite — 30-day retention (Bug #116) | Lite org | Cron | Results > 30 days deleted (was 90) | Regression |
| TC-RET-03 | Builder — 90-day retention (Bug #116) | Builder org | Cron | Results > 90 days deleted (was NULL) | Regression |
| TC-RET-04 | Scale — 365-day retention (Bug #116) | Scale org | Cron | Results > 365 days deleted | Regression |
| TC-RET-05 | Per-org retention (Bug #103) | Free org + Scale org, same-age data | Cron runs | Free data pruned at 7 days; Scale kept for 365 | Core regression |
| TC-RET-06 | No sub defaults to Free retention | Org with no subscription | Cron runs | Defaults to 7-day | |

---

## MODULE 8 — TEAM MANAGEMENT

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-TEAM-01 | Invite — success | Builder org, 5/10 members | Invite new@example.com | Invite email sent, record created | |
| TC-TEAM-02 | Accept invite — valid token | Invite email received | Click invite link | User added to org, can access dashboard | |
| TC-TEAM-03 | Accept invite — expired token | Invite > 7 days old | Click invite link | Error: "Invite link has expired" | |
| TC-TEAM-04 | Accept invite — TOCTOU check (Bug #112) | Builder org hits limit (10/10) after invite sent | Invited user clicks link | Blocked at accept time: "Organisation is full" | Critical regression |
| TC-TEAM-05 | Accept checks TARGET org (Bug #112) | User in org-A; invite from org-B | Accept org-B invite | Check uses org-B's limit, not org-A's | Regression |
| TC-TEAM-06 | Race condition — two simultaneous accepts | Two people accept same last-slot invite | Both hit accept | Only one succeeds; second: "Organisation is full" | |
| TC-TEAM-07 | Remove member | Owner removes member | Member removed | Loses dashboard access | |
| TC-TEAM-08 | Invite — Free plan blocked | Free org | Send team invite | Blocked: team = 0 for Free | |
| TC-TEAM-09 | Member scope | Member added to org | Member logs in | Can only see their org's data | |

---

## MODULE 9 — WORKSPACES

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-WS-01 | Create — within limit | Builder org, 2 workspaces | Create 3rd | Success | |
| TC-WS-02 | Create — at limit | Builder org, 3 workspaces | Create 4th | Blocked | |
| TC-WS-03 | Monitors scoped to workspace | Workspace A and B | Create monitor in A | Not visible in B | |
| TC-WS-04 | Status page linked to workspace | Status page in Workspace A | View page | Only Workspace A monitors shown | |

---

## MODULE 10 — DASHBOARD UX

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-UX-01 | Filter by type | Multiple monitor types | Filter "SSL" | Only SSL monitors shown | |
| TC-UX-02 | Filter by status | Mix of up/down | Filter "Down" | Only down monitors shown | |
| TC-UX-03 | Sort by response time | Multiple HTTP monitors | Sort "Response time" | Sorted highest → lowest | |
| TC-UX-04 | Bulk pause | 5 monitors selected | Click "Pause" | All 5 paused | |
| TC-UX-05 | Bulk delete | 3 monitors selected | Click "Delete" | Confirmation dialog; on confirm, 3 deleted | |
| TC-UX-06 | Bulk change severity | 4 selected | Change to P1 | All 4 updated | |
| TC-UX-07 | Dark mode — system auto | Device in dark mode | First dashboard visit | Dark theme applied | |
| TC-UX-08 | Dark mode — manual toggle | Light mode | Click toggle | Switches, persisted in localStorage | |
| TC-UX-09 | Dark mode — persists | Dark mode ON | Close + reopen browser | Dark mode still active | |
| TC-UX-10 | Toast — success | Create monitor | Save | "Monitor created successfully" toast | |
| TC-UX-11 | Toast — error | Create monitor over limit | Submit | Error toast with limit explanation | |
| TC-UX-12 | Create form — help panel | Form open | Select "SSL" type | Right panel shows SSL description, how-to, FAQs | |
| TC-UX-13 | Monitor type insight — HTTP | HTTP monitor detail | View monitor | Plain-English interpretation of latest check | |
| TC-UX-14 | Breadcrumb navigation | Monitor detail page | View breadcrumb | Dashboard > Monitors > [Name] | |
| TC-UX-15 | Create form — 50/50 layout | Form open | View layout | Form left, help panel right | |

---

## MODULE 11 — COMPETE ADD-ON

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-COMP-01 | Compete tab hidden for Free/Lite | Free org | Dashboard | No /compete tab | |
| TC-COMP-02 | Checkout — Lite blocked (Bug #107) | Lite org | POST /api/v1/compete/checkout | 403: "Compete requires Builder plan and above" | Critical regression |
| TC-COMP-03 | Checkout — Builder allowed | Builder org | POST /api/v1/compete/checkout | Checkout created | |
| TC-COMP-04 | Checkout — Scale allowed | Scale org | POST /api/v1/compete/checkout | Checkout created | |
| TC-COMP-05 | Checkout — Free blocked | Free org | POST /api/v1/compete/checkout | 403 | |
| TC-COMP-06 | Add competitor by URL | Active Compete sub | Enter URL | Competitor added, auto-detection starts | |
| TC-COMP-07 | Pricing page tracker | Competitor pricing page set | Price number changes | Alert: pricing change detected | |
| TC-COMP-08 | Generic page change | Competitor page monitored | Content changes | Alert: "Page content changed" | |
| TC-COMP-09 | Weekly AI digest | Compete sub, competitors added | Weekly cron | AI digest email summarising changes | |
| TC-COMP-10 | Slack alert on change | Slack configured | Competitor change | Slack alert sent | Builder/Scale required for Slack |
| TC-COMP-11 | GBP pricing shown | UK org | View Compete add-on pricing | +£19/mo shown | |
| TC-COMP-12 | INR pricing shown | Indian org | View Compete pricing | +₹1,999/mo shown | |

---

## MODULE 12 — ADMIN PANEL

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-ADM-01 | Admin access — superadmin only | sachindiwaker@gmail.com | Login via Google, navigate /admin | Admin panel accessible | |
| TC-ADM-02 | Admin access — non-admin blocked | Any other email | Navigate /admin | 403 or redirect | |
| TC-ADM-03 | User search | Admin logged in | Search by email | User details: plan, org, last seen | |
| TC-ADM-04 | Change plan | Admin panel | Change org Lite → Builder | Limits update immediately | |
| TC-ADM-05 | Deactivate user | Admin panel | Deactivate user | User cannot login | |
| TC-ADM-06 | Impersonate | Admin panel | Click "Impersonate" | Views org's dashboard, read-only marker shown | |
| TC-ADM-07 | Impersonation — payment blocked | Impersonating | Attempt billing change | 403 | |
| TC-ADM-08 | Impersonation — audit log | Impersonating | Any action | Audit entry with impersonator ID | |
| TC-ADM-09 | Live/test mode toggle | Admin panel | Toggle to test mode | OTP required; test mode banner shown | |
| TC-ADM-10 | Blog CMS — approve | Draft post awaiting | Approve | Post published; social queued | |
| TC-ADM-11 | Blog CMS — reject | Draft post | Reject | Stays draft; no social post | |
| TC-ADM-12 | Admin reports — MRR | Admin reports page | Load | MRR/ARR correct | Cross-check with Stripe |
| TC-ADM-13 | Feature flag toggle | Flag list | Toggle OFF | Feature inaccessible to all users | |
| TC-ADM-14 | Plan price edit | Admin plan control | Change Lite price | DB updated; checkout uses new price | |

---

## MODULE 13 — OUTAGE BLOG (AUTO-PUBLISH)

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-BLOG-01 | Auto-generated post holds for approval | Post generated | Created | Status = draft | |
| TC-BLOG-02 | Disclaimer box on auto-generated post | auto_generated=true | View post | Disclaimer visible | Legal |
| TC-BLOG-03 | Hedged language | AI prompt used | Read content | "reportedly", "appears to be" — no definitive claims | |
| TC-BLOG-04 | Usernames stripped | Social data scraped | Content generated | No Reddit usernames or X handles | Harvey legal requirement |
| TC-BLOG-05 | Takedown email in disclaimer | Disclaimer | Read | reports@uptrue.io visible | |
| TC-BLOG-06 | Published after approval | Admin approves | Post goes live | At /blog/[slug]; in sitemap | |
| TC-BLOG-07 | Social posts on publish | Post published | Social cron | X and LinkedIn posts fired | |
| TC-BLOG-08 | LinkedIn — org account | LINKEDIN_ORGANIZATION_ID set | LinkedIn post | Posted from org account | |

---

## MODULE 14 — SEO & PUBLIC PAGES

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SEO-01 | All 23 monitor landing pages exist | 23 monitor types | Navigate each /monitoring/[slug] | Each loads with correct content | Check all 23 |
| TC-SEO-02 | All 8 content sections present | Any /monitoring/[slug] | View page | Hero · What · Why · Risks · How Uptrue · Setup · FAQs · CTA | |
| TC-SEO-03 | Monitor index lists all types | /monitoring | Load | All 23 types listed | |
| TC-SEO-04 | Sitemap generated | GET /sitemap.xml | Request | Marketing pages + /monitoring + blog + /tools + /tracker included | |
| TC-SEO-05 | Sitemap excludes internal routes | GET /sitemap.xml | Parse | No /dashboard, /admin, /status/* | |
| TC-SEO-06 | robots.txt — staging noindex | Staging env | GET /robots.txt | Disallow: / | |
| TC-SEO-07 | robots.txt — production allows public | Production | GET /robots.txt | Public pages crawlable | |
| TC-SEO-08 | JSON-LD Organization schema | Homepage | Page source | `@type: Organization` present | |
| TC-SEO-09 | Public tracker page | GET /tracker/[domain] | Load | Uptime stats for tracked domain | |
| TC-SEO-10 | Leaderboard ordered by uptime | GET /leaderboard | Load | Sorted by uptime % descending | |
| TC-SEO-11 | No free trial copy | All public pages | Search + read | Zero mention of "free trial" | Per KB: trials removed |

---

## MODULE 15 — EMAIL NURTURE / DRIP

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-NURT-01 | Welcome email on signup | New user | Signup completed | Welcome email received | |
| TC-NURT-02 | First monitor email | User creates first monitor | Saved | Drip email triggered | |
| TC-NURT-03 | Upgrade nudge | Free user, 5 days post-signup | Nurture cron | Nudge email if conditions met | |
| TC-NURT-04 | No duplicate nurture | Trigger already fired for user | Same trigger again | Duplicate not sent | |
| TC-NURT-05 | Unsubscribe works | Nurture email | Click unsubscribe | Removed from sequence | |

---

## MODULE 16 — COOKIE CONSENT & LEGAL

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-LEGAL-01 | Banner — first visit | Clear localStorage | Visit any public page | Cookie consent banner appears | |
| TC-LEGAL-02 | Accept all | Banner shown | Click "Accept All" | Dismissed; consent in localStorage | |
| TC-LEGAL-03 | Reject non-essential | Banner shown | Click "Reject" | Only necessary cookies active | |
| TC-LEGAL-04 | Preference persists | Consent given | Revisit | Banner does NOT reappear | |
| TC-LEGAL-05 | Shown on all public pages | Fresh browser | Visit /, /pricing, /blog, /monitoring | Banner on all | |
| TC-LEGAL-06 | Hidden in dashboard | Logged-in user | /dashboard | No cookie banner | |
| TC-LEGAL-07 | All legal pages accessible | Anonymous | /terms /privacy /cookies /aup /dpa /ai-disclaimer | All load without auth | |
| TC-LEGAL-08 | AI Disclaimer — corrections email | /ai-disclaimer | Read | reports@uptrue.io with corrections process | |

---

## MODULE 17 — COMMUNITY CREDITS

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-CRED-01 | Badge embed — £2/mo | User embeds badge | Badge verified | £2/mo credit on next invoice | |
| TC-CRED-02 | Badge credit capped at £2/mo | Badge + other credits | Invoice | Badge portion max £2 | |
| TC-CRED-03 | Referral — £5 per paying referral | User refers paying friend | Friend upgrades | £5 one-time credit | |
| TC-CRED-04 | Referral cap — max 5 (£25) | 5 referrals | 6th referral | No additional credit | |
| TC-CRED-05 | G2 review — £10 | Verified G2 review | Confirmed | £10 credit | |
| TC-CRED-06 | Capterra review — £10 | Verified Capterra review | Confirmed | £10 credit (separate from G2) | |
| TC-CRED-07 | One per review platform | Second G2 review | Processed | No additional credit | |
| TC-CRED-08 | Bug report — £5 | Bug confirmed fixed | Applied | £5 credit | |
| TC-CRED-09 | Bug credit max 3/year | 3 fixed bugs | 4th bug | No credit beyond 3 | |
| TC-CRED-10 | Monthly cap £10 | £12 earned in month | Invoice | Total capped at £10 | |
| TC-CRED-11 | Cannot exceed subscription cost | £1 Lite sub, £5 credits | Invoice | Only £1 applied | |
| TC-CRED-12 | Credits not cashable | £20 credits | Request cash | Blocked: credits not redeemable for cash | |

---

## MODULE 18 — SECURITY & ACCESS CONTROL

| TC# | Title | Given | When | Then | Notes |
|-----|-------|-------|------|------|-------|
| TC-SEC-01 | RLS — no cross-org monitors | User in org-A | Query monitors via Supabase | Only org-A monitors returned | |
| TC-SEC-02 | RLS — no cross-org incidents | User in org-A | Query incidents | Only org-A incidents | |
| TC-SEC-03 | RLS — no cross-org billing | User in org-A | Query subscriptions | Only org-A subscription | |
| TC-SEC-04 | API key — Scale only | Scale org | Generate API key | Key generated | |
| TC-SEC-05 | API key — non-Scale blocked | Builder org | Generate API key | 403 | |
| TC-SEC-06 | No free trial anywhere | All public pages | Search | Zero "free trial" CTAs or copy | Trials removed: migration 00034 |
| TC-SEC-07 | Status page no internal IDs | Public status page | Source + network | No org_id / user_id / subscription_id | |
| TC-SEC-08 | Webhook HMAC verifiable | Webhook event | Validate X-Uptrue-Signature | Signature valid with shared secret | |
| TC-SEC-09 | Rate limiting — checkout | 11 rapid requests | 11th request | 429 | |
| TC-SEC-10 | Stripe webhook — synchronous constructEvent | Stripe sends event | Webhook processes | constructEvent (sync), not constructEventAsync | Prior fix: was using wrong method |
| TC-SEC-11 | XSS — monitor URL sanitised | Create monitor form | Enter URL with XSS payload | Sanitised; no execution | |
| TC-SEC-12 | Auth required for API | Logged-out | GET /api/v1/monitors | 401 | |

---

## REGRESSION CHECKLIST — ALL CONFIRMED BUG FIXES

Run on every release before pushing to dev.

| Bug # | Test Case | Description | Must result in |
|-------|-----------|-------------|----------------|
| #103 | TC-RET-05 | Per-org data retention | Each org pruned per their plan's `data_retention_days` |
| #104 | TC-PAY-04 | Past-due retains plan limits | Scale past-due → Scale limits, NOT Free |
| #106 | TC-RZP-05 | INR downgrade UI blocked | Razorpay button absent for lower-tier plans |
| #107 | TC-COMP-02 | Compete — Lite blocked | 403 on compete checkout for Lite |
| #110 | TC-PAY-01 | No past_due on first failure | attempt_count=1 → no status change |
| #111 | TC-AIR-04 | AI report limit enforced | Builder blocked after 5 |
| #112 | TC-TEAM-04 | TOCTOU accept blocked | Accept blocked when org at limit |
| #112 | TC-TEAM-05 | Accept uses invite.org_id | invite.org_id used (not user.org_id) |
| #113 | TC-SP-14 | Scale: no Uptrue branding on status page | "Powered by Uptrue" absent |
| #113 | TC-AIR-10 | Scale: no branding in PDF | No branding in PDF |
| #114 | TC-LIM-10 | Builder: no API access | 403 for Builder API calls |
| #115 | TC-RZP-13 | No "Save 20%" for INR | Badge absent for INR |
| #115 | TC-RZP-14 | "Save up to 20%" for GBP | Correct label text |
| #116 | TC-RET-01 | Free 7-day retention | Pruned at 7 days |
| #116 | TC-RET-02 | Lite 30-day retention | Pruned at 30 days |
| #116 | TC-RET-03 | Builder 90-day retention | Pruned at 90 days |
| #116 | TC-RET-04 | Scale 365-day retention | Pruned at 365 days |
| #117 | TC-AIR-06 | Scale AI reports work | Scale generates unlimited |
| #117 | TC-AIR-07 | Scale not blocked by old limit=0 | No false-block |
| #118 | TC-RZP-06 | Razorpay API downgrade blocked | 403 on direct POST |
| #119 | TC-BIL-05 | Stripe API downgrade blocked | 403 on direct POST |

---

## OPEN BUGS — DO NOT TEST AS PASS

| Bug # | Description | Status |
|-------|-------------|--------|
| #105 | Stripe proration behaviour on upgrade | Awaiting product decision |
| #108 | Compete pricing: DB tiers vs KB single add-on | Awaiting product decision |
| #109 | Community credits Phase 2 (Stripe credit API) | Deferred to V1.5 |

---

## SIGN-OFF TRACKER

| Module | Tester | Date | ✅ Pass | ❌ Fail | Notes |
|--------|--------|------|---------|---------|-------|
| 1. Authentication (12) | @kritichawla | | | | |
| 2. Monitoring Engine (14) | @kritichawla | | | | |
| 3. Monitor Types — 23 types (52) | @kritichawla | | | | |
| 4. Alerting (14) | @kritichawla | | | | |
| 5. Status Pages (19) | @kritichawla | | | | |
| 6. AI Reports (13) | @kritichawla | | | | |
| 7. Billing — Stripe (14) | @kritichawla | | | | |
| 7. Billing — Razorpay (14) | @kritichawla | | | | |
| 7. Billing — Payment Failure (6) | @kritichawla | | | | |
| 7. Billing — Plan Limits (11) | @kritichawla | | | | |
| 7. Billing — Data Retention (6) | @kritichawla | | | | |
| 8. Team Management (9) | @kritichawla | | | | |
| 9. Workspaces (4) | @kritichawla | | | | |
| 10. Dashboard UX (15) | @kritichawla | | | | |
| 11. Compete Add-On (12) | @kritichawla | | | | |
| 12. Admin Panel (14) | @kritichawla | | | | |
| 13. Outage Blog (8) | @kritichawla | | | | |
| 14. SEO & Public Pages (11) | @kritichawla | | | | |
| 15. Email Nurture (5) | @kritichawla | | | | |
| 16. Cookie Consent & Legal (8) | @kritichawla | | | | |
| 17. Community Credits (12) | @kritichawla | | | | |
| 18. Security & Access Control (12) | @kritichawla | | | | |
| **Regression (Bug #103–#119)** | @kritichawla | | | | |

**Total: 215 test cases**

---

*Generated: 2026-06-22*  
*Source of truth: `knowledge/product/pricing.md`, `docs/FEATURES.md`, full KB*  
*Automated gate: `npx vitest run` — 569/569 before any human run*
