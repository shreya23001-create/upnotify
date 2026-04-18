-- Fix monitors created with the plan minimum interval (60s) instead of type-specific defaults.
-- Root cause: bulkCreateMonitorsAction used planLimits.checkIntervalSeconds for all types.
-- This migration is idempotent — safe to run on DBs already patched by the one-off script.
--
-- Only updates monitors whose interval is below the type's minimum sensible value.
-- Does NOT touch monitors where the user explicitly chose a valid custom interval.

UPDATE monitors SET
  check_interval_seconds = CASE type
    WHEN 'ssl'              THEN 86400
    WHEN 'domain'           THEN 86400
    WHEN 'whois-change'     THEN 86400
    WHEN 'blacklist'        THEN 86400
    WHEN 'dns'              THEN 21600
    WHEN 'security-headers' THEN 21600
    WHEN 'ip-change'        THEN 21600
    WHEN 'mx-health'        THEN 21600
    WHEN 'spf-dmarc'        THEN 21600
    WHEN 'nameserver-change'THEN 21600
    WHEN 'competitor'       THEN 3600
    WHEN 'robots-txt'       THEN 3600
    WHEN 'sitemap'          THEN 3600
    WHEN 'redirect-chain'   THEN 3600
    WHEN 'page-size'        THEN 3600
    WHEN 'cookie-consent'   THEN 3600
  END,
  next_check_at = NOW() + (INTERVAL '1 second' * CASE type
    WHEN 'ssl'              THEN 86400
    WHEN 'domain'           THEN 86400
    WHEN 'whois-change'     THEN 86400
    WHEN 'blacklist'        THEN 86400
    WHEN 'dns'              THEN 21600
    WHEN 'security-headers' THEN 21600
    WHEN 'ip-change'        THEN 21600
    WHEN 'mx-health'        THEN 21600
    WHEN 'spf-dmarc'        THEN 21600
    WHEN 'nameserver-change'THEN 21600
    WHEN 'competitor'       THEN 3600
    WHEN 'robots-txt'       THEN 3600
    WHEN 'sitemap'          THEN 3600
    WHEN 'redirect-chain'   THEN 3600
    WHEN 'page-size'        THEN 3600
    WHEN 'cookie-consent'   THEN 3600
  END)
WHERE
  is_paused = FALSE
  AND type IN (
    'ssl', 'domain', 'whois-change', 'blacklist',
    'dns', 'security-headers', 'ip-change', 'mx-health', 'spf-dmarc', 'nameserver-change',
    'competitor', 'robots-txt', 'sitemap', 'redirect-chain', 'page-size', 'cookie-consent'
  )
  AND check_interval_seconds < CASE type
    WHEN 'ssl'              THEN 3600
    WHEN 'domain'           THEN 3600
    WHEN 'whois-change'     THEN 3600
    WHEN 'blacklist'        THEN 3600
    WHEN 'dns'              THEN 3600
    WHEN 'security-headers' THEN 3600
    WHEN 'ip-change'        THEN 3600
    WHEN 'mx-health'        THEN 3600
    WHEN 'spf-dmarc'        THEN 3600
    WHEN 'nameserver-change'THEN 3600
    WHEN 'competitor'       THEN 300
    WHEN 'robots-txt'       THEN 300
    WHEN 'sitemap'          THEN 300
    WHEN 'redirect-chain'   THEN 300
    WHEN 'page-size'        THEN 300
    WHEN 'cookie-consent'   THEN 300
  END;
