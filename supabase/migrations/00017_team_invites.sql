-- Team invites table
-- Replaces the broken direct-insert-to-users approach with a proper
-- invite workflow: invite → email → accept → add to org.

CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, accepted, cancelled, expired
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  UNIQUE(org_id, email)
);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users in the org can view invites
CREATE POLICY "Org members can view invites"
  ON team_invites FOR SELECT TO authenticated
  USING (org_id = public.user_org_id());

-- Service role can manage all invites (used by API routes)
CREATE POLICY "Service role manages invites"
  ON team_invites FOR ALL TO service_role
  USING (true) WITH CHECK (true);
