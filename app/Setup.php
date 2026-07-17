<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App;

defined( 'ABSPATH' ) || exit;

class Setup
{
    /**
     * Initialize plugin setup.
     */
    public static function init()
    {
        register_activation_hook( HYOKA_PLUGIN_FILE, [ self::class, 'activate' ] );
        register_uninstall_hook( HYOKA_PLUGIN_FILE, [ self::class, 'uninstall' ] );
        Deactivation::init();
    }

    /**
     * Run plugin activation scripts 
     */
    public static function activate()
    {
        global $wpdb;

        $reviews_table  = $wpdb->prefix . 'hyoka_reviews';
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta( "CREATE TABLE $reviews_table (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT UNSIGNED NOT NULL,
            rating tinyint(4) NOT NULL,
            content longtext NOT NULL,
            store_review text DEFAULT NULL,
            status enum('pending','approved','rejected','spam') NOT NULL DEFAULT 'pending',
            is_verified boolean DEFAULT 0,
            media longtext DEFAULT NULL,
            email longtext DEFAULT NULL,
            reply text DEFAULT NULL,
            question text DEFAULT NULL,
            likes BIGINT UNSIGNED DEFAULT 0,
            settings longtext DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime DEFAULT NULL
        ) $charset_collate;" );

        $customer_table = $wpdb->prefix . 'hyoka_customer';
        dbDelta( "CREATE TABLE $customer_table (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_id BIGINT UNSIGNED NOT NULL,
            product_id BIGINT UNSIGNED NOT NULL,
            product longtext DEFAULT NULL,
            customer longtext DEFAULT NULL,
            purchase_date datetime NOT NULL,
            email longtext DEFAULT NULL,
            invite longtext DEFAULT NULL,
            review longtext DEFAULT NULL,
            audit longtext DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime DEFAULT NULL
        ) $charset_collate;" );

        $import_table = $wpdb->prefix . 'hyoka_import';
        dbDelta( "CREATE TABLE $import_table (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            import_job_id varchar(36) DEFAULT NULL,
            batch_status enum('queued','processing','imported','failed') NOT NULL DEFAULT 'queued',
            source varchar(32) NOT NULL DEFAULT 'csv',
            source_type varchar(32) NOT NULL DEFAULT 'file',
            product_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
            order_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
            rating tinyint(4) NOT NULL,
            content longtext NOT NULL,
            store_review text DEFAULT NULL,
            status enum('pending','approved','rejected','spam') NOT NULL DEFAULT 'pending',
            is_verified boolean DEFAULT 0,
            media longtext DEFAULT NULL,
            email longtext DEFAULT NULL,
            customer_email_hash varchar(64) DEFAULT NULL,
            reply text DEFAULT NULL,
            question text DEFAULT NULL,
            likes BIGINT UNSIGNED DEFAULT 0,
            review_id BIGINT UNSIGNED DEFAULT NULL,
            import_meta longtext DEFAULT NULL,
            settings longtext DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime DEFAULT NULL
        ) $charset_collate;" );
    }

    /**
     * Run plugin uninstall scripts.
     */
    public static function uninstall()
    {
        global $wpdb;
        $delete_data = get_option( 'hyoka_delete_data_on_uninstall', false );
        if ( $delete_data ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.SchemaChange -- Plugin-owned table from $wpdb->prefix + fixed hyoka_reviews suffix; DROP only when hyoka_delete_data_on_uninstall is enabled.
            $wpdb->query( "DROP TABLE IF EXISTS `{$wpdb->prefix}hyoka_reviews`" );
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.SchemaChange -- Plugin-owned table from $wpdb->prefix + fixed hyoka_customer suffix; DROP only when hyoka_delete_data_on_uninstall is enabled.
            $wpdb->query( "DROP TABLE IF EXISTS `{$wpdb->prefix}hyoka_customer`" );
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.SchemaChange -- Plugin-owned table from $wpdb->prefix + fixed hyoka_import suffix; DROP only when hyoka_delete_data_on_uninstall is enabled.
            $wpdb->query( "DROP TABLE IF EXISTS `{$wpdb->prefix}hyoka_import`" );

            delete_option( 'hyoka_delete_data_on_uninstall' );
        }
    }
}
