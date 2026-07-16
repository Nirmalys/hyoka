<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\View;

use Hyoka\App\Helper\Assets;
use Hyoka\Woocommerce\Email\EmailSender;

defined('ABSPATH') || exit;

class Page
{
    /**
     * Initialize admin page hooks.
     * 
     * @since 1.0.0
     * @return void
     */
    public static function init()
    {
        add_action('admin_menu', [self::class, 'addMenu']);

        add_action('admin_init', function () {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            if (isset($_GET['page']) && sanitize_text_field(wp_unslash($_GET['page'])) === HYOKA_PLUGIN_SLUG) {
                self::pageInit();
            }
        }, 1000);

        add_action('admin_enqueue_scripts', [self::class, 'enqueueAssets']);
    }

    /**
     * Add hyoka menu and submenus.
     * 
     * @since 1.0.0
     * @return void
     */
    public static function addMenu()
    {
        add_menu_page(
            esc_html(HYOKA_PLUGIN_NAME),
            esc_html(HYOKA_PLUGIN_NAME),
            'manage_options',
            HYOKA_PLUGIN_SLUG,
            [self::class, 'renderPage'],
            'data:image/svg+xml;base64,' . base64_encode(file_get_contents(HYOKA_PLUGIN_PATH . 'assets/menu-icon.svg'))
        );
    }

    /**
     * Render the selected admin page.
     * 
     * @since 1.0.0
     * @return void
     */
    public static function renderPage()
    {
        echo '<div class="wrap">';
        echo '<div id="HYOKA-admin-content" class="HYOKA-admin">';
        echo '<div id="HYOKA-root" class="HYOKA-root" style="max-height:80vh;" data-page="dashboard"></div>';
        echo '</div></div>';
    }

    /**
     * Page init.
     */
    public static function pageInit()
    {
        add_action('admin_notices', function () {
            remove_all_actions('admin_notices');
            remove_all_actions('all_admin_notices');
        }, 1);

        add_filter('admin_footer_text', '__return_empty_string', 1000);
        add_filter('update_footer', '__return_empty_string', 1000);

        add_action('admin_head', function () {
            $screen = get_current_screen();
            if ($screen) {
                $screen->remove_help_tabs();
            }
        });
        add_filter('screen_options_show_screen', '__return_false');
    }


    /**
     * Enqueue assets.
     * 
     * @param string $hook The current admin page hook.
     */
    public static function enqueueAssets($hook)
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (!isset($_GET['page']) || sanitize_text_field(wp_unslash($_GET['page'])) !== HYOKA_PLUGIN_SLUG) {
            return;
        }

        Assets::enqueueAdminApp(self::getBundleFile(), self::getLocalizationData());
    }

    /**
     * Get the main bundle filename from dist.
     */
    private static function getBundleFile(): string
    {
        $dist_path = HYOKA_PLUGIN_PATH . 'admin-ui/dist/';
        $files = glob($dist_path . 'bundle.*.js');
        if ($files && isset($files[0])) {
            return basename($files[0]);
        }

        return 'bundle.js';
    }

    /**
     * Get page data.
     */
    private static function getLocalizationData(): array
    {
        $settings = EmailSender::getSettings();

        return [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'distUrl' => HYOKA_PLUGIN_URL . 'admin-ui/dist/',
            'assetsUrl' => HYOKA_PLUGIN_URL . 'assets/',
            'nonce' => wp_create_nonce('hyoka_nonce'),
            'pluginUrl' => HYOKA_PLUGIN_URL,
            'version' => HYOKA_VERSION,
            'mediaUploadNonce' => wp_create_nonce('media-form'),
            'reviewsPerPage' => max(1, min(100, (int) ($settings['reviews_per_page'] ?? 10))),
            'showVerifiedPurchaseBadge' => ! empty($settings['show_verified_purchase_badge']),
            'showAuditLogDetails' => ! empty($settings['show_audit_log_details']),
            'adminNotificationsEnabled' => ! empty($settings['admin_notifications_enabled']),
            'currentUserName' => wp_get_current_user()->display_name,
        ];
    }
}
