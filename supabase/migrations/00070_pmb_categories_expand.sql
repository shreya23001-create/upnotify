-- Migration 00070: Expand PMB categories + full monitor categorization
-- Run in Supabase SQL Editor (anon or service role, admin editor)
-- Safe to run multiple times — uses ON CONFLICT DO UPDATE

-- ═══════════════════════════════════════════════════════════════════
-- PART 1 — New PMB categories
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO pmb_categories (slug, display_name, emoji, default_keywords, is_active)
VALUES
  ('social-media',     'Social Media',          '📱', ARRAY['social','twitter','facebook','instagram','reddit','tiktok','snapchat','pinterest','linkedin','discord','bluesky','threads','telegram','whatsapp'], true),
  ('streaming',        'Streaming & Music',     '🎬', ARRAY['streaming','youtube','twitch','vimeo','netflix','spotify','disney','hbo','hulu','crunchyroll','soundcloud','mixcloud'], true),
  ('gaming',           'Gaming',                '🎮', ARRAY['gaming','steam','epicgames','playstation','xbox','nintendo','roblox','minecraft','valorant','blizzard','ea','riotgames'], true),
  ('banking',          'Banking & Finance',     '🏦', ARRAY['bank','banking','finance','revolut','monzo','chime','zerodha','robinhood','fidelity','vanguard','hsbc','barclays','jpmorgan','chase'], true),
  ('crypto',           'Crypto & Web3',         '₿',  ARRAY['crypto','bitcoin','ethereum','binance','coinbase','blockchain','defi','nft','web3','okx','bybit'], true),
  ('food-delivery',    'Food Delivery',         '🍔', ARRAY['food','delivery','zomato','swiggy','doordash','deliveroo','ubereats','justeat','blinkit','grubhub'], true),
  ('travel',           'Travel & Airlines',     '✈️', ARRAY['travel','airline','flight','hotel','booking','expedia','airbnb','skyscanner','ryanair','easyjet','delta','emirates'], true),
  ('logistics',        'Logistics & Shipping',  '📦', ARRAY['logistics','shipping','courier','fedex','dhl','ups','royalmail','parcelforce','dpd','evri'], true),
  ('news-media',       'News & Media',          '📰', ARRAY['news','media','bbc','cnn','reuters','bloomberg','guardian','nytimes','techcrunch','theverge','forbes'], true),
  ('healthcare',       'Healthcare',            '🏥', ARRAY['health','medical','nhs','webmd','mayo','hospital','pharmacy','clinic','doctor','telehealth'], true),
  ('education',        'Education',             '🎓', ARRAY['education','learning','coursera','udemy','duolingo','khan','codecademy','university','mooc','edtech'], true),
  ('telecom',          'Telecom',               '📡', ARRAY['telecom','mobile','broadband','vodafone','bt','o2','airtel','jio','sprint','verizon','att'], true),
  ('design-creative',  'Design & Creative',     '🎨', ARRAY['design','creative','canva','figma','dribbble','behance','shutterstock','unsplash','freepik','pexels'], true),
  ('business-saas',    'Business & SaaS',       '💼', ARRAY['salesforce','zendesk','freshworks','zoho','oracle','sap','workday','freshdesk','pipedrive','intercom','zapier','xero'], true),
  ('real-estate',      'Real Estate',           '🏠', ARRAY['real estate','property','rightmove','zoopla','zillow','trulia','realtor','realestate'], true),
  ('automotive',       'Automotive',            '🚗', ARRAY['automotive','car','vehicle','autotrader','cargurus','carwow','kelley blue book'], true),
  ('government',       'Government & Public',   '🏛️', ARRAY['government','gov','uidai','incometax','passport','digilocker','epf','umang'], true),
  ('security',         'Security & Privacy',    '🔐', ARRAY['1password','bitwarden','lastpass','malwarebytes','surfshark','nordpass','keeper','dashlane'], true)
ON CONFLICT (slug) DO UPDATE
  SET display_name   = EXCLUDED.display_name,
      emoji          = EXCLUDED.emoji,
      default_keywords = EXCLUDED.default_keywords,
      is_active      = EXCLUDED.is_active,
      updated_at     = now();

-- ═══════════════════════════════════════════════════════════════════
-- PART 2 — Fix wrong categorizations from previous run
-- ═══════════════════════════════════════════════════════════════════

UPDATE public_monitors SET pmb_category = NULL
WHERE domain IN ('bloomberg.com', 'legalzoom.com', 'moneybox.com', 'xbox.com', 'squarespace.com');

-- ═══════════════════════════════════════════════════════════════════
-- PART 3 — Full categorization (all 468 monitors)
-- Each domain gets pmb_category + pmb_enabled = true
-- Domains with no meaningful category are left with pmb_enabled = false
-- ═══════════════════════════════════════════════════════════════════

-- 1. AI Tools
UPDATE public_monitors SET pmb_category = 'ai-tools', pmb_enabled = true
WHERE domain IN (
  'anthropic.com', 'chat.openai.com', 'openai.com', 'gemini.google.com', 'claude.ai',
  'perplexity.ai', 'mistral.ai', 'cohere.com', 'huggingface.co', 'grok.com', 'groq.com',
  'together.ai', 'deepmind.google', 'midjourney.com', 'civitai.com',
  'character.ai', 'copy.ai', 'jasper.ai', 'elevenlabs.io', 'poe.com',
  'runwayml.com', 'writesonic.com'
);

-- 2. Cloud Providers
UPDATE public_monitors SET pmb_category = 'cloud-providers', pmb_enabled = true
WHERE domain IN (
  'digitalocean.com', 'fly.io', 'heroku.com', 'netlify.com', 'render.com', 'vercel.com',
  'a2hosting.com', 'dreamhost.com', 'godaddy.com', 'liquidweb.com', 'namecheap.com',
  'pantheon.io', 'platform.sh', 'rackspace.com', 'icloud.com'
);

-- 3. Payment Processors
UPDATE public_monitors SET pmb_category = 'payment-processors', pmb_enabled = true
WHERE domain IN (
  'stripe.com', 'paypal.com', 'squareup.com', 'razorpay.com', 'klarna.com', 'afterpay.com',
  'payoneer.com', 'wise.com', 'cash.app', 'paytm.com', 'phonepe.com', 'mobikwik.com', 'venmo.com'
);

-- 4. E-commerce
UPDATE public_monitors SET pmb_category = 'ecommerce', pmb_enabled = true
WHERE domain IN (
  'shopify.com', 'bigcommerce.com', 'prestashop.com', 'etsy.com', 'ebay.com', 'alibaba.com',
  'amazon.in', 'aliexpress.com', 'flipkart.com', 'meesho.com', 'myntra.com', 'nykaa.com',
  'snapdeal.com', 'asos.com', 'boohoo.com', 'currys.co.uk', 'depop.com', 'farfetch.com',
  'jd.com', 'johnlewis.com', 'lazada.com', 'marksandspencer.com', 'mercadolibre.com',
  'noon.com', 'overstock.com', 'poshmark.com', 'prettylittlething.com', 'rakuten.com',
  'shein.com', 'shopee.com', 'taobao.com', 'target.com', 'tesco.com', 'vinted.com',
  'walmart.com', 'wayfair.com', 'zalando.com', 'zara.com', 'zepto.in', 'bigbasket.com',
  'argos.co.uk', 'bestbuy.com'
);

-- 5. Collaboration & Productivity
UPDATE public_monitors SET pmb_category = 'collaboration', pmb_enabled = true
WHERE domain IN (
  'slack.com', 'notion.so', 'asana.com', 'trello.com', 'jira.atlassian.com', 'monday.com',
  'zoom.us', 'linear.app', 'figma.com', 'miro.com', 'confluence.atlassian.com', 'clickup.com',
  'airtable.com', 'dropbox.com', 'teams.microsoft.com', 'loom.com', 'coda.io', 'fibery.io',
  'nuclino.com', 'calendly.com', 'evernote.com', 'grammarly.com', 'onedrive.live.com',
  'docs.google.com', 'drive.google.com', 'meet.google.com', 'skype.com'
);

-- 6. Dev Tools
UPDATE public_monitors SET pmb_category = 'devtools', pmb_enabled = true
WHERE domain IN (
  'github.com', 'gitlab.com', 'circleci.com', 'hub.docker.com', 'docker.com', 'kubernetes.io',
  'terraform.io', 'sentry.io', 'npmjs.com', 'pypi.org', 'rubygems.org',
  'atlassian.com', 'postman.com', 'supabase.com', 'stackoverflow.com', 'codesandbox.io',
  'replit.com', 'hashnode.com', 'hex.pm', 'hotjar.com', 'insomnia.rest',
  'mixpanel.com', 'nuget.org', 'fullstory.com', 'crates.io', 'readme.com',
  'analytics.google.com', 'cloudflare.dev'
);

-- 7. Email & Marketing
UPDATE public_monitors SET pmb_category = 'email-marketing', pmb_enabled = true
WHERE domain IN (
  'mailchimp.com', 'sendgrid.com', 'hubspot.com', 'klaviyo.com', 'activecampaign.com',
  'convertkit.com', 'constantcontact.com', 'campaignmonitor.com', 'outlook.com',
  'mail.google.com', 'substack.com'
);

-- 8. CDN & Security Infrastructure
UPDATE public_monitors SET pmb_category = 'cdn-security', pmb_enabled = true
WHERE domain IN (
  'cloudflare.com', 'cloudinary.com', 'cdnjs.com', 'jsdelivr.com',
  'keycdn.com', 'maxcdn.com', 'imperva.com', 'crowdstrike.com',
  'nordvpn.com', 'expressvpn.com'
);

-- 9. CMS & Site Builders
UPDATE public_monitors SET pmb_category = 'cms-builders', pmb_enabled = true
WHERE domain IN (
  'wordpress.com', 'contentful.com', 'ghost.org', 'webflow.com', 'wix.com', 'squarespace.com'
);

-- 10. Monitoring & Observability
UPDATE public_monitors SET pmb_category = 'monitoring', pmb_enabled = true
WHERE domain IN (
  'datadog.com', 'newrelic.com', 'grafana.com', 'pagerduty.com', 'elastic.co'
);

-- 11. Social Media
UPDATE public_monitors SET pmb_category = 'social-media', pmb_enabled = true
WHERE domain IN (
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'pinterest.com',
  'snapchat.com', 'reddit.com', 'threads.net', 'bluesky.app', 'telegram.org', 'discord.com',
  'medium.com', 'quora.com', 'line.me', 'whatsapp.com', 'signal.org', 'viber.com', 'wire.com'
);

-- 12. Streaming & Music
UPDATE public_monitors SET pmb_category = 'streaming', pmb_enabled = true
WHERE domain IN (
  'youtube.com', 'music.youtube.com', 'twitch.tv', 'vimeo.com', 'rumble.com',
  'channel4.com', 'itvx.com', 'itv.com', 'hotstar.com', 'sonyliv.com', 'zee5.com',
  'mxplayer.in', 'jiocinema.com', 'voot.com', 'discoveryplus.com', 'crunchyroll.com',
  'pluto.tv', 'tubi.tv', 'max.com', 'tv.apple.com', 'music.apple.com',
  'soundcloud.com', 'mixcloud.com', 'last.fm'
);

-- 13. Gaming
UPDATE public_monitors SET pmb_category = 'gaming', pmb_enabled = true
WHERE domain IN (
  'activision.com', 'blizzard.com', 'callofduty.com', 'dream11.com', 'ea.com',
  'epicgames.com', 'genshin.hoyoverse.com', 'gog.com', 'humblebundle.com', 'itch.io',
  'leagueoflegends.com', 'minecraft.net', 'mpl.live', 'nintendo.com', 'playstation.com',
  'playvalorant.com', 'valorant.com', 'riotgames.com', 'roblox.com',
  'store.steampowered.com', 'xbox.com'
);

-- 14. Banking & Finance
UPDATE public_monitors SET pmb_category = 'banking', pmb_enabled = true
WHERE domain IN (
  -- Traditional banks
  'axisbank.com', 'bankofbaroda.in', 'barclays.co.uk', 'canarabank.com', 'capitalone.com',
  'chase.com', 'hdfcbank.com', 'hsbc.com', 'icicibank.com', 'indusind.com', 'kotakbank.com',
  'lloydsbank.com', 'natwest.com', 'onlinesbi.sbi', 'pnbindia.in', 'santander.com',
  'santander.co.uk', 'schwab.com', 'yesbank.in', 'halifax.co.uk',
  -- Neobanks, investment & trading
  'chime.com', 'fidelity.com', 'freetrade.io', 'groww.in', 'ig.com', 'monzo.com',
  'n26.com', 'nutmeg.com', 'revolut.com', 'robinhood.com', 'sofi.com', 'starlingbank.com',
  'upstox.com', 'vanguard.com', 'zerodha.com', 'etoro.com', 'policybazaar.com',
  'plaid.com',
  -- Card networks
  'mastercard.com', 'visa.com', 'americanexpress.com'
);

-- 15. Crypto & Web3
UPDATE public_monitors SET pmb_category = 'crypto', pmb_enabled = true
WHERE domain IN (
  'binance.com', 'bybit.com', 'coinbase.com', 'crypto.com', 'ledger.com',
  'okx.com', 'opensea.io', 'uniswap.org'
);

-- 16. Food Delivery
UPDATE public_monitors SET pmb_category = 'food-delivery', pmb_enabled = true
WHERE domain IN (
  'blinkit.com', 'deliveroo.com', 'doordash.com', 'dunzo.com', 'justeat.com',
  'swiggy.com', 'ubereats.com', 'yelp.com', 'zomato.com'
);

-- 17. Travel & Airlines
UPDATE public_monitors SET pmb_category = 'travel', pmb_enabled = true
WHERE domain IN (
  'agoda.com', 'booking.com', 'britishairways.com', 'ba.com', 'delta.com',
  'easyjet.com', 'emirates.com', 'expedia.com', 'hilton.com', 'hostelworld.com',
  'irctc.co.in', 'ixigo.com', 'jet2.com', 'lufthansa.com', 'lyft.com',
  'makemytrip.com', 'marriott.com', 'momondo.com', 'redbus.in', 'ryanair.com',
  'skyscanner.net', 'southwest.com', 'trivago.com', 'uber.com', 'united.com',
  'vrbo.com', 'yatra.com', 'aa.com', 'airindia.in', 'indigoair.in'
);

-- 18. Logistics & Shipping
UPDATE public_monitors SET pmb_category = 'logistics', pmb_enabled = true
WHERE domain IN (
  'dhl.com', 'dpd.co.uk', 'evri.com', 'fedex.com', 'hermes.com',
  'parcelforce.com', 'royalmail.com', 'ups.com', 'yodel.co.uk'
);

-- 19. News & Media
UPDATE public_monitors SET pmb_category = 'news-media', pmb_enabled = true
WHERE domain IN (
  'aljazeera.com', 'apnews.com', 'arstechnica.com', 'bbc.co.uk', 'bloomberg.com',
  'cnn.com', 'economist.com', 'engadget.com', 'forbes.com', 'ft.com',
  'theguardian.com', 'independent.co.uk', 'mashable.com', 'nytimes.com', 'reuters.com',
  'techcrunch.com', 'theverge.com', 'washingtonpost.com'
);

-- 20. Healthcare
UPDATE public_monitors SET pmb_category = 'healthcare', pmb_enabled = true
WHERE domain IN (
  'babylon.com', 'drugs.com', 'healthline.com', 'mayoclinic.org', 'medicinenet.com',
  'nhs.uk', 'nih.gov', 'patient.info', 'webmd.com', 'who.int', 'zocdoc.com'
);

-- 21. Education
UPDATE public_monitors SET pmb_category = 'education', pmb_enabled = true
WHERE domain IN (
  'academia.edu', 'byjus.com', 'chegg.com', 'codecademy.com', 'coursera.org',
  'duolingo.com', 'freecodecamp.org', 'futurelearn.com', 'khanacademy.org',
  'masterclass.com', 'quizlet.com', 'ted.com', 'udemy.com', 'unacademy.com',
  'vedantu.com', 'w3schools.com', 'wikipedia.org'
);

-- 22. Telecom
UPDATE public_monitors SET pmb_category = 'telecom', pmb_enabled = true
WHERE domain IN (
  'airtel.in', 'bsnl.co.in', 'bt.com', 'ee.co.uk', 'jio.com',
  'myvi.in', 'o2.co.uk', 'virginmedia.com', 'vodafone.com', 'sky.com'
);

-- 23. Design & Creative
UPDATE public_monitors SET pmb_category = 'design-creative', pmb_enabled = true
WHERE domain IN (
  'behance.net', 'canva.com', 'dribbble.com', 'freepik.com', 'gettyimages.com',
  'pexels.com', 'shutterstock.com', 'unsplash.com'
);

-- 24. Business SaaS & CRM
UPDATE public_monitors SET pmb_category = 'business-saas', pmb_enabled = true
WHERE domain IN (
  'salesforce.com', 'zendesk.com', 'freshdesk.com', 'freshworks.com', 'helpscout.com',
  'intercom.com', 'oracle.com', 'pipedrive.com', 'sap.com', 'zoho.com', 'zapier.com',
  'twilio.com', 'docusign.com', 'quickbooks.intuit.com', 'xero.com', 'sage.com',
  'bamboohr.com', 'gusto.com', 'rippling.com', 'workday.com', 'deel.com',
  'legalzoom.com'
);

-- 25. Real Estate
UPDATE public_monitors SET pmb_category = 'real-estate', pmb_enabled = true
WHERE domain IN (
  'rightmove.co.uk', 'zoopla.co.uk', 'zillow.com', 'trulia.com', 'realtor.com'
);

-- 26. Automotive
UPDATE public_monitors SET pmb_category = 'automotive', pmb_enabled = true
WHERE domain IN (
  'autotrader.co.uk', 'cargurus.com', 'carwow.co.uk', 'kbb.com', 'motors.co.uk'
);

-- 27. Government & Public Services
UPDATE public_monitors SET pmb_category = 'government', pmb_enabled = true
WHERE domain IN (
  'uidai.gov.in', 'incometax.gov.in', 'passportindia.gov.in', 'cowin.gov.in',
  'digilocker.gov.in', 'epfindia.gov.in', 'umang.gov.in'
);

-- 28. Security & Privacy Tools
UPDATE public_monitors SET pmb_category = 'security', pmb_enabled = true
WHERE domain IN (
  '1password.com', 'bitwarden.com', 'lastpass.com', 'malwarebytes.com', 'surfshark.com'
);

-- ═══════════════════════════════════════════════════════════════════
-- PART 4 — Verify counts per category
-- ═══════════════════════════════════════════════════════════════════

SELECT pmb_category, COUNT(*) AS monitor_count
FROM public_monitors
WHERE pmb_enabled = true
GROUP BY pmb_category
ORDER BY monitor_count DESC;
