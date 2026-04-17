-- Add 13 new monitor types to the CHECK constraint on monitors.type
-- Existing types: http, ssl, domain, dns, keyword, port, api, ping, heartbeat, competitor, server

ALTER TABLE monitors DROP CONSTRAINT IF EXISTS monitors_type_check;

ALTER TABLE monitors ADD CONSTRAINT monitors_type_check CHECK (type IN (
  -- Original 10 + server
  'http', 'ssl', 'domain', 'dns', 'keyword', 'port', 'api', 'ping', 'heartbeat', 'competitor', 'server',
  -- Tier 1 — new (10)
  'security-headers', 'response-time', 'robots-txt', 'ip-change', 'mx-health',
  'whois-change', 'sitemap', 'redirect-chain', 'spf-dmarc', 'blacklist',
  -- Tier 2 — new (3)
  'page-size', 'cookie-consent', 'nameserver-change'
));
