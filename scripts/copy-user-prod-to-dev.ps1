# =============================================================================
# copy-user-prod-to-dev.ps1
# -----------------------------------------------------------------------------
# Copies the operational data of ONE user/org from prod Supabase into dev,
# remapped under a different dev user/org. Merge mode (existing dev data kept).
#
# Skipped on purpose: auth.users, auth.identities, public.users, organisations,
#   subscriptions, invoices, stripe_connect_payouts, contact_preferences,
#   user_messages, credit_submissions, referrals, check_results, audit_log,
#   org_alert_settings, agency_tags, pending_alert_events.
#
# Safety on import: monitors imported as paused, alert_channels disabled,
#   maintenance_windows inactive, api_keys.key_hash invalidated. Re-enable
#   manually on dev before testing.
#
# Prereqs:
#   - psql + pg_dump available on PATH (PostgreSQL client tools)
#   - $env:UPTRUE_PROD_DB and $env:UPTRUE_DEV_DB set to Postgres connection
#     strings (Supabase Dashboard -> Project Settings -> Database -> URI)
#
# Usage:
#   $env:UPTRUE_PROD_DB = "postgresql://postgres.[ref]:[pwd]@..."
#   $env:UPTRUE_DEV_DB  = "postgresql://postgres.[ref]:[pwd]@..."
#   ./scripts/copy-user-prod-to-dev.ps1 `
#     -SourceEmail srr800761@gmail.com `
#     -TargetEmail devsaxena012@gmail.com
#
#   Add -DryRun to resolve IDs and exit without mutating anything.
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SourceEmail,

    [Parameter(Mandatory=$true)]
    [string]$TargetEmail,

    [switch]$DryRun,
    [switch]$KeepStagingOnError,
    [string]$WorkDir = (Join-Path $env:TEMP 'uptrue-copy-user')
)

$ErrorActionPreference = 'Stop'

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Dim($msg)  { Write-Host $msg -ForegroundColor DarkGray }

# -----------------------------------------------------------------------------
# 0. Preflight
# -----------------------------------------------------------------------------
$prodDb = $env:UPTRUE_PROD_DB
$devDb  = $env:UPTRUE_DEV_DB
if ([string]::IsNullOrWhiteSpace($prodDb)) { Fail 'UPTRUE_PROD_DB env var not set' }
if ([string]::IsNullOrWhiteSpace($devDb))  { Fail 'UPTRUE_DEV_DB env var not set' }

foreach ($tool in @('psql','pg_dump')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Fail "$tool not found on PATH. Install PostgreSQL client tools (https://www.postgresql.org/download/)."
    }
}

if (Test-Path $WorkDir) { Remove-Item -Recurse -Force $WorkDir }
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Dim "Work dir: $WorkDir"

# Helper to run psql, capture stderr+stdout, fail loudly
function Invoke-Psql {
    param([string]$ConnStr, [string]$Sql, [switch]$ReturnOutput, [switch]$AllowFail)
    $tmpFile = Join-Path $WorkDir ("psql_" + [guid]::NewGuid().ToString('N').Substring(0,8) + ".sql")
    Set-Content -Path $tmpFile -Value $Sql -Encoding UTF8
    if ($ReturnOutput) {
        $out = & psql $ConnStr --no-psqlrc -v ON_ERROR_STOP=1 -At -F '|' -f $tmpFile 2>&1
        $code = $LASTEXITCODE
        Remove-Item $tmpFile -Force
        if ($code -ne 0 -and -not $AllowFail) { Fail "psql failed (exit $code):`n$out" }
        return $out
    } else {
        & psql $ConnStr --no-psqlrc -v ON_ERROR_STOP=1 -f $tmpFile
        $code = $LASTEXITCODE
        Remove-Item $tmpFile -Force
        if ($code -ne 0 -and -not $AllowFail) { Fail "psql failed (exit $code)" }
    }
}

# -----------------------------------------------------------------------------
# 1. Resolve source + target IDs
# -----------------------------------------------------------------------------
Info "[1/8] Resolving IDs"

$srcLine = Invoke-Psql -ConnStr $prodDb -ReturnOutput -Sql @"
SELECT id::text, org_id::text FROM public.users WHERE email = '$SourceEmail' LIMIT 1;
"@
if (-not $srcLine) { Fail "Source user '$SourceEmail' not found in prod" }
$prodUserId, $prodOrgId = ($srcLine -split '\|')

$dstLine = Invoke-Psql -ConnStr $devDb -ReturnOutput -Sql @"
SELECT id::text, org_id::text FROM public.users WHERE email = '$TargetEmail' LIMIT 1;
"@
if (-not $dstLine) { Fail "Target user '$TargetEmail' not found in dev" }
$devUserId, $devOrgId = ($dstLine -split '\|')

Dim "  Source: $SourceEmail  user=$prodUserId  org=$prodOrgId"
Dim "  Target: $TargetEmail   user=$devUserId   org=$devOrgId"

# Quick sanity: ensure source org actually has monitors (catches typos in email)
$monitorCount = Invoke-Psql -ConnStr $prodDb -ReturnOutput -Sql @"
SELECT count(*) FROM public.monitors WHERE org_id = '$prodOrgId';
"@
Dim "  Source org has $monitorCount monitor(s) in prod."
if ([int]$monitorCount -eq 0) {
    Write-Host "WARN: source org has 0 monitors. Continue anyway? (y/N): " -ForegroundColor Yellow -NoNewline
    if ((Read-Host).Trim().ToLower() -ne 'y') { exit 0 }
}

if ($DryRun) {
    Ok "`nDry run complete. No changes made."
    exit 0
}

# -----------------------------------------------------------------------------
# 2. Stage filtered + rewritten data into export_user schema on prod
# -----------------------------------------------------------------------------
# Strategy: CREATE TABLE export_user.X AS SELECT ... WHERE org_id = prodOrgId,
# then UPDATE org_id -> devOrgId and rewrite user FKs. Slugs suffixed to avoid
# collisions in dev. Sensitive fields nulled. Safety flags set.
# -----------------------------------------------------------------------------
Info "[2/8] Staging filtered data into export_user on prod"

$stagingSql = @"
SET statement_timeout = '15min';

DROP SCHEMA IF EXISTS export_user CASCADE;
CREATE SCHEMA export_user;

-- ===== Snapshot tables filtered to source org =====

CREATE TABLE export_user.workspaces AS
  SELECT * FROM public.workspaces WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.monitors AS
  SELECT * FROM public.monitors WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.alert_channels AS
  SELECT * FROM public.alert_channels WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.status_pages AS
  SELECT * FROM public.status_pages WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.incidents AS
  SELECT * FROM public.incidents WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.alerts AS
  SELECT * FROM public.alerts WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.maintenance_windows AS
  SELECT * FROM public.maintenance_windows WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.status_page_subscribers AS
  SELECT sps.* FROM public.status_page_subscribers sps
  WHERE sps.status_page_id IN (SELECT id FROM export_user.status_pages);

CREATE TABLE export_user.api_keys AS
  SELECT * FROM public.api_keys WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.reports AS
  SELECT * FROM public.reports WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.competitor_monitors AS
  SELECT * FROM public.competitor_monitors WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.wp_monitors AS
  SELECT * FROM public.wp_monitors WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.wp_snapshots AS
  SELECT * FROM public.wp_snapshots WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.wp_findings AS
  SELECT * FROM public.wp_findings WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.voice_call_logs AS
  SELECT * FROM public.voice_call_logs WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.support_tickets AS
  SELECT * FROM public.support_tickets WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.support_messages AS
  SELECT * FROM public.support_messages
  WHERE support_ticket_id IN (SELECT id FROM export_user.support_tickets);

CREATE TABLE export_user.team_invites AS
  SELECT * FROM public.team_invites WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.ecom_product_groups AS
  SELECT * FROM public.ecom_product_groups WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.ecom_products AS
  SELECT * FROM public.ecom_products WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.ecom_pricing_rules AS
  SELECT * FROM public.ecom_pricing_rules WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.ecom_price_history AS
  SELECT * FROM public.ecom_price_history WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.llms_txt_generations AS
  SELECT * FROM public.llms_txt_generations WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.citation_check_runs AS
  SELECT * FROM public.citation_check_runs WHERE org_id = '$prodOrgId';

CREATE TABLE export_user.citation_check_results AS
  SELECT ccr.* FROM public.citation_check_results ccr
  WHERE ccr.run_id IN (SELECT id FROM export_user.citation_check_runs);

-- ===== Rewrite org_id from prod to dev across all staged tables =====
UPDATE export_user.workspaces           SET org_id = '$devOrgId';
UPDATE export_user.monitors             SET org_id = '$devOrgId';
UPDATE export_user.alert_channels       SET org_id = '$devOrgId';
UPDATE export_user.status_pages         SET org_id = '$devOrgId';
UPDATE export_user.incidents            SET org_id = '$devOrgId';
UPDATE export_user.alerts               SET org_id = '$devOrgId';
UPDATE export_user.maintenance_windows  SET org_id = '$devOrgId';
UPDATE export_user.api_keys             SET org_id = '$devOrgId';
UPDATE export_user.reports              SET org_id = '$devOrgId';
UPDATE export_user.competitor_monitors  SET org_id = '$devOrgId';
UPDATE export_user.wp_monitors          SET org_id = '$devOrgId';
UPDATE export_user.wp_snapshots         SET org_id = '$devOrgId';
UPDATE export_user.wp_findings          SET org_id = '$devOrgId';
UPDATE export_user.voice_call_logs      SET org_id = '$devOrgId';
UPDATE export_user.support_tickets      SET org_id = '$devOrgId';
UPDATE export_user.support_messages     SET org_id = '$devOrgId';
UPDATE export_user.team_invites         SET org_id = '$devOrgId';
UPDATE export_user.ecom_product_groups  SET org_id = '$devOrgId';
UPDATE export_user.ecom_products        SET org_id = '$devOrgId';
UPDATE export_user.ecom_pricing_rules   SET org_id = '$devOrgId';
UPDATE export_user.ecom_price_history   SET org_id = '$devOrgId';
UPDATE export_user.llms_txt_generations SET org_id = '$devOrgId';
UPDATE export_user.citation_check_runs  SET org_id = '$devOrgId';

-- ===== Rewrite user FK columns from prod_user -> dev_user =====
UPDATE export_user.support_tickets       SET user_id = '$devUserId';
UPDATE export_user.llms_txt_generations  SET user_id = '$devUserId';
UPDATE export_user.citation_check_runs   SET user_id = '$devUserId';
UPDATE export_user.team_invites          SET invited_by = '$devUserId'
  WHERE invited_by IS NOT NULL;
UPDATE export_user.api_keys              SET created_by = '$devUserId'
  WHERE created_by IS NOT NULL;
UPDATE export_user.reports               SET created_by = '$devUserId'
  WHERE created_by IS NOT NULL;

-- ===== Suffix slugs to avoid uniqueness collisions on dev =====
-- workspaces unique(org_id, slug); status_pages.slug globally unique
UPDATE export_user.workspaces  SET slug = slug || '-imp-' || substr(id::text,1,8);
UPDATE export_user.status_pages SET slug = slug || '-imp-' || substr(id::text,1,8);

-- ===== Safety: import everything in disabled state =====
UPDATE export_user.monitors              SET is_paused = true, status = 'paused', next_check_at = NULL;
UPDATE export_user.alert_channels        SET is_enabled = false;
UPDATE export_user.maintenance_windows   SET is_active = false;

-- ===== NULL out sensitive fields =====
-- API key hashes invalidated -> dev keys cannot be used until regenerated
UPDATE export_user.api_keys SET key_hash = '__INVALID_DEV_IMPORT__';

-- ===== Diagnostic =====
SELECT table_name, n_rows FROM (
  SELECT 'workspaces'              AS table_name, count(*)::bigint AS n_rows FROM export_user.workspaces UNION ALL
  SELECT 'monitors',                count(*)        FROM export_user.monitors UNION ALL
  SELECT 'alert_channels',          count(*)        FROM export_user.alert_channels UNION ALL
  SELECT 'status_pages',            count(*)        FROM export_user.status_pages UNION ALL
  SELECT 'incidents',               count(*)        FROM export_user.incidents UNION ALL
  SELECT 'alerts',                  count(*)        FROM export_user.alerts UNION ALL
  SELECT 'maintenance_windows',     count(*)        FROM export_user.maintenance_windows UNION ALL
  SELECT 'status_page_subscribers', count(*)        FROM export_user.status_page_subscribers UNION ALL
  SELECT 'api_keys',                count(*)        FROM export_user.api_keys UNION ALL
  SELECT 'reports',                 count(*)        FROM export_user.reports UNION ALL
  SELECT 'competitor_monitors',     count(*)        FROM export_user.competitor_monitors UNION ALL
  SELECT 'wp_monitors',             count(*)        FROM export_user.wp_monitors UNION ALL
  SELECT 'wp_snapshots',            count(*)        FROM export_user.wp_snapshots UNION ALL
  SELECT 'wp_findings',             count(*)        FROM export_user.wp_findings UNION ALL
  SELECT 'voice_call_logs',         count(*)        FROM export_user.voice_call_logs UNION ALL
  SELECT 'support_tickets',         count(*)        FROM export_user.support_tickets UNION ALL
  SELECT 'support_messages',        count(*)        FROM export_user.support_messages UNION ALL
  SELECT 'team_invites',            count(*)        FROM export_user.team_invites UNION ALL
  SELECT 'ecom_product_groups',     count(*)        FROM export_user.ecom_product_groups UNION ALL
  SELECT 'ecom_products',           count(*)        FROM export_user.ecom_products UNION ALL
  SELECT 'ecom_pricing_rules',      count(*)        FROM export_user.ecom_pricing_rules UNION ALL
  SELECT 'ecom_price_history',      count(*)        FROM export_user.ecom_price_history UNION ALL
  SELECT 'llms_txt_generations',    count(*)        FROM export_user.llms_txt_generations UNION ALL
  SELECT 'citation_check_runs',     count(*)        FROM export_user.citation_check_runs UNION ALL
  SELECT 'citation_check_results',  count(*)        FROM export_user.citation_check_results
) t WHERE n_rows > 0 ORDER BY n_rows DESC;
"@

try {
    $diagnostic = Invoke-Psql -ConnStr $prodDb -ReturnOutput -Sql $stagingSql -AllowFail
    if ($LASTEXITCODE -ne 0) {
        if (-not $KeepStagingOnError) {
            Invoke-Psql -ConnStr $prodDb -Sql 'DROP SCHEMA IF EXISTS export_user CASCADE;' -AllowFail
        }
        Fail "Staging on prod failed. Output:`n$diagnostic"
    }
    Write-Host "  Staged rows:" -ForegroundColor Gray
    $diagnostic -split "`n" | ForEach-Object {
        if ($_ -match '\|') { Write-Host ("    " + ($_ -replace '\|', ' = ')) -ForegroundColor Gray }
    }
} catch {
    if (-not $KeepStagingOnError) {
        Invoke-Psql -ConnStr $prodDb -Sql 'DROP SCHEMA IF EXISTS export_user CASCADE;' -AllowFail
    }
    throw
}

# -----------------------------------------------------------------------------
# 3. pg_dump export_user
# -----------------------------------------------------------------------------
Info "[3/8] Dumping export_user schema"
$dumpFile = Join-Path $WorkDir 'export.sql'
& pg_dump $prodDb --schema=export_user --no-owner --no-privileges --no-comments --file=$dumpFile
if ($LASTEXITCODE -ne 0) { Fail 'pg_dump failed' }
Dim ("  Dump file: " + $dumpFile + "  (" + ((Get-Item $dumpFile).Length / 1KB).ToString('N0') + " KB)")

# -----------------------------------------------------------------------------
# 4. Drop staging schema on prod (cleanup)
# -----------------------------------------------------------------------------
Info "[4/8] Dropping export_user from prod"
Invoke-Psql -ConnStr $prodDb -Sql 'DROP SCHEMA IF EXISTS export_user CASCADE;'

# -----------------------------------------------------------------------------
# 5. Rewrite dump: export_user -> import_staging (so we can reuse on dev)
# -----------------------------------------------------------------------------
Info "[5/8] Rewriting dump for dev import"
$importFile = Join-Path $WorkDir 'import.sql'
(Get-Content $dumpFile -Raw) `
    -replace 'SCHEMA export_user', 'SCHEMA import_staging' `
    -replace 'export_user\.', 'import_staging.' `
    | Set-Content -Path $importFile -Encoding UTF8
Dim "  Rewritten: $importFile"

# -----------------------------------------------------------------------------
# 6. Load dump into dev's import_staging schema
# -----------------------------------------------------------------------------
Info "[6/8] Loading staging data into dev"
Invoke-Psql -ConnStr $devDb -Sql 'DROP SCHEMA IF EXISTS import_staging CASCADE;'
& psql $devDb --no-psqlrc -v ON_ERROR_STOP=1 -f $importFile
if ($LASTEXITCODE -ne 0) { Fail 'Loading dump into dev failed' }

# -----------------------------------------------------------------------------
# 7. Merge import_staging.* INTO public.* with ON CONFLICT DO NOTHING
#    Order matters — children after parents. session_replication_role=replica
#    further protects us from FK ordering quirks but we still keep order tidy.
# -----------------------------------------------------------------------------
Info "[7/8] Merging staging into public (ON CONFLICT DO NOTHING)"

$mergeSql = @"
SET session_replication_role = 'replica';
SET statement_timeout = '15min';

INSERT INTO public.workspaces             SELECT * FROM import_staging.workspaces             ON CONFLICT DO NOTHING;
INSERT INTO public.monitors               SELECT * FROM import_staging.monitors               ON CONFLICT DO NOTHING;
INSERT INTO public.alert_channels         SELECT * FROM import_staging.alert_channels         ON CONFLICT DO NOTHING;
INSERT INTO public.status_pages           SELECT * FROM import_staging.status_pages           ON CONFLICT DO NOTHING;
INSERT INTO public.incidents              SELECT * FROM import_staging.incidents              ON CONFLICT DO NOTHING;
INSERT INTO public.alerts                 SELECT * FROM import_staging.alerts                 ON CONFLICT DO NOTHING;
INSERT INTO public.maintenance_windows    SELECT * FROM import_staging.maintenance_windows    ON CONFLICT DO NOTHING;
INSERT INTO public.status_page_subscribers SELECT * FROM import_staging.status_page_subscribers ON CONFLICT DO NOTHING;
INSERT INTO public.api_keys               SELECT * FROM import_staging.api_keys               ON CONFLICT DO NOTHING;
INSERT INTO public.reports                SELECT * FROM import_staging.reports                ON CONFLICT DO NOTHING;
INSERT INTO public.competitor_monitors    SELECT * FROM import_staging.competitor_monitors    ON CONFLICT DO NOTHING;
INSERT INTO public.wp_monitors            SELECT * FROM import_staging.wp_monitors            ON CONFLICT DO NOTHING;
INSERT INTO public.wp_snapshots           SELECT * FROM import_staging.wp_snapshots           ON CONFLICT DO NOTHING;
INSERT INTO public.wp_findings            SELECT * FROM import_staging.wp_findings            ON CONFLICT DO NOTHING;
INSERT INTO public.voice_call_logs        SELECT * FROM import_staging.voice_call_logs        ON CONFLICT DO NOTHING;
INSERT INTO public.support_tickets        SELECT * FROM import_staging.support_tickets        ON CONFLICT DO NOTHING;
INSERT INTO public.support_messages       SELECT * FROM import_staging.support_messages       ON CONFLICT DO NOTHING;
INSERT INTO public.team_invites           SELECT * FROM import_staging.team_invites           ON CONFLICT DO NOTHING;
INSERT INTO public.ecom_product_groups    SELECT * FROM import_staging.ecom_product_groups    ON CONFLICT DO NOTHING;
INSERT INTO public.ecom_products          SELECT * FROM import_staging.ecom_products          ON CONFLICT DO NOTHING;
INSERT INTO public.ecom_pricing_rules     SELECT * FROM import_staging.ecom_pricing_rules     ON CONFLICT DO NOTHING;
INSERT INTO public.ecom_price_history     SELECT * FROM import_staging.ecom_price_history     ON CONFLICT DO NOTHING;
INSERT INTO public.llms_txt_generations   SELECT * FROM import_staging.llms_txt_generations   ON CONFLICT DO NOTHING;
INSERT INTO public.citation_check_runs    SELECT * FROM import_staging.citation_check_runs    ON CONFLICT DO NOTHING;
INSERT INTO public.citation_check_results SELECT * FROM import_staging.citation_check_results ON CONFLICT DO NOTHING;

SET session_replication_role = 'origin';
"@
Invoke-Psql -ConnStr $devDb -Sql $mergeSql

# -----------------------------------------------------------------------------
# 8. Drop import_staging on dev (cleanup)
# -----------------------------------------------------------------------------
Info "[8/8] Dropping import_staging from dev"
Invoke-Psql -ConnStr $devDb -Sql 'DROP SCHEMA IF EXISTS import_staging CASCADE;'

Ok "`nDone. $SourceEmail's operational data merged into $TargetEmail's org on dev."
Write-Host @"

  IMPORTANT — imported data is INTENTIONALLY DISABLED for safety:
    - All monitors are paused (status='paused', is_paused=true)
    - All alert_channels have is_enabled=false
    - All maintenance_windows have is_active=false
    - api_keys.key_hash is invalidated (regenerate from dashboard if needed)

  Re-enable selectively on dev BEFORE testing, or you'll trigger real
  alerts to whatever Slack/email/webhook config came from prod.

  Slugs were suffixed with -imp-<8hex> to avoid uniqueness conflicts.
  Rename in dashboard if you want clean names.

  Work files preserved at: $WorkDir
"@ -ForegroundColor Yellow
