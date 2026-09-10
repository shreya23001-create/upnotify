# Uptrue — Product Requirements
# ============================================================
# Single source of truth for what Uptrue is, who it's for,
# and what it must do. Read this before writing any code.
# Last updated: April 2026
# ============================================================

---

## 1. PRODUCT OVERVIEW

**Uptrue** is a multi-tenant SaaS platform for uptime, performance, and infrastructure monitoring.

**Category we are creating:** Website Monitoring Suite — not "uptime monitoring."

**Core positioning line:** "Your website has 23 things that can go wrong. Most tools check one. Uptrue monitors all of them."

### Origin Story
Built by a UK agency owner (sachindiwaker@gmail.com) who runs a web agency monitoring hundreds of client sites on UptimeRobot's free tier. The tool was conceived to replace UptimeRobot and grow into a sellable SaaS targeting other agencies and direct users via Google Ads and SEO.

### Core Philosophy
- Start with external monitoring (ping URLs, check SSL, watch DNS) — the simplest form
- Evolve toward developer-native monitoring (SDK, heartbeats, API assertions) as the product matures
- Agencies are the highest-value customers
- Direct users are the top-of-funnel growth driver
- No validation needed — founder runs an agency. He IS the market. Building for himself first

---

## 2. USER TYPES & ACCOUNT MODEL

### Five User Types
| Type | Description |
|---|---|
| **Direct user** | Signs up via Google Ads / SEO. Monitors their own sites. |
| **Agency owner** | Owns an agency workspace. Manages multiple client sub-accounts. |
| **Agency team member** | Staff within an agency. Role-based access. |
| **Client user** | Client of an agency. Read-only access to their own workspace. |
| **Super admin** | sachindiwaker@gmail.com only. Platform-wide control. |

### Three-Level Account Hierarchy
```
Organisation
  └── Client workspace
        └── Environment group
              └── Individual monitor
```

### Roles
| Role | Access |
|---|---|
| Admin | Full access |
| Manager | Monitors + assigned clients |
| Viewer | Read only |
| Client user | Own workspace only |

### Alert Routing Rules
- Agency team gets ALL alerts for ALL their clients
- Clients only get alerts the agency explicitly enables for them
- Different severity levels route to different people

### Internal Accounts
- Agency owner's own sites flagged as `is_internal = true`
- Excluded from billing metrics and public reports
- Used for testing before client onboarding

---

## 3. MONITOR TYPES — V1 (23 total)

### Two-Confirmation Down Detection (critical rule)
1. First check fails → wait 30 seconds
2. Second check from a different region
3. Both fail = incident created + alerts fired
4. Second check passes = log as flap, no alert
5. Flap count visible on monitor detail page

### Core 10 (original)
| # | Type | What it checks |
|---|---|---|
| 1 | HTTP/HTTPS Uptime | Status code + response time |
| 2 | SSL Certificate | Expiry date, validity, domain match |
| 3 | Domain Expiry | WHOIS registrar expiry date |
| 4 | DNS Records | A, MX, NS, TXT record change detection |
| 5 | Keyword Detection | Word present or absent on a page |
| 6 | Port Check | TCP port open/closed (SSH, SMTP, MySQL etc.) |
| 7 | API Endpoint | HTTP request with headers, assert response body/status |
| 8 | Ping / Reachability | ICMP ping, host reachability |
| 9 | Heartbeat | Cron job checks in via HTTP ping — alert if it stops |
| 10 | Page Change Detection | Alert on any content change on a URL |

### Advanced 13 (added in V1.0.0)
| # | Type | What it checks |
|---|---|---|
| 11 | Security Headers | CSP, HSTS, X-Frame-Options scoring |
| 12 | Response Time Threshold | Alert when response time crosses configured limit |
| 13 | robots.txt Change | Detects changes + Googlebot block |
| 14 | IP Address Change | Alerts on A record change vs stored baseline |
| 15 | MX Health | MX lookup + TCP port 25/587 check per MX host |
| 16 | WHOIS Registrar Change | Detects registrar change vs stored baseline |
| 17 | Sitemap Validity | Validates XML structure (urlset / sitemapindex) |
| 18 | Redirect Chain | Detects change in redirect chain or final URL |
| 19 | SPF / DMARC Validity | Validates SPF v=spf1 and DMARC v=DMARC1 format |
| 20 | Blacklist Check | DNS-based queries: Spamhaus ZEN/DBL, Barracuda, SpamCop, SORBS |
| 21 | Page Size | Alert on >30% deviation (spike = malware, drop = content deleted) |
| 22 | Cookie Consent Presence | Scans for GDPR consent library signatures |
| 23 | Nameserver Change | NS record change — default P1 severity, 1hr interval |

### Deferred to V2
- Google Safe Browsing check
- Certificate Transparency monitoring
- TLS cipher suite check
- HSTS preload status
- Core Web Vitals
- Visual regression (screenshot diff)
- Broken link crawl
- Multi-step transaction monitor (Playwright)
- Server resource monitoring (CPU/RAM/disk via agent)
- Database connectivity checks
- Third-party script load time

---

## 4. SEVERITY LEVELS

| Level | Default Trigger | Customisable |
|---|---|---|
| P1 Critical | Site completely unreachable | Yes |
| P2 High | Degraded performance OR SSL < 7 days | Yes |
| P3 Medium | SSL < 30 days OR DNS changed OR keyword changed | Yes |
| P4 Low | Domain expiry warning OR heartbeat missed once | Yes |

All severities are fully customisable per monitor.

---

## 5. ALERT CHANNELS — V1

| Channel | Plans | Notes |
|---|---|---|
| Email | All plans | Resend, per-contact per-severity |
| Slack | Builder+ | Incoming webhook, configurable channel per severity |
| Microsoft Teams | Builder+ | Incoming webhook, adaptive card format |
| WhatsApp | Scale+ | Twilio WhatsApp API, Meta pre-approved templates required |
| AI Voice Call | Agency only (Phase 2) | ElevenLabs + Twilio, 100 calls/mo pool |
| Webhook / API Push | Builder+ | Custom HTTP POST, HMAC-SHA256 signed |

### Voice Call Specifics
- Triggers on any incident where customer has enabled voice for that monitor
- 100 calls/month shared across all client workspaces (Agency plan)
- Over limit: calls stop, email fires instead
- Maximum overage: £0.10/call, capped at £50/month
- ElevenLabs generates voice from dynamic script, Twilio places the call
- Call outcome logged in database

---

## 6. STATUS PAGES

### Hosting by Plan
| Plan | Domain |
|---|---|
| Free / Lite | upnotify-monitoring.vercel.app/status/slug |
| Builder | upnotify-monitoring.vercel.app/status/slug |
| Scale | status.yourclientname.com (CNAME) |
| Agency (Phase 2) | client's own domain (status.acmecorp.com) |

### Content (all public, no login required)
- Current status per monitor (Up / Degraded / Down)
- 90-day uptime percentage
- Response time graph (30 / 60 / 90 day selector)
- Incident history log
- Active incident banner
- Scheduled maintenance announcements
- Email subscribe for status updates
- Custom branding (Agency — Phase 2)

### Domain Verification (custom domains)
1. Agency enters custom domain
2. Platform generates DNS TXT record value
3. Agency adds TXT to their DNS
4. Platform polls every 5 minutes for up to 24 hours
5. On verification: SSL auto-provisioned via Let's Encrypt
6. Same verification required before white-label email sending

### Maintenance Windows
- Configurable start/end time + affected monitors
- Monitoring pauses during window — zero alerts fire
- Status page shows 'Scheduled maintenance' banner
- After window: monitoring auto-resumes
- If window overruns: optional alert to agency owner

---

## 7. REPORTING & AI

### Schedule Options
- Monthly automatic (1st of month, 08:00 in org timezone)
- Custom schedule per client (Scale + Agency)
- On-demand (all paid plans)

### Report Format
- Web page URL, print-friendly via CSS
- No PDF generation required

### Report Contents
| Section | Notes |
|---|---|
| Overall uptime % | For the period |
| Per-monitor breakdown | Each monitor's uptime % |
| Incident list | Duration and cause |
| SSL + domain expiry status | Current state |
| Response time averages + trends | Period comparison |
| Maintenance windows | Scheduled and completed |
| Month-on-month comparison | Up/down vs prior period |
| Upcoming expiry alerts | 60-day horizon |
| AI executive summary | Claude API — 2–3 paragraphs plain English |
| AI predictive alerts | Pattern recognition — requires 90 days minimum data |

### Predictive Alert Examples
- "Site went down every Easter Monday for 2 years"
- "Response times degrade every Friday 17:00–19:00"
- "SSL has expired twice — auto-renewal not configured"

AI predictive alerts are Scale plan and above.

---

## 8. PRICING & PLANS

### V1 Plans (current)
| Plan | Price | Monitors | Interval |
|---|---|---|---|
| Free | £0 | 3 | 10 min |
| Lite | £10/yr | 5 | 1 min |
| Builder | £15/mo | 50 | 1 min |
| Scale | £39/mo | 250 | 30 sec |

### Annual Billing
- Annual discount available on paid plans
- Billing cadence: monthly or annual

### Agency Model (Phase 2)
- Entry fee: £149 one-time onboarding — never pay again
- Monthly fee: £0 — zero recurring
- Revenue split: Uptrue keeps 75% of all agency client billing
- Agency keeps: 25% — their margin on client relationships
- Fixed at 75/25 for all agencies (reviewed by custom agreement at 200+ clients)

### Billing Behaviour
- 7-day grace period on payment failure
- 3 automatic retries (day 1, 3, 6)
- Dunning email sequence on days 1, 3, 6
- Prorated upgrade mid-cycle
- Invoice download from billing dashboard
- Agency: white-label billing emails from verified domain (Phase 2)
- SLA breach on Agency helpdesk: 10% bill credit, max 1/month (Phase 2)

### No Free Trials — Ever
Free plan + low-cost Lite is the entry point. No time-limited trials.

### Pricing is Never Hardcoded
All prices, limits, and features live in the `plans` table in Supabase. Admin-editable. Landing page, dashboard, and enforcement all read from the same source.

---

## 9. SUPPORT & TICKETING (Phase 2)

### SLAs by Plan
| Plan | SLA | Channel |
|---|---|---|
| Free / Lite | 5 business days | Email only |
| Builder | No SLA | Self-serve docs only |
| Scale | 1 business day | Priority email + AI chat |
| Agency | 24 hours | Dedicated Slack + AI chat |

### AI Chatbot Deflection
- Every support interaction begins with Claude-powered chatbot
- Searches docs + resolved ticket history
- Target: 40–60% deflection rate
- If unresolved: 'Raise a ticket' button — full chat transcript attached

### White-Label Helpdesk (Agency — Phase 2)
- Branded per agency, agency sets own SLAs
- Embeddable support widget for agency's client portal
- AI chatbot trained on agency's own documentation

---

## 10. INTEGRATIONS

### Webhook Events
```
incident.created, incident.resolved, incident.updated,
ssl.expiring, domain.expiring, dns.changed, keyword.changed,
heartbeat.missed, maintenance.started, maintenance.ended, report.ready
```

### Webhook Security
- All payloads HMAC-SHA256 signed
- Header: `X-Uptrue-Signature: sha256=<hex>`
- Signature verified on retry events

### REST API (Scale+)
- Rate limits: Scale 1,000/day (60/min) — Enterprise higher
- Full CRUD for monitors, incidents, reports
- API keys: bcrypt hashed on creation, shown once
- API consumption report in dashboard

### Ticketing Integrations Philosophy
- Universal outbound webhook — not native integrations
- Ready-made code snippets for: Jira, Linear, Freshdesk, Zendesk, Monday, ClickUp, GitHub Issues, Asana
- n8n / Zapier / Make pre-built templates included

---

## 11. SECURITY & COMPLIANCE REQUIREMENTS

### Authentication
- Supabase Auth handles all sessions — no custom auth code
- Admin area: Google OAuth only, email whitelist in Vercel env vars
- Rate limiting: 5 failed attempts = 15 min lockout
- Session auto-logout after 24h inactivity

### Data
- GDPR compliant — data stored in EU only (Supabase Frankfurt)
- RLS on every table — enforced at database level
- Every query also explicitly scoped by org_id (double protection)
- API keys: bcrypt hashed, shown once, never stored plain
- 2FA: TOTP, mandatory for super admin, enforced on Agency plan
- Audit log: immutable, 1-year retention, append-only

### Encryption
- HTTPS only, TLS 1.2 minimum
- Sensitive config fields encrypted at application layer (AES-256)
- HMAC-SHA256 for webhook payload signing

### Compliance Targets
- GDPR compliant at launch
- SOC 2: target 12 months post-launch
- Pen testing: before public launch
- Data retention policy: personal data deleted within 30 days of erasure request

---

## 12. NON-FUNCTIONAL REQUIREMENTS

### Performance Targets
| Area | Target |
|---|---|
| Dashboard load | < 2 seconds |
| Public status pages | < 1 second |
| API response p95 | < 500ms |
| Check runner batch | < 30 seconds |
| Report generation | < 30 seconds |

### Scalability Targets
- 10,000 simultaneous monitors
- 1,000 concurrent dashboard users
- 100 concurrent API requests
- Auto-scale via Vercel serverless

### Migration Path
- Current: Vercel + Supabase free tiers
- Migration trigger: ~£2,000–3,000/mo infra cost (~500k+ monitors)
- Path A: Next.js → AWS Amplify. Cron → EventBridge/Lambda. Postgres → RDS
- Path B: Docker + ECS/EKS. Checker as microservice. SQS between checker and alert engine
- **Service abstraction pattern ensures migration = changing service files + env vars only**

---

## 13. ENVIRONMENT MANAGEMENT

### Three Environments
| Environment | Where | Banner | Keys |
|---|---|---|---|
| Development | localhost / 127.0.0.1 | Yellow: "Development mode" | Test keys always |
| Staging | *.vercel.app | Yellow: "Staging environment" | Test keys always |
| Production | upnotify-monitoring.vercel.app | None | Respects Live/Test toggle |

### Live/Test Mode Toggle (production only)
- Super admin (sachindiwaker@gmail.com) only
- Requires OTP to switch: 6-digit code, 10-min expiry, 3 attempts = 30-min lockout
- Test mode in production shows RED banner in admin
- Customer pages never show mode banner
- Switches: Stripe, Razorpay, Twilio, Resend, ElevenLabs, webhook endpoints, voice numbers

---

## 14. DEPLOYMENT PIPELINE

| Stage | Owner | Gate |
|---|---|---|
| 1 — Code | Claude | — |
| 2 — AI review | Claude | Full checklist (CLAUDE.md §18) |
| 3 — Human review | Founder | Business logic approval |
| 4 — Automated tests | Vitest + GitHub Actions | Any failure blocks |
| 5 — Static analysis | TypeScript + ESLint | Type errors block |
| 6 — Security scan | npm audit + secrets scanner | Vulnerabilities block |
| 7 — Staging smoke | Vercel preview | Login, monitor, alert, billing, API |
| 8 — Production | Vercel (one-click) | Instant rollback available |

---

## 15. RUNNING COSTS AT LAUNCH

| Service | Cost |
|---|---|
| Next.js / Vercel | Free tier |
| Supabase | Free tier |
| Resend | Free (3k emails/mo) |
| Twilio SMS/WhatsApp/Voice | ~£20/mo |
| ElevenLabs | Free then ~£5/mo |
| Claude API | ~£20–30/mo |
| Stripe + Razorpay | % per transaction |
| Sentry | Free tier |
| **Total** | **~£50–60/mo** |

---

*Last updated: April 2026*
*Owner: Sachin Diwaker (sachindiwaker@gmail.com)*
