-- Add is_active flag to users (cleaner than changing role constraint)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
