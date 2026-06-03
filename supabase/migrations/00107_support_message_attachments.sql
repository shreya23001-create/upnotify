-- Migration 00107: persist support message attachments
-- =================================================================
-- The /api/v1/support/upload route uploads files to the
-- support-attachments bucket (migration 00106) and the client posts
-- the resulting metadata alongside ticket creation and replies. Until
-- now both POST handlers silently dropped that payload because
-- support_messages had no column to hold it and the DB layer didn't
-- accept it. As a result Boss reported "attachment uploaded but not
-- visible in /admin/support/<id>" — the row was created, but the file
-- pointer was never written. This migration adds the missing column.
--
-- Shape: JSONB array of { path, name?, mime?, size? }.
-- We store the storage path (durable) rather than the signed URL
-- (expires after 7 days). The read path regenerates a signed URL on
-- demand from `path`.
-- =================================================================

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
