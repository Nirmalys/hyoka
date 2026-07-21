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

use Hyoka\App\Helper\Wp;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\ImportRecord;
use Hyoka\App\Model\Review;

defined('ABSPATH') || exit;

class DashboardStats
{
    /**
     * @return array<string, mixed>
     */
    public static function getOverview(int $days = 30): array
    {
        $days = max(7, min(90, $days));
        $now_ts = time();

        $current_start = gmdate('Y-m-d H:i:s', $now_ts - ($days * DAY_IN_SECONDS));
        $current_end   = gmdate('Y-m-d H:i:s', $now_ts);
        $prev_start    = gmdate('Y-m-d H:i:s', $now_ts - (2 * $days * DAY_IN_SECONDS));
        $prev_end      = $current_start;

        $current  = self::metricsForRange($current_start, $current_end);
        $previous = self::metricsForRange($prev_start, $prev_end);
        $pending  = self::countPendingReviews();
        $all_stats = Review::fetchReviewStats(['status' => 'approved']);

        $conversion = self::conversionRate(
            (int) ($current['approved_reviews'] ?? 0),
            (int) ($current['requests_sent'] ?? 0)
        );
        $prev_conversion = self::conversionRate(
            (int) ($previous['approved_reviews'] ?? 0),
            (int) ($previous['requests_sent'] ?? 0)
        );

        return [
            'days'                 => $days,
            'total_reviews'        => (int) ($all_stats['count'] ?? 0),
            'average_rating'       => (float) ($all_stats['average'] ?? 0),
            'conversion_rate'      => $conversion,
            'pending_reviews'      => $pending,
            'requests_sent'        => (int) ($current['requests_sent'] ?? 0),
            'media_reviews'        => self::countMediaReviewsAllTime(),
            'review_growth'        => self::getReviewGrowthSeries($days),
            'rating_distribution'  => self::getRatingDistribution(),
            'recent_activity'      => self::getRecentActivity(6),
            'top_products'         => self::getTopProducts($days, 5),
            'deltas'               => [
                'total_reviews'   => self::percentDelta(
                    (int) ($current['approved_reviews'] ?? 0),
                    (int) ($previous['approved_reviews'] ?? 0)
                ),
                'average_rating'  => self::ratingDelta(
                    (float) ($current['average_rating'] ?? 0),
                    (float) ($previous['average_rating'] ?? 0)
                ),
                'conversion_rate' => self::pointsDelta($conversion, $prev_conversion),
                'pending_reviews' => self::percentDelta(
                    (int) ($current['pending_arrivals'] ?? 0),
                    (int) ($previous['pending_arrivals'] ?? 0)
                ),
                'requests_sent'   => self::percentDelta(
                    (int) ($current['requests_sent'] ?? 0),
                    (int) ($previous['requests_sent'] ?? 0)
                ),
                'media_reviews'   => self::percentDelta(
                    (int) ($current['media_reviews'] ?? 0),
                    (int) ($previous['media_reviews'] ?? 0)
                ),
            ],
        ];
    }

    /**
     * @return array{approved_reviews: int, average_rating: float, media_reviews: int, pending_arrivals: int, requests_sent: int}
     */
    private static function metricsForRange(string $start, string $end): array
    {
        return [
            'approved_reviews' => self::countApprovedReviews($start, $end),
            'average_rating'   => self::averageApprovedRating($start, $end),
            'media_reviews'    => self::countMediaReviews($start, $end),
            'pending_arrivals' => self::countPendingArrivals($start, $end),
            'requests_sent'    => self::countRequestsSent($start, $end),
        ];
    }

    private static function countApprovedReviews(string $start, string $end): int
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND rating BETWEEN 1 AND 5
                AND created_at >= %s
                AND created_at < %s",
                'approved',
                $emails[0],
                $emails[1],
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    private static function averageApprovedRating(string $start, string $end): float
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $avg = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT AVG(rating) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND rating BETWEEN 1 AND 5
                AND created_at >= %s
                AND created_at < %s",
                'approved',
                $emails[0],
                $emails[1],
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return $avg !== null ? round((float) $avg, 1) : 0.0;
    }

    private static function countMediaReviews(string $start, string $end): int
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND rating BETWEEN 1 AND 5
                AND media IS NOT NULL
                AND media <> %s
                AND media <> %s
                AND created_at >= %s
                AND created_at < %s",
                'approved',
                $emails[0],
                $emails[1],
                '',
                '[]',
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    private static function countMediaReviewsAllTime(): int
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND rating BETWEEN 1 AND 5
                AND media IS NOT NULL
                AND media <> %s
                AND media <> %s",
                'approved',
                $emails[0],
                $emails[1],
                '',
                '[]'
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    private static function countPendingReviews(): int
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)",
                'pending',
                $emails[0],
                $emails[1]
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    private static function countPendingArrivals(string $start, string $end): int
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND created_at >= %s
                AND created_at < %s",
                'pending',
                $emails[0],
                $emails[1],
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    private static function countRequestsSent(string $start, string $end): int
    {
        global $wpdb;
        $table = Customer::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE email LIKE %s
                AND JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')) >= %s
                AND JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')) < %s",
                '%"email_sent":1%',
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) ($count ?? 0);
    }

    private static function conversionRate(int $reviews, int $requests): float
    {
        if ($requests <= 0) {
            return 0.0;
        }

        return round(($reviews / $requests) * 100, 1);
    }

    /**
     * @return array{value: float, up: bool, label: string}
     */
    private static function percentDelta(int $current, int $previous): array
    {
        if ($previous <= 0) {
            $value = $current > 0 ? 100.0 : 0.0;
            return [
                'value' => $value,
                'up'    => $value >= 0,
                'label' => self::formatSignedPercent($value),
            ];
        }

        $value = round((($current - $previous) / $previous) * 100, 1);

        return [
            'value' => $value,
            'up'    => $value >= 0,
            'label' => self::formatSignedPercent($value),
        ];
    }

    /**
     * @return array{value: float, up: bool, label: string}
     */
    private static function ratingDelta(float $current, float $previous): array
    {
        $value = round($current - $previous, 2);

        return [
            'value' => $value,
            'up'    => $value >= 0,
            'label' => ($value > 0 ? '+' : '') . number_format($value, 2),
        ];
    }

    /**
     * @return array{value: float, up: bool, label: string}
     */
    private static function pointsDelta(float $current, float $previous): array
    {
        $value = round($current - $previous, 1);

        return [
            'value' => $value,
            'up'    => $value >= 0,
            'label' => ($value > 0 ? '+' : '') . number_format($value, 1) . '%',
        ];
    }

    private static function formatSignedPercent(float $value): string
    {
        $rounded = round($value, 1);
        $prefix  = $rounded > 0 ? '+' : '';

        return $prefix . number_format($rounded, 1) . '%';
    }

    /**
     * Daily review and request counts for the overview growth chart.
     *
     * @return array{days: int, reviews: int[], requests: int[], max_y: int, grid: int[]}
     */
    public static function getReviewGrowthSeries(int $days): array
    {
        $days   = max(7, min(90, $days));
        $now_ts = time();
        $start  = gmdate('Y-m-d H:i:s', $now_ts - ($days * DAY_IN_SECONDS));
        $end    = gmdate('Y-m-d H:i:s', $now_ts);

        $reviews  = array_fill(0, $days, 0);
        $requests = array_fill(0, $days, 0);

        global $wpdb;
        $emails         = Review::systemEmails();
        $reviews_table  = Review::getTableName();
        $customer_table = Customer::getTableName();

        // Live dashboard series for custom tables; caching would stale chart data.
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table names from getTableName() ($wpdb->prefix + plugin-owned tables); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $review_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DATE(created_at) AS day, COUNT(*) AS cnt
                FROM {$reviews_table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND rating BETWEEN 1 AND 5
                AND created_at >= %s
                AND created_at < %s
                GROUP BY DATE(created_at)
                ORDER BY day ASC",
                'approved',
                $emails[0],
                $emails[1],
                $start,
                $end
            ),
            ARRAY_A
        );

        $request_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DATE(JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at'))) AS day, COUNT(*) AS cnt
                FROM {$customer_table}
                WHERE email LIKE %s
                AND JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')) >= %s
                AND JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')) < %s
                GROUP BY DATE(JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')))
                ORDER BY day ASC",
                '%"email_sent":1%',
                $start,
                $end
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $period_start_ts = strtotime($start . ' UTC');
        if (is_array($review_rows)) {
            foreach ($review_rows as $row) {
                $index = self::dayIndexFromDate((string) ($row['day'] ?? ''), $period_start_ts, $days);
                if ($index !== null) {
                    $reviews[$index] = (int) ($row['cnt'] ?? 0);
                }
            }
        }

        if (is_array($request_rows)) {
            foreach ($request_rows as $row) {
                $index = self::dayIndexFromDate((string) ($row['day'] ?? ''), $period_start_ts, $days);
                if ($index !== null) {
                    $requests[$index] = (int) ($row['cnt'] ?? 0);
                }
            }
        }

        $max_value = max(max($reviews), max($requests), 1);
        $max_y     = self::chartMaxY($max_value);
        $grid      = [0, (int) round($max_y * 0.25), (int) round($max_y * 0.5), (int) round($max_y * 0.75), $max_y];

        return [
            'days'     => $days,
            'reviews'  => $reviews,
            'requests' => $requests,
            'max_y'    => $max_y,
            'grid'     => $grid,
        ];
    }

    /**
     * All-time star histogram for the rating distribution card.
     *
     * @return array{total: int, average: float, rows: array<int, array{star: int, count: int, pct: int}>}
     */
    public static function getRatingDistribution(): array
    {
        $stats     = Review::fetchReviewStats(['status' => 'approved']);
        $total     = (int) ($stats['count'] ?? 0);
        $histogram = is_array($stats['histogram'] ?? null) ? $stats['histogram'] : [];
        $rows      = [];

        foreach ([5, 4, 3, 2, 1] as $star) {
            $count = (int) ($histogram[$star] ?? 0);
            $pct   = $total > 0 ? (int) round(($count / $total) * 100) : 0;
            $rows[] = [
                'star'  => $star,
                'count' => $count,
                'pct'   => $pct,
            ];
        }

        return [
            'total'   => $total,
            'average' => (float) ($stats['average'] ?? 0),
            'rows'    => $rows,
        ];
    }

    private static function dayIndexFromDate(string $day, int $period_start_ts, int $days): ?int
    {
        if ($day === '') {
            return null;
        }

        $day_ts = strtotime($day . ' UTC');
        if ($day_ts === false) {
            return null;
        }

        $index = (int) floor(($day_ts - $period_start_ts) / DAY_IN_SECONDS);
        if ($index < 0 || $index >= $days) {
            return null;
        }

        return $index;
    }

    private static function chartMaxY(int $max_value): int
    {
        if ($max_value <= 4) {
            return 4;
        }

        $step = (int) ceil($max_value / 4);
        $magnitude = (int) pow(10, (int) floor(log10(max(1, $step))));
        $step = (int) (ceil($step / $magnitude) * $magnitude);

        return max(4, $step * 4);
    }

    /**
     * Recent dashboard timeline events merged from reviews, imports, and email sends.
     *
     * @return array<int, array{id: string, type: string, text: string, occurred_at: string}>
     */
    public static function getRecentActivity(int $limit = 6): array
    {
        $limit = max(1, min(20, $limit));
        $events = array_merge(
            self::collectReviewActivityEvents(40),
            self::collectImportActivityEvents(10),
            self::collectEmailSendActivityEvents(10)
        );

        usort(
            $events,
            static function (array $a, array $b): int {
                return strtotime((string) ($b['occurred_at'] ?? '')) <=> strtotime((string) ($a['occurred_at'] ?? ''));
            }
        );

        return array_slice($events, 0, $limit);
    }

    /**
     * Products ranked by approved review volume with period-over-period impact.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getTopProducts(int $days = 30, int $limit = 5): array
    {
        $days  = max(7, min(90, $days));
        $limit = max(1, min(20, $limit));
        $now_ts = time();

        $current_start = gmdate('Y-m-d H:i:s', $now_ts - ($days * DAY_IN_SECONDS));
        $current_end   = gmdate('Y-m-d H:i:s', $now_ts);
        $prev_start    = gmdate('Y-m-d H:i:s', $now_ts - (2 * $days * DAY_IN_SECONDS));
        $prev_end      = $current_start;

        global $wpdb;
        $emails = Review::systemEmails();
        $table  = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT product_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating
                FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND product_id > 0
                AND rating BETWEEN 1 AND 5
                GROUP BY product_id
                ORDER BY review_count DESC, avg_rating DESC
                LIMIT %d",
                'approved',
                $emails[0],
                $emails[1],
                $limit
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (! is_array($rows) || $rows === []) {
            return [];
        }

        $product_ids = array_values(array_unique(array_filter(array_map(static function ($row) {
            return absint($row['product_id'] ?? 0);
        }, $rows))));

        $products = self::resolveProductsByIds($product_ids);
        $output   = [];

        foreach ($rows as $row) {
            $product_id   = absint($row['product_id'] ?? 0);
            if ($product_id <= 0) {
                continue;
            }

            $current_count = self::countProductReviewsInRange($product_id, $current_start, $current_end);
            $previous_count = self::countProductReviewsInRange($product_id, $prev_start, $prev_end);
            $impact        = self::percentDelta($current_count, $previous_count);
            $product       = $products[$product_id] ?? [];

            $output[] = [
                'id'      => $product_id,
                'name'    => (string) ($product['name'] ?? __('Unknown Product', 'hyoka-product-reviews')),
                'sku'     => (string) ($product['sku'] ?? ''),
                'image'   => (string) ($product['image'] ?? ''),
                'rating'  => number_format((float) ($row['avg_rating'] ?? 0), 1),
                'reviews' => (int) ($row['review_count'] ?? 0),
                'impact'  => $impact['label'],
                'up'      => $impact['up'],
                'url'     => (string) ($product['url'] ?? ''),
            ];
        }

        return $output;
    }

    /**
     * @return array<int, array{id: string, type: string, text: string, occurred_at: string}>
     */
    private static function collectReviewActivityEvents(int $fetch_limit): array
    {
        global $wpdb;
        $emails = Review::systemEmails();
        $fetch_limit = max(1, min(100, $fetch_limit));
        $table = Review::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, product_id, rating, content, media, question, reply, created_at, updated_at
                FROM {$table}
                WHERE email NOT IN (%s, %s)
                ORDER BY GREATEST(
                    COALESCE(UNIX_TIMESTAMP(updated_at), 0),
                    COALESCE(UNIX_TIMESTAMP(created_at), 0)
                ) DESC
                LIMIT %d",
                $emails[0],
                $emails[1],
                $fetch_limit
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (! is_array($rows) || $rows === []) {
            return [];
        }

        $product_ids = array_values(array_unique(array_filter(array_map(static function ($row) {
            return absint($row['product_id'] ?? 0);
        }, $rows))));
        $products = self::resolveProductsByIds($product_ids);

        $events = [];
        foreach ($rows as $row) {
            $review_id  = absint($row['id'] ?? 0);
            $product_id = absint($row['product_id'] ?? 0);
            $product_name = $product_id > 0
                ? (string) (($products[$product_id]['name'] ?? '') ?: __('a product', 'hyoka-product-reviews'))
                : __('your store', 'hyoka-product-reviews');

            $content_data = Review::decodeReviewContent($row);
            $author       = self::shortReviewerName((string) ($content_data['author'] ?? ''));
            $question     = trim((string) ($row['question'] ?? ''));
            $reply        = trim((string) ($row['reply'] ?? ''));
            $updated_at   = (string) ($row['updated_at'] ?? '');
            $created_at   = (string) ($row['created_at'] ?? '');
            $media        = Wp::parseStoredMediaJson($row['media'] ?? '');
            $has_video    = self::mediaHasVideo($media);

            if ($question !== '' && $reply !== '') {
                $events[] = [
                    'id'           => 'question-' . $review_id,
                    'type'         => 'question',
                    'text'         => sprintf(
                        /* translators: %s: product name */
                        __('Customer question answered on %s', 'hyoka-product-reviews'),
                        $product_name
                    ),
                    'occurred_at'  => $updated_at !== '' ? $updated_at : $created_at,
                ];
                continue;
            }

            if ($reply !== '') {
                $events[] = [
                    'id'           => 'reply-' . $review_id,
                    'type'         => 'reply',
                    'text'         => sprintf(
                        /* translators: %s: product name */
                        __('You replied to a review on %s', 'hyoka-product-reviews'),
                        $product_name
                    ),
                    'occurred_at'  => $updated_at !== '' ? $updated_at : $created_at,
                ];
                continue;
            }

            if ($has_video) {
                $events[] = [
                    'id'           => 'video-' . $review_id,
                    'type'         => 'video',
                    'text'         => sprintf(
                        /* translators: 1: reviewer name, 2: product name */
                        __('%1$s uploaded a video review on %2$s', 'hyoka-product-reviews'),
                        $author,
                        $product_name
                    ),
                    'occurred_at'  => $created_at,
                ];
                continue;
            }

            $rating = absint($row['rating'] ?? 0);
            if ($rating < 1 || $rating > 5) {
                continue;
            }

            $events[] = [
                'id'           => 'review-' . $review_id,
                'type'         => 'review',
                'text'         => sprintf(
                    /* translators: 1: reviewer name, 2: star rating, 3: product name */
                    __('%1$s left a %2$d-star review on %3$s', 'hyoka-product-reviews'),
                    $author,
                    $rating,
                    $product_name
                ),
                'occurred_at'  => $created_at,
            ];
        }

        return $events;
    }

    /**
     * @return array<int, array{id: string, type: string, text: string, occurred_at: string}>
     */
    private static function collectImportActivityEvents(int $fetch_limit): array
    {
        global $wpdb;
        $fetch_limit = max(1, min(50, $fetch_limit));
        $table = ImportRecord::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT import_job_id, source, COUNT(*) AS review_count, MAX(created_at) AS imported_at
                FROM {$table}
                WHERE import_job_id IS NOT NULL
                AND import_job_id <> %s
                AND batch_status = %s
                GROUP BY import_job_id, source
                ORDER BY imported_at DESC
                LIMIT %d",
                '',
                'imported',
                $fetch_limit
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (! is_array($rows) || $rows === []) {
            return [];
        }

        $events = [];
        foreach ($rows as $row) {
            $job_id = sanitize_text_field((string) ($row['import_job_id'] ?? ''));
            if ($job_id === '') {
                continue;
            }

            $count  = (int) ($row['review_count'] ?? 0);
            $source = self::formatImportSourceLabel((string) ($row['source'] ?? 'csv'));

            $events[] = [
                'id'          => 'import-' . $job_id,
                'type'        => 'import',
                'text'        => sprintf(
                    /* translators: 1: number of reviews, 2: import source label */
                    _n(
                        '%1$d review imported from %2$s',
                        '%1$d reviews imported from %2$s',
                        $count,
                        'hyoka-product-reviews'
                    ),
                    $count,
                    $source
                ),
                'occurred_at' => (string) ($row['imported_at'] ?? ''),
            ];
        }

        return $events;
    }

    /**
     * @return array<int, array{id: string, type: string, text: string, occurred_at: string}>
     */
    private static function collectEmailSendActivityEvents(int $fetch_limit): array
    {
        global $wpdb;
        $fetch_limit = max(1, min(50, $fetch_limit));
        $table = Customer::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT
                    DATE_FORMAT(JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at')), '%%Y-%%m-%%d %%H:00:00') AS batch_hour,
                    COUNT(*) AS customer_count,
                    MAX(JSON_UNQUOTE(JSON_EXTRACT(email, '$.email_sent_at'))) AS last_sent_at
                FROM {$table}
                WHERE email LIKE %s
                GROUP BY batch_hour
                ORDER BY last_sent_at DESC
                LIMIT %d",
                '%"email_sent":1%',
                $fetch_limit
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (! is_array($rows) || $rows === []) {
            return [];
        }

        $events = [];
        foreach ($rows as $row) {
            $count = (int) ($row['customer_count'] ?? 0);
            $hour  = sanitize_text_field((string) ($row['batch_hour'] ?? ''));
            if ($count <= 0 || $hour === '') {
                continue;
            }

            $events[] = [
                'id'          => 'send-' . md5($hour),
                'type'        => 'send',
                'text'        => sprintf(
                    /* translators: %d: number of customers */
                    _n(
                        'Review request email sent to %d customer',
                        'Review request email sent to %d customers',
                        $count,
                        'hyoka-product-reviews'
                    ),
                    $count
                ),
                'occurred_at' => (string) ($row['last_sent_at'] ?? $hour),
            ];
        }

        return $events;
    }

    private static function countProductReviewsInRange(int $product_id, string $start, string $end): int
    {
        global $wpdb;

        $product_id = absint($product_id);
        if ($product_id <= 0) {
            return 0;
        }
        $emails = Review::systemEmails();

        $table = Review::getTableName();
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table}
                WHERE status = %s
                AND email NOT IN (%s, %s)
                AND product_id = %d
                AND rating BETWEEN 1 AND 5
                AND created_at >= %s
                AND created_at < %s",
                'approved',
                $emails[0],
                $emails[1],
                $product_id,
                $start,
                $end
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $count;
    }

    /**
     * @param array<int, int> $product_ids
     * @return array<int, array{name: string, sku: string, image: string, url: string}>
     */
    private static function resolveProductsByIds(array $product_ids): array
    {
        $product_ids = array_values(array_unique(array_filter(array_map('absint', $product_ids))));
        if ($product_ids === []) {
            return [];
        }

        global $wpdb;
        $in_list = Wp::prepareInIntegers($product_ids);

        // $in_list is per-value prepare('%d'); core tables via $wpdb->posts / $wpdb->postmeta.
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Core $wpdb->posts/$wpdb->postmeta; IN() from Wp::prepareInIntegers() (Plugin Check does not treat that helper as a sanitizer).
        $results = $wpdb->get_results(
            "SELECT p.ID, p.post_title AS name, pm.meta_value AS sku
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm ON (p.ID = pm.post_id AND pm.meta_key = '_sku')
            WHERE p.ID IN ({$in_list})",
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        $products = [];
        if (! is_array($results)) {
            return $products;
        }

        foreach ($results as $row) {
            $product_id = absint($row['ID'] ?? 0);
            if ($product_id <= 0) {
                continue;
            }

            $image = '';
            if (function_exists('wc_get_product')) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $image_id = $product->get_image_id();
                    if ($image_id > 0) {
                        $image = (string) wp_get_attachment_image_url($image_id, 'thumbnail');
                    }
                }
            }

            $products[$product_id] = [
                'name'  => (string) ($row['name'] ?? __('Unknown Product', 'hyoka-product-reviews')),
                'sku'   => (string) ($row['sku'] ?? ''),
                'image' => $image,
                'url'   => get_permalink($product_id) ?: '',
            ];
        }

        return $products;
    }

    /**
     * @param array<int, array{url: string, type: string, id: int}> $media
     */
    private static function mediaHasVideo(array $media): bool
    {
        foreach ($media as $item) {
            $type = sanitize_key((string) ($item['type'] ?? ''));
            if ($type === 'video') {
                return true;
            }
        }

        return false;
    }

    private static function shortReviewerName(string $author): string
    {
        $author = trim($author);
        if ($author === '') {
            return __('A customer', 'hyoka-product-reviews');
        }

        $words = preg_split('/\s+/', $author) ?: [];
        if (count($words) >= 2) {
            return $words[0] . ' ' . strtoupper(substr((string) $words[1], 0, 1)) . '.';
        }

        return (string) $words[0];
    }

    private static function formatImportSourceLabel(string $source): string
    {
        $source = sanitize_key($source);
        $labels = [
            'csv'      => 'CSV',
            'judgeme'  => 'Judge.me',
            'judge_me' => 'Judge.me',
            'yotpo'    => 'Yotpo',
            'stamped'  => 'Stamped.io',
            'loox'     => 'Loox',
            'shopify'  => 'Shopify',
        ];

        if (isset($labels[$source])) {
            return $labels[$source];
        }

        if ($source === '') {
            return __('Import', 'hyoka-product-reviews');
        }

        return ucwords(str_replace(['_', '-'], ' ', $source));
    }
}
