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

use Hyoka\App\Helper\UserReplies;

defined('ABSPATH') || exit;

class UserReply
{
    private const CACHE_GROUP = 'hyoka_user_replies';

    private const CACHE_TTL = HOUR_IN_SECONDS;

    private const USER_REPLIES_LIKE = '%"user_replies"%';

    /**
     * Single review row by ID (cached).
     */
    public function findReviewById(int $id): ?array
    {
        $id = absint($id);
        if ($id <= 0) {
            return null;
        }

        $cache_key = 'hyoka_user_reply_review_' . $id;
        $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);
        if ($cached !== false) {
            return is_array($cached) ? $cached : null;
        }

        $result = (new Review())->findById($id);
        wp_cache_set($cache_key, $result ?? [], self::CACHE_GROUP, self::CACHE_TTL);

        return $result;
    }

    /**
     * Reviews whose settings JSON contains visitor discussion replies.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getReviewsWithUserReplies(): array
    {
        return $this->queryRowsWithUserReplies('*', 'hyoka_reviews_with_user_replies');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getSettingsRowsWithUserReplies(): array
    {
        return $this->queryRowsWithUserReplies('settings', 'hyoka_user_reply_settings_rows');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function queryRowsWithUserReplies(string $columns, string $cache_key): array
    {
        global $wpdb;

        $cached = wp_cache_get($cache_key, self::CACHE_GROUP);
        if ($cached !== false) {
            return is_array($cached) ? $cached : [];
        }

        $emails = Review::systemEmails();
        $table = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from Review::getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        if ($columns === 'settings') {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT settings
                     FROM {$table}
                     WHERE email NOT IN (%s, %s)
                     AND settings LIKE %s",
                    $emails[0],
                    $emails[1],
                    self::USER_REPLIES_LIKE
                ),
                ARRAY_A
            );
        } else {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT *
                     FROM {$table}
                     WHERE email NOT IN (%s, %s)
                     AND settings LIKE %s",
                    $emails[0],
                    $emails[1],
                    self::USER_REPLIES_LIKE
                ),
                ARRAY_A
            );
        }
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $results = is_array($rows) ? $rows : [];
        wp_cache_set($cache_key, $results, self::CACHE_GROUP, 5 * MINUTE_IN_SECONDS);

        return $results;
    }

    /**
     * Reviews that have visitor discussion replies (admin customer_replies view).
     * Parent reviews stay listed after replies are approved; only pending rows are highlighted in the UI.
     *
     * @param array<string, mixed> $args
     * @return array{data: array<int, array<string, mixed>>, total: int, page: int, per_page: int, pages: int}
     */
    public function getFilteredPendingList(array $args): array
    {
        $page     = max(1, absint($args['page'] ?? 1));
        $per_page = max(1, absint($args['per_page'] ?? 10));
        $search   = strtolower(trim((string) ($args['search'] ?? '')));

        $parents = [];
        foreach ($this->getReviewsWithUserReplies() as $row) {
            if (! is_array($row)) {
                continue;
            }

            $replies = UserReplies::list($row, null);
            if ($replies === []) {
                continue;
            }

            if ($search !== '' && ! $this->matchesSearch($row, $search)) {
                continue;
            }

            $latest = 0;
            foreach ($replies as $reply) {
                $created = (string) ($reply['created_at'] ?? '');
                if ($created === '') {
                    continue;
                }
                $timestamp = strtotime($created);
                if ($timestamp !== false && $timestamp > $latest) {
                    $latest = $timestamp;
                }
            }

            $fallback = strtotime((string) ($row['updated_at'] ?? $row['created_at'] ?? ''));
            $parents[] = [
                'parent' => $row,
                'sort'   => $latest > 0 ? $latest : ($fallback !== false ? $fallback : 0),
            ];
        }

        usort($parents, static function ($a, $b) {
            return ($b['sort'] ?? 0) <=> ($a['sort'] ?? 0);
        });

        $total  = count($parents);
        $offset = ($page - 1) * $per_page;
        $slice  = array_slice($parents, $offset, $per_page);

        $data = [];
        foreach ($slice as $entry) {
            $data[] = $entry['parent'];
        }

        return [
            'data'     => $data,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int) max(1, (int) ceil($total / $per_page)),
        ];
    }

    public function countReviewsWithPendingReplies(): int
    {
        $cache_key = 'hyoka_reviews_pending_user_replies_count';
        $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);
        if ($cached !== false) {
            return (int) $cached;
        }

        $count = $this->countPendingFromSettingsRows(true);
        wp_cache_set($cache_key, $count, self::CACHE_GROUP, 5 * MINUTE_IN_SECONDS);

        return $count;
    }

    /** Total pending visitor discussion replies (admin tab badge). */
    public static function countPendingVisitorReplies(): int
    {
        $cache_key = 'hyoka_pending_visitor_replies_count';
        $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);
        if ($cached !== false) {
            return (int) $cached;
        }

        $count = (new self())->countPendingFromSettingsRows(false);
        wp_cache_set($cache_key, $count, self::CACHE_GROUP, 5 * MINUTE_IN_SECONDS);

        return $count;
    }

    /**
     * @param bool $count_reviews When true, count reviews with pending replies; when false, count reply items.
     */
    private function countPendingFromSettingsRows(bool $count_reviews): int
    {
        $count = 0;
        foreach ($this->getSettingsRowsWithUserReplies() as $row) {
            if (! is_array($row)) {
                continue;
            }

            $pending = UserReplies::pendingCount($row);
            if ($pending <= 0) {
                continue;
            }

            $count += $count_reviews ? 1 : $pending;
        }

        return $count;
    }

    /**
     * Persist decoded settings JSON on a review row.
     *
     * @param array<string, mixed> $settings
     */
    public function updateSettings(int $review_id, array $settings): bool
    {
        $encoded = wp_json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false) {
            return false;
        }

        $review_model = new Review();
        $ok           = $review_model->update($review_id, [
            'settings'   => $encoded,
            'updated_at' => current_time('mysql', true),
        ]);

        if ($ok) {
            $this->clearCache($review_id);
        }

        return $ok;
    }

    public function clearCache(int $review_id = 0): void
    {
        if ($review_id > 0) {
            wp_cache_delete('hyoka_user_reply_review_' . $review_id, self::CACHE_GROUP);
        }

        wp_cache_delete('hyoka_reviews_with_user_replies', self::CACHE_GROUP);
        wp_cache_delete('hyoka_user_reply_settings_rows', self::CACHE_GROUP);
        wp_cache_delete('hyoka_reviews_pending_user_replies_count', self::CACHE_GROUP);
        wp_cache_delete('hyoka_pending_visitor_replies_count', self::CACHE_GROUP);
    }

    /**
     * @param array<string, mixed> $row
     * @param array<string, mixed> $reply
     */
    private function matchesReplySearch(array $row, array $reply, string $search): bool
    {
        $content_data = Review::decodeReviewContent($row);
        $haystacks    = [
            strtolower((string) ($content_data['text'] ?? '')),
            strtolower((string) ($content_data['author'] ?? '')),
            strtolower((string) ($content_data['title'] ?? '')),
            strtolower((string) ($reply['author'] ?? '')),
            strtolower((string) ($reply['content'] ?? '')),
        ];

        foreach ($haystacks as $haystack) {
            if ($haystack !== '' && strpos($haystack, $search) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function matchesSearch(array $row, string $search): bool
    {
        $content_data = Review::decodeReviewContent($row);
        $haystacks    = [
            strtolower((string) ($content_data['text'] ?? '')),
            strtolower((string) ($content_data['author'] ?? '')),
            strtolower((string) ($content_data['title'] ?? '')),
        ];

        foreach (UserReplies::list($row, null) as $reply) {
            $haystacks[] = strtolower((string) ($reply['author'] ?? ''));
            $haystacks[] = strtolower((string) ($reply['content'] ?? ''));
        }

        foreach ($haystacks as $haystack) {
            if ($haystack !== '' && strpos($haystack, $search) !== false) {
                return true;
            }
        }

        return false;
    }
}
