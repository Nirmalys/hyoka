<?php

/**
 * Plugin Name:       Hyoka
 * Plugin URI:        https://ysinnovations.com/our-products/hyoka
 * Description:       Product reviews & ratings for WooCommerce — collect, moderate, and showcase reviews and UGC.
 * Version:           1.0.0
 * Requires at least: 5.3
 * Requires PHP:      7.4
 * Requires Plugins:  woocommerce
 * Author:            YS Innovations
 * Author URI:        https://ysinnovations.com
 * Text Domain:       hyoka-product-reviews
 * Domain Path:       /languages
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

defined('ABSPATH') || exit;

define('HYOKA_PLUGIN_FILE', __FILE__);
define('HYOKA_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('HYOKA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HYOKA_PLUGIN_NAME', 'Hyoka');
define('HYOKA_PLUGIN_SLUG', 'hyoka-product-reviews');
define('HYOKA_TEXT_DOMAIN', 'hyoka-product-reviews');
define('HYOKA_VERSION', '1.0.0');
define('HYOKA_REQUIREMENTS', [
    'php' => ">=7.4",
    'wordpress' => ">=5.3",
]);

if (file_exists(HYOKA_PLUGIN_PATH . 'vendor/autoload.php')) {
    require HYOKA_PLUGIN_PATH . 'vendor/autoload.php';
} else {
    wp_die('Hyoka is missing the autoloader file.');
}

if (class_exists('\Hyoka\App\Boot')) {
    \Hyoka\App\Boot::init();
} else {
    wp_die('Hyoka is unable to find the Boot class.');
}

