<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Model;

use Hyoka\App\Helper\Customers;
use Hyoka\App\Helper\Wp;
use Hyoka\Woocommerce\Email\EmailSender;

defined('ABSPATH') || exit;

class Customer
{
    /**
     * Fixed column list for full purchase-row reads (not user input).
     */
    public const CUSTOMER_COLUMNS = 'id, order_id, product_id, product, customer, purchase_date, email, created_at, updated_at, invite, review, audit';

    /**
     * Prefixed customer table name (plugin-owned identifier, not user input).
     */
    public static function getTableName(): string
    {
        global $wpdb;

        return $wpdb->prefix . 'hyoka_customer';
    }

    /**
     * $wpdb format strings for known customer columns.
     * Keep $int_cols in sync when adding integer columns to the customer schema.
     *
     * @param array<string, mixed> $data Column map.
     * @return array<int, string>
     */
    private static function columnFormats(array $data): array
    {
        $int_cols = ['order_id', 'product_id'];
        $formats  = [];
        foreach (array_keys($data) as $col) {
            $formats[] = in_array($col, $int_cols, true) ? '%d' : '%s';
        }

        return $formats;
    }

    /**
     * @param array<string, mixed> $row
     */
    public static function isCustomerOrderCompleted(array $row): bool
    {
        if (!function_exists('wc_get_order')) {
            return true;
        }

        $order_id = (int) ($row['order_id'] ?? 0);
        if ($order_id <= 0) {
            return false;
        }

        $order = wc_get_order($order_id);
        return $order && $order->get_status() === 'completed';
    }

    /**
     * @param array<string, mixed> $row
     * @return array{label: string, reason: string}
     */
    public static function describePendingFollowup(array $row): array
    {
        if (! empty($row['email_sent'])) {
            return ['label' => '', 'reason' => ''];
        }

        if (! self::isCustomerOrderCompleted($row)) {
            return [
                'label'  => __('Pending', 'hyoka'),
                'reason' => __('WooCommerce order is not Completed yet.', 'hyoka'),
            ];
        }

        $settings   = EmailSender::getSettings();
        $days_after = max(1, (int) ($settings['days_after'] ?? 7));
        $purchase   = (string) ($row['purchase_date'] ?? '');
        $purchase_ts = $purchase !== '' ? strtotime($purchase . ' UTC') : false;

        if ($purchase_ts === false) {
            return [
                'label'  => __('Pending', 'hyoka'),
                'reason' => empty($settings['automation_enabled'])
                    ? __('Automation is off.', 'hyoka')
                    : __('Waiting for automation to send.', 'hyoka'),
            ];
        }

        $due_ts = $purchase_ts + ($days_after * DAY_IN_SECONDS);
        $now    = time();

        if ($now < $due_ts) {
            return [
                'label'  => __('Scheduled', 'hyoka'),
                'reason' => sprintf(
                    /* translators: 1: formatted date, 2: number of days */
                    __('Sends on or after %1$s (%2$d days after purchase).', 'hyoka'),
                    gmdate('M j, Y', $due_ts),
                    $days_after
                ),
            ];
        }

        if (empty($settings['automation_enabled'])) {
            return [
                'label'  => __('Pending', 'hyoka'),
                'reason' => __('Turn on automation or send manually from Manual Request.', 'hyoka'),
            ];
        }

        if (empty($settings['review_request_schedule_enabled'])) {
            return [
                'label'  => __('Pending', 'hyoka'),
                'reason' => __('Scheduled review requests are off. Send manually from Manual Request.', 'hyoka'),
            ];
        }

        return [
            'label'  => __('Pending', 'hyoka'),
            'reason' => '',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function fetchCustomerRows(string $search, int $limit, int $offset): array
    {
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- Column list is a class constant; values are prepared.
        if ($search !== '') {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT ' . self::CUSTOMER_COLUMNS . '
                 FROM %i
                 WHERE (customer LIKE %s OR product LIKE %s OR order_id LIKE %s)
                 ORDER BY purchase_date DESC, id DESC
                 LIMIT %d OFFSET %d',
                    self::getTableName(),
                    $like,
                    $like,
                    $like,
                    $limit,
                    $offset
                ),
                ARRAY_A
            );
        } else {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT ' . self::CUSTOMER_COLUMNS . '
                 FROM %i
                 WHERE 1=1
                 ORDER BY purchase_date DESC, id DESC
                 LIMIT %d OFFSET %d',
                    self::getTableName(),
                    $limit,
                    $offset
                ),
                ARRAY_A
            );
        }
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared

        return is_array($rows) ? Meta::hydrateRowsWithEmail($rows) : [];
    }

    public static function normalizeStoredUrl(string $url): string
    {
        $url = wp_unslash($url);
        $url = str_replace('\\/', '/', $url);
        $url = str_replace('\\', '', $url);

        return trim($url);
    }

    public static function insertPurchase(int $order_id, int $product_id, array $product_data, array $customer_data, string $purchase_date): bool
    {
        global $wpdb;
        $now = current_time('mysql', true);

        $json_flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

        $raw_link  = isset($product_data['link']) ? (string) $product_data['link'] : '';
        $raw_image = isset($product_data['image']) ? (string) $product_data['image'] : '';
        $link_clean  = $raw_link !== '' ? esc_url_raw(self::normalizeStoredUrl($raw_link)) : '';
        $image_clean = $raw_image !== '' ? esc_url_raw(self::normalizeStoredUrl($raw_image)) : '';

        $product_json = wp_json_encode([
            'title' => wp_unslash(isset($product_data['title']) ? (string) $product_data['title'] : ''),
            'image' => $image_clean,
            'link'  => $link_clean,
        ], $json_flags);
        if ($product_json === false) {
            return false;
        }

        $customer_json = wp_json_encode([
            'email' => wp_unslash(isset($customer_data['email']) ? (string) $customer_data['email'] : ''),
            'name'  => wp_unslash(isset($customer_data['name']) ? (string) $customer_data['name'] : ''),
        ], $json_flags);
        if ($customer_json === false) {
            return false;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $result = $wpdb->query(
            $wpdb->prepare(
                'INSERT IGNORE INTO %i
                (order_id, product_id, product, customer, purchase_date, created_at)
             VALUES (%d, %d, %s, %s, %s, %s)',
                self::getTableName(),
                $order_id,
                $product_id,
                $product_json,
                $customer_json,
                $purchase_date,
                $now
            )
        );

        return $result !== false;
    }

    /**
     * @param array<string, mixed> $import_payload CSV metadata (type, source, etc.).
     * @return int Customer row ID, or 0 on failure.
     */
    public static function insertCsvImportRow(
        int $product_id,
        array $product_data,
        string $customer_name,
        string $customer_email,
        array $import_payload,
        string $purchase_date,
        string $review_json
    ): int {
        global $wpdb;

        $now   = current_time('mysql', true);
        $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

        $link  = isset($product_data['link']) ? esc_url_raw(self::normalizeStoredUrl((string) $product_data['link'])) : '';
        $image = isset($product_data['image']) ? esc_url_raw(self::normalizeStoredUrl((string) $product_data['image'])) : '';

        $product_json = wp_json_encode([
            'title' => wp_unslash((string) ($product_data['title'] ?? '')),
            'image' => $image,
            'link'  => $link,
        ], $flags);
        if ($product_json === false) {
            return 0;
        }

        $customer_json = wp_json_encode([
            'email' => sanitize_email($customer_email),
            'name'  => sanitize_text_field($customer_name),
        ], $flags);
        if ($customer_json === false) {
            return 0;
        }

        $audit_json = wp_json_encode(
            array_merge($import_payload, ['imported_at' => $now]),
            $flags
        );
        if ($audit_json === false) {
            return 0;
        }

        $data = [
            'order_id'       => 0,
            'product_id'     => absint($product_id),
            'product'        => $product_json,
            'customer'       => $customer_json,
            'purchase_date'  => $purchase_date,
            'review'         => $review_json,
            'audit'          => $audit_json,
            'email'          => Meta::encodeEmailJson([
                'email_sent'    => 1,
                'email_sent_at' => $now,
            ]),
            'created_at'     => $now,
            'updated_at'     => $now,
        ];

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $inserted = $wpdb->insert(
            self::getTableName(),
            $data,
            self::columnFormats($data)
        );

        if ($inserted === false) {
            return 0;
        }

        return (int) $wpdb->insert_id;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getCustomersDueForEmail(int $days_after, int $limit = 50): array
    {
        global $wpdb;

        $days_after = max(1, $days_after);
        $limit = max(1, $limit);

        $results = [];
        $last_id = 0;
        $batch = max(100, $limit * 4);

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        while (count($results) < $limit) {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT id, order_id, product_id, product, customer, purchase_date, email, review
                 FROM %i
                 WHERE id > %d
                   AND purchase_date <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL %d DAY)
                 ORDER BY id ASC
                 LIMIT %d',
                    self::getTableName(),
                    $last_id,
                    $days_after,
                    $batch
                ),
                ARRAY_A
            );

            if (!is_array($rows) || $rows === []) {
                break;
            }

            $max_id = $last_id;
            foreach ($rows as $row) {
                $rid = (int) ($row['id'] ?? 0);
                if ($rid > $max_id) {
                    $max_id = $rid;
                }
                $email_meta = Meta::parseEmailJson($row['email'] ?? '');
                if (! empty($email_meta['email_sent'])) {
                    continue;
                }
                if (! self::isCustomerOrderCompleted($row)) {
                    continue;
                }
                $results[] = Meta::hydrateRowWithEmail($row);
                if (count($results) >= $limit) {
                    break 2;
                }
            }

            if ($max_id <= $last_id) {
                break;
            }
            $last_id = $max_id;
            if (count($rows) < $batch) {
                break;
            }
        }
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        return $results;
    }

    /**
     * @param array<string, mixed> $row
     */
    public static function hasSubmittedReview(array $row): bool
    {
        $review_raw = $row['review'] ?? '';
        $decoded    = Customers::parseReviewColumn($review_raw);
        if (! empty($decoded['review_id'])) {
            return true;
        }
        if (is_string($review_raw) && trim($review_raw) !== '' && trim($review_raw) !== 'null') {
            if (trim($review_raw) !== '{}' && strlen(trim($review_raw)) > 2) {
                return true;
            }
        }

        $product_id = (int) ($row['product_id'] ?? 0);
        if ($product_id <= 0) {
            return false;
        }

        $decoded_customer = Customers::parseCustomer($row['customer'] ?? '');
        $email              = self::normalizeCustomerEmail($decoded_customer['email']);
        if ($email === '') {
            return false;
        }

        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $found = $wpdb->get_var(
            $wpdb->prepare(
                'SELECT id FROM %i WHERE product_id = %d AND email = %s AND email != %s LIMIT 1',
                Review::getTableName(),
                $product_id,
                $email,
                'widget_settings'
            )
        );

        return (int) $found > 0;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getCustomersDueForReminder(int $days_after_reminder, int $limit = 50): array
    {
        global $wpdb;

        $days_after_reminder = max(1, $days_after_reminder);
        $limit               = max(1, $limit);

        $results = [];
        $last_id = 0;
        $batch   = max(100, $limit * 4);

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        while (count($results) < $limit) {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT id, order_id, product_id, product, customer, purchase_date, email, review
                 FROM %i
                 WHERE id > %d
                 ORDER BY id ASC
                 LIMIT %d',
                    self::getTableName(),
                    $last_id,
                    $batch
                ),
                ARRAY_A
            );

            if (! is_array($rows) || $rows === []) {
                break;
            }

            $cutoff_ts = time() - ($days_after_reminder * DAY_IN_SECONDS);
            $max_id    = $last_id;
            foreach ($rows as $row) {
                $rid = (int) ($row['id'] ?? 0);
                if ($rid > $max_id) {
                    $max_id = $rid;
                }
                $email_meta = Meta::parseEmailJson($row['email'] ?? '');
                if (empty($email_meta['email_sent']) || ! empty($email_meta['reminder_sent'])) {
                    continue;
                }
                if ($email_meta['email_sent_at'] === '') {
                    continue;
                }
                $sent_ts = strtotime($email_meta['email_sent_at'] . ' UTC');
                if ($sent_ts === false || $sent_ts > $cutoff_ts) {
                    continue;
                }
                if (! self::isCustomerOrderCompleted($row)) {
                    continue;
                }
                if (self::hasSubmittedReview($row)) {
                    continue;
                }
                $results[] = Meta::hydrateRowWithEmail($row);
                if (count($results) >= $limit) {
                    break 2;
                }
            }

            if ($max_id <= $last_id) {
                break;
            }
            $last_id = $max_id;
            if (count($rows) < $batch) {
                break;
            }
        }
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        return $results;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function getCustomerRow(int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- Column list is a class constant; values are prepared.
        $row = $wpdb->get_row(
            $wpdb->prepare(
                'SELECT ' . self::CUSTOMER_COLUMNS . '
             FROM %i
             WHERE id = %d
             LIMIT 1',
                self::getTableName(),
                $id
            ),
            ARRAY_A
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared

        return is_array($row) ? Meta::hydrateRowWithEmail($row) : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getRowsByProductId(int $product_id): array
    {
        if ($product_id <= 0) {
            return [];
        }
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- Column list is a class constant; values are prepared.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                'SELECT ' . self::CUSTOMER_COLUMNS . '
             FROM %i
             WHERE product_id = %d
             ORDER BY id DESC',
                self::getTableName(),
                $product_id
            ),
            ARRAY_A
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared

        return is_array($rows) ? Meta::hydrateRowsWithEmail($rows) : [];
    }

    /**
     * @return int Number of rows updated.
     */
    public static function saveReviewForProductEmail(int $product_id, string $email, string $review_json): int
    {
        $product_id = absint($product_id);
        $email = self::normalizeCustomerEmail($email);
        if ($product_id <= 0 || $email === '') {
            return 0;
        }

        $rows = self::getRowsByProductId($product_id);
        $updated = 0;
        foreach ($rows as $row) {
            $decoded   = Customers::parseCustomer($row['customer'] ?? '');
            $row_email = self::normalizeCustomerEmail($decoded['email']);
            if ($row_email !== $email) {
                continue;
            }
            $row_id = (int) ($row['id'] ?? 0);
            if ($row_id <= 0) {
                continue;
            }
            if (self::saveReviewOnCustomer($row_id, $review_json)) {
                Meta::markInviteConsumed($row_id);
                ++$updated;
            }
        }

        return $updated;
    }

    /**
     * Store JSON in review column only (does not clear invite fields).
     */
    public static function saveReviewOnCustomer(int $row_id, string $review_json): bool
    {
        if ($row_id <= 0 || $review_json === '') {
            return false;
        }
        global $wpdb;
        $now = current_time('mysql', true);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $result = $wpdb->update(
            self::getTableName(),
            [
                'review'     => $review_json,
                'updated_at' => $now,
            ],
            ['id' => $row_id],
            self::columnFormats([
                'review'     => $review_json,
                'updated_at' => $now,
            ]),
            ['%d']
        );

        if ($result === false) {
            return false;
        }

        Meta::updateEmailMeta(
            $row_id,
            [
                'reminder_sent'    => 1,
                'reminder_sent_at' => $now,
            ]
        );

        return (int) $result > 0;
    }

    /**
     * @return string
     */
    public static function buildReviewJson(
        int $review_id,
        int $rating,
        string $title,
        string $content,
        string $author,
        string $email,
        string $source
    ): string {
        $payload = [
            'review_id'    => $review_id,
            'rating'       => $rating,
            'text'         => $content,
            'author'       => $author,
            'email'        => $email,
            'source'       => $source,
            'submitted_at' => current_time('mysql', true),
        ];
        if ($title !== '') {
            $payload['title'] = $title;
        }

        $json = wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($json) ? $json : '';
    }

    /**
     * @param array<string, mixed> $data Column => value.
     */
    public static function updateRow(int $id, array $data): bool
    {
        global $wpdb;

        $allowed = [
            'email',
            'updated_at',
            'invite',
            'review',
            'customer',
            'product',
            'audit',
        ];
        $data = array_intersect_key($data, array_flip($allowed));

        if ($data === []) {
            return false;
        }

        if (! isset($data['updated_at'])) {
            $data['updated_at'] = current_time('mysql', true);
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        return $wpdb->update(
            self::getTableName(),
            $data,
            ['id' => absint($id)],
            self::columnFormats($data),
            ['%d']
        ) !== false;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function parseAuditJson($audit_raw): array
    {
        return Wp::decodeJsonColumn($audit_raw, []);
    }

    /**
     * @param array<int, array<string, mixed>> $entries
     */
    public static function encodeAuditJson(array $entries): string
    {
        $json = wp_json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($json) ? $json : '';
    }

    /**
     * Find customer row ids for a product + buyer email (best-effort, based on customer JSON).
     *
     * @return int[]
     */
    public static function getCustomerRowIdsForProductEmail(int $product_id, string $email): array
    {
        $product_id = absint($product_id);
        $email      = self::normalizeCustomerEmail($email);
        if ($product_id <= 0 || $email === '') {
            return [];
        }

        global $wpdb;
        $like = '%"email":"' . $wpdb->esc_like($email) . '"%';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $rows = $wpdb->get_col(
            $wpdb->prepare(
                'SELECT id FROM %i WHERE product_id = %d AND customer LIKE %s ORDER BY id DESC LIMIT 50',
                self::getTableName(),
                $product_id,
                $like
            )
        );

        if (! is_array($rows)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('absint', $rows))));
    }

    private static function normalizeCustomerEmail(string $email): string
    {
        return strtolower(trim(sanitize_email($email)));
    }

    /**
     * Fallback: find customer row ids by buyer email only (across products).
     *
     * @return int[]
     */
    private static function findCustomerIdsByEmail(string $email, int $limit = 50): array
    {
        $email = self::normalizeCustomerEmail($email);
        if ($email === '') {
            return [];
        }

        $limit = max(1, min(200, absint($limit)));

        global $wpdb;
        $like = '%"email":"' . $wpdb->esc_like($email) . '"%';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $rows = $wpdb->get_col(
            $wpdb->prepare(
                'SELECT id FROM %i WHERE customer LIKE %s ORDER BY id DESC LIMIT %d',
                self::getTableName(),
                $like,
                $limit
            )
        );

        if (!is_array($rows)) {
            return [];
        }
        return array_values(array_unique(array_filter(array_map('absint', $rows))));
    }

    /**
     * Order and review totals for a buyer email (admin review drawer).
     *
     * @return array{orders_count: int, reviews_count: int}
     */
    public static function getCustomerSummaryByEmail(string $email): array
    {
        $email = self::normalizeCustomerEmail($email);
        if ($email === '') {
            return [
                'orders_count'  => 0,
                'reviews_count' => 0,
            ];
        }

        global $wpdb;
        $like          = '%"email":"' . $wpdb->esc_like($email) . '"%';
        $system_emails = Review::systemEmails();

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $orders_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                'SELECT COUNT(DISTINCT order_id) FROM %i WHERE customer LIKE %s',
                self::getTableName(),
                $like
            )
        );

        $reviews_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                'SELECT COUNT(*) FROM %i WHERE email = %s AND email NOT IN (%s, %s)',
                Review::getTableName(),
                $email,
                $system_emails[0],
                $system_emails[1]
            )
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        return [
            'orders_count'  => $orders_count,
            'reviews_count' => $reviews_count,
        ];
    }

    /**
     * Append a review-edit audit entry and (optionally) update the stored review snapshot.
     *
     * @param array<string, mixed> $entry
     */
    public static function appendAuditForReviewEdit(int $product_id, string $email, array $entry, ?string $new_title = null, ?string $new_text = null): int
    {
        $ids = self::getCustomerRowIdsForProductEmail($product_id, $email);
        if ($ids === []) {
            // Variable/parent product mismatch or missing purchase row; fallback to email-only.
            $ids = self::findCustomerIdsByEmail($email);
        }
        if ($ids === []) {
            return 0;
        }

        global $wpdb;
        $updated = 0;

        foreach ($ids as $id) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $row = $wpdb->get_row(
                $wpdb->prepare(
                    'SELECT audit, review FROM %i WHERE id = %d LIMIT 1',
                    self::getTableName(),
                    $id
                ),
                ARRAY_A
            );
            if (!is_array($row)) {
                continue;
            }

            $audit_entries = self::parseAuditJson($row['audit'] ?? '');
            $audit_entries[] = $entry;

            $audit_json = self::encodeAuditJson($audit_entries);
            if ($audit_json === '') {
                continue;
            }

            $patch = [
                'audit'      => $audit_json,
                'updated_at' => current_time('mysql', true),
            ];

            if ($new_title !== null || $new_text !== null) {
                $snapshot = Customers::parseReviewColumn($row['review'] ?? null);

                if (!isset($snapshot['review_id']) && isset($entry['review_id'])) {
                    $snapshot['review_id'] = (int) $entry['review_id'];
                }
                if ($new_title !== null) {
                    $snapshot['title'] = (string) $new_title;
                }
                if ($new_text !== null) {
                    $snapshot['text'] = (string) $new_text;
                }
                $snapshot['edited_at'] = (string) ($entry['edited_at'] ?? current_time('mysql', true));
                $snapshot['edited_by'] = (int) ($entry['admin_user_id'] ?? 0);

                $review_json = wp_json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($review_json === false) {
                    continue;
                }
                $patch['review'] = $review_json;
            }

            if (self::updateRow($id, $patch)) {
                $updated++;
            }
        }

        return $updated;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getAuditForReview(int $product_id, string $email, int $review_id): array
    {
        $review_id = absint($review_id);
        if ($review_id <= 0) {
            return [];
        }

        $ids = self::getCustomerRowIdsForProductEmail($product_id, $email);
        if ($ids === []) {
            $ids = self::findCustomerIdsByEmail($email);
        }
        if ($ids === []) {
            return [];
        }

        global $wpdb;

        $all = [];
        foreach ($ids as $id) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $raw = $wpdb->get_var($wpdb->prepare('SELECT audit FROM %i WHERE id = %d LIMIT 1', self::getTableName(), $id));
            $entries = self::parseAuditJson(is_string($raw) ? $raw : '');
            foreach ($entries as $e) {
                if (!is_array($e)) {
                    continue;
                }
                if ((int) ($e['review_id'] ?? 0) !== $review_id) {
                    continue;
                }
                $all[] = $e;
            }
        }

        usort($all, static function ($a, $b) {
            $ta = isset($a['edited_at']) ? strtotime((string) $a['edited_at'] . ' UTC') : 0;
            $tb = isset($b['edited_at']) ? strtotime((string) $b['edited_at'] . ' UTC') : 0;
            return $tb <=> $ta;
        });

        return $all;
    }

    /**
     * Paginated purchased rows (raw DB rows, completed orders only).
     *
     * @param array{page?: int, per_page?: int, search?: string} $args
     * @return array{data: array, total: int, page: int, per_page: int, pages: int}
     */
    /**
     * @param array<string, mixed> $filters
     */
    private static function rowMatchesCustomerListFilters(array $row, array $filters): bool
    {
        if (! self::isCustomerOrderCompleted($row)) {
            return false;
        }

        $send_source = (string) ($filters['send_source'] ?? '');
        if ($send_source !== '' && (string) ($row['email_send_source'] ?? '') !== $send_source) {
            return false;
        }

        if (! empty($filters['require_sent']) && empty($row['email_sent'])) {
            return false;
        }

        return true;
    }

    public static function getCustomerList(array $args = []): array
    {
        $page     = max(1, (int) ($args['page'] ?? 1));
        $per_page = max(1, (int) ($args['per_page'] ?? 10));
        $search   = (string) ($args['search'] ?? '');
        $filters  = [];

        if (isset($args['send_source']) && (string) $args['send_source'] !== '') {
            $filters['send_source'] = (string) $args['send_source'];
        }
        if (! empty($args['require_sent'])) {
            $filters['require_sent'] = true;
        }

        $rows  = self::getCustomerPage($page, $per_page, $search, $filters);
        $total = self::countCustomers($search, $filters);

        return [
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int) ceil($total / $per_page),
        ];
    }

    /**
     * List purchased customers for the admin Email Details tab.
     */
  /**
     * @param array<string, mixed> $filters
     */
    public static function getCustomerPage(int $page = 1, int $per_page = 10, string $search = '', array $filters = []): array
    {
        $page = max(1, $page);
        $per_page = max(1, $per_page);
        $skip = ($page - 1) * $per_page;
        $need = $skip + $per_page;

        $matched = [];
        $db_offset = 0;
        $batch = 50;

        while (count($matched) < $need) {
            $rows = self::fetchCustomerRows($search, $batch, $db_offset);
            if ($rows === []) {
                break;
            }
            foreach ($rows as $row) {
                if (self::rowMatchesCustomerListFilters($row, $filters)) {
                    $matched[] = $row;
                }
            }
            $db_offset += $batch;
            if (count($rows) < $batch) {
                break;
            }
        }

        return array_slice($matched, $skip, $per_page);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public static function countCustomers(string $search = '', array $filters = []): int
    {
        $total = 0;
        $db_offset = 0;
        $batch = 100;

        while (true) {
            $rows = self::fetchCustomerRows($search, $batch, $db_offset);
            if ($rows === []) {
                break;
            }
            foreach ($rows as $row) {
                if (self::rowMatchesCustomerListFilters($row, $filters)) {
                    ++$total;
                }
            }
            $db_offset += $batch;
            if (count($rows) < $batch) {
                break;
            }
        }

        return $total;
    }
}
