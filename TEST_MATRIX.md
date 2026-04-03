# UPTRUE TEST MATRIX
# ================================================
# Use this document to track testing status.
# Mark each test: ✅ Pass | ❌ Fail | ⏳ Not Tested
# Report issues in the "Issues Found" column.
# Last updated: 2026-04-03
# ================================================

## 1. AUTHENTICATION & ACCOUNTS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 1.1 | Signup | Email/password signup | ⏳ | Sign up with new email → lands on dashboard | ⏳ | |
| 1.2 | Signup | Google OAuth signup | ⏳ | Click "Continue with Google" → authorize → dashboard | ⏳ | |
| 1.3 | Signup | Referral code in URL | ⏳ | /signup?ref=CODE → signup → referral tracked | ⏳ | |
| 1.4 | Login | Email/password login | ⏳ | Login with existing creds → dashboard | ⏳ | |
| 1.5 | Login | Google OAuth login | ⏳ | Click Google → authorize → dashboard | ⏳ | |
| 1.6 | Login | Back to home link | ⏳ | Logo/link on login page → goes to / | ⏳ | |
| 1.7 | Logout | Session end | ⏳ | Click logout → redirected to login | ⏳ | |
| 1.8 | Trial | 14-day Builder trial | ✅ (unit) | New signup → gets Builder features for 14 days | ⏳ | |
| 1.9 | Trial | Trial banner | ⏳ | Dashboard shows "X days remaining" banner | ⏳ | |
| 1.10 | Trial | Trial expiry | ⏳ | After 14 days → downgrade to Free | ⏳ | |

## 2. MONITORS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 2.1 | Create Monitor | HTTP monitor | ⏳ | Add URL → monitor created → first check runs | ⏳ | |
| 2.2 | Create Monitor | SSL monitor | ⏳ | Add domain → SSL check runs → cert details shown | ⏳ | |
| 2.3 | Create Monitor | DNS monitor | ⏳ | Add domain → DNS records checked | ⏳ | |
| 2.4 | Create Monitor | Keyword monitor | ⏳ | Add URL + keyword → check if keyword exists on page | ⏳ | |
| 2.5 | Create Monitor | Domain monitor | ⏳ | Add domain → expiry date tracked | ⏳ | |
| 2.6 | Create Monitor | Port monitor | ⏳ | Add host + port → port availability checked | ⏳ | |
| 2.7 | Create Monitor | Ping monitor | ⏳ | Add host → ICMP ping checked | ⏳ | |
| 2.8 | Create Monitor | API endpoint monitor | ⏳ | Add endpoint + expected response → validated | ⏳ | |
| 2.9 | Create Monitor | Heartbeat monitor | ⏳ | Generate heartbeat URL → send ping → tracked | ⏳ | |
| 2.10 | Create Monitor | Competitor/Page monitor | ⏳ | Add URL → page changes detected | ⏳ | |
| 2.11 | Plan Limits | Free plan (3 monitors) | ✅ (unit) | Create 3 → 4th blocked with upgrade link | ⏳ | |
| 2.12 | Plan Limits | Lite plan (5 monitors) | ✅ (unit) | Create 5 → 6th blocked | ⏳ | |
| 2.13 | Edit Monitor | Change URL/interval | ⏳ | Edit monitor settings → saves correctly | ⏳ | |
| 2.14 | Delete Monitor | With confirmation | ⏳ | Click delete → confirm dialog → monitor removed | ⏳ | |
| 2.15 | Pause/Resume | Toggle monitoring | ⏳ | Pause → checks stop. Resume → checks restart | ⏳ | |
| 2.16 | Bulk Actions | Select all + delete | ⏳ | Select multiple → bulk delete with confirmation | ⏳ | |
| 2.17 | Bulk Actions | Select all + pause | ⏳ | Select multiple → bulk pause | ⏳ | |
| 2.18 | Check Runner | Cron execution | ✅ (integration) | Cron fires → due monitors checked → results written | ⏳ | |
| 2.19 | Two-Confirmation | Down detection | ✅ (integration) | First check down → second check confirms → incident created | ⏳ | |
| 2.20 | Flap Detection | Flap logged | ✅ (integration) | First down + second up → flap count incremented | ⏳ | |
| 2.21 | Recovery | Incident resolved | ✅ (integration) | Monitor recovers → incident resolved → recovery alert | ⏳ | |
| 2.22 | Badge Embed | Badge display | ⏳ | Monitor detail → badge section → copy embed code → renders SVG | ⏳ | |

## 3. ALERTS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 3.1 | Create Channel | Email alert | ⏳ | Add email channel → test alert sends | ⏳ | |
| 3.2 | Create Channel | Slack alert | ⏳ | Add Slack webhook → test alert sends | ⏳ | |
| 3.3 | Create Channel | Teams alert | ⏳ | Add Teams webhook → test alert sends | ⏳ | |
| 3.4 | Create Channel | Webhook alert | ⏳ | Add webhook URL → test with HMAC signing | ⏳ | |
| 3.5 | Severity Filter | P1-P4 filtering | ⏳ | Channel set to P1 only → P2 incident doesn't trigger | ⏳ | |
| 3.6 | Alert Dispatch | Email delivery | ✅ (integration) | Incident created → email sent via Resend | ⏳ | |
| 3.7 | Alert Dispatch | Slack delivery | ✅ (integration) | Incident → Slack message posted | ⏳ | |
| 3.8 | Alert Dispatch | Webhook delivery | ✅ (integration) | Incident → webhook fired with HMAC | ⏳ | |
| 3.9 | Bulk Actions | Delete channels | ⏳ | Select multiple → bulk delete with confirmation | ⏳ | |
| 3.10 | Bulk Actions | Enable/disable | ⏳ | Select multiple → bulk enable/disable | ⏳ | |

## 4. STATUS PAGES

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 4.1 | Create | Status page | ⏳ | Create with name + slug + monitors → public URL works | ⏳ | |
| 4.2 | Public View | Status display | ⏳ | Visit /status/[slug] → shows uptime bars, incidents | ⏳ | |
| 4.3 | Subscribe | Email subscribe | ⏳ | Enter email on status page → double opt-in → notifications | ⏳ | |
| 4.4 | Unsubscribe | Token unsubscribe | ⏳ | Click unsubscribe link → confirmed → no more emails | ⏳ | |
| 4.5 | Time Range | 24h/7d/30d toggle | ⏳ | Switch time range → data updates correctly | ⏳ | |
| 4.6 | Edit | Update monitors/name | ⏳ | Edit status page → changes reflected publicly | ⏳ | |
| 4.7 | Delete | With confirmation | ⏳ | Delete → confirm → public URL returns 404 | ⏳ | |
| 4.8 | Bulk Actions | Publish/unpublish | ⏳ | Bulk publish/unpublish status pages | ⏳ | |

## 5. REPORTS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 5.1 | Generate | Uptime report | ⏳ | Select monitors + period → generate → shows uptime % | ⏳ | |
| 5.2 | Generate | Performance report | ⏳ | Generate → shows response time trends, slowest monitors | ⏳ | |
| 5.3 | Generate | Incident report | ⏳ | Generate → shows all incidents in period with timeline | ⏳ | |
| 5.4 | Generate | SLA report | ⏳ | Generate → shows uptime vs 99.9% target, compliance | ⏳ | |
| 5.5 | AI Summary | Claude summary | ⏳ | Report includes AI-generated executive summary | ⏳ | |
| 5.6 | AI Disclaimer | Disclaimer shown | ⏳ | AI summary shows disclaimer with link to /ai-disclaimer | ⏳ | |
| 5.7 | Delete | Report deletion | ⏳ | Delete report → confirm → removed from list | ⏳ | |

## 6. BILLING & PRICING

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 6.1 | Pricing Page | Landing pricing | ⏳ | Shows Free/Lite/Builder/Scale with correct prices | ⏳ | |
| 6.2 | Pricing Page | Monthly/annual toggle | ⏳ | Toggle switches prices, Lite always shows annual | ⏳ | |
| 6.3 | Pricing Page | Dashboard pricing | ⏳ | Settings → Billing → shows plans matching landing page | ⏳ | |
| 6.4 | Checkout | Lite (£10/yr) | ⏳ | Click upgrade → Stripe checkout → payment → plan active | ⏳ | |
| 6.5 | Checkout | Builder (£15/mo) | ⏳ | Click upgrade → Stripe → monthly subscription created | ⏳ | |
| 6.6 | Checkout | Scale (£39/mo) | ⏳ | Click upgrade → Stripe → subscription active | ⏳ | |
| 6.7 | Checkout | Free plan | ✅ (unit) | Free plan → no Stripe, returns error if attempted | ⏳ | |
| 6.8 | Webhook | Payment success | ✅ (integration) | Stripe webhook → subscription created in DB | ⏳ | |
| 6.9 | Webhook | Payment failed | ✅ (integration) | Stripe webhook → subscription marked past_due | ⏳ | |
| 6.10 | Portal | Manage subscription | ⏳ | Click manage → Stripe portal opens | ⏳ | |
| 6.11 | Redirect | After payment | ⏳ | After Stripe → redirects to dashboard (not uptrue.io) | ⏳ | |
| 6.12 | Credits | Balance display | ⏳ | Settings → Credits → shows current balance | ⏳ | |
| 6.13 | Credits | Earn methods | ⏳ | Shows all 4 ways to earn (badge, referral, review, bug) | ⏳ | |
| 6.14 | Credits | £10/mo cap | ⏳ | Cannot exceed £10/mo in credits | ⏳ | |

## 7. TEAM MANAGEMENT

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 7.1 | Invite | Send invite email | ⏳ | Enter email + role → invite email sent → pending shown | ⏳ | |
| 7.2 | Invite | Accept invite | ⏳ | Click email link → accept → joined org | ⏳ | |
| 7.3 | Invite | Cancel invite | ⏳ | Cancel pending invite → status cancelled | ⏳ | |
| 7.4 | Invite | Plan limit | ⏳ | Free (0 members) blocks invite with upgrade link | ⏳ | |
| 7.5 | Remove | Remove member | ⏳ | Click remove → confirm → member removed from org | ⏳ | |
| 7.6 | Roles | Member permissions | ⏳ | Member can view but not delete monitors | ⏳ | |

## 8. SETTINGS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 8.1 | Company | View details | ⏳ | Settings → Company → shows card with saved details | ⏳ | |
| 8.2 | Company | Edit details | ⏳ | Click edit → form → save → card updates without reload | ⏳ | |
| 8.3 | Company | Logo upload | ⏳ | Upload image → crop to 200x200 → shown in header | ⏳ | |
| 8.4 | API Keys | Create key | ⏳ | Create → key shown once → hashed in DB | ⏳ | |
| 8.5 | API Keys | Revoke key | ⏳ | Revoke → confirm → key no longer works | ⏳ | |
| 8.6 | Referrals | Referral link | ⏳ | Settings → Referrals → shows shareable link | ⏳ | |
| 8.7 | Referrals | Copy link | ⏳ | Click copy → link in clipboard | ⏳ | |

## 9. PUBLIC PAGES

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 9.1 | Landing | Page loads | ⏳ | / → all sections render, logo visible, CTA works | ⏳ | |
| 9.2 | Landing | Nav consistency | ⏳ | Logo LEFT, links CENTER, login RIGHT | ⏳ | |
| 9.3 | Landing | Dark mode | ⏳ | Toggle → all elements visible, logo switches | ⏳ | |
| 9.4 | Landing | Mobile responsive | ⏳ | Resize → hamburger menu, stacked layout | ⏳ | |
| 9.5 | Landing | Pricing section | ⏳ | 4 plans shown, toggle works, CTAs link to signup | ⏳ | |
| 9.6 | Landing | Agency waitlist | ⏳ | "Join Waitlist" → opens email to agencies@uptrue.io | ⏳ | |
| 9.7 | Landing | Trusted logos | ⏳ | Admin adds logos → they appear on landing page | ⏳ | |
| 9.8 | Score | Input page | ⏳ | /score → enter URL → redirects to results | ⏳ | |
| 9.9 | Score | Results page | ⏳ | /score/[domain] → score circle, 5 categories, badge embed | ⏳ | |
| 9.10 | Tracker | Directory | ⏳ | /tracker → paginated, category filter, status dots | ⏳ | |
| 9.11 | Tracker | Detail page | ⏳ | /tracker/[domain] → status, uptime, incidents, FAQ, subscribe | ⏳ | |
| 9.12 | Tracker | FAQ SEO | ⏳ | FAQ section with dynamic data, JSON-LD schema present | ⏳ | |
| 9.13 | Leaderboard | Rankings | ⏳ | /leaderboard → top sites ranked by uptime | ⏳ | |
| 9.14 | Tools | Index | ⏳ | /tools → lists all free tools | ⏳ | |
| 9.15 | Tools | SSL Checker | ⏳ | /tools/ssl-checker → enter domain → cert details shown | ⏳ | |
| 9.16 | Tools | Uptime Calculator | ⏳ | /tools/uptime-calculator → enter % → downtime shown | ⏳ | |
| 9.17 | Blog | Index + pagination | ⏳ | /blog → posts listed, pagination works | ⏳ | |
| 9.18 | Blog | Post pages | ⏳ | Each post loads, internal links work, CTA present | ⏳ | |
| 9.19 | About | Page loads | ⏳ | /about → company info, mission, values | ⏳ | |
| 9.20 | Contact | Form works | ⏳ | /contact → fill form → opens mailto (no mixed content) | ⏳ | |
| 9.21 | Contact | Dropdown options | ⏳ | No "Technical Support" or "Bug Report" in dropdown | ⏳ | |
| 9.22 | Credits | Public page | ⏳ | /credits → how to earn, CTA to signup | ⏳ | |
| 9.23 | Referrals | Public page | ⏳ | /referrals → give 1 month get 1 month, CTA | ⏳ | |
| 9.24 | Footer | Consistency | ⏳ | Same footer on ALL public pages (PublicFooter component) | ⏳ | |
| 9.25 | Footer | Trust badges | ⏳ | Secure Payments, GDPR, SLA badges visible | ⏳ | |
| 9.26 | Footer | Company info | ⏳ | Company name, registration, location shown | ⏳ | |
| 9.27 | Nav | Logged-in state | ⏳ | If logged in → "Dashboard" button instead of "Sign in" | ⏳ | |

## 10. LEGAL PAGES

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 10.1 | Terms | Page loads | ⏳ | /terms → renders, no hardcoded pricing | ⏳ | |
| 10.2 | Privacy | Page loads | ⏳ | /privacy → renders, all processors listed | ⏳ | |
| 10.3 | Cookies | Page loads | ⏳ | /cookies → renders, consent banner referenced | ⏳ | |
| 10.4 | DPA | Page loads | ⏳ | /dpa → renders, sub-processors listed | ⏳ | |
| 10.5 | AUP | Page loads | ⏳ | /acceptable-use → renders, Compete + Tracker disclaimers | ⏳ | |
| 10.6 | Agency | Page loads | ⏳ | /agency-agreement → renders, pricing links to pricing page | ⏳ | |
| 10.7 | Refund | Page loads | ⏳ | /refund-policy → renders, UK Consumer Rights referenced | ⏳ | |
| 10.8 | GDPR | Page loads | ⏳ | /gdpr → renders, all 7 rights listed | ⏳ | |
| 10.9 | AI Disclaimer | Page loads | ⏳ | /ai-disclaimer → renders, liability limitations clear | ⏳ | |
| 10.10 | SLA | Page loads | ⏳ | /sla → 99.9% target, service credits table | ⏳ | |
| 10.11 | Subprocessors | Page loads | ⏳ | /subprocessors → all processors with data locations | ⏳ | |
| 10.12 | Security | Page loads | ⏳ | /security → encryption, RLS, audit logging described | ⏳ | |

## 11. ADMIN PANEL

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 11.1 | Access | Super admin only | ⏳ | Non-admin → redirected to dashboard | ⏳ | |
| 11.2 | Dashboard | Stats cards | ⏳ | /admin → shows user/org/monitor counts | ⏳ | |
| 11.3 | Users | User list | ⏳ | /admin/users → all users with filters | ⏳ | |
| 11.4 | Users | Impersonate | ⏳ | Click impersonate → view as user → amber banner → exit | ⏳ | |
| 11.5 | Impersonate | Read-only | ⏳ | While impersonating → all mutations blocked | ⏳ | |
| 11.6 | Organisations | Org list | ⏳ | /admin/organisations → all orgs with filters | ⏳ | |
| 11.7 | Plans | Plan editor | ⏳ | /admin/plans → edit prices, limits, features | ⏳ | |
| 11.8 | Plans | Credit rules | ⏳ | Credit rules tab → edit amounts, caps, toggle active | ⏳ | |
| 11.9 | Tracker | Site management | ⏳ | /admin/tracker → add/remove/pause tracked sites | ⏳ | |
| 11.10 | Tracker | External link | ⏳ | ↗ icon opens public tracker page in new tab | ⏳ | |
| 11.11 | Feature Flags | Toggle flags | ⏳ | /admin/feature-flags → toggle on/off | ⏳ | |
| 11.12 | Team | Add sub-admin | ⏳ | /admin/team → add Gmail → role assigned | ⏳ | |
| 11.13 | Team | Permissions | ⏳ | Click Permissions → checkbox grid → save | ⏳ | |
| 11.14 | Team | Impersonate grant | ⏳ | Toggle impersonate permission per admin | ⏳ | |
| 11.15 | Settings | Trusted logos | ⏳ | /admin/settings → paste URLs → logos appear on landing | ⏳ | |

## 12. COMPETITOR INTELLIGENCE

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 12.1 | Add Competitor | Add domain | ⏳ | Enter competitor domain → added to dashboard | ⏳ | |
| 12.2 | Plan Limits | Competitor limit | ⏳ | Free (3), Lite (5), Builder (10), Scale (25) enforced | ⏳ | |
| 12.3 | Comparison | Side-by-side | ⏳ | Your uptime vs competitor uptime displayed | ⏳ | |
| 12.4 | Delete | Remove competitor | ⏳ | Delete → removed from dashboard | ⏳ | |

## 13. EMAIL NURTURE

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 13.1 | Welcome | Email on signup | ⏳ | New user → welcome email sent via Resend | ⏳ | |
| 13.2 | Trial Ending | 4-day warning | ⏳ | Trial ends in 4 days → email sent | ⏳ | |
| 13.3 | Trial Ending | 2-day warning | ⏳ | Trial ends in 2 days → email sent | ⏳ | |
| 13.4 | Trial Ending | Last day | ⏳ | Trial ends today → email sent | ⏳ | |
| 13.5 | Monthly Digest | Stats email | ⏳ | 1st of month → stats digest email | ⏳ | |
| 13.6 | Unsubscribe | Token unsubscribe | ⏳ | Click unsubscribe → preferences updated → confirmed | ⏳ | |
| 13.7 | Preferences | Opt-out categories | ⏳ | Settings → Email preferences → toggle categories | ⏳ | |

## 14. SEO & TECHNICAL

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 14.1 | Favicon | Shield icon | ⏳ | Browser tab shows Uptrue shield, not Vercel logo | ⏳ | |
| 14.2 | OG Image | Social sharing | ⏳ | Share URL on social → branded preview card | ⏳ | |
| 14.3 | Sitemap | All pages included | ⏳ | /sitemap.xml → all public pages listed | ⏳ | |
| 14.4 | Sitemap | Dynamic pages | ⏳ | Tracker sites + status pages auto-included | ⏳ | |
| 14.5 | Robots | Dev blocked | ⏳ | dev.uptrue.io/robots.txt → Disallow: / | ⏳ | |
| 14.6 | Robots | Prod allowed | ⏳ | uptrue.io/robots.txt → Allow public, block dashboard | ⏳ | |
| 14.7 | JSON-LD | Structured data | ⏳ | Landing page → Organization, SoftwareApp, FAQ schema | ⏳ | |
| 14.8 | JSON-LD | Tracker FAQ | ⏳ | Tracker detail → FAQPage schema with dynamic data | ⏳ | |
| 14.9 | Metadata | All pages | ⏳ | Every public page has title, description, OG tags | ⏳ | |

## 15. SECURITY

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 15.1 | Headers | Security headers | ⏳ | X-Frame-Options, X-Content-Type, Referrer-Policy present | ⏳ | |
| 15.2 | Auth | Protected routes | ⏳ | /dashboard without login → redirect to /login | ⏳ | |
| 15.3 | Auth | Admin routes | ⏳ | /admin without super_admin → redirect to /dashboard | ⏳ | |
| 15.4 | Rate Limiting | Auth endpoints | ✅ (unit) | 10 req/15min → 11th blocked with 429 | ⏳ | |
| 15.5 | Rate Limiting | Public APIs | ✅ (unit) | Subscribe (5/min), badge (100/min), SSL check (15/min) | ⏳ | |
| 15.6 | IDOR | Ownership check | ⏳ | User A cannot edit User B's monitor | ⏳ | |
| 15.7 | Redirect | Open redirect fixed | ✅ (unit) | /auth/callback?next=//evil.com → defaults to /dashboard | ⏳ | |
| 15.8 | Stripe | Webhook verification | ✅ (integration) | Invalid signature → 400 rejected | ⏳ | |
| 15.9 | Stripe | Production enforcement | ✅ (integration) | Missing webhook secret in prod → 500 | ⏳ | |
| 15.10 | Cookie Consent | Banner shown | ⏳ | First visit → consent banner appears | ⏳ | |
| 15.11 | Cookie Consent | Preferences saved | ⏳ | Accept/reject → saved to localStorage | ⏳ | |
| 15.12 | GDPR | Data export | ✅ (integration) | GET /api/v1/user/export → downloads JSON | ⏳ | |
| 15.13 | GDPR | Account deletion | ✅ (integration) | DELETE /api/v1/user/delete → cascading delete | ⏳ | |

## 16. ONBOARDING

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 16.1 | Wizard | First-time flow | ⏳ | New user → wizard shows → add URL → monitors created | ⏳ | |
| 16.2 | Wizard | Dismissable | ⏳ | Click X → wizard hidden → never shows again | ⏳ | |
| 16.3 | Getting Started | Card on dashboard | ⏳ | Shows checklist: monitor ✓, alert ✓, status page ✓ | ⏳ | |
| 16.4 | Getting Started | Auto-hide | ⏳ | All steps done → congratulations → auto-hides | ⏳ | |

## 17. HELP CENTER

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 17.1 | Index | Search works | ⏳ | /dashboard/help → search filters topics | ⏳ | |
| 17.2 | Topics | All 9 topics load | ⏳ | Getting started, monitors, alerts, status pages, billing, competitors, credits, referrals, tools | ⏳ | |
| 17.3 | Admin Help | Hidden from users | ⏳ | Regular user → admin help topic not visible | ⏳ | |
| 17.4 | Pricing | Links to pricing page | ⏳ | Billing help → links to /#pricing, no hardcoded prices | ⏳ | |

## 18. DARK MODE

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 18.1 | Toggle | Theme switch | ⏳ | Click toggle → all elements switch correctly | ⏳ | |
| 18.2 | Logo | Visible in dark mode | ⏳ | Logo text readable on dark backgrounds | ⏳ | |
| 18.3 | Charts | Readable in dark | ⏳ | Dashboard charts visible and labeled in dark mode | ⏳ | |
| 18.4 | Forms | Disabled fields visible | ⏳ | Disabled inputs readable (opacity 0.75) in dark mode | ⏳ | |
| 18.5 | Sidebar | Dark bg always | ⏳ | Dashboard + admin sidebar always dark (not affected by toggle) | ⏳ | |

## 19. MOBILE RESPONSIVENESS

| # | Feature | Sub-Feature | Unit Test | Functional Test | Status | Issues Found |
|---|---|---|---|---|---|---|
| 19.1 | Landing | Mobile layout | ⏳ | All sections stack, nav collapses, pricing cards stack | ⏳ | |
| 19.2 | Dashboard | Mobile sidebar | ⏳ | Hamburger menu → sidebar slides in → overlay | ⏳ | |
| 19.3 | Admin | Mobile sidebar | ⏳ | Same hamburger + slide pattern | ⏳ | |
| 19.4 | Tables | Mobile tables | ⏳ | Data tables scrollable on mobile, touch-friendly | ⏳ | |
| 19.5 | Forms | Mobile forms | ⏳ | All forms usable on 375px screen | ⏳ | |

---

## SUMMARY

| Category | Total Tests | Unit Tests | Functional Tests | Pass | Fail | Not Tested |
|---|---|---|---|---|---|---|
| Authentication | 10 | 1 | 10 | ⏳ | ⏳ | ⏳ |
| Monitors | 22 | 5 | 22 | ⏳ | ⏳ | ⏳ |
| Alerts | 10 | 3 | 10 | ⏳ | ⏳ | ⏳ |
| Status Pages | 8 | 0 | 8 | ⏳ | ⏳ | ⏳ |
| Reports | 7 | 0 | 7 | ⏳ | ⏳ | ⏳ |
| Billing | 14 | 3 | 14 | ⏳ | ⏳ | ⏳ |
| Team | 6 | 0 | 6 | ⏳ | ⏳ | ⏳ |
| Settings | 7 | 0 | 7 | ⏳ | ⏳ | ⏳ |
| Public Pages | 27 | 0 | 27 | ⏳ | ⏳ | ⏳ |
| Legal | 12 | 0 | 12 | ⏳ | ⏳ | ⏳ |
| Admin | 15 | 0 | 15 | ⏳ | ⏳ | ⏳ |
| Competitor Intel | 4 | 0 | 4 | ⏳ | ⏳ | ⏳ |
| Email Nurture | 7 | 0 | 7 | ⏳ | ⏳ | ⏳ |
| SEO | 9 | 0 | 9 | ⏳ | ⏳ | ⏳ |
| Security | 13 | 6 | 13 | ⏳ | ⏳ | ⏳ |
| Onboarding | 4 | 0 | 4 | ⏳ | ⏳ | ⏳ |
| Help Center | 4 | 0 | 4 | ⏳ | ⏳ | ⏳ |
| Dark Mode | 5 | 0 | 5 | ⏳ | ⏳ | ⏳ |
| Mobile | 5 | 0 | 5 | ⏳ | ⏳ | ⏳ |
| **TOTAL** | **189** | **18** | **189** | ⏳ | ⏳ | ⏳ |
