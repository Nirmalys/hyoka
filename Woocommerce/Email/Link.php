<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\Woocommerce\Email;

use Hyoka\App\Helper\Customers;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\Meta;

defined('ABSPATH') || exit;

class Link
{
    public const QUERY_ARG = 'hyoka_invite';

    public const DEFAULT_EXPIRY_DAYS = 30;

    /**
     * New unpredictable token (store only a hash in the database).
     */
    public static function createInviteToken(): string
    {
        try {
            return bin2hex(random_bytes(32));
        } catch (\Throwable $e) {
            return wp_generate_password(64, true, true);
        }
    }

    public static function hashInviteToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    public static function buildInviteUrl(string $plain_token, string $base_url = ''): string
    {
        $plain_token = trim($plain_token);
        if ($plain_token === '') {
            return '';
        }

        $base = $base_url !== '' ? $base_url : home_url('/');

        return esc_url_raw(
            add_query_arg(self::QUERY_ARG, $plain_token, $base)
        );
    }

    /**
     * Invite URL for a purchase row (product page when possible).
     */
    private static function inviteBaseUrlForCustomerRow(array $row): string
    {
        $product_id = absint($row['product_id'] ?? 0);
        if ($product_id > 0) {
            if (function_exists('wc_get_product')) {
                $wc_product = wc_get_product($product_id);
                if ($wc_product) {
                    $permalink = $wc_product->get_permalink();
                    if (is_string($permalink) && $permalink !== '') {
                        return esc_url_raw($permalink);
                    }
                }
            }

            $permalink = get_permalink($product_id);
            if (is_string($permalink) && $permalink !== '') {
                return esc_url_raw($permalink);
            }
        }

        $product = Customers::parseProduct($row['product'] ?? '');
        if ($product['link'] !== '') {
            return esc_url_raw($product['link']);
        }

        return esc_url_raw(home_url('/'));
    }

    /**
     * Best link for leaving or viewing a review: invite token URL, else product page.
     */
    public static function resolveReviewUrl(int $product_id, string $email = ''): string
    {
        $product_id = absint($product_id);
        $email      = sanitize_email($email);

        if ($product_id > 0 && $email !== '' && is_email($email)) {
            $ids = Customer::getCustomerRowIdsForProductEmail($product_id, $email);
            foreach ($ids as $customer_row_id) {
                $invite = self::getOrCreateInviteForCustomer($customer_row_id);
                if ($invite !== null && ! empty($invite['url'])) {
                    return (string) $invite['url'];
                }
            }
        }

        if ($product_id > 0) {
            $permalink = get_permalink($product_id);
            if (is_string($permalink) && $permalink !== '') {
                return esc_url_raw($permalink);
            }
        }

        return esc_url_raw(home_url('/'));
    }

    /**
     * Sanitize a raw invite token value (from a query arg or request bag).
     *
     * @param mixed $value
     */
    public static function sanitizeInviteToken($value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $raw = sanitize_text_field(wp_unslash((string) $value));
        $raw = trim(rawurldecode($raw));
        if ($raw === '' || strlen($raw) < 32) {
            return null;
        }

        return $raw;
    }

    /**
     * Read invite token from a query array (typically wp_unslash( $_GET )).
     *
     * This is not a form submission or CSRF-protected action. The unguessable
     * invite token is the authorization (same pattern as password-reset or
     * WooCommerce order-pay links). Validation happens via getInviteStatus() /
     * getInviteByToken(): SHA-256 hash lookup, expiry, single-use, and customer
     * row resolution. WordPress form nonces are intentionally not used — invite
     * links live ~30 days and recipients are typically logged out.
     *
     * Pass the query bag from ReviewInvite::renderInvitePage() so this helper
     * never touches $_GET. Mutating review submission is protected separately
     * with hyoka_nonce (AJAX) or wp_rest (REST).
     *
     * @param array<string, mixed> $query Unslashed query args from the invite URL.
     */
    public static function getInviteFromRequest(array $query = []): ?string
    {
        if (! isset($query[self::QUERY_ARG]) || ! is_scalar($query[self::QUERY_ARG])) {
            return null;
        }

        return self::sanitizeInviteToken($query[self::QUERY_ARG]);
    }

    /**
     * @return array{plain: string, url: string, customer_row_id: int}|null
     */
    public static function createInviteForCustomer(int $customer_row_id): ?array
    {
        if ($customer_row_id <= 0) {
            return null;
        }

        $plain = self::createInviteToken();
        $hash  = self::hashInviteToken($plain);

        $expires = gmdate('Y-m-d H:i:s', time() + (self::DEFAULT_EXPIRY_DAYS * DAY_IN_SECONDS));

        if (! Meta::saveInviteOnCustomer($customer_row_id, $hash, $expires, $plain)) {
            return null;
        }

        $row = Customer::getCustomerRow($customer_row_id);
        $base = is_array($row) ? self::inviteBaseUrlForCustomerRow($row) : home_url('/');
        $url  = self::buildInviteUrl($plain, $base);
        if ($url === '') {
            return null;
        }

        return [
            'plain'           => $plain,
            'url'             => $url,
            'customer_row_id' => $customer_row_id,
        ];
    }

    /**
     * Issue a fresh invite token for an outbound email (invalidates any previous link for this row).
     *
     * @return array{plain: string, url: string, customer_row_id: int}|null
     */
    public static function refreshInviteForCustomer(int $customer_row_id): ?array
    {
        if ($customer_row_id <= 0) {
            return null;
        }

        $row = Customer::getCustomerRow($customer_row_id);
        if ($row !== null && Customer::hasSubmittedReview($row)) {
            return null;
        }

        return self::createInviteForCustomer($customer_row_id);
    }

    /**
     * Reuse a valid invite link when resolving URLs; create only if missing or expired.
     *
     * @return array{plain: string, url: string, customer_row_id: int}|null
     */
    public static function getOrCreateInviteForCustomer(int $customer_row_id): ?array
    {
        if ($customer_row_id <= 0) {
            return null;
        }

        $row = Customer::getCustomerRow($customer_row_id);
        if ($row === null) {
            return self::createInviteForCustomer($customer_row_id);
        }

        if (Customer::hasSubmittedReview($row)) {
            return null;
        }

        $inv = Meta::parseInviteJson($row['invite'] ?? '');
        $now = gmdate('Y-m-d H:i:s');
        if (
            $inv['consumed_at'] === ''
            && $inv['expires_at'] !== ''
            && $inv['expires_at'] > $now
            && $inv['invite_plain'] !== ''
        ) {
            $url = self::buildInviteUrl($inv['invite_plain'], self::inviteBaseUrlForCustomerRow($row));
            if ($url !== '') {
                return [
                    'plain'           => $inv['invite_plain'],
                    'url'             => $url,
                    'customer_row_id' => $customer_row_id,
                ];
            }
        }

        return self::createInviteForCustomer($customer_row_id);
    }

    /**
     * Invite token state for the current request.
     *
     * @return 'valid'|'expired'|'consumed'|'invalid'
     */
    public static function getInviteStatus(?string $plain): string
    {
        if ($plain === null || $plain === '') {
            return 'invalid';
        }

        $hash = self::hashInviteToken($plain);
        $row  = Meta::getCustomerRowByInviteHash($hash);
        if ($row === null) {
            $row = Meta::getCustomerRowByInvitePlain($plain);
        }
        if ($row === null) {
            return 'invalid';
        }

        if (! Customer::isCustomerOrderCompleted($row)) {
            return 'invalid';
        }

        if (Customer::hasSubmittedReview($row)) {
            $row_id = (int) ($row['id'] ?? 0);
            if ($row_id > 0) {
                Meta::markInviteConsumed($row_id);
            }
            return 'consumed';
        }

        $inv = Meta::parseInviteJson($row['invite'] ?? '');
        if ($inv['consumed_at'] !== '') {
            return 'consumed';
        }

        $now = gmdate('Y-m-d H:i:s');
        if ($inv['expires_at'] === '' || $inv['expires_at'] <= $now) {
            return 'expired';
        }

        return 'valid';
    }

    /**
     * User-facing message when an invite link cannot be used.
     */
    public static function inviteStatusMessage(string $status): string
    {
        switch ($status) {
            case 'expired':
                return sprintf(
                    /* translators: %d: number of days invite links stay valid */
                    __('This review link has expired. Review links are valid for %d days from when the email was sent.', 'hyoka-product-reviews'),
                    self::DEFAULT_EXPIRY_DAYS
                );
            case 'consumed':
                return __('This review link has already been used.', 'hyoka-product-reviews');
            case 'valid':
                return '';
            default:
                return __('This review link is invalid.', 'hyoka-product-reviews');
        }
    }

    /**
     * @return array{row: array<string, mixed>}|null
     */
    public static function getInviteByToken(?string $plain): ?array
    {
        if (self::getInviteStatus($plain) !== 'valid') {
            return null;
        }

        $hash = self::hashInviteToken((string) $plain);
        $row  = Meta::getCustomerByInviteHash($hash);
        if ($row === null) {
            return null;
        }

        return ['row' => $row];
    }
}
