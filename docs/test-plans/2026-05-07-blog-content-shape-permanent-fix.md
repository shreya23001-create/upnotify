# Test Plan — Blog content-shape permanent fix

**Date:** 2026-05-07
**Branch:** dev (rebased over `3a5433d update issue #20 & #19`)
**Issue:** Blog posts published with empty content returning 404
**Files changed:**
- `lib/db/blog-posts.ts` — `normaliseContent()` helper, dropped `string` from input type
- `app/(admin)/admin/blog/actions.ts` — separate FormData fields, build content server-side, publish-empty guard, restore `og_image_url` + `tags`
- `components/admin/admin-blog-editor.tsx` — stop JSON.stringify double-encoding, send CTA fields separately, disable Publish on empty body
- `lib/services/calendar-blog-generator.ts` — fix orphan recovery `bodyMarkdown` extraction
- `app/(public)/blog/[slug]/page.tsx` — log warning on unexpected content shape
- `supabase/migrations/00103_blog_content_constraint.sql` — extends 00100, adds CHECK constraint
- `tests/unit/blog-content-normalise.test.ts` — 11 unit tests for `normaliseContent`

---

## Root cause (recap)

`calendar-blog-generator.ts` saved `content: draft.bodyMarkdown` (raw string) into the JSONB column on 2026-05-02. Postgres accepted it as a JSONB string primitive; the renderer at `[slug]/page.tsx` 404s because `content?.body` is undefined. Fixed in `3a5433d` on 2026-05-06, but four broken rows remain in DB and three related defects could let the bug recur from other writers.

---

## Pre-deploy automated checks (all must pass before push to dev)

```bash
cd uptrue-app
npx tsc --noEmit                                       # exit 0 expected
npx vitest run tests/unit/blog-content-normalise.test.ts  # 11 / 11 pass
npx vitest run                                            # 407 / 407 pass
```

Status at commit time: ✅ all three green.

---

## Migration safety check (run on dev DB only first)

Before `npx supabase db push`:

```sql
-- 1. Inventory rows the migration will touch
select status, jsonb_typeof(content) as ct, count(*) as n
from public.blog_posts
group by status, jsonb_typeof(content)
order by n desc;

-- 2. Posts that will be unpublished by step 3
select slug, title, published_at
from public.blog_posts
where status = 'published'
  and coalesce(content->>'body','') = ''
  and coalesce(content->>'html','') = '';
```

Apply the migration. After:

```sql
-- 3. Confirm the constraint is live
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.blog_posts'::regclass
  and conname = 'blog_posts_content_is_object';

-- 4. Confirm zero non-object rows remain
select count(*) from public.blog_posts where jsonb_typeof(content) <> 'object';
-- expected: 0

-- 5. Try to break it (should fail with constraint violation)
update public.blog_posts set content = '"raw string"'::jsonb where slug = 'website-monitoring';
-- expected: ERROR — new row violates check constraint "blog_posts_content_is_object"
```

---

## Human-tester walkthrough (admin editor)

Tester: Boss or Krithi, logged in as super admin on `dev.uptrue.io`.

### Path 1 — New post happy path
1. Go to `/admin/blog/new`
2. Title: `Test post — content shape fix verification`
3. Slug auto-fills
4. Body: paste 2 paragraphs of markdown including `**bold**` and `[a link](https://uptrue.io)`
5. Mid-CTA: heading "Try Uptrue", label "Start Free", URL "/signup"
6. End-CTA: leave heading empty
7. Click **Save Draft**
8. Reopen post from list
   - **Expect:** body, mid-CTA, slug, tags all preserved. End-CTA still empty (not corrupted to empty object).

### Path 2 — Publish-empty guard
1. New post, set title only
2. Body field empty
3. **Expect:** Publish button is disabled (greyed out, tooltip says "Add content before publishing")
4. Save Draft works (content is just `{}`)
5. Try to flip status dropdown to Published, then click Save Draft
   - **Expect:** server returns error "Cannot publish a post with no content. Add a body or save as draft."

### Path 3 — Existing post round-trip
1. Pick any existing published post (e.g. `wordpress-503-error` if present)
2. Open in admin editor
3. Add one paragraph at the end
4. Save Draft
5. Reload `dev.uptrue.io/blog/<slug>`
   - **Expect:** post renders correctly. Original CTAs and OG image still intact (regression check for the field-restoration in actions.ts).

### Path 4 — Calendar autoblog drafts
1. Navigate to `/admin/blog`
2. Filter by status `draft` and `auto_generated = true`
3. Open a recent calendar-generated draft (one created after migration runs)
4. View source (developer tools, `view-source:`) at `/blog/<slug>` (returns 404 because draft, not published — correct)
5. Approve via digest email link
6. Open `/blog/<slug>` after approval
   - **Expect:** renders correctly with body, no JSON gibberish.

### Path 5 — Existing broken slugs (backfilled by migration)
After migration runs on dev:
1. `dev.uptrue.io/blog/api-monitoring-tools` → expect 404 (now unpublished)
2. `dev.uptrue.io/blog/security-headers` → expect 404 (still draft)
3. `dev.uptrue.io/blog/website-monitoring` → expect 404 (still draft)
4. `dev.uptrue.io/blog/monitor-website-content-changes` → expect 404 (still draft)

In admin, they should all show as drafts with `{}` content — Boss can decide whether to add content or delete.

---

## Integration tests (no automated coverage — manual via Path 4 + DB query)

The end-to-end calendar-generator → digest → approve → publish flow has no unit tests today. Path 4 above is the manual integration check. Pre-existing — not introduced by this fix.

---

## Regression areas (where the fix could break something else)

| Area | Risk | Mitigation |
|---|---|---|
| Outage autoblog (`blog-generator.ts`) | None — uses `{ body, sources, midCta, endCta }` object form, untouched | n/a |
| PMB generator (`pmb-generator.ts`) | None — uses `{ html: content }`, untouched. CHECK constraint accepts. | normaliseContent test covers `{html: ...}` shape |
| Autoblog v1 (`autoblog-generator.ts`) | None — uses object form, untouched | n/a |
| Static blog `.tsx` files | None — they don't go through DB writers; `parseContent` still returns null for `type: 'static'` rows | Unchanged behaviour |
| Sitemap (`app/sitemap.ts`) | Posts unpublished by migration step 3 will leave the sitemap | Desired — they were 404ing |
| Public blog index | Unpublished posts will leave the index | Desired |
| Admin `/api/admin/blog` POST/PATCH endpoint | Receives `content` as Record from JSON body — passes through normaliseContent now | Type-tightening means TS callers must pass object; fetch callers without TS see the same DB-layer guard |
| Existing published WordPress static blogs | DB rows are placeholders (`type: 'static'`) — ignored by Next routing | Unchanged |

---

## Dependencies

- **Required:** Migration 00100 must have already run (it did the bulk of the string→object backfill). Migration 00103 is idempotent on top of 00100.
- **None on:** Vercel env vars, Stripe, Razorpay, Resend, social posting, WP plugin.
- **Forward dependency:** Once 00103 is live, any future blog-writer must respect the CHECK constraint. New writers should call `createBlogPost` / `updateBlogPost` from `lib/db/blog-posts.ts` rather than raw `supabase.from('blog_posts').insert()` — `normaliseContent` is the single chokepoint that guarantees compliance.

---

## Rollback plan

If something breaks after deploy:

1. **Code:** `git revert <merge-commit>` on dev branch — `normaliseContent` is additive so no data corruption from the rollback.
2. **Migration:** `ALTER TABLE public.blog_posts DROP CONSTRAINT blog_posts_content_is_object;` reinstates pre-103 behaviour. The unpublished posts can be re-published from admin if needed.
3. **Data:** No destructive UPDATEs in the migration are irreversible (string→object can be reversed by reading `content->>'body'` back into a string column — but no caller does that anyway).

---

## Sign-off

- [x] TypeScript: 0 errors
- [x] Unit tests: 407 / 407 pass (includes 11 new for `normaliseContent`)
- [ ] Migration applied to dev DB
- [ ] Path 1–5 walked manually on dev
- [ ] Boss approval before push to master
