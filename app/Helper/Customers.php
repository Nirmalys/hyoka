<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Helper;

use Hyoka\App\Model\Customer;
use Hyoka\App\Helper\Wp;

defined('ABSPATH') || exit;

class Customers
{
    /**
     * @param \WC_Order $order
     * @return int Number of new rows inserted.
     */
    public static function recordPurchase($order): int
    {
        if (!is_object($order) || !method_exists($order, 'get_items')) {
            return 0;
        }

        $order_id = (int) $order->get_id();
        $email = sanitize_email((string) $order->get_billing_email());
        if (empty($email) && method_exists($order, 'get_user')) {
            $user = $order->get_user();
            $email = $user ? sanitize_email($user->user_email) : '';
        }

        if (empty($email)) {
            return 0;
        }

        $first_name = sanitize_text_field((string) $order->get_billing_first_name());
        $last_name  = sanitize_text_field((string) $order->get_billing_last_name());
        $name = trim($first_name . ' ' . $last_name);
        if ($name === '') {
            $name = $first_name ?: 'Customer';
        }

        $customer_data = [
            'email' => $email,
            'name'  => $name,
        ];


        $purchase_date = current_time('mysql', true);

        $count = 0;
        foreach ($order->get_items('line_item') as $item) {
            if (!$item instanceof \WC_Order_Item_Product) {
                continue;
            }

            $variation_id = (int) $item->get_variation_id();
            $product_id   = (int) $item->get_product_id();
            $target_id    = $variation_id ?: $product_id;

            if ($target_id <= 0) {
                continue;
            }

            $product = function_exists('wc_get_product') ? wc_get_product($target_id) : null;

            $title = $product ? (string) $product->get_name() : (string) $item->get_name();
            if ($title === '') {
                $title = (string) get_the_title($target_id);
            }
            $image = '';
            if ($product) {
                $image_id = (int) $product->get_image_id();
                if ($image_id > 0) {
                    $raw = wp_get_attachment_image_url($image_id, 'thumbnail');
                    $image = $raw !== false ? (string) wp_unslash($raw) : '';
                }
            }
            if ($image === '') {
                $thumb_id = (int) get_post_thumbnail_id($target_id);
                if ($thumb_id > 0) {
                    $raw = wp_get_attachment_image_url($thumb_id, 'thumbnail');
                    $image = $raw !== false ? (string) wp_unslash($raw) : '';
                }
            }
            $link = esc_url_raw(wp_unslash((string) get_permalink($target_id)));

            $product_data = [
                'title' => $title,
                'image' => esc_url_raw(wp_unslash($image)),
                'link'  => $link,
            ];

            if (Customer::insertPurchase($order_id, $target_id, $product_data, $customer_data, $purchase_date)) {
                $count++;
            }
        }
        return $count;
    }


    /**
     * @param mixed $product_raw
     * @return array{title: string, image: string, link: string}
     */
    public static function parseProduct($product_raw): array
    {
        $decoded = Wp::decodeJsonColumn($product_raw, []);
        $title   = isset($decoded['title']) ? wp_unslash((string) $decoded['title']) : '';
        $image   = isset($decoded['image']) ? Customer::normalizeStoredUrl((string) $decoded['image']) : '';
        $link    = isset($decoded['link']) ? Customer::normalizeStoredUrl((string) $decoded['link']) : '';

        return [
            'title' => $title,
            'image' => $image !== '' ? esc_url_raw($image) : '',
            'link'  => $link !== '' ? esc_url_raw($link) : '',
        ];
    }

    /**
     * Decode the stored review JSON column.
     *
     * @param mixed $review_raw
     * @return array<string, mixed>
     */
    public static function parseReviewColumn($review_raw): array
    {
        return Wp::decodeJsonColumn($review_raw, []);
    }

    /**
     * Decode the stored customer JSON column into a normalized array.
     *
     * @param mixed $customer_raw
     * @return array{email: string, name: string}
     */
    public static function parseCustomer($customer_raw): array
    {
        $decoded = Wp::decodeJsonColumn($customer_raw, []);

        return [
            'email' => isset($decoded['email']) ? (string) $decoded['email'] : '',
            'name'  => isset($decoded['name']) ? (string) $decoded['name'] : '',
        ];
    }

    /**
     * Format DB rows for the admin UI.
     *
     * @param array{page?: int, per_page?: int, search?: string, send_source?: string, require_sent?: bool} $args
     * @return array{customers: array<int, array<string, mixed>>, total: int, page: int, per_page: int}
     */
    public static function getCustomersForAdmin(array $args): array
    {
        $list = Customer::getCustomerList($args);

        return [
            'customers' => array_map([self::class, 'formatCustomerRow'], $list['data']),
            'total'     => $list['total'],
            'page'      => $list['page'],
            'per_page'  => $list['per_page'],
            'pages'     => $list['pages'],
        ];
    }

    /**
     * @param array<string, mixed> $row Raw DB row from hka_customers.
     * @return array<string, mixed>
     */
    public static function formatCustomerRow(array $row): array
    {
        $product = self::parseProduct($row['product'] ?? '');
        $customer = self::parseCustomer($row['customer'] ?? '');
        $product_id = (int) ($row['product_id'] ?? 0);

        if ($product['title'] === '' && $product_id > 0) {
            $product['title'] = (string) get_the_title($product_id);
        }
        if ($product['image'] === '' && $product_id > 0) {
            $thumb_id = (int) get_post_thumbnail_id($product_id);
            if ($thumb_id > 0) {
                $raw = wp_get_attachment_image_url($thumb_id, 'thumbnail');
                $product['image'] = $raw !== false ? (string) wp_unslash($raw) : '';
            }
        }
        if ($product['link'] === '' && $product_id > 0) {
            $permalink = get_permalink($product_id);
            $product['link'] = $permalink !== false && $permalink !== null
                ? esc_url_raw(wp_unslash((string) $permalink))
                : '';
        }
        if ($product['link'] !== '' && ! preg_match('#^https?://#i', $product['link'])) {
            $product['link'] = esc_url_raw(wp_unslash(home_url($product['link'])));
        }

        $pending_meta = Customer::describePendingFollowup($row);

        $email_sent = ! empty($row['email_sent']);
        $reminder_sent = ! empty($row['reminder_sent']);
        $send_source = (string) ($row['email_send_source'] ?? '');

        if ($send_source === 'manual') {
            $email_type = 'Manual Request';
        } elseif ($reminder_sent && ! $email_sent) {
            $email_type = 'Reminder';
        } elseif ($reminder_sent) {
            $email_type = 'Reminder';
        } else {
            $email_type = 'Review Request';
        }

        return [
            'id'                => (int) ($row['id'] ?? 0),
            'order_id'          => (int) ($row['order_id'] ?? 0),
            'product_id'        => $product_id,
            'name'              => $customer['name'],
            'email'             => $customer['email'],
            'date'              => isset($row['purchase_date']) ? gmdate('M d, Y', strtotime((string) $row['purchase_date'] . ' UTC')) : '',
            'purchase_date'     => (string) ($row['purchase_date'] ?? ''),
            'email_sent'        => $email_sent,
            'email_sent_at'     => (string) ($row['email_sent_at'] ?? ''),
            'email_send_source' => $send_source,
            'reminder_sent'     => $reminder_sent,
            'reminder_sent_at'  => (string) ($row['reminder_sent_at'] ?? ''),
            'email_type'        => $email_type,
            'email_pending_label' => $pending_meta['label'],
            'email_pending_reason' => $pending_meta['reason'],
            'product'           => $product,
            'review'            => Customers::parseReviewColumn($row['review'] ?? null),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function getCustomerById(int $id): ?array
    {
        $row = Customer::getCustomerRow($id);
        if ($row === null) {
            return null;
        }
        return self::formatCustomerRow($row);
    }
}
