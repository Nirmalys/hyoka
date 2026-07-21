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

use Hyoka\Woocommerce\Email\EmailService;

defined('ABSPATH') || exit;

class Review
{
    protected $hyoka_reviews_table;

    /** @var array<string, string> Request-scoped prepared WHERE SQL (avoids duplicate search lookups). */
    private static $prepared_where_cache = [];

    /** @var array<string, int[]> Request-scoped product IDs matched by search term. */
    private static $search_product_ids_cache = [];

    /**
     * Clear request-scoped memoization (PHP-FPM ends the request automatically;
     * call this between jobs in long-running CLI / workers if needed).
     */
    public static function clearRequestCaches(): void
    {
        self::$prepared_where_cache      = [];
        self::$search_product_ids_cache = [];
    }

    public function __construct()
    {
        $this->hyoka_reviews_table = self::getTableName();
    }

    /**
     * Prefixed reviews table name (plugin-owned identifier, not user input).
     */
    public static function getTableName(): string
    {
        global $wpdb;

        return $wpdb->prefix . 'hyoka_reviews';
    }

    /**
     * $wpdb format strings for known review columns.
     * Keep $int_cols in sync when adding integer columns to the reviews schema.
     *
     * @param array<string, mixed> $data Column map.
     * @return array<int, string>
     */
    private function columnFormats(array $data): array
    {
        $int_cols = ['product_id', 'rating', 'likes', 'is_verified'];
        $formats  = [];
        foreach (array_keys($data) as $col) {
            $formats[] = in_array($col, $int_cols, true) ? '%d' : '%s';
        }

        return $formats;
    }

    /**
     * Insert row; enriches timestamps when missing.
     *
     * @param array<string, mixed> $data Column map for $wpdb->insert.
     * @return int|false Insert ID or false.
     */
    public function create(array $data)
    {
        global $wpdb;

        $now = current_time('mysql', true);
        if (! isset($data['created_at'])) {
            $data['created_at'] = $now;
        }
        if (! isset($data['updated_at'])) {
            $data['updated_at'] = $now;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Direct $wpdb->insert() into the plugin-owned custom table; no WordPress API equivalent.
        $result = $wpdb->insert($this->hyoka_reviews_table, $data, $this->columnFormats($data));
        if ($result === false) {
            return false;
        }

        Reviewing::clearReviewCache(absint($data['product_id'] ?? 0));

        return (int) $wpdb->insert_id;
    }

    public function findById(int $id): ?array
    {
        global $wpdb;

        $table = self::getTableName();
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d",
                absint($id)
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return is_array($row) ? $row : null;
    }

    /**
     * Special meta rows (plugin_settings, etc.) keyed by email column.
     */
    public function findSettingsByEmail(string $email_key): ?array
    {
        global $wpdb;

        $email_key = sanitize_text_field($email_key);
        $cache_key = 'HYOKA_meta_' . md5($email_key);
        $cached    = wp_cache_get($cache_key, 'HYOKA_reviews_v2');
        if ($cached === 'none') {
            return null;
        }
        if (is_array($cached)) {
            return $cached;
        }

        $table = self::getTableName();
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE product_id = %d AND email = %s",
                0,
                $email_key
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (! is_array($row)) {
            wp_cache_set($cache_key, 'none', 'HYOKA_reviews_v2', 5 * MINUTE_IN_SECONDS);

            return null;
        }

        wp_cache_set($cache_key, $row, 'HYOKA_reviews_v2', HOUR_IN_SECONDS);

        return $row;
    }

    /**
     * Drop cached settings/meta row for an email key.
     */
    private static function clearSettingsEmailCache(string $email_key): void
    {
        wp_cache_delete('HYOKA_meta_' . md5(sanitize_text_field($email_key)), 'HYOKA_reviews_v2');
    }

    /**
     * @param array<string, mixed> $data Columns to write on update.
     * @param array<string, mixed> $insert_defaults Used only when inserting a new meta row.
     */
    public function saveSettingsByEmail(string $email_key, array $data, array $insert_defaults = []): bool
    {
        global $wpdb;

        $existing = $this->findSettingsByEmail($email_key);
        if ($existing !== null) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $success = $wpdb->update(
                $this->hyoka_reviews_table,
                $data,
                ['id' => absint($existing['id'])],
                $this->columnFormats($data),
                ['%d']
            ) !== false;

            if ($success) {
                self::clearSettingsEmailCache($email_key);
                Reviewing::clearReviewCache();
            }

            return $success;
        }

        $row = array_merge($insert_defaults, $data, [
            'email'      => $email_key,
            'created_at' => current_time('mysql', true),
        ]);

        $success = $this->create($row) !== false;
        if ($success) {
            self::clearSettingsEmailCache($email_key);
            Reviewing::clearReviewCache();
        }

        return $success;
    }

    public function countMany(array $args = []): int
    {
        global $wpdb;

        $where = $this->buildPreparedWhereSql($args);
        $table = self::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- $table from getTableName(); $where is assembled only from $wpdb->prepare() fragments (no raw user SQL).
        $count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} WHERE {$where}"
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        return $count;
    }

    public function getCountsByStatus(string $view = ''): array
    {
        global $wpdb;
        $emails = self::systemEmails();
        $table  = self::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); system emails and fixed scope params are bound via $wpdb->prepare(); variadic replacements are safe (PHPCS cannot count them); custom tables require direct database queries.
        if ($view === 'questions') {
            $results = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT status, COUNT(*) as count FROM {$table} WHERE email NOT IN (%s, %s) AND question != %s AND (reply IS NULL OR reply = %s) GROUP BY status",
                    $emails[0],
                    $emails[1],
                    '',
                    ''
                ),
                ARRAY_A
            );
        } elseif ($view === 'store_reviews') {
            $results = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT status, COUNT(*) as count FROM {$table} WHERE email NOT IN (%s, %s) AND (COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s)) GROUP BY status",
                    ...array_merge($emails, self::SQL_STORE_REVIEWS_PARAMS)
                ),
                ARRAY_A
            );
        } elseif ($view === 'replies') {
            $results = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT status, COUNT(*) as count FROM {$table} WHERE email NOT IN (%s, %s) AND reply != %s AND ((COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s)) OR question != %s) GROUP BY status",
                    ...array_merge($emails, self::storeRepliesScopeParams())
                ),
                ARRAY_A
            );
        } else {
            $results = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT status, COUNT(*) as count FROM {$table} WHERE email NOT IN (%s, %s) AND product_id > %d AND (question IS NULL OR question = %s) GROUP BY status",
                    ...array_merge($emails, self::SQL_PRODUCT_REVIEWS_PARAMS)
                ),
                ARRAY_A
            );
        }

        $counts = [
            'All'            => 0,
            'Pending'        => 0,
            'Approved'       => 0,
            'Rejected'       => 0,
            'Spam'           => 0,
            'ProductReviews' => 0,
            'Questions'      => (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE email NOT IN (%s, %s) AND question != %s AND (reply IS NULL OR reply = %s)",
                    $emails[0],
                    $emails[1],
                    '',
                    ''
                )
            ),
            'StoreReviews'   => (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE email NOT IN (%s, %s) AND (COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s))",
                    ...array_merge($emails, self::SQL_STORE_REVIEWS_PARAMS)
                )
            ),
            'StoreReplies'   => (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE email NOT IN (%s, %s) AND reply != %s AND ((COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s)) OR question != %s)",
                    ...array_merge($emails, self::storeRepliesScopeParams())
                )
            ),
        ];
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $total = 0;
        if (is_array($results)) {
            foreach ($results as $row) {
                $status = ucfirst($row['status']);
                if (isset($counts[$status])) {
                    $counts[$status] = (int) $row['count'];
                }
                $total += (int) $row['count'];
            }
        }
        $counts['All']            = $total;
        $counts['ProductReviews'] = $total;

        return $counts;
    }

    /**
     * Paginated list + total (admin and services).
     *
     * @param array<string, mixed> $args Filters: status, page, per_page, search, view, etc.
     * @return array{data: array, total: int, page: int, per_page: int, pages: int, counts: array}
     */
    public function getFilteredList(array $args = []): array
    {
        $defaults = [
            'status'   => '',
            'page'     => 1,
            'per_page' => 10,
            'search'   => '',
            'view'     => '',
        ];
        $args     = wp_parse_args($args, $defaults);
        $per_page = max(1, absint($args['per_page']));
        $page     = max(1, absint($args['page']));

        $list_args           = $args;
        $list_args['page']     = $page;
        $list_args['per_page'] = $per_page;

        $rows  = $this->findMany($list_args);
        $total = $this->countMany($args);

        return [
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int) ceil($total / $per_page),
            'counts'   => $this->getCountsByStatus((string) ($args['view'] ?? '')),
        ];
    }

    /**
     * @param array<string, mixed> $args
     * @return array<int, array<string, mixed>>
     */
    public function findMany(array $args = []): array
    {
        global $wpdb;

        $defaults = [
            'status'     => '',
            'product_id' => 0,
            'per_page'   => 20,
            'page'       => 1,
            'rating'     => 0,
            'orderby'    => 'created_at',
            'order'      => 'DESC',
        ];
        $args = wp_parse_args($args, $defaults);

        $where    = $this->buildPreparedWhereSql($args);
        $per_page = max(1, absint($args['per_page'] ?? 20));
        $offset   = max(0, (absint($args['page']) - 1) * $per_page);

        $allowed_orderby = [
            'created_at' => 'created_at',
            'rating'     => 'rating',
            'author'     => 'author',
            'likes'      => 'likes',
        ];
        $orderby_key = sanitize_key((string) $args['orderby']);
        $orderby     = $allowed_orderby[$orderby_key] ?? 'created_at';
        $order       = strtoupper((string) $args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $table = self::getTableName();

        // Prepare LIMIT/OFFSET alone so a second prepare() cannot re-parse % in LIKE literals
        // already embedded in $where by buildPreparedWhereSql().
        $limit_sql = $wpdb->prepare('LIMIT %d OFFSET %d', $per_page, $offset);

        // $where is already fully prepared (values embedded via $wpdb->prepare per clause).
        // ORDER BY uses an allowlisted identifier. LIMIT/OFFSET come from prepare() above.
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- $table from getTableName(); $where from buildPreparedWhereSql(); $orderby/$order are allowlisted; $limit_sql from $wpdb->prepare().
        $rows = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE {$where} ORDER BY {$orderby} {$order} {$limit_sql}",
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        return is_array($rows) ? $rows : [];
    }

    public function incrementLikes(int $id): bool
    {
        global $wpdb;

        $id    = absint($id);
        $table = self::getTableName();

        // One query: bump likes and capture product_id via LAST_INSERT_ID(expr) for cache clear.
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $result = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$table}
                SET likes = COALESCE(likes, 0) + 1,
                    product_id = LAST_INSERT_ID(product_id)
                WHERE id = %d",
                $id
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if ($result === false || (int) $result <= 0) {
            return false;
        }

        Reviewing::clearReviewCache(absint($wpdb->insert_id));

        return true;
    }

    /**
     * @param array<string, mixed> $data Whitelisted columns only.
     */
    public function update(int $id, array $data): bool
    {
        global $wpdb;

        $allowed = [
            'product_id',
            'rating',
            'title',
            'content',
            'author',
            'email',
            'status',
            'is_verified',
            'media',
            'reply',
            'question',
            'likes',
            'settings',
            'updated_at',
            'created_at',
            'store_review',
        ];
        $data = array_intersect_key($data, array_flip($allowed));

        if ($data === []) {
            return false;
        }

        $id          = absint($id);
        $existing    = $this->findById($id);
        $old_product = is_array($existing) ? absint($existing['product_id'] ?? 0) : 0;

        $data['updated_at'] = $data['updated_at'] ?? current_time('mysql', true);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $result = $wpdb->update(
            $this->hyoka_reviews_table,
            $data,
            ['id' => $id],
            $this->columnFormats($data),
            ['%d']
        );

        if ($result === false) {
            return false;
        }

        $new_product = isset($data['product_id']) ? absint($data['product_id']) : $old_product;
        Reviewing::clearReviewCache($new_product);
        if ($old_product > 0 && $old_product !== $new_product) {
            Reviewing::clearReviewCache($old_product);
        }

        return true;
    }

    public function delete(int $id): bool
    {
        global $wpdb;

        $id  = absint($id);
        $row = $this->findById($id);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $result = $wpdb->delete($this->hyoka_reviews_table, ['id' => $id], ['%d']);
        if ($result === false) {
            return false;
        }

        if (is_array($row)) {
            Reviewing::clearReviewCache(absint($row['product_id'] ?? 0));
        } else {
            Reviewing::clearReviewCache();
        }

        return true;
    }

    public const WIDGET_SETTINGS_EMAIL = 'widget_settings';

    private const PLUGIN_SETTINGS_EMAIL = 'plugin_settings';

    /** @var array<int, mixed> */
    private const SQL_PRODUCT_REVIEWS_PARAMS = [0, ''];

    /** @var array<int, mixed> */
    private const SQL_STORE_REVIEWS_PARAMS = ['', '', 0, '', ''];

    /**
     * @return array<int, mixed>
     */
    private static function storeRepliesScopeParams(): array
    {
        return array_merge([''], self::SQL_STORE_REVIEWS_PARAMS, ['']);
    }

    /**
     * @return array<int, string>
     */
    public static function systemEmails(): array
    {
        return [self::WIDGET_SETTINGS_EMAIL, self::PLUGIN_SETTINGS_EMAIL];
    }

    public static function isSystemEmail(string $email): bool
    {
        return in_array($email, self::systemEmails(), true);
    }

    /**
     * @return array<string, mixed>
     */
    public static function parseSettingsColumn(string $raw): array
    {
        $raw = trim($raw);
        if ($raw === '' || $raw === 'null') {
            return [];
        }
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param array<string, mixed> $row
     * @return array{text: string, title: string, author: string}
     */
    public static function decodeReviewContent(array $row): array
    {
        $content = trim((string) ($row['content'] ?? ''));
        if ($content === '') {
            return [
                'text'   => '',
                'title'  => '',
                'author' => '',
            ];
        }

        if (strpos($content, '{') === false) {
            return [
                'text'   => $content,
                'title'  => '',
                'author' => '',
            ];
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            return [
                'text'   => $content,
                'title'  => '',
                'author' => '',
            ];
        }

        return [
            'text'   => isset($decoded['text']) ? (string) $decoded['text'] : '',
            'title'  => isset($decoded['title']) ? (string) $decoded['title'] : '',
            'author' => isset($decoded['author']) ? (string) $decoded['author'] : '',
        ];
    }

    public static function normalizeStatus(string $status): string
    {
        $status  = strtolower(sanitize_text_field($status));
        $allowed = ['pending', 'approved', 'rejected', 'spam'];

        return in_array($status, $allowed, true) ? $status : 'pending';
    }

    /**
     * Args that affect the WHERE clause (excludes pagination / ordering).
     *
     * @param array<string, mixed> $args
     * @return array<string, mixed>
     */
    private function whereCacheArgs(array $args): array
    {
        return [
            'status'      => (string) ($args['status'] ?? ''),
            'product_id'  => absint($args['product_id'] ?? 0),
            'product_ids' => array_values(array_unique(array_filter(array_map('absint', (array) ($args['product_ids'] ?? []))))),
            'rating'      => absint($args['rating'] ?? 0),
            'search'      => trim((string) ($args['search'] ?? '')),
            'view'        => sanitize_key((string) ($args['view'] ?? '')),
            'media_type'  => sanitize_key((string) ($args['media_type'] ?? '')),
        ];
    }

    /**
     * Product / variation IDs matching a title or SKU search (cached per request + object cache).
     *
     * @return int[]
     */
    private function findProductIdsMatchingSearch(string $search_term): array
    {
        global $wpdb;

        $search_term = trim($search_term);
        if ($search_term === '') {
            return [];
        }

        $request_key = md5(strtolower($search_term));
        if (isset(self::$search_product_ids_cache[$request_key])) {
            return self::$search_product_ids_cache[$request_key];
        }

        $cache_key = 'HYOKA_search_pids_' . $request_key;
        $cached    = wp_cache_get($cache_key, 'HYOKA_reviews_v2');
        if (is_array($cached)) {
            self::$search_product_ids_cache[$request_key] = $cached;

            return $cached;
        }

        $like = '%' . $wpdb->esc_like($search_term) . '%';

        // No WP_Query equivalent for title + SKU product ID lookup; values bound via prepare().
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $title_ids = array_map(
            'absint',
            (array) $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT ID FROM {$wpdb->posts}
                    WHERE post_type IN ('product', 'product_variation')
                    AND post_title LIKE %s",
                    $like
                )
            )
        );

        $sku_ids = array_map(
            'absint',
            (array) $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT post_id FROM {$wpdb->postmeta}
                    WHERE meta_key = '_sku' AND meta_value LIKE %s",
                    $like
                )
            )
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        $ids = array_values(array_unique(array_filter(array_merge($title_ids, $sku_ids))));

        self::$search_product_ids_cache[$request_key] = $ids;
        wp_cache_set($cache_key, $ids, 'HYOKA_reviews_v2', 5 * MINUTE_IN_SECONDS);

        return $ids;
    }

    /**
     * Build a WHERE clause from plugin-controlled SQL fragments.
     *
     * WordPress.org / wpdb pattern: every dynamic value is bound with $wpdb->prepare()
     * on its own fragment. The returned string contains no unbound placeholders and
     * never interpolates raw user input into SQL identifiers or operators.
     *
     * Results are memoized for the request so countMany() + findMany() share one build
     * (and one product-title/SKU lookup) during pagination.
     *
     * @param array<string, mixed> $args
     */
    private function buildPreparedWhereSql(array $args): string
    {
        global $wpdb;

        $where_args = $this->whereCacheArgs($args);
        $memo_key   = md5((string) wp_json_encode($where_args));
        if (isset(self::$prepared_where_cache[$memo_key])) {
            return self::$prepared_where_cache[$memo_key];
        }

        $clauses = [];

        $emails    = self::systemEmails();
        $clauses[] = $wpdb->prepare(
            'email NOT IN (%s, %s)',
            $emails[0],
            $emails[1]
        );

        if ($where_args['status'] !== '' && strtolower($where_args['status']) !== 'all') {
            $clauses[] = $wpdb->prepare(
                'status = %s',
                self::normalizeStatus($where_args['status'])
            );
        }

        if ($where_args['product_ids'] !== []) {
            $ids          = $where_args['product_ids'];
            $placeholders = implode(',', array_fill(0, count($ids), '%d'));
            // Dynamic IN (%d,%d,...) placeholder list — WordPress-recommended pattern; PHPCS cannot analyze it.
            // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
            $clauses[] = $wpdb->prepare(
                "product_id IN ($placeholders)",
                ...$ids
            );
            // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
        } elseif ($where_args['product_id'] > 0) {
            $clauses[] = $wpdb->prepare('product_id = %d', $where_args['product_id']);
        }

        if ($where_args['rating'] > 0) {
            $clauses[] = $wpdb->prepare('rating = %d', $where_args['rating']);
        }

        if ($where_args['search'] !== '') {
            $search         = '%' . $wpdb->esc_like($where_args['search']) . '%';
            $search_clauses = [
                $wpdb->prepare('email LIKE %s', $search),
                $wpdb->prepare('content LIKE %s', $search),
                $wpdb->prepare('store_review LIKE %s', $search),
                $wpdb->prepare('question LIKE %s', $search),
            ];

            $matched_product_ids = $this->findProductIdsMatchingSearch($where_args['search']);
            if ($matched_product_ids !== []) {
                $placeholders = implode(',', array_fill(0, count($matched_product_ids), '%d'));
                // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
                $search_clauses[] = $wpdb->prepare(
                    "product_id IN ($placeholders)",
                    ...$matched_product_ids
                );
                // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
            }

            $clauses[] = '(' . implode(' OR ', $search_clauses) . ')';
        }

        if ($where_args['view'] !== '') {
            $view = $where_args['view'];
            if ($view === 'questions') {
                $clauses[] = $wpdb->prepare(
                    'question != %s AND (reply IS NULL OR reply = %s)',
                    '',
                    ''
                );
            } elseif ($view === 'store_reviews') {
                // Variadic constant expansion — PHPCS cannot count ...self::SQL_* replacements.
                // phpcs:disable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
                $clauses[] = $wpdb->prepare(
                    '(COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s))',
                    ...self::SQL_STORE_REVIEWS_PARAMS
                );
                // phpcs:enable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
            } elseif ($view === 'replies') {
                // phpcs:disable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
                $clauses[] = $wpdb->prepare(
                    'reply != %s AND ((COALESCE(store_review, %s) != %s OR (product_id = %d AND (question IS NULL OR question = %s) AND content IS NOT NULL AND content != %s)) OR question != %s)',
                    ...self::storeRepliesScopeParams()
                );
                // phpcs:enable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
            }
        } else {
            // phpcs:disable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
            $clauses[] = $wpdb->prepare(
                'product_id > %d AND (question IS NULL OR question = %s)',
                ...self::SQL_PRODUCT_REVIEWS_PARAMS
            );
            // phpcs:enable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
        }

        if ($where_args['media_type'] !== '') {
            $type = $where_args['media_type'];
            if ($type === 'visual') {
                $clauses[] = $wpdb->prepare(
                    '(media LIKE %s OR media LIKE %s)',
                    '%' . $wpdb->esc_like('"type":"image"') . '%',
                    '%' . $wpdb->esc_like('"type":"video"') . '%'
                );
            } elseif (in_array($type, ['image', 'video'], true)) {
                $clauses[] = $wpdb->prepare(
                    'media LIKE %s',
                    '%' . $wpdb->esc_like('"type":"' . $type . '"') . '%'
                );
            }
        }

        $sql = implode(' AND ', $clauses);
        self::$prepared_where_cache[$memo_key] = $sql;

        return $sql;
    }

    // —— Plugin settings row (hyoka_reviews.email = plugin_settings) ——

    /**
     * @return array<string, mixed>
     */
    public function getPluginSettings(): array
    {
        $row = $this->findSettingsByEmail(self::PLUGIN_SETTINGS_EMAIL);
        if ($row === null || empty($row['settings'])) {
            return [];
        }

        return self::parseSettingsColumn((string) $row['settings']);
    }

    /**
     * @param array<string, mixed> $data Settings JSON payload.
     */
    public function savePluginSettings(array $data): bool
    {
        $json = wp_json_encode($data);
        if ($json === false) {
            return false;
        }

        return $this->saveSettingsByEmail(self::PLUGIN_SETTINGS_EMAIL, [
            'settings'   => $json,
            'updated_at' => current_time('mysql', true),
        ], [
            'product_id' => 0,
            'rating'     => 5,
            'content'    => 'Plugin Settings Row',
            'status'     => 'approved',
            'email'      => self::PLUGIN_SETTINGS_EMAIL,
        ]);
    }

    // —— Widget options (WP options API) ——

    /**
     * @return array<string, mixed>
     */
    private static function getWidgetSettingsFromTable(): array
    {
        $instance = new self();
        $row = $instance->findSettingsByEmail(self::WIDGET_SETTINGS_EMAIL);

        if ($row !== null) {
            if (! empty($row['settings'])) {
                $settings = self::parseSettingsColumn((string) $row['settings']);

                return is_array($settings) ? $settings : [];
            }

            return [];
        }

        // One-time migration when no settings row exists yet (never re-import stale WP options).
        $statuses   = self::readWpOptionArray('hyoka_widget_settings');
        $placements = self::readWpOptionArray('hyoka_widget_placement');
        $styles     = get_option('hyoka_widget_styles', []);

        if (! is_array($styles)) {
            $styles = [];
        }

        if ($statuses === [] && $placements === [] && $styles === []) {
            return [];
        }

        $settings = [
            'statuses'   => $statuses,
            'placements' => $placements,
            'styles'     => $styles,
        ];
        self::saveWidgetSettingsToTable($settings);

        return $settings;
    }

    private static function purgeLegacyWidgetOptions(): void
    {
        delete_option('hyoka_widget_settings');
        delete_option('hyoka_widget_placement');
        delete_option('hyoka_widget_styles');
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function saveWidgetSettingsToTable(array $data): bool
    {
        $json = wp_json_encode($data);
        if ($json === false) {
            return false;
        }

        $instance = new self();

        $success = $instance->saveSettingsByEmail(self::WIDGET_SETTINGS_EMAIL, [
            'settings'   => $json,
            'updated_at' => current_time('mysql', true),
        ], [
            'product_id' => 0,
            'rating'     => 5,
            'content'    => 'Widget Settings Row',
            'status'     => 'approved',
            'email'      => self::WIDGET_SETTINGS_EMAIL,
        ]);

        if ($success) {
            self::purgeLegacyWidgetOptions();
        }

        return $success;
    }

    /**
     * @return array<string, mixed>
     */
    public static function getWidgetSettings(): array
    {
        return self::getWidgetSettingsFromTable();
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function saveWidgetSettings(array $data): bool
    {
        return self::saveWidgetSettingsToTable($data);
    }

    /**
     * @return array<string, string>
     */
    public static function getWidgetStatuses(): array
    {
        $settings = self::getWidgetSettingsFromTable();

        return is_array($settings['statuses'] ?? null) ? $settings['statuses'] : [];
    }

    /**
     * @return array<string, string>
     */
    public static function getWidgetPlacements(): array
    {
        $settings = self::getWidgetSettingsFromTable();

        return is_array($settings['placements'] ?? null) ? $settings['placements'] : [];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function getWidgetStyles(): array
    {
        $settings = self::getWidgetSettingsFromTable();

        return is_array($settings['styles'] ?? null) ? $settings['styles'] : [];
    }

    /**
     * @param array<string, array<string, mixed>> $data
     */
    public static function saveWidgetStyles(array $data): bool
    {
        $settings           = self::getWidgetSettingsFromTable();
        $settings['styles'] = $data;

        return self::saveWidgetSettingsToTable($settings);
    }


    /**
     * Read an option as a normalized string map (for migration).
     *
     * @return array<string, string>
     */
    private static function readWpOptionArray(string $option): array
    {
        $settings = get_option($option, []);
        if (! is_array($settings)) {
            return [];
        }

        $normalized = [];
        foreach ($settings as $widget_id => $status) {
            $key = sanitize_key((string) $widget_id);
            if ($key === '') {
                continue;
            }
            $normalized[$key] = strtolower(trim((string) $status));
        }

        return $normalized;
    }

    /**
     * @param array<string, mixed> $args Supports product_id, limit, page, status, media_type.
     * @return array
     */
    public static function fetchReviewList(array $args = []): array
    {
        $product_id = isset($args['product_id']) ? absint($args['product_id']) : 0;
        $limit      = isset($args['limit']) ? max(1, absint($args['limit'])) : 10;
        $page       = isset($args['page']) ? max(1, absint($args['page'])) : 1;
        $status     = self::normalizeStatus((string) ($args['status'] ?? 'approved'));
        $media_type = isset($args['media_type']) ? sanitize_key((string) $args['media_type']) : '';
        $view       = isset($args['view']) ? sanitize_key((string) $args['view']) : '';
        $rating     = isset($args['rating']) ? absint($args['rating']) : 0;
        if ($rating < 1 || $rating > 5) {
            $rating = 0;
        }

        // Handle related products if single product specified
        $related    = $product_id > 0 ? Reviewing::getRelatedProductIds($product_id) : [];
        $use_multi  = $product_id > 0 && count($related) > 1;

        // Cache Key
        $cache_parts = [$status, $limit, $page, $media_type ?: 'no-media', $view ?: 'no-view', 'r_' . $rating];
        if ($use_multi) {
            $rel_sorted    = $related;
            sort($rel_sorted);
            $cache_parts[] = 'multi_' . md5(implode(',', $rel_sorted));
        } else {
            $cache_parts[] = 'p_' . $product_id;
        }
        $cache_key = 'HYOKA_list_' . implode('_', $cache_parts);

        $cached = wp_cache_get($cache_key, 'HYOKA_reviews_v2');
        if ($cached !== false) {
            return $cached;
        }

        $find_args = [
            'status'   => $status,
            'per_page' => $limit,
            'page'     => $page,
        ];

        if ($product_id > 0) {
            $find_args[$use_multi ? 'product_ids' : 'product_id'] = $use_multi ? $related : $product_id;
        }

        if ($media_type !== '') {
            $find_args['media_type'] = $media_type;
        }
        if ($rating > 0) {
            $find_args['rating'] = $rating;
        }
        if ($view !== '') {
            $find_args['view'] = $view;
        }

        $reviews = (new self())->findMany($find_args);
        $mapped  = array_map([Reviewing::class, 'attachProductMeta'], $reviews);

        wp_cache_set($cache_key, $mapped, 'HYOKA_reviews_v2', MINUTE_IN_SECONDS * 10);

        return $mapped;
    }

    /**
     * Unified method for getting review stats (average, count, histogram).
     *
     * @param array<string, mixed> $args Supports product_id, product_ids, status.
     * @return array{average: float|int, count: int, histogram: array<int, int>}
     */
    public static function fetchReviewStats(array $args = []): array
    {
        global $wpdb;
        $table = self::getTableName();

        $product_id = isset($args['product_id']) ? absint($args['product_id']) : 0;
        $related    = $product_id > 0 ? Reviewing::getRelatedProductIds($product_id) : [];
        $use_multi  = $product_id > 0 && count($related) > 1;

        if ($use_multi) {
            $rel_sorted = $related;
            sort($rel_sorted);
            $cache_key = 'HYOKA_stats_multi_' . md5(implode(',', $rel_sorted));
        } elseif ($product_id > 0) {
            $cache_key = 'HYOKA_stats_product_' . $product_id;
        } else {
            $cache_key = 'HYOKA_stats_site';
        }

        $status       = self::normalizeStatus((string) ($args['status'] ?? 'approved'));
        $product_only = ! empty($args['product_reviews_only']);
        $cache_key .= $product_only ? '_product_only' : '';
        $cache_key .= '_' . $status;

        $cached = wp_cache_get($cache_key, 'HYOKA_reviews_v2');
        if ($cached !== false) {
            return $cached;
        }

        $system_emails = self::systemEmails();
        $clauses       = [
            $wpdb->prepare(
                'status = %s AND email NOT IN (%s, %s) AND rating BETWEEN 1 AND 5',
                $status,
                $system_emails[0],
                $system_emails[1]
            ),
        ];

        if ($use_multi) {
            $placeholders = implode(',', array_fill(0, count($related), '%d'));
            // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
            $clauses[] = $wpdb->prepare(
                "product_id IN ($placeholders)",
                ...$related
            );
            // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
        } elseif ($product_id > 0) {
            $clauses[] = $wpdb->prepare('product_id = %d', $product_id);
        }

        if ($product_only) {
            // phpcs:disable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
            $clauses[] = $wpdb->prepare(
                'product_id > %d AND (question IS NULL OR question = %s)',
                ...self::SQL_PRODUCT_REVIEWS_PARAMS
            );
            // phpcs:enable WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
        }

        $where = implode(' AND ', $clauses);

        // Single GROUP BY: derive histogram, count, and average in PHP (MySQL 5.x / MariaDB safe).
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table from getTableName(); $where is assembled only from $wpdb->prepare() fragments.
        $histogram_rows = $wpdb->get_results(
            "SELECT rating, COUNT(*) as count FROM {$table} WHERE {$where} GROUP BY rating",
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $histogram = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $total     = 0;
        $weighted  = 0.0;
        if (is_array($histogram_rows)) {
            foreach ($histogram_rows as $row) {
                $r = (int) $row['rating'];
                $c = (int) $row['count'];
                if (isset($histogram[$r])) {
                    $histogram[$r] = $c;
                    $total        += $c;
                    $weighted     += $r * $c;
                }
            }
        }

        $data = [
            'average'   => $total > 0 ? round($weighted / $total, 1) : 0,
            'count'     => $total,
            'histogram' => $histogram,
        ];

        wp_cache_set($cache_key, $data, 'HYOKA_reviews_v2', MINUTE_IN_SECONDS * 30);

        return $data;
    }

    public static function updateReviewReply(int $review_id, string $reply): bool
    {
        $model = new self();
        $row   = $model->findById($review_id);
        if ($row === null) {
            return false;
        }

        $old_reply = trim((string) ($row['reply'] ?? ''));
        $new_reply = trim($reply);

        $success = $model->update($review_id, [
            'reply'      => $reply,
            'updated_at' => current_time('mysql', true),
        ]);

        if ($success) {
            Reviewing::clearReviewCache(absint($row['product_id'] ?? 0));

            if ($new_reply !== '' && $new_reply !== $old_reply) {
                $row['reply'] = $reply;
                $replacements = EmailService::buildReplacementsFromReview($row);
                $recipient    = sanitize_email((string) ($row['email'] ?? ''));
                $is_question  = trim((string) ($row['question'] ?? '')) !== '';
                if ($replacements !== null && $recipient !== '' && is_email($recipient) && ! $is_question) {
                    $failure_reason = null;
                    $reply_text     = sanitize_textarea_field($new_reply);

                    EmailService::sendTemplateEmail(
                        'reply_notification',
                        $recipient,
                        $replacements,
                        $failure_reason,
                        ['reply_text' => $reply_text]
                    );
                }
            }
        }

        return $success;
    }
}
