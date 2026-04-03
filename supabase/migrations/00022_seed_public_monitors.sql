-- Seed public_monitors table with all tracked sites
-- These can also be managed from the admin panel (source of truth)
-- Only insert if not already exists (avoid duplicates on re-run)

INSERT INTO public.public_monitors (domain, display_name, category)
SELECT * FROM (VALUES
  -- Search & Ads
  ('google.com', 'Google', 'Search & Ads'),
  ('bing.com', 'Bing', 'Search & Ads'),
  ('duckduckgo.com', 'DuckDuckGo', 'Search & Ads'),

  -- Social Media
  ('facebook.com', 'Facebook', 'Social Media'),
  ('instagram.com', 'Instagram', 'Social Media'),
  ('twitter.com', 'X (Twitter)', 'Social Media'),
  ('linkedin.com', 'LinkedIn', 'Social Media'),
  ('reddit.com', 'Reddit', 'Social Media'),
  ('tiktok.com', 'TikTok', 'Social Media'),
  ('pinterest.com', 'Pinterest', 'Social Media'),

  -- Video & Streaming
  ('youtube.com', 'YouTube', 'Video & Streaming'),
  ('netflix.com', 'Netflix', 'Video & Streaming'),
  ('disneyplus.com', 'Disney+', 'Video & Streaming'),
  ('hulu.com', 'Hulu', 'Video & Streaming'),

  -- Cloud & Hosting
  ('aws.amazon.com', 'AWS', 'Cloud & Hosting'),
  ('cloud.google.com', 'Google Cloud', 'Cloud & Hosting'),
  ('azure.microsoft.com', 'Microsoft Azure', 'Cloud & Hosting'),
  ('vercel.com', 'Vercel', 'Cloud & Hosting'),
  ('netlify.com', 'Netlify', 'Cloud & Hosting'),
  ('heroku.com', 'Heroku', 'Cloud & Hosting'),
  ('digitalocean.com', 'DigitalOcean', 'Cloud & Hosting'),

  -- Dev Tools
  ('github.com', 'GitHub', 'Dev Tools'),
  ('gitlab.com', 'GitLab', 'Dev Tools'),
  ('bitbucket.org', 'Bitbucket', 'Dev Tools'),
  ('npmjs.com', 'npm', 'Dev Tools'),
  ('stackoverflow.com', 'Stack Overflow', 'Dev Tools'),
  ('docker.com', 'Docker Hub', 'Dev Tools'),

  -- Communication
  ('slack.com', 'Slack', 'Communication'),
  ('discord.com', 'Discord', 'Communication'),
  ('zoom.us', 'Zoom', 'Communication'),
  ('teams.microsoft.com', 'Microsoft Teams', 'Communication'),
  ('whatsapp.com', 'WhatsApp', 'Communication'),

  -- E-commerce
  ('amazon.com', 'Amazon', 'E-commerce'),
  ('shopify.com', 'Shopify', 'E-commerce'),
  ('ebay.com', 'eBay', 'E-commerce'),
  ('stripe.com', 'Stripe', 'E-commerce'),
  ('paypal.com', 'PayPal', 'E-commerce'),

  -- Productivity
  ('notion.so', 'Notion', 'Productivity'),
  ('figma.com', 'Figma', 'Productivity'),
  ('canva.com', 'Canva', 'Productivity'),
  ('docs.google.com', 'Google Docs', 'Productivity'),
  ('trello.com', 'Trello', 'Productivity'),
  ('asana.com', 'Asana', 'Productivity'),

  -- Email & Marketing
  ('mail.google.com', 'Gmail', 'Email & Marketing'),
  ('outlook.com', 'Outlook', 'Email & Marketing'),
  ('mailchimp.com', 'Mailchimp', 'Email & Marketing'),

  -- CDN & Infrastructure
  ('cloudflare.com', 'Cloudflare', 'CDN & Infrastructure'),
  ('fastly.com', 'Fastly', 'CDN & Infrastructure'),

  -- AI
  ('openai.com', 'OpenAI', 'AI'),
  ('anthropic.com', 'Anthropic', 'AI'),
  ('huggingface.co', 'Hugging Face', 'AI'),
  ('midjourney.com', 'Midjourney', 'AI'),
  ('stability.ai', 'Stability AI', 'AI'),
  ('perplexity.ai', 'Perplexity', 'AI'),

  -- Gaming
  ('store.steampowered.com', 'Steam', 'Gaming'),
  ('epicgames.com', 'Epic Games', 'Gaming'),
  ('roblox.com', 'Roblox', 'Gaming'),
  ('playstation.com', 'PlayStation', 'Gaming'),
  ('xbox.com', 'Xbox', 'Gaming'),
  ('twitch.tv', 'Twitch', 'Gaming'),
  ('ea.com', 'EA', 'Gaming'),

  -- Finance
  ('wise.com', 'Wise', 'Finance'),
  ('revolut.com', 'Revolut', 'Finance'),
  ('coinbase.com', 'Coinbase', 'Finance'),
  ('binance.com', 'Binance', 'Finance'),
  ('robinhood.com', 'Robinhood', 'Finance'),

  -- CMS
  ('wordpress.com', 'WordPress.com', 'CMS'),
  ('wix.com', 'Wix', 'CMS'),
  ('squarespace.com', 'Squarespace', 'CMS'),
  ('webflow.com', 'Webflow', 'CMS'),
  ('ghost.org', 'Ghost', 'CMS'),

  -- Education
  ('coursera.org', 'Coursera', 'Education'),
  ('udemy.com', 'Udemy', 'Education'),
  ('duolingo.com', 'Duolingo', 'Education'),
  ('khanacademy.org', 'Khan Academy', 'Education'),

  -- Music
  ('spotify.com', 'Spotify', 'Music'),
  ('soundcloud.com', 'SoundCloud', 'Music'),
  ('music.apple.com', 'Apple Music', 'Music'),

  -- Food & Delivery
  ('ubereats.com', 'Uber Eats', 'Food & Delivery'),
  ('deliveroo.com', 'Deliveroo', 'Food & Delivery'),
  ('doordash.com', 'DoorDash', 'Food & Delivery'),
  ('justeat.com', 'Just Eat', 'Food & Delivery'),

  -- Travel
  ('booking.com', 'Booking.com', 'Travel'),
  ('airbnb.com', 'Airbnb', 'Travel'),
  ('expedia.com', 'Expedia', 'Travel'),

  -- SaaS
  ('hubspot.com', 'HubSpot', 'SaaS'),
  ('salesforce.com', 'Salesforce', 'SaaS'),
  ('zendesk.com', 'Zendesk', 'SaaS'),
  ('intercom.com', 'Intercom', 'SaaS'),
  ('freshdesk.com', 'Freshdesk', 'SaaS'),
  ('monday.com', 'Monday.com', 'SaaS'),
  ('airtable.com', 'Airtable', 'SaaS'),
  ('jira.atlassian.com', 'Jira', 'SaaS'),
  ('confluence.atlassian.com', 'Confluence', 'SaaS'),

  -- Security
  ('nordvpn.com', 'NordVPN', 'Security'),
  ('1password.com', '1Password', 'Security'),
  ('lastpass.com', 'LastPass', 'Security')
) AS new_sites(domain, display_name, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.public_monitors pm WHERE pm.domain = new_sites.domain
);
