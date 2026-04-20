CREATE TABLE contact_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  email               text NOT NULL,
  subject             text NOT NULL,
  message             text NOT NULL,
  status              text NOT NULL DEFAULT 'pending_verification'
                        CHECK (status IN ('pending_verification', 'verified', 'read')),
  verification_token  text UNIQUE NOT NULL,
  verified_at         timestamptz,
  is_read             boolean NOT NULL DEFAULT false,
  ip_address          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_status     ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_token      ON contact_messages(verification_token);

-- No user-level access — service role only
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
