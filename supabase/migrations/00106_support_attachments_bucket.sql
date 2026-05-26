-- Migration 00106: support-attachments storage bucket + RLS
-- =================================================================
-- Engineering-app#49 — the /api/v1/support/upload route writes to a
-- bucket named `support-attachments`. That bucket was never provisioned
-- on any Supabase project, so every upload returned "Bucket not found".
-- The route was hardened in commit ff68fc3 to fail closed with a 503
-- when the bucket is missing; this migration provisions it so uploads
-- actually work.
--
-- Decision (Boss, 2026-05-26): bucket is PRIVATE + signed URLs.
-- Support attachments often contain sensitive info (billing screenshots,
-- error logs with PII). Private + signed URL is the industry default.
-- The upload route paired with this migration uses createSignedUrl()
-- with a 7-day TTL instead of getPublicUrl().
-- =================================================================

-- 1. Create the bucket (idempotent — ON CONFLICT DO NOTHING for re-runs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,                            -- private; URLs are signed
  5242880,                          -- 5 MB (matches MAX_BYTES in the route)
  array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
)
on conflict (id) do nothing;

-- 2. RLS — defence in depth. The upload route uses the service role
-- client (createAdminClient), which bypasses RLS. These policies guard
-- against future code paths that might use the user's client by mistake.
--
-- Files are stored under <org_id>/<timestamp>-<random>.<ext> — the first
-- path segment is the org id. Policies allow a user to read only files
-- under their own org's folder.

-- Drop any pre-existing policies on this bucket so re-running the migration
-- is safe.
drop policy if exists "support_attachments_read_own_org" on storage.objects;
drop policy if exists "support_attachments_insert_own_org" on storage.objects;

-- Read: authenticated user can SELECT any object in support-attachments
-- whose first path segment matches their org_id.
create policy "support_attachments_read_own_org" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] in (
      select org_id::text from public.users where id = auth.uid()
    )
  );

-- Insert: same constraint — user can only upload to their own org folder.
-- (Service-role uploads from the API route still work, since service-role
-- bypasses RLS entirely.)
create policy "support_attachments_insert_own_org" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] in (
      select org_id::text from public.users where id = auth.uid()
    )
  );

-- 3. Cron job to delete attachments older than 90 days (out of scope here —
-- noted as a follow-up. Filed as needed when retention policy is decided.)
