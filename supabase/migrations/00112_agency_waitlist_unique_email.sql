-- =============================================================
-- 00112: Enforce one agency-waitlist signup per email (#146)
-- Prevents duplicate rows from repeated/double form submissions.
-- The API "check then insert" was a TOCTOU race; a unique index
-- makes dedupe atomic at the database level.
-- =============================================================

-- Collapse any pre-existing duplicates, keeping the earliest signup per email.
DELETE FROM agency_waitlist a
USING agency_waitlist b
WHERE lower(a.email) = lower(b.email)
  AND (a.created_at > b.created_at
       OR (a.created_at = b.created_at AND a.id > b.id));

-- One signup per email address, case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_waitlist_email_unique
  ON agency_waitlist (lower(email));
