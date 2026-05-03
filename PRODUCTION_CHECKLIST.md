# Production Readiness Checklist

Items that must be enabled or verified before going live.

---

## Audit Logging — Status: ENABLED in all environments

**File:** `lib/db/audit.ts`
The historic dev-only environment guard has been removed; both
`writeAuditLog()` and the `devAuditLog()` alias now write audit rows
unconditionally in dev, staging and production.

### Coverage matrix

| Surface | Action(s) logged | Where |
|---|---|---|
| **Authentication** | `auth.magic_link_requested`, `auth.magic_link_failed`, `auth.google_oauth_failed`, `auth.logout` | `lib/auth/actions.ts` |
| **Authentication** | `auth.login.success`, `auth.login.failed` | `app/auth/callback/route.ts` |
| **Monitors** | `monitor.created / updated / deleted / paused / resumed / bulk_*` | `app/(dashboard)/dashboard/monitors/actions.ts` |
| **Alert channels** | `alert_channel.created / updated / deleted / enabled / disabled / bulk_*` | `app/(dashboard)/dashboard/alerts/actions.ts` |
| **Status pages** | `status_page.created / updated / deleted / bulk_*` | `app/(dashboard)/dashboard/status-pages/actions.ts` |
| **API keys** | `api_key.created / api_key.revoked` | `app/api/v1/api-keys/route.ts`, `app/api/v1/api-keys/revoke/route.ts` |
| **Team** | `team.invited / team.accepted / team.removed` | `app/api/v1/team/route.ts`, `app/api/v1/team/accept/route.ts` |
| **User data** | `user.data_export`, `user.delete` | `app/api/v1/user/export/route.ts`, `app/api/v1/user/delete/route.ts` |
| **Admin** | `admin.role_created / role_updated / monitor_limit_override / wp_monitor_limit_override` | `app/(admin)/admin/team/actions.ts`, `app/(admin)/admin/user360/actions.ts` |
| **Admin impersonation** | `admin.impersonate_start / impersonate_end` | `app/api/v1/admin/impersonate/route.ts` |
| **Billing — Stripe** | `subscription.created / updated / canceled`, `compete_subscription.created`, `invoice.paid`, `invoice.payment_failed` | `app/api/webhooks/stripe/route.ts` |
| **Billing — Razorpay** | `subscription.created / canceled / halted / resumed`, `invoice.paid` | `app/api/webhooks/razorpay/route.ts` |

### Pre-launch verification
- [ ] All audit log entries look correct in User 360 activity log on dev
- [ ] No sensitive data is being logged in metadata fields (no passwords, no card data, no auth tokens)
- [ ] `audit_log` table has no RLS that blocks system-context writes (`org_id='system'` rows from auth events)
- [ ] Performance acceptable — audit log writes are fire-and-forget, should not block user actions

---

## Other Items

| Item | Status | Notes |
|---|---|---|
| Stripe webhook secret | Done | Set in Vercel env vars for all environments |
| Stripe live keys | Pending | Swap test keys for live keys before launch |
| Supabase prod project | Pending | Create uptrue-prod project in Frankfurt region |
| Vercel prod env vars | Pending | Copy all env vars, use live keys |
| DNS cutover | Pending | Point uptrue.io to Vercel prod deployment |
| Cookie consent banner | Pending | Required before live traffic |
| Email alerts (Resend) | Pending | Set RESEND_API_KEY in prod env |
| Cron jobs | Pending | Switch from cron-job.org to Vercel Pro native crons |

---

*Last updated: April 2026*
