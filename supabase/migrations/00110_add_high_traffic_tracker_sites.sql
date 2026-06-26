-- Migration 110: Add high-traffic "is X down?" tracker sites
-- chatgpt.com:    135,000 searches/month
-- zoom.us:         60,000 searches/month (was removed in 00062 as "low consumer volume" — re-adding)
-- aws.amazon.com:  40,000 searches/month (was removed in 00062 as "infrastructure / not consumer-facing" — re-adding)

INSERT INTO public_monitors (domain, display_name, category, is_active) VALUES
  ('chatgpt.com',    'ChatGPT',  'AI',                   true),
  ('zoom.us',        'Zoom',     'Communication',         true),
  ('aws.amazon.com', 'AWS',      'Cloud & Hosting',       true)
ON CONFLICT (domain) DO NOTHING;
