-- Track user's original org so they can switch back after accepting a team invite
ALTER TABLE users ADD COLUMN IF NOT EXISTS original_org_id UUID REFERENCES organisations(id);

-- Backfill: for existing users, set original_org_id = current org_id
UPDATE users SET original_org_id = org_id WHERE original_org_id IS NULL;
