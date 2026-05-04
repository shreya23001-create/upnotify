<?php
/**
 * Uninstall handler — runs when the user deletes the plugin from WP admin.
 * Removes every option this plugin has written so we don't leave orphan rows.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;

$options = array(
    'uptrue_api_token',
    'uptrue_check_interval',
    'uptrue_last_push',
    'uptrue_last_error',
    'uptrue_settings',
    'uptrue_self_test_ok',
    'uptrue_self_test_at',
    'uptrue_file_scan_cache',
    'uptrue_file_baseline',
    'uptrue_core_baseline',
    'uptrue_theme_baseline',
);

foreach ( $options as $option ) {
    delete_option( $option );
}

// Daily login-failure counters — clean up the last 7 days of keys.
for ( $i = 0; $i < 7; $i++ ) {
    delete_option( 'uptrue_login_fails_' . gmdate( 'Y-m-d', strtotime( "-{$i} day" ) ) );
}

// Unschedule any cron events that may still be queued.
$hooks = array(
    'uptrue_main_push',
    'uptrue_scan_php',
    'uptrue_scan_js',
    'uptrue_scan_core',
    'uptrue_scan_htaccess',
    'uptrue_scan_exec',
    'uptrue_scan_theme',
    'uptrue_scan_perms',
    'uptrue_scan_plugin_mods',
    'uptrue_monthly_report',
);
foreach ( $hooks as $hook ) {
    $ts = wp_next_scheduled( $hook );
    while ( $ts ) {
        wp_unschedule_event( $ts, $hook );
        $ts = wp_next_scheduled( $hook );
    }
}
