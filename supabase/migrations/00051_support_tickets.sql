-- =============================================================================
-- Migration 00051: Support ticket system
-- Tables: support_tickets, support_messages
-- =============================================================================

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject        TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'general'
                   CHECK (category IN ('billing','technical','feature_request','bug','general')),
  priority       TEXT        NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high','urgent')),
  status         TEXT        NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','waiting_on_user','resolved','closed')),
  assigned_to    TEXT,
  message_count  INTEGER     NOT NULL DEFAULT 0,
  last_reply_at  TIMESTAMPTZ,
  last_reply_by  TEXT        CHECK (last_reply_by IN ('user','admin')),
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- support_messages  (append-only thread)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  org_id      UUID        NOT NULL,
  author_type TEXT        NOT NULL CHECK (author_type IN ('user','admin')),
  author_name TEXT,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_support_tickets_org_id     ON public.support_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket    ON public.support_messages(ticket_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view tickets belonging to their own org
CREATE POLICY "support_tickets_select_own_org"
  ON public.support_tickets FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1));

-- Users can create tickets for their own org only
CREATE POLICY "support_tickets_insert_own_org"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    org_id  = (SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1)
    AND user_id = auth.uid()
  );

-- Users can see messages on tickets belonging to their org
CREATE POLICY "support_messages_select_own_org"
  ON public.support_messages FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1));

-- Users can post messages on their org's tickets
CREATE POLICY "support_messages_insert_own_org"
  ON public.support_messages FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1));
