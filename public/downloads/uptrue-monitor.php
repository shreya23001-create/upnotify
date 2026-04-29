<?php
/**
 * Plugin Name: Uptrue WordPress Monitor
 * Plugin URI:  https://uptrue.io/wordpress-monitor
 * Description: Connect your WordPress site to Uptrue for real-time security monitoring, health alerts, and AI-powered fix suggestions. Works standalone with a free monthly email report — no Uptrue account required.
 * Version:     1.2.0
 * Author:      Uptrue
 * Author URI:  https://uptrue.io
 * License:     GPL v2 or later
 * Text Domain: uptrue-monitor
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'UPTRUE_VERSION',      '1.2.0' );
define( 'UPTRUE_PLUGIN_FILE',  __FILE__ );

function uptrue_api_base() {
    // Priority: wp-config constant → saved option → hardcoded default
    if ( defined( 'UPTRUE_API_BASE_URL' ) ) {
        return rtrim( UPTRUE_API_BASE_URL, '/' );
    }
    $saved = get_option( 'uptrue_api_base_url', '' );
    if ( $saved ) {
        return rtrim( $saved, '/' );
    }
    return 'https://uptrue.io/api/v1/wp-agent';
}
define( 'UPTRUE_OPT_TOKEN',    'uptrue_api_token' );
define( 'UPTRUE_OPT_INTERVAL', 'uptrue_check_interval' );
define( 'UPTRUE_OPT_LAST_PUSH','uptrue_last_push' );
define( 'UPTRUE_OPT_LAST_ERR', 'uptrue_last_error' );
define( 'UPTRUE_OPT_SETTINGS', 'uptrue_settings' );
define( 'UPTRUE_CRON_MAIN',    'uptrue_main_push' );
define( 'UPTRUE_CRON_PHP',     'uptrue_scan_php' );
define( 'UPTRUE_CRON_JS',      'uptrue_scan_js' );
define( 'UPTRUE_CRON_CORE',    'uptrue_scan_core' );
define( 'UPTRUE_CRON_HTACCESS','uptrue_scan_htaccess' );
define( 'UPTRUE_CRON_EXEC',    'uptrue_scan_exec' );
define( 'UPTRUE_CRON_THEME',   'uptrue_scan_theme' );
define( 'UPTRUE_CRON_PERMS',   'uptrue_scan_perms' );
define( 'UPTRUE_CRON_MODS',    'uptrue_scan_plugin_mods' );
define( 'UPTRUE_CRON_REPORT',  'uptrue_monthly_report' );

// ============================================================
// ACTIVATION / DEACTIVATION
// ============================================================

register_activation_hook( UPTRUE_PLUGIN_FILE, 'uptrue_activate' );
register_deactivation_hook( UPTRUE_PLUGIN_FILE, 'uptrue_deactivate' );

function uptrue_activate() {
    add_filter( 'cron_schedules', 'uptrue_add_cron_intervals' );
    uptrue_schedule_crons();
    uptrue_self_test();
}

function uptrue_deactivate() {
    uptrue_unschedule_crons();
    $token = get_option( UPTRUE_OPT_TOKEN, '' );
    if ( $token ) {
        uptrue_api_post( '/event', array( 'event' => 'plugin_deactivated' ), $token );
    }
}

// Re-register any missing cron jobs on every WP load.
add_action( 'plugins_loaded', 'uptrue_ensure_crons' );

function uptrue_ensure_crons() {
    if ( ! get_option( UPTRUE_OPT_TOKEN, '' ) ) return;

    $critical_hooks = array( UPTRUE_CRON_MAIN, UPTRUE_CRON_PHP, UPTRUE_CRON_REPORT, UPTRUE_CRON_PERMS );
    foreach ( $critical_hooks as $hook ) {
        if ( ! wp_next_scheduled( $hook ) ) {
            uptrue_schedule_crons();
            return;
        }
    }
}

// ============================================================
// CRON INTERVALS & SCHEDULING
// ============================================================

add_filter( 'cron_schedules', 'uptrue_add_cron_intervals' );

function uptrue_add_cron_intervals( $schedules ) {
    foreach ( array( 60, 120, 180, 240 ) as $mins ) {
        $schedules[ 'uptrue_' . $mins . 'min' ] = array(
            'interval' => $mins * 60,
            'display'  => sprintf( 'Every %d minutes (Uptrue)', $mins ),
        );
    }
    $schedules['uptrue_daily']   = array( 'interval' => DAY_IN_SECONDS,       'display' => 'Daily (Uptrue)' );
    $schedules['uptrue_weekly']  = array( 'interval' => WEEK_IN_SECONDS,       'display' => 'Weekly (Uptrue)' );
    $schedules['uptrue_monthly'] = array( 'interval' => 30 * DAY_IN_SECONDS,   'display' => 'Monthly (Uptrue)' );
    return $schedules;
}

function uptrue_get_interval_schedule() {
    $mins    = (int) get_option( UPTRUE_OPT_INTERVAL, 120 );
    $allowed = array( 60, 120, 180, 240 );
    return in_array( $mins, $allowed, true ) ? 'uptrue_' . $mins . 'min' : 'uptrue_daily';
}

function uptrue_schedule_crons() {
    if ( ! wp_next_scheduled( UPTRUE_CRON_MAIN ) ) {
        wp_schedule_event( time(), uptrue_get_interval_schedule(), UPTRUE_CRON_MAIN );
    }

    // Staggered security scans — daily, offset by activation hour to distribute server load
    $base      = time();
    $scan_jobs = array(
        UPTRUE_CRON_PHP      => 0,
        UPTRUE_CRON_JS       => HOUR_IN_SECONDS,
        UPTRUE_CRON_CORE     => 2 * HOUR_IN_SECONDS,
        UPTRUE_CRON_HTACCESS => 3 * HOUR_IN_SECONDS,
        UPTRUE_CRON_EXEC     => 4 * HOUR_IN_SECONDS,
        UPTRUE_CRON_THEME    => 5 * HOUR_IN_SECONDS,
        UPTRUE_CRON_PERMS    => 6 * HOUR_IN_SECONDS,
        UPTRUE_CRON_MODS     => 7 * HOUR_IN_SECONDS,
    );
    foreach ( $scan_jobs as $hook => $offset ) {
        if ( ! wp_next_scheduled( $hook ) ) {
            wp_schedule_event( $base + $offset, 'uptrue_daily', $hook );
        }
    }

    if ( ! wp_next_scheduled( UPTRUE_CRON_REPORT ) ) {
        wp_schedule_event( time(), 'uptrue_monthly', UPTRUE_CRON_REPORT );
    }
}

function uptrue_unschedule_crons() {
    $hooks = array(
        UPTRUE_CRON_MAIN, UPTRUE_CRON_PHP, UPTRUE_CRON_JS, UPTRUE_CRON_CORE,
        UPTRUE_CRON_HTACCESS, UPTRUE_CRON_EXEC, UPTRUE_CRON_THEME,
        UPTRUE_CRON_PERMS, UPTRUE_CRON_MODS, UPTRUE_CRON_REPORT,
    );
    foreach ( $hooks as $hook ) {
        $ts = wp_next_scheduled( $hook );
        if ( $ts ) wp_unschedule_event( $ts, $hook );
    }
}

// ============================================================
// CRON HANDLERS
// ============================================================

add_action( UPTRUE_CRON_MAIN,    'uptrue_do_main_push' );
add_action( UPTRUE_CRON_PHP,     'uptrue_scan_php_files' );
add_action( UPTRUE_CRON_JS,      'uptrue_scan_js_files' );
add_action( UPTRUE_CRON_CORE,    'uptrue_scan_core_files' );
add_action( UPTRUE_CRON_HTACCESS,'uptrue_scan_htaccess_files' );
add_action( UPTRUE_CRON_EXEC,    'uptrue_scan_exec_files' );
add_action( UPTRUE_CRON_THEME,   'uptrue_scan_theme_files' );
add_action( UPTRUE_CRON_PERMS,   'uptrue_scan_permissions' );
add_action( UPTRUE_CRON_MODS,    'uptrue_scan_modified_plugin_files' );
add_action( UPTRUE_CRON_REPORT,  'uptrue_send_monthly_report' );

// Track login failures for brute-force detection (fires on every failed login)
add_action( 'wp_login_failed', 'uptrue_track_login_failure' );

function uptrue_track_login_failure() {
    $key = 'uptrue_login_fails_' . gmdate( 'Y-m-d' );
    update_option( $key, (int) get_option( $key, 0 ) + 1, false );
    // Clean yesterday's counter to avoid option table bloat
    delete_option( 'uptrue_login_fails_' . gmdate( 'Y-m-d', strtotime( '-1 day' ) ) );
}

function uptrue_do_main_push() {
    $token = get_option( UPTRUE_OPT_TOKEN, '' );
    if ( ! $token ) return;

    $payload = uptrue_collect_data();
    $ok      = uptrue_push_data( $token, $payload );
    if ( $ok ) {
        update_option( UPTRUE_OPT_LAST_PUSH, current_time( 'mysql' ) );
        delete_option( UPTRUE_OPT_LAST_ERR );
    }
}

// ============================================================
// DATA COLLECTION
// ============================================================

function uptrue_collect_data() {
    global $wpdb;

    // ---- Plugins ----
    $all_plugins      = get_plugins();
    $active_slugs     = get_option( 'active_plugins', array() );
    $plugin_updates   = get_site_transient( 'update_plugins' );
    $active_plugins   = array();
    $inactive_plugins = array();

    foreach ( $all_plugins as $file => $data ) {
        $is_active  = in_array( $file, $active_slugs, true );
        $has_update = isset( $plugin_updates->response[ $file ] );
        $entry = array(
            'name'             => $data['Name'],
            'slug'             => dirname( $file ),
            'version'          => $data['Version'],
            'update_available' => $has_update,
            'new_version'      => $has_update ? $plugin_updates->response[ $file ]->new_version : null,
        );
        if ( $is_active ) {
            $active_plugins[] = $entry;
        } else {
            $inactive_plugins[] = array( 'name' => $data['Name'], 'slug' => dirname( $file ), 'version' => $data['Version'] );
        }
    }

    // ---- Theme ----
    $theme      = wp_get_theme();
    $theme_upd  = get_site_transient( 'update_themes' );
    $theme_slug = $theme->get_stylesheet();
    $active_theme = array(
        'name'             => $theme->get( 'Name' ),
        'version'          => $theme->get( 'Version' ),
        'update_available' => isset( $theme_upd->response[ $theme_slug ] ),
    );

    // ---- Admin/editor users ----
    $admin_users = array();
    foreach ( get_users( array( 'role__in' => array( 'administrator', 'editor' ), 'number' => 100 ) ) as $u ) {
        $admin_users[] = array(
            'id'         => $u->ID,
            'login'      => $u->user_login,
            'email'      => $u->user_email,
            'roles'      => array_values( $u->roles ),
            'registered' => $u->user_registered,
        );
    }

    // ---- Recent pages/posts (last 7 days — for new content detection) ----
    $recent_pages = array();
    foreach ( get_posts( array(
        'post_status'  => 'publish',
        'post_type'    => array( 'post', 'page' ),
        'date_query'   => array( array( 'after' => '1 week ago' ) ),
        'numberposts'  => 100,
    ) ) as $post ) {
        $recent_pages[] = array(
            'id'         => $post->ID,
            'title'      => $post->post_title,
            'slug'       => $post->post_name,
            'status'     => $post->post_status,
            'author_id'  => (int) $post->post_author,
            'created_at' => $post->post_date_gmt,
            'language'   => uptrue_detect_language( $post->post_title ),
        );
    }

    // ---- Foreign language injection scan (ALL published content) ----
    // Checks title, slug, and first 300 chars of content for CJK/Cyrillic/Arabic/etc.
    $foreign_pages = array();
    foreach ( get_posts( array(
        'post_status' => 'publish',
        'post_type'   => array( 'post', 'page' ),
        'numberposts' => 300,
    ) ) as $post ) {
        $title_lang   = uptrue_detect_language( $post->post_title );
        $slug_lang    = uptrue_detect_language( $post->post_name );
        $content_lang = uptrue_detect_language( wp_strip_all_tags( substr( $post->post_content, 0, 300 ) ) );
        $lang         = 'en' !== $title_lang ? $title_lang : ( 'en' !== $slug_lang ? $slug_lang : ( 'en' !== $content_lang ? $content_lang : 'en' ) );
        $detected_in  = 'en' !== $title_lang ? 'title' : ( 'en' !== $slug_lang ? 'slug' : ( 'en' !== $content_lang ? 'content' : '' ) );
        if ( 'en' !== $lang ) {
            $foreign_pages[] = array(
                'id'          => $post->ID,
                'title'       => $post->post_title,
                'slug'        => $post->post_name,
                'lang'        => $lang,
                'detected_in' => $detected_in,
                'url'         => get_permalink( $post->ID ),
            );
        }
    }

    // ---- File scan cache (written by staggered daily crons) ----
    $file_scan = get_option( 'uptrue_file_scan_cache', array(
        'php_in_uploads'        => array(),
        'js_in_uploads'         => array(),
        'htaccess_modified'     => false,
        'wpconfig_modified'     => false,
        'suspicious_files'      => array(),
        'core_files_modified'   => array(),
        'theme_files_modified'  => array(),
        'world_writable_dirs'   => array(),
        'modified_plugin_files' => array(),
    ) );

    // ---- DB size ----
    $db_size = (float) $wpdb->get_var(
        $wpdb->prepare( "SELECT SUM(data_length + index_length) / 1024 / 1024 FROM information_schema.tables WHERE table_schema = %s", DB_NAME )
    );

    // ---- Site stats ----
    $user_counts = count_users();

    // ================================================================
    // SECURITY CONFIG — collected once per push from live WP state
    // ================================================================

    // 2FA plugin detection
    $twofa_slugs  = array( 'wordfence', 'two-factor', 'google-authenticator', 'wp-2fa',
        'ithemes-security', 'better-wp-security', 'miniOrange-2-factor-authentication',
        'rublon', 'wp-cerber', 'shield-security' );
    $twofa_active = false;
    foreach ( $active_slugs as $plugin_file ) {
        if ( in_array( dirname( $plugin_file ), $twofa_slugs, true ) ) {
            $twofa_active = true;
            break;
        }
    }

    // Backup plugin detection
    $backup_slugs   = array( 'updraftplus', 'all-in-one-wp-migration', 'backwpup', 'duplicator',
        'wp-db-backup', 'blogvault-real-time-backup', 'wpvivid-backups', 'backupbuddy',
        'jetpack', 'simple-backup', 'backup-backup', 'boldgrid-backup' );
    $backup_present = false;
    foreach ( $active_slugs as $plugin_file ) {
        if ( in_array( dirname( $plugin_file ), $backup_slugs, true ) ) {
            $backup_present = true;
            break;
        }
    }

    // WordPress core auto-update setting
    if ( defined( 'WP_AUTO_UPDATE_CORE' ) ) {
        if ( true === WP_AUTO_UPDATE_CORE ) {
            $auto_updates = 'enabled';
        } elseif ( false === WP_AUTO_UPDATE_CORE ) {
            $auto_updates = 'disabled';
        } else {
            $auto_updates = 'minor_only';
        }
    } else {
        $auto_updates = 'minor_only'; // WordPress default behaviour
    }

    // Application passwords in use (WP 5.6+)
    $app_passwords = false;
    if ( function_exists( 'wp_is_application_passwords_available' ) && wp_is_application_passwords_available() ) {
        foreach ( get_users( array( 'number' => 50 ) ) as $u ) {
            if ( class_exists( 'WP_Application_Passwords' ) &&
                 ! empty( WP_Application_Passwords::get_user_application_passwords( $u->ID ) ) ) {
                $app_passwords = true;
                break;
            }
        }
    }

    // XML-RPC status
    $xmlrpc_enabled = (bool) apply_filters( 'xmlrpc_enabled', true );

    // REST API user enumeration — internal dispatch in unauthenticated context
    $rest_user_enum = false;
    if ( function_exists( 'rest_do_request' ) && class_exists( 'WP_REST_Request' ) ) {
        $prev_user = get_current_user_id();
        wp_set_current_user( 0 );
        try {
            $req = new WP_REST_Request( 'GET', '/wp/v2/users' );
            $res = rest_get_server()->dispatch( $req );
            $rest_user_enum = ( 200 === $res->get_status() &&
                                is_array( $res->get_data() ) &&
                                count( $res->get_data() ) > 0 );
        } catch ( Exception $e ) {
            $rest_user_enum = false;
        }
        wp_set_current_user( $prev_user );
    }

    // Spam comment volume
    $comment_counts = wp_count_comments();
    $spam_count     = isset( $comment_counts->spam ) ? (int) $comment_counts->spam : 0;

    // Disk usage
    $disk_free     = @disk_free_space( ABSPATH );
    $disk_total    = @disk_total_space( ABSPATH );
    $disk_used_pct = ( $disk_total && false !== $disk_free )
        ? round( ( 1 - $disk_free / $disk_total ) * 100, 1 )
        : null;
    $disk_free_gb  = ( false !== $disk_free ) ? round( $disk_free / 1073741824, 1 ) : null;

    // Login failures today (incremented by wp_login_failed hook)
    $login_failures = (int) get_option( 'uptrue_login_fails_' . gmdate( 'Y-m-d' ), 0 );

    return array(
        'site_url'         => get_bloginfo( 'url' ),
        'wp_version'       => get_bloginfo( 'version' ),
        'php_version'      => PHP_VERSION,
        'active_plugins'   => $active_plugins,
        'inactive_plugins' => $inactive_plugins,
        'active_theme'     => $active_theme,
        'admin_users'      => $admin_users,
        'recent_pages'     => $recent_pages,
        'foreign_pages'    => $foreign_pages,
        'file_scan'        => $file_scan,
        'debug_mode'       => defined( 'WP_DEBUG' ) && WP_DEBUG,
        'memory_limit'     => defined( 'WP_MEMORY_LIMIT' ) ? WP_MEMORY_LIMIT : ini_get( 'memory_limit' ),
        'db_size_mb'       => round( $db_size, 2 ),
        'cron_last_run'    => get_option( UPTRUE_OPT_LAST_PUSH, null ),
        'site_stats'       => array(
            'total_pages'   => (int) wp_count_posts( 'page' )->publish,
            'total_posts'   => (int) wp_count_posts( 'post' )->publish,
            'total_users'   => (int) $user_counts['total_users'],
            'users_by_role' => (array) $user_counts['avail_roles'],
        ),
        'security_config'  => array(
            'login_failures_24h'    => $login_failures,
            'world_writable_dirs'   => isset( $file_scan['world_writable_dirs'] )   ? (array) $file_scan['world_writable_dirs']   : array(),
            'xmlrpc_enabled'        => $xmlrpc_enabled,
            'rest_user_enum'        => $rest_user_enum,
            'app_passwords_in_use'  => $app_passwords,
            'auto_updates'          => $auto_updates,
            'spam_comments'         => $spam_count,
            'twofa_active'          => $twofa_active,
            'modified_plugin_files' => isset( $file_scan['modified_plugin_files'] ) ? (array) $file_scan['modified_plugin_files'] : array(),
            'backup_plugin_present' => $backup_present,
            'disk_used_pct'         => $disk_used_pct,
            'disk_free_gb'          => $disk_free_gb,
        ),
    );
}

// ============================================================
// LANGUAGE DETECTION (Unicode block check — no library needed)
// ============================================================

function uptrue_detect_language( $text ) {
    if ( preg_match( '/[\x{0400}-\x{04FF}]/u', $text ) )                          return 'ru'; // Cyrillic
    if ( preg_match( '/[\x{4E00}-\x{9FFF}]/u', $text ) )                          return 'zh'; // CJK (Chinese)
    if ( preg_match( '/[\x{0600}-\x{06FF}]/u', $text ) )                          return 'ar'; // Arabic / Persian / Urdu
    if ( preg_match( '/[\x{0900}-\x{097F}]/u', $text ) )                          return 'hi'; // Devanagari (Hindi)
    if ( preg_match( '/[\x{0E00}-\x{0E7F}]/u', $text ) )                          return 'th'; // Thai
    if ( preg_match( '/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $text ) )         return 'ja'; // Japanese
    if ( preg_match( '/[\x{AC00}-\x{D7A3}]/u', $text ) )                          return 'ko'; // Korean
    if ( preg_match( '/[\x{0590}-\x{05FF}]/u', $text ) )                          return 'he'; // Hebrew
    if ( preg_match( '/[\x{0980}-\x{09FF}]/u', $text ) )                          return 'bn'; // Bengali
    if ( preg_match( '/[\x{10A0}-\x{10FF}]/u', $text ) )                          return 'ka'; // Georgian
    return 'en';
}

// ============================================================
// STAGGERED FILE SCANS
// ============================================================

function uptrue_scan_php_files() {
    $dir   = wp_upload_dir();
    $found = uptrue_scan_dir_for_extensions( $dir['basedir'], array( 'php', 'php5', 'php7', 'phtml' ) );
    uptrue_update_scan_cache( 'php_in_uploads', $found );
}

function uptrue_scan_js_files() {
    $dir   = wp_upload_dir();
    $found = uptrue_scan_dir_for_extensions( $dir['basedir'], array( 'js' ) );
    uptrue_update_scan_cache( 'js_in_uploads', $found );
}

function uptrue_scan_exec_files() {
    $dir   = wp_upload_dir();
    $found = uptrue_scan_dir_for_extensions( $dir['basedir'], array( 'sh', 'exe', 'bat', 'py', 'pl', 'cgi', 'cmd' ) );
    uptrue_update_scan_cache( 'suspicious_files', $found );
}

function uptrue_scan_htaccess_files() {
    $baseline = get_option( 'uptrue_file_baseline', array() );
    $cache    = get_option( 'uptrue_file_scan_cache', array() );

    foreach ( array( '.htaccess' => 'htaccess_modified', 'wp-config.php' => 'wpconfig_modified' ) as $file => $key ) {
        $path = ABSPATH . $file;
        if ( ! file_exists( $path ) ) continue;
        $mtime = filemtime( $path );
        if ( ! isset( $baseline[ $file ] ) ) {
            $baseline[ $file ] = $mtime;
        }
        $cache[ $key ] = $mtime > $baseline[ $file ];
    }

    update_option( 'uptrue_file_baseline', $baseline );
    update_option( 'uptrue_file_scan_cache', $cache );
}

function uptrue_scan_core_files() {
    $core_files = array( 'wp-login.php', 'wp-settings.php', 'wp-admin/admin.php', 'wp-includes/functions.php' );
    $baseline   = get_option( 'uptrue_core_baseline', array() );
    $modified   = array();

    foreach ( $core_files as $rel ) {
        $path = ABSPATH . $rel;
        if ( ! file_exists( $path ) ) continue;
        $mtime = filemtime( $path );
        if ( ! isset( $baseline[ $rel ] ) ) {
            $baseline[ $rel ] = $mtime;
        } elseif ( $mtime > $baseline[ $rel ] ) {
            $modified[] = $rel;
        }
    }

    update_option( 'uptrue_core_baseline', $baseline );
    uptrue_update_scan_cache( 'core_files_modified', $modified );
}

function uptrue_scan_theme_files() {
    $theme    = wp_get_theme();
    $dir      = $theme->get_stylesheet_directory();
    $baseline = get_option( 'uptrue_theme_baseline', array() );
    $modified = array();

    $functions = $dir . '/functions.php';
    if ( file_exists( $functions ) ) {
        $mtime = filemtime( $functions );
        if ( ! isset( $baseline['functions.php'] ) ) {
            $baseline['functions.php'] = $mtime;
        } elseif ( $mtime > $baseline['functions.php'] ) {
            $modified[] = 'functions.php';
        }
    }

    update_option( 'uptrue_theme_baseline', $baseline );
    uptrue_update_scan_cache( 'theme_files_modified', $modified );
}

function uptrue_scan_permissions() {
    $paths = array(
        'wp-admin'           => ABSPATH . 'wp-admin',
        'wp-includes'        => ABSPATH . 'wp-includes',
        'wp-content/plugins' => WP_PLUGIN_DIR,
    );
    $writable = array();
    foreach ( $paths as $label => $path ) {
        if ( is_dir( $path ) ) {
            $perms = @fileperms( $path );
            if ( false !== $perms && ( $perms & 0x0002 ) ) {
                $writable[] = $label;
            }
        }
    }
    uptrue_update_scan_cache( 'world_writable_dirs', $writable );
}

function uptrue_scan_modified_plugin_files() {
    $cutoff   = time() - DAY_IN_SECONDS;
    $modified = array();
    foreach ( (array) glob( WP_PLUGIN_DIR . '/*', GLOB_ONLYDIR ) as $dir ) {
        try {
            $it = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS )
            );
            foreach ( $it as $f ) {
                if ( 'php' === strtolower( $f->getExtension() ) && $f->getMTime() > $cutoff ) {
                    $modified[] = str_replace( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR, '', $f->getPathname() );
                    if ( count( $modified ) >= 20 ) break 2; // cap at 20 to avoid huge payloads
                }
            }
        } catch ( Exception $e ) { /* skip unreadable dirs */ }
    }
    uptrue_update_scan_cache( 'modified_plugin_files', $modified );
}

function uptrue_scan_dir_for_extensions( $dir, $extensions ) {
    $found = array();
    if ( ! is_dir( $dir ) ) return $found;
    try {
        $it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS ) );
        foreach ( $it as $file ) {
            if ( in_array( strtolower( $file->getExtension() ), $extensions, true ) ) {
                $found[] = str_replace( ABSPATH, '', $file->getPathname() );
            }
        }
    } catch ( Exception $e ) { /* skip unreadable dirs */ }
    return $found;
}

function uptrue_update_scan_cache( $key, $value ) {
    $cache         = get_option( 'uptrue_file_scan_cache', array() );
    $cache[ $key ] = $value;
    update_option( 'uptrue_file_scan_cache', $cache );
}

// ============================================================
// PUSH TO UPTRUE API
// ============================================================

function uptrue_push_data( $token, $payload ) {
    $response = uptrue_api_post( '/push', $payload, $token );
    if ( is_wp_error( $response ) ) {
        update_option( UPTRUE_OPT_LAST_ERR, $response->get_error_message() );
        return false;
    }
    $code = wp_remote_retrieve_response_code( $response );
    if ( 200 !== $code ) {
        update_option( UPTRUE_OPT_LAST_ERR, 'API returned HTTP ' . $code );
        return false;
    }
    return true;
}

function uptrue_api_post( $endpoint, $body, $token ) {
    return wp_remote_post( uptrue_api_base() . $endpoint, array(
        'headers' => array(
            'Content-Type'     => 'application/json',
            'Authorization'    => 'Bearer ' . $token,
            'X-Uptrue-Version' => UPTRUE_VERSION,
            'User-Agent'       => 'Uptrue-WP-Monitor/' . UPTRUE_VERSION,
        ),
        'body'    => wp_json_encode( $body ),
        'timeout' => 20,
    ) );
}

// ============================================================
// SELF TEST ON ACTIVATION
// ============================================================

function uptrue_self_test() {
    $response = wp_remote_get( uptrue_api_base() . '/ping', array(
        'timeout'    => 10,
        'user-agent' => 'Uptrue-WP-Monitor/' . UPTRUE_VERSION,
    ) );
    $ok = ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response );
    update_option( 'uptrue_self_test_ok', $ok );
    update_option( 'uptrue_self_test_at', current_time( 'mysql' ) );
}

// ============================================================
// FREE MONTHLY EMAIL REPORT (no Uptrue account required)
// ============================================================

function uptrue_send_monthly_report() {
    $settings = get_option( UPTRUE_OPT_SETTINGS, array() );
    if ( isset( $settings['monthly_report'] ) && ! $settings['monthly_report'] ) return;

    $data   = uptrue_collect_data();
    $issues = array();
    $score  = 100;

    $outdated = array_filter( $data['active_plugins'], function( $p ) { return $p['update_available']; } );
    if ( count( $outdated ) > 0 ) {
        $issues[] = '⚠️  ' . count( $outdated ) . ' plugin(s) need updating: ' . implode( ', ', array_column( $outdated, 'name' ) );
        $score   -= count( $outdated ) * 3;
    }

    if ( ! empty( $data['active_theme']['update_available'] ) ) {
        $issues[] = '⚠️  Active theme has an update available: ' . $data['active_theme']['name'];
        $score   -= 5;
    }

    if ( ! empty( $data['file_scan']['php_in_uploads'] ) ) {
        $issues[] = '🚨 PHP files found in /uploads/ — possible security threat: ' . implode( ', ', $data['file_scan']['php_in_uploads'] );
        $score   -= 30;
    }

    if ( ! empty( $data['debug_mode'] ) ) {
        $issues[] = '⚠️  WP_DEBUG is ON — this should be disabled in production.';
        $score   -= 10;
    }

    $sec = $data['security_config'] ?? array();
    if ( ! empty( $sec['twofa_active'] ) === false ) {
        $issues[] = '⚠️  No two-factor authentication plugin detected — admin accounts are at risk.';
        $score   -= 8;
    }
    if ( empty( $sec['backup_plugin_present'] ) ) {
        $issues[] = '⚠️  No backup plugin found — install one to protect against data loss.';
        $score   -= 5;
    }
    if ( ! empty( $sec['xmlrpc_enabled'] ) ) {
        $issues[] = '⚠️  XML-RPC is enabled — consider disabling it to reduce brute-force attack surface.';
        $score   -= 5;
    }

    $score       = max( 0, $score );
    $score_label = $score >= 90 ? 'Excellent' : ( $score >= 70 ? 'Good' : ( $score >= 50 ? 'Fair' : 'Poor' ) );
    $site_name   = get_bloginfo( 'name' );
    $site_url    = get_bloginfo( 'url' );
    $to          = get_option( 'admin_email' );
    $subject     = "[Uptrue] Monthly WordPress health report for {$site_name}";

    $body  = "Monthly WordPress Health Report\n";
    $body .= str_repeat( '=', 44 ) . "\n\n";
    $body .= "Site:         {$site_url}\n";
    $body .= "Health Score: {$score}/100 ({$score_label})\n";
    $body .= "Report Date:  " . gmdate( 'd M Y' ) . "\n\n";

    if ( empty( $issues ) ) {
        $body .= "✅  No issues found. Your site looks healthy!\n\n";
    } else {
        $body .= "Issues Found\n" . str_repeat( '-', 44 ) . "\n";
        foreach ( $issues as $issue ) {
            $body .= "  {$issue}\n";
        }
        $body .= "\n";
    }

    $body .= str_repeat( '-', 44 ) . "\n";
    $body .= "Connect to Uptrue for real-time alerts, AI-powered fix suggestions, and full historical reports.\n";
    $body .= "Free to start: https://uptrue.io/wordpress-monitor\n";

    wp_mail( $to, $subject, $body );
}

// ============================================================
// REST API — handshake endpoint for setup wizard
// ============================================================

add_action( 'rest_api_init', function () {
    register_rest_route( 'uptrue/v1', '/status', array(
        'methods'             => 'GET',
        'callback'            => 'uptrue_rest_status',
        'permission_callback' => '__return_true',
    ) );
} );

function uptrue_rest_status( WP_REST_Request $request ) {
    $token = get_option( UPTRUE_OPT_TOKEN, '' );
    $auth  = $request->get_header( 'X-Uptrue-Token' );

    if ( ! $token || $auth !== $token ) {
        return new WP_Error( 'unauthorized', 'Invalid token', array( 'status' => 401 ) );
    }

    return array(
        'status'     => 'connected',
        'version'    => UPTRUE_VERSION,
        'site_url'   => get_bloginfo( 'url' ),
        'wp_version' => get_bloginfo( 'version' ),
        'last_push'  => get_option( UPTRUE_OPT_LAST_PUSH, null ),
        'self_test'  => (bool) get_option( 'uptrue_self_test_ok', false ),
    );
}

// ============================================================
// ADMIN MENU
// ============================================================

add_action( 'admin_menu', 'uptrue_admin_menu' );

function uptrue_admin_menu() {
    $icon = 'dashicons-shield-alt';
    add_menu_page( 'Uptrue', 'Uptrue', 'manage_options', 'uptrue', 'uptrue_page_dashboard', $icon, 25 );
    add_submenu_page( 'uptrue', 'Dashboard',  'Dashboard',   'manage_options', 'uptrue',          'uptrue_page_dashboard' );
    add_submenu_page( 'uptrue', 'Settings',   'Settings',    'manage_options', 'uptrue-settings', 'uptrue_page_settings' );
    add_submenu_page( 'uptrue', 'Cron Status','Cron Status', 'manage_options', 'uptrue-cron',     'uptrue_page_cron' );
}

// ============================================================
// ADMIN PAGE — DASHBOARD
// ============================================================

function uptrue_page_dashboard() {
    $token     = get_option( UPTRUE_OPT_TOKEN, '' );
    $last_push = get_option( UPTRUE_OPT_LAST_PUSH, null );
    $last_err  = get_option( UPTRUE_OPT_LAST_ERR, null );
    $self_test = get_option( 'uptrue_self_test_ok', false );
    ?>
    <div class="wrap">
        <h1>🛡️ Uptrue WordPress Monitor</h1>

        <?php if ( ! $token ) : ?>
        <div class="notice notice-warning inline">
            <p><strong>Not connected to Uptrue.</strong>
            Go to <a href="<?php echo esc_url( admin_url( 'admin.php?page=uptrue-settings' ) ); ?>">Settings</a> to paste your API token.</p>
        </div>
        <?php else : ?>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0;max-width:700px">
            <?php foreach ( array(
                array( 'Status',    $token ? '✅ Connected'             : '❌ Not connected',    $token ? '#10b981' : '#ef4444' ),
                array( 'Last Push', $last_push ? esc_html( $last_push ) : 'Never',               '#1e293b' ),
                array( 'Uptrue API',$self_test  ? '✅ Reachable'        : '⚠️ Check connection', $self_test ? '#10b981' : '#f97316' ),
            ) as $stat ) : ?>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:600"><?php echo esc_html( $stat[0] ); ?></div>
                <div style="font-size:15px;font-weight:700;color:<?php echo esc_attr( $stat[2] ); ?>;margin-top:6px"><?php echo $stat[1]; ?></div>
            </div>
            <?php endforeach; ?>
        </div>

        <?php if ( $last_err ) : ?>
        <div class="notice notice-error inline">
            <p><strong>Last error:</strong> <?php echo esc_html( $last_err ); ?></p>
        </div>
        <?php endif; ?>

        <p>
            <a href="https://uptrue.io/dashboard/monitors" target="_blank" class="button button-primary">View full report on Uptrue →</a>
            &nbsp;
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=uptrue-settings' ) ); ?>" class="button">Settings</a>
        </p>

        <?php endif; ?>
    </div>
    <?php
}

// ============================================================
// ADMIN PAGE — SETTINGS
// ============================================================

function uptrue_page_settings() {
    // Handle force-push action
    if ( isset( $_GET['uptrue_push_now'] ) && wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'uptrue_push_now' ) ) {
        $token = get_option( UPTRUE_OPT_TOKEN, '' );
        if ( $token ) {
            uptrue_self_test();
            uptrue_do_main_push();
            echo '<div class="notice notice-success inline"><p>Push sent. Check Last Error below — if empty, it worked.</p></div>';
        }
    }

    if ( isset( $_POST['uptrue_save'] ) && check_admin_referer( 'uptrue_save_settings' ) ) {
        $token    = sanitize_text_field( wp_unslash( $_POST['uptrue_token'] ?? '' ) );
        $interval = (int) ( $_POST['uptrue_interval'] ?? 120 );
        if ( ! in_array( $interval, array( 60, 120, 180, 240, 1440, 10080, 43200 ), true ) ) $interval = 120;

        $raw_settings = $_POST['settings'] ?? array();
        $settings     = array();
        $check_keys   = array( 'scan_php_uploads', 'scan_js_uploads', 'scan_core_files', 'scan_htaccess',
                               'scan_exec_files', 'scan_theme_files', 'detect_new_users',
                               'detect_new_pages', 'detect_languages', 'monthly_report' );
        foreach ( $check_keys as $k ) {
            $settings[ $k ] = isset( $raw_settings[ $k ] );
        }

        update_option( UPTRUE_OPT_TOKEN,    $token );
        update_option( UPTRUE_OPT_INTERVAL, $interval );
        update_option( UPTRUE_OPT_SETTINGS, $settings );

        uptrue_unschedule_crons();
        uptrue_schedule_crons();

        if ( $token ) {
            uptrue_self_test();
            // Schedule push 5 seconds from now — avoids blocking the admin HTTP response on slow servers.
            wp_schedule_single_event( time() + 5, UPTRUE_CRON_MAIN );
        }

        echo '<div class="notice notice-success inline"><p>Settings saved. First data push scheduled — check Last Error below in a few seconds.</p></div>';
    }

    $token    = get_option( UPTRUE_OPT_TOKEN, '' );
    $interval = get_option( UPTRUE_OPT_INTERVAL, 120 );
    $settings = get_option( UPTRUE_OPT_SETTINGS, array() );
    $self_test= get_option( 'uptrue_self_test_ok', null );
    $last_err = get_option( UPTRUE_OPT_LAST_ERR, null );
    ?>
    <div class="wrap">
        <h1>Uptrue — Settings</h1>

        <?php if ( $last_err ) : ?>
        <div class="notice notice-error inline" style="margin-bottom:16px">
            <p><strong>Last push error:</strong> <?php echo esc_html( $last_err ); ?></p>
            <p style="font-size:13px">
                <strong>401</strong> — Invalid API token. Copy the token from the Uptrue monitor setup page and paste it above.<br>
                <strong>405</strong> — Wrong endpoint URL. If you need to point to a different environment, add <code>define( 'UPTRUE_API_BASE_URL', 'https://dev.uptrue.io/api/v1/wp-agent' );</code> to your wp-config.php.<br>
                <strong>Network error</strong> — Your server may be blocking outbound HTTPS requests to uptrue.io.
            </p>
        </div>
        <?php endif; ?>

        <p>
            <a href="<?php echo esc_url( wp_nonce_url( add_query_arg( 'uptrue_push_now', '1', admin_url( 'admin.php?page=uptrue-settings' ) ), 'uptrue_push_now' ) ); ?>" class="button">
                ↑ Force push now
            </a>
        </p>

        <form method="post">
            <?php wp_nonce_field( 'uptrue_save_settings' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="uptrue_token">Uptrue API Token</label></th>
                    <td>
                        <input type="text" id="uptrue_token" name="uptrue_token"
                               value="<?php echo esc_attr( $token ); ?>"
                               class="regular-text" placeholder="wpt_..." />
                        <p class="description">
                            Get your token from the Uptrue dashboard — WordPress monitor setup page.
                        </p>
                        <?php if ( $token && null !== $self_test ) : ?>
                        <p style="color:<?php echo $self_test ? '#10b981' : '#ef4444'; ?>;font-weight:600;margin-top:6px">
                            <?php echo $self_test ? '✅ Connection test passed' : '❌ Connection test failed — verify your token and that your server can reach uptrue.io'; ?>
                        </p>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th><label for="uptrue_interval">Check Frequency</label></th>
                    <td>
                        <select id="uptrue_interval" name="uptrue_interval">
                            <?php foreach ( array(
                                60    => 'Every 60 minutes',
                                120   => 'Every 120 minutes (default)',
                                180   => 'Every 180 minutes',
                                240   => 'Every 240 minutes',
                                1440  => 'Once a day',
                                10080 => 'Once a week',
                                43200 => 'Once a month',
                            ) as $val => $label ) : ?>
                            <option value="<?php echo esc_attr( $val ); ?>" <?php selected( $interval, $val ); ?>>
                                <?php echo esc_html( $label ); ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
            </table>

            <h2 style="margin-top:24px">Advanced — Enable / Disable Checks</h2>
            <table class="form-table">
                <?php foreach ( array(
                    'scan_php_uploads'  => 'Scan /uploads/ for PHP files (critical security check)',
                    'scan_js_uploads'   => 'Scan /uploads/ for JavaScript files',
                    'scan_core_files'   => 'Monitor WordPress core file modifications',
                    'scan_htaccess'     => 'Monitor .htaccess and wp-config.php changes',
                    'scan_exec_files'   => 'Scan /uploads/ for executable files (.sh, .exe, .py…)',
                    'scan_theme_files'  => 'Monitor active theme file changes (functions.php)',
                    'detect_new_users'  => 'Alert on new admin/editor users',
                    'detect_new_pages'  => 'Alert on newly published pages/posts',
                    'detect_languages'  => 'Alert on foreign-language page titles (SEO spam detection)',
                    'monthly_report'    => 'Send monthly health report to admin email',
                ) as $key => $label ) :
                    $checked = ! isset( $settings[ $key ] ) || $settings[ $key ];
                ?>
                <tr>
                    <th><?php echo esc_html( $label ); ?></th>
                    <td>
                        <input type="checkbox" name="settings[<?php echo esc_attr( $key ); ?>]" value="1" <?php checked( $checked ); ?> />
                        <label>Enabled</label>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>

            <p class="submit">
                <button type="submit" name="uptrue_save" class="button button-primary">Save Settings</button>
            </p>
        </form>
    </div>
    <?php
}

// ============================================================
// ADMIN PAGE — CRON STATUS
// ============================================================

function uptrue_page_cron() {
    $interval      = get_option( UPTRUE_OPT_INTERVAL, 120 );
    $last_err      = get_option( UPTRUE_OPT_LAST_ERR, null );
    $cron_disabled = defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON;

    $jobs = array(
        UPTRUE_CRON_MAIN     => 'Main data push',
        UPTRUE_CRON_PHP      => 'PHP file scan (/uploads/)',
        UPTRUE_CRON_JS       => 'JavaScript file scan (/uploads/)',
        UPTRUE_CRON_CORE     => 'Core file integrity check',
        UPTRUE_CRON_HTACCESS => '.htaccess / wp-config.php monitor',
        UPTRUE_CRON_EXEC     => 'Executable file scan (/uploads/)',
        UPTRUE_CRON_THEME    => 'Active theme file monitor',
        UPTRUE_CRON_PERMS    => 'Directory permissions scan',
        UPTRUE_CRON_MODS     => 'Plugin file modification scan (24h)',
        UPTRUE_CRON_REPORT   => 'Monthly health email report',
    );
    ?>
    <div class="wrap">
        <h1>Uptrue — Cron Status</h1>

        <?php if ( $cron_disabled ) : ?>
        <div class="notice notice-warning">
            <p><strong>WP Cron is disabled</strong> (DISABLE_WP_CRON = true in wp-config.php).</p>
            <p>Add a real cron job to your server so Uptrue checks run on schedule:</p>
            <code>*/ <?php echo esc_html( $interval ); ?> * * * * curl -s "<?php echo esc_url( get_bloginfo( 'url' ) ); ?>/wp-cron.php?doing_wp_cron" > /dev/null 2>&1</code>
        </div>
        <?php endif; ?>

        <?php if ( $last_err ) : ?>
        <div class="notice notice-error">
            <p><strong>Last error:</strong> <?php echo esc_html( $last_err ); ?></p>
            <p><strong>Likely fix:</strong> Verify your API token in Settings. Confirm your server allows outbound HTTPS requests to uptrue.io.</p>
        </div>
        <?php endif; ?>

        <table class="wp-list-table widefat fixed striped" style="max-width:800px;margin-top:16px">
            <thead>
                <tr><th>Job</th><th>Next Scheduled Run</th><th>Status</th></tr>
            </thead>
            <tbody>
                <?php foreach ( $jobs as $hook => $label ) :
                    $next = wp_next_scheduled( $hook );
                ?>
                <tr>
                    <td><?php echo esc_html( $label ); ?></td>
                    <td><?php echo $next ? esc_html( gmdate( 'd M Y H:i', $next ) . ' UTC' ) : '—'; ?></td>
                    <td>
                        <?php if ( $next ) : ?>
                            <span style="color:#10b981;font-weight:600">✅ Scheduled</span>
                        <?php else : ?>
                            <span style="color:#ef4444;font-weight:600">❌ Not scheduled</span>
                            &nbsp;
                            <a href="<?php echo esc_url( add_query_arg( array( 'uptrue_reschedule' => $hook, '_wpnonce' => wp_create_nonce( 'uptrue_reschedule' ) ), admin_url( 'admin.php?page=uptrue-cron' ) ) ); ?>" class="button button-small">Reschedule</a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php
        if ( isset( $_GET['uptrue_reschedule'] ) && wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'uptrue_reschedule' ) ) {
            $hook = sanitize_key( $_GET['uptrue_reschedule'] );
            if ( array_key_exists( $hook, $jobs ) ) {
                wp_schedule_single_event( time() + 60, $hook );
                echo '<div class="notice notice-success inline" style="margin-top:12px"><p>Job rescheduled to run in 60 seconds.</p></div>';
            }
        }
        ?>

        <h2 style="margin-top:24px">Remediation Steps</h2>
        <ol>
            <li><strong>Check if WP Cron is disabled</strong> — look for <code>define( 'DISABLE_WP_CRON', true )</code> in wp-config.php and remove it (or set up a server cron).</li>
            <li><strong>Set up a real server cron</strong> — in cPanel or SSH terminal, run:<br>
                <code>*/ <?php echo esc_html( $interval ); ?> * * * * php <?php echo esc_html( ABSPATH ); ?>wp-cron.php</code></li>
            <li><strong>Trigger manually now</strong> — visit <a href="<?php echo esc_url( get_bloginfo( 'url' ) . '/wp-cron.php?doing_wp_cron' ); ?>" target="_blank">wp-cron.php?doing_wp_cron</a></li>
            <li><strong>Re-save Settings</strong> — go to Uptrue → Settings and click Save to reschedule all jobs.</li>
        </ol>
    </div>
    <?php
}
