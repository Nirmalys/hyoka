<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\Woocommerce\Wooservicer;

use Hyoka\Woocommerce\Email\EmailSender;
use Hyoka\App\Helper\Customers;

defined('ABSPATH') || exit;

class Wooinit
{
    /**
     * Check if WooCommerce is active
     *
     * @return bool
     */
    public static function isActive(): bool
    {
        return class_exists('\WooCommerce') || defined('WC_VERSION');
    }

    /**
     * Initialize WooCommerce-related logic
     * Safe no-op if WooCommerce is not installed
     *
     * @return void
     */
    public static function init(): void
    {
        if (!self::isActive()) {
            return;
        }

        self::registerOrderEmailFilter();

        add_action('woocommerce_order_status_completed', [self::class, 'onOrderCompleted'], 10, 1);
    }

    /**
     * When review automation is on, suppress WooCommerce "completed order" emails.
     * Hyoka sends a review invitation instead (not a duplicate order receipt).
     *
     * @return void
     */
    private static function registerOrderEmailFilter(): void
    {
        add_filter('woocommerce_email_enabled_customer_completed_order', [self::class, 'filterCompletedOrderEmail'], 5, 2);
    }

    /**
     * @param bool  $is_enabled Whether WooCommerce would send this email.
     * @param mixed $object     Order or other context (unused).
     */
    public static function filterCompletedOrderEmail($is_enabled, $object = null)
    {
        unset($object);
        $settings = EmailSender::getSettings();
        if (empty($settings['automation_enabled'])) {
            return (bool) $is_enabled;
        }

        return false;
    }

    /**
     
     * @param int $order_id
     * @return void
     */
    public static function onOrderCompleted(int $order_id): void
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        Customers::recordPurchase($order);

        $settings = EmailSender::getSettings();
        if (! empty($settings['automation_enabled'])) {
            EmailSender::processAutomationIfEnabled();
        }
    }
}
