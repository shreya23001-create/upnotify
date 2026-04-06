# Production Readiness Checklist

Items that are intentionally limited to dev/staging and must be enabled before going live.

---

## Audit Logging — Enable in Production

**Status:** Dev only  
**File:** `lib/db/audit.ts` — `devAuditLog()` function  
**What to do:** Remove the environment guard so audit logs write in production too.

```typescript
// Current (dev only):
export async function devAuditLog(input: AuditLogInput): Promise<void> {
  if (getEnvironment() === 'production') return   // ← REMOVE THIS LINE
  await writeAuditLog(input)
}
```

**Why it's gated:** Audit logging was added during QA testing phase. Before enabling in production, verify:
- [ ] All audit log entries look correct in User 360 activity log on dev
- [ ] No sensitive data is being logged in metadata fields
- [ ] audit_log table has no RLS that blocks the user-context writes
- [ ] Confirm performance is acceptable (audit log writes are fire-and-forget, should not block)

**Actions covered by devAuditLog (will go live when guard removed):**
- `monitor.created / updated / deleted / paused / resumed / bulk_*`
- `alert_channel.created / updated / deleted / enabled / disabled / bulk_*`
- `status_page.created / updated / deleted / bulk_*`

**Actions already writing to production audit log (writeAuditLog directly):**
- All admin actions (deactivate, activate, plan change, delete user)
- Impersonation start/end
- API key revoke
- User data export
- Team invite/remove

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
