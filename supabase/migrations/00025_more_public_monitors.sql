-- Add 55 more popular websites to the public tracker
-- Avoids all domains already seeded in 00022_seed_public_monitors.sql
-- Uses the same INSERT pattern with duplicate guard

INSERT INTO public.public_monitors (domain, display_name, category)
SELECT * FROM (VALUES
  -- SaaS & Productivity Tools
  ('miro.com', 'Miro', 'SaaS'),
  ('clickup.com', 'ClickUp', 'SaaS'),
  ('basecamp.com', 'Basecamp', 'SaaS'),
  ('linear.app', 'Linear', 'SaaS'),
  ('loom.com', 'Loom', 'SaaS'),
  ('calendly.com', 'Calendly', 'SaaS'),
  ('zapier.com', 'Zapier', 'SaaS'),
  ('datadog.com', 'Datadog', 'SaaS'),
  ('twilio.com', 'Twilio', 'SaaS'),
  ('sendgrid.com', 'SendGrid', 'SaaS'),

  -- Social Media & Messaging
  ('snapchat.com', 'Snapchat', 'Social Media'),
  ('telegram.org', 'Telegram', 'Social Media'),
  ('threads.net', 'Threads', 'Social Media'),
  ('mastodon.social', 'Mastodon', 'Social Media'),
  ('signal.org', 'Signal', 'Communication'),

  -- E-commerce & Marketplaces
  ('etsy.com', 'Etsy', 'E-commerce'),
  ('alibaba.com', 'Alibaba', 'E-commerce'),
  ('aliexpress.com', 'AliExpress', 'E-commerce'),
  ('walmart.com', 'Walmart', 'E-commerce'),
  ('target.com', 'Target', 'E-commerce'),
  ('bestbuy.com', 'Best Buy', 'E-commerce'),
  ('asos.com', 'ASOS', 'E-commerce'),
  ('zara.com', 'Zara', 'E-commerce'),
  ('shein.com', 'Shein', 'E-commerce'),
  ('wayfair.com', 'Wayfair', 'E-commerce'),

  -- Dev Tools & Infrastructure
  ('pypi.org', 'PyPI', 'Dev Tools'),
  ('crates.io', 'crates.io', 'Dev Tools'),
  ('sentry.io', 'Sentry', 'Dev Tools'),
  ('postman.com', 'Postman', 'Dev Tools'),
  ('supabase.com', 'Supabase', 'Dev Tools'),
  ('railway.app', 'Railway', 'Dev Tools'),
  ('render.com', 'Render', 'Cloud & Hosting'),
  ('fly.io', 'Fly.io', 'Cloud & Hosting'),

  -- Entertainment & Streaming
  ('music.youtube.com', 'YouTube Music', 'Music'),
  ('deezer.com', 'Deezer', 'Music'),
  ('primevideo.com', 'Prime Video', 'Video & Streaming'),
  ('crunchyroll.com', 'Crunchyroll', 'Video & Streaming'),
  ('peacocktv.com', 'Peacock', 'Video & Streaming'),

  -- Productivity & Storage
  ('drive.google.com', 'Google Drive', 'Productivity'),
  ('onedrive.live.com', 'OneDrive', 'Productivity'),
  ('dropbox.com', 'Dropbox', 'Productivity'),
  ('evernote.com', 'Evernote', 'Productivity'),
  ('todoist.com', 'Todoist', 'Productivity'),
  ('grammarly.com', 'Grammarly', 'Productivity'),

  -- Finance & Payments
  ('squareup.com', 'Square', 'Finance'),
  ('klarna.com', 'Klarna', 'Finance'),
  ('afterpay.com', 'Afterpay', 'Finance'),
  ('plaid.com', 'Plaid', 'Finance'),

  -- News & Media
  ('bbc.co.uk', 'BBC', 'News & Media'),
  ('cnn.com', 'CNN', 'News & Media'),
  ('reuters.com', 'Reuters', 'News & Media'),
  ('theguardian.com', 'The Guardian', 'News & Media'),
  ('nytimes.com', 'New York Times', 'News & Media'),
  ('washingtonpost.com', 'Washington Post', 'News & Media'),

  -- AI Tools
  ('chat.openai.com', 'ChatGPT', 'AI'),
  ('claude.ai', 'Claude', 'AI'),
  ('gemini.google.com', 'Gemini', 'AI'),
  ('poe.com', 'Poe', 'AI'),
  ('replicate.com', 'Replicate', 'AI'),

  -- Travel & Transport
  ('uber.com', 'Uber', 'Travel'),
  ('lyft.com', 'Lyft', 'Travel'),
  ('tripadvisor.com', 'TripAdvisor', 'Travel'),
  ('skyscanner.net', 'Skyscanner', 'Travel')
) AS new_sites(domain, display_name, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.public_monitors pm WHERE pm.domain = new_sites.domain
);
