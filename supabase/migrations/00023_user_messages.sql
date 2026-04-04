-- =============================================================
-- 00023: User Messages / Notifications system
-- Supports: system notifications, admin broadcasts, plan alerts
-- =============================================================

-- Messages table
create table if not exists user_messages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organisations(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  title         text not null,
  body          text not null,
  type          text not null default 'info' check (type in ('info', 'warning', 'success', 'error', 'system')),
  category      text not null default 'general' check (category in ('general', 'billing', 'plan', 'system', 'announcement', 'credit')),
  is_read       boolean not null default false,
  read_at       timestamptz,
  action_url    text,
  action_label  text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  metadata      jsonb default '{}'::jsonb
);

-- Indexes
create index idx_user_messages_user_id on user_messages(user_id);
create index idx_user_messages_org_id on user_messages(org_id);
create index idx_user_messages_unread on user_messages(user_id, is_read) where is_read = false;
create index idx_user_messages_created on user_messages(created_at desc);

-- RLS
alter table user_messages enable row level security;

-- Users can read their own messages
create policy "Users can read own messages" on user_messages
  for select using (auth.uid() = user_id);

-- Users can update (mark read) their own messages
create policy "Users can update own messages" on user_messages
  for update using (auth.uid() = user_id);

-- Service role can insert (for admin broadcasts, system messages)
-- No insert policy for regular users — only service role inserts

-- Credit review submissions table
create table if not exists credit_submissions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  credit_type     text not null check (credit_type in ('trustpilot_review', 'g2_review', 'capterra_review', 'blog_post', 'social_share', 'bug_report')),
  submission_url  text,
  evidence_text   text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes    text,
  reviewed_by     text,
  reviewed_at     timestamptz,
  credit_amount_pence integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Indexes
create index idx_credit_submissions_org on credit_submissions(org_id);
create index idx_credit_submissions_status on credit_submissions(status);
create index idx_credit_submissions_user on credit_submissions(user_id);

-- RLS
alter table credit_submissions enable row level security;

-- Users can read own submissions
create policy "Users can read own submissions" on credit_submissions
  for select using (auth.uid() = user_id);

-- Users can insert own submissions
create policy "Users can insert own submissions" on credit_submissions
  for insert with check (auth.uid() = user_id);

-- Admin broadcast log (tracks which broadcasts went to which audience)
create table if not exists admin_broadcasts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  type          text not null default 'info',
  category      text not null default 'announcement',
  audience      text not null default 'all' check (audience in ('all', 'free', 'lite', 'builder', 'scale', 'trial', 'agency')),
  sent_by       text not null,
  sent_at       timestamptz not null default now(),
  recipient_count integer not null default 0,
  action_url    text,
  action_label  text
);
