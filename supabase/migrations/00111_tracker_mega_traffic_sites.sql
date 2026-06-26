-- Migration 111: Add mega-traffic "is X down?" tracker sites
-- Combined search volume: 1,500,000+ searches/month
--
-- facebook.com:  450,000/mo — explicitly NOT in DB
-- twitter.com:   300,000/mo — explicitly NOT in DB
-- netflix.com:   250,000/mo — was deleted in migration 00062 (IP blocker)
-- roblox.com:    200,000/mo — NOT in DB
-- spotify.com:   200,000/mo — was deleted in migration 00062 (low volume streaming)
-- reddit.com:    100,000/mo — NOT in DB
-- zepto.com:     GSC showing 43+ impressions already (zepto.in exists, .com does not)
-- jira.com:      GSC showing 15+ impressions already

INSERT INTO public_monitors (domain, display_name, category, is_active) VALUES
  ('facebook.com', 'Facebook',  'Social Media',   true),
  ('twitter.com',  'X (Twitter)', 'Social Media', true),
  ('netflix.com',  'Netflix',   'Video & Streaming', true),
  ('roblox.com',   'Roblox',    'Gaming',         true),
  ('spotify.com',  'Spotify',   'Music',          true),
  ('reddit.com',   'Reddit',    'Social Media',   true),
  ('zepto.com',    'Zepto',     'E-commerce',     true),
  ('jira.com',     'Jira',      'Dev Tools',      true)
ON CONFLICT (domain) DO NOTHING;
