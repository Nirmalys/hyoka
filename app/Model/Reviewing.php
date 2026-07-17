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
use Hyoka\App\Helper\Wp;
use Hyoka\Woocommerce\Email\EmailSender;
use Hyoka\Woocommerce\Product\ProductReview;
use Hyoka\App\Model\Review;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\ImportRecord;
use Hyoka\App\Model\Meta;

defined('ABSPATH') || exit;

class Reviewing
{
    /**
     * Send admin notification email for new review/question (if enabled).
     *
     * @param array<string, mixed> $payload Must include product_id, rating, title, content, author, email.
     */
    public static function maybeSendAdminNotification(int $review_id, array $payload, string $review_type): void
    {
        $settings = EmailSender::getSettings();
        if (empty($settings['admin_notifications_enabled'])) {
            return;
        }

        $review_type = strtolower((string) $review_type) === 'question' ? 'question' : 'review';
        if ($review_type === 'review' && empty($settings['admin_notify_new_review'])) {
            return;
        }
        if ($review_type === 'question' && empty($settings['admin_notify_new_question'])) {
            return;
        }

        $admin_emails = EmailSender::parseEmailList((string) ($settings['admin_notification_emails'] ?? ''));
        if ($admin_emails === []) {
            $fallback = sanitize_email((string) get_option('admin_email', ''));
            if ($fallback !== '' && is_email($fallback)) {
                $admin_emails = [$fallback];
            }
        }
        if ($admin_emails === []) {
            return;
        }

        $rating = max(1, min(5, absint($payload['rating'] ?? 0)));
        $negative_threshold = (int) ($settings['negative_review_threshold'] ?? 0);
        $negative_threshold = max(0, min(5, $negative_threshold));
        $is_negative = $negative_threshold > 0 && $rating > 0 && $rating <= $negative_threshold;

        if ($is_negative && ! empty($settings['negative_notification_alt_enabled'])) {
            $alt = EmailSender::parseEmailList((string) ($settings['negative_notification_alt_emails'] ?? ''));
            if ($alt !== []) {
                $admin_emails = $alt;
            }
        }

        $product_id = absint($payload['product_id'] ?? 0);
        $product_title = $product_id ? (string) get_the_title($product_id) : '';
        $product_link = $product_id ? (string) get_permalink($product_id) : '';

        $author = sanitize_text_field((string) ($payload['author'] ?? ''));
        $email  = sanitize_email((string) ($payload['email'] ?? ''));
        $title  = sanitize_text_field((string) ($payload['title'] ?? ''));
        $text   = sanitize_textarea_field((string) ($payload['content'] ?? ''));

        $subject_prefix = $review_type === 'question' ? 'New question' : 'New review';
        if ($is_negative) {
            $subject_prefix = 'Negative ' . $subject_prefix;
        }

        $subject = sprintf(
            '[%s] %s (%d★) %s',
            wp_specialchars_decode((string) get_bloginfo('name'), ENT_QUOTES),
            $subject_prefix,
            $rating,
            $product_title !== '' ? $product_title : ('Product #' . $product_id)
        );

        $body_lines = [];
        $body_lines[] = '<p><strong>' . esc_html($subject_prefix) . '</strong></p>';
        $body_lines[] = '<p><strong>Rating:</strong> ' . esc_html((string) $rating) . ' / 5</p>';
        $body_lines[] = '<p><strong>Author:</strong> ' . esc_html($author !== '' ? $author : 'Guest') . '</p>';
        if ($email !== '') {
            $body_lines[] = '<p><strong>Email:</strong> ' . esc_html($email) . '</p>';
        }
        if ($product_title !== '') {
            $body_lines[] = '<p><strong>Product:</strong> ' . esc_html($product_title) . '</p>';
        }
        if ($product_link !== '') {
            $body_lines[] = '<p><strong>Product link:</strong> <a href="' . esc_url($product_link) . '">' . esc_html($product_link) . '</a></p>';
        }
        if ($title !== '') {
            $body_lines[] = '<p><strong>Title:</strong> ' . esc_html($title) . '</p>';
        }
        $body_lines[] = '<p><strong>Content:</strong><br />' . nl2br(esc_html($text)) . '</p>';
        $body_lines[] = '<p><strong>Review ID:</strong> ' . esc_html((string) $review_id) . '</p>';

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
        ];

        // Best-effort send; ignore failure (WP may be unconfigured).
        wp_mail($admin_emails, $subject, implode("\n", $body_lines), $headers);
    }

    /**
     * Input $data from Ajax → write payload → Review::create.
     *
     * @param array<string, mixed> $data product_id, rating, content, author, email, media, etc.
     * @return int|false
     */
    public static function addReview(array $data)
    {
        $media = [];
        if (! empty($data['media']) && is_array($data['media'])) {
            foreach ($data['media'] as $item) {
                if (! is_array($item)) {
                    continue;
                }
                if (isset($item['url']) && is_string($item['url'])) {
                    $item['url'] = esc_url_raw(wp_unslash($item['url']));
                }
                $media[] = $item;
            }
        }

        $insert_data = [
            'product_id'   => absint($data['product_id'] ?? 0),
            'rating'       => max(1, min(5, absint($data['rating'] ?? 5))),
            'content'      => self::encodeReviewContent([
                'text'   => sanitize_textarea_field((string) ($data['content'] ?? '')),
                'title'  => $data['title'] ?? '',
                'author' => $data['author'] ?? '',
            ]),
            'store_review' => isset($data['store_review']) && $data['store_review'] !== null
                ? sanitize_textarea_field((string) $data['store_review'])
                : '',
            'email'        => sanitize_email($data['email'] ?? ''),
            'status'       => Review::normalizeStatus($data['status'] ?? 'pending'),
            'is_verified'  => ! empty($data['is_verified']) ? 1 : 0,
            'media'        => null,
        ];

        if ($media !== []) {
            $media_json = wp_json_encode($media, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($media_json === false) {
                return false;
            }
            $insert_data['media'] = $media_json;
        }

        if (! empty($data['question'])) {
            $insert_data['question'] = sanitize_textarea_field((string) $data['question']);
        }

        $model     = new Review();
        $review_id = $model->create($insert_data);
        if ($review_id) {
            self::clearReviewCache($insert_data['product_id']);
        }

        return $review_id;
    }


    public static function deleteReview(int $review_id): bool
    {
        $model      = new Review();
        $row        = $model->findById($review_id);
        $product_id = is_array($row) ? absint($row['product_id'] ?? 0) : 0;
        $result     = $model->delete($review_id);
        if ($result) {
            self::clearReviewCache($product_id);
        }

        return $result;
    }

    /**
     * @return int[]
     */
    public static function getRelatedProductIds(int $product_id): array
    {
        $product_id = absint($product_id);
        if ($product_id <= 0) {
            return [];
        }
        $ids = [$product_id];
        if (! function_exists('wc_get_product')) {
            return $ids;
        }
        $product = wc_get_product($product_id);
        if (! $product) {
            return $ids;
        }
        if ($product->is_type('variable')) {
            foreach ($product->get_children() as $child_id) {
                $ids[] = (int) $child_id;
            }
        }
        $parent_id = (int) $product->get_parent_id();
        if ($parent_id > 0) {
            $ids[] = $parent_id;
            $parent = wc_get_product($parent_id);
            if ($parent && $parent->is_type('variable')) {
                foreach ($parent->get_children() as $child_id) {
                    $ids[] = (int) $child_id;
                }
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }

    public static function clearReviewCache(int $product_id = 0): void
    {
        if (function_exists('wp_cache_supports') && wp_cache_supports('flush_group')) {
            wp_cache_flush_group('HYOKA_reviews_v2');
        } elseif (function_exists('wp_cache_flush_group')) {
            wp_cache_flush_group('HYOKA_reviews_v2');
        } else {
            $statuses = ['approved', 'pending', 'all', 'rejected', 'spam'];
            $limits   = [1, 5, 6, 8, 10, 25, 50, 100];
            $pages    = range(1, 20);
            $types    = ['image', 'video'];

            $settings_per_page = max(1, min(100, (int) (EmailSender::getSettings()['reviews_per_page'] ?? 10)));
            if (! in_array($settings_per_page, $limits, true)) {
                $limits[] = $settings_per_page;
            }

            foreach ($statuses as $s) {
                foreach ($limits as $l) {
                    wp_cache_delete('HYOKA_all_site_reviews_' . $s . '_' . $l, 'HYOKA_reviews_v2');
                    foreach ($pages as $p) {
                        wp_cache_delete('HYOKA_product_reviews_0_' . $s . '_' . $l . '_p' . $p, 'HYOKA_reviews_v2');
                    }
                }
            }

            $product_ids = [0];
            if ($product_id > 0) {
                $product_ids = array_merge($product_ids, self::getRelatedProductIds($product_id));
            }

            foreach ($product_ids as $pid) {
                foreach ($statuses as $s) {
                    foreach ($limits as $l) {
                        foreach ($pages as $p) {
                            wp_cache_delete('HYOKA_product_reviews_' . $pid . '_' . $s . '_' . $l . '_p' . $p, 'HYOKA_reviews_v2');
                        }
                    }
                }
                wp_cache_delete('HYOKA_product_stats_' . $pid, 'HYOKA_reviews_v2');

                // Clear HYOKA_list_ keys (used by fetchReviewList and widgets) to avoid stale data on live sites.
                foreach ($statuses as $s) {
                    foreach ($limits as $l) {
                        foreach ($pages as $p) {
                            foreach (['no-media', 'image', 'video'] as $mt) {
                                foreach ([0, 1, 2, 3, 4, 5] as $r) {
                                    wp_cache_delete('HYOKA_list_' . $s . '_' . $l . '_' . $p . '_' . $mt . '_r_' . $r . '_p_' . $pid, 'HYOKA_reviews_v2');
                                }
                            }
                        }
                    }
                }
            }

            $related = $product_id > 0 ? self::getRelatedProductIds($product_id) : [];
            if (count($related) > 1) {
                $rel_sorted = $related;
                sort($rel_sorted);
                $hash = md5(implode(',', $rel_sorted));
                foreach ($statuses as $s) {
                    foreach ($limits as $l) {
                        foreach ($pages as $p) {
                            wp_cache_delete('HYOKA_product_reviews_in_' . $hash . '_' . $s . '_' . $l . '_p' . $p, 'HYOKA_reviews_v2');

                            // Clear HYOKA_list_ multi-product keys
                            foreach (['no-media', 'image', 'video'] as $mt) {
                                foreach ([0, 1, 2, 3, 4, 5] as $r) {
                                    wp_cache_delete('HYOKA_list_' . $s . '_' . $l . '_' . $p . '_' . $mt . '_r_' . $r . '_multi_' . $hash, 'HYOKA_reviews_v2');
                                }
                            }
                        }
                    }
                }
                wp_cache_delete('HYOKA_product_stats_in_' . $hash, 'HYOKA_reviews_v2');
            }

            foreach ($types as $t) {
                foreach ($limits as $l) {
                    wp_cache_delete('HYOKA_media_reviews_' . $t . '_' . $l, 'HYOKA_reviews_v2');
                }
            }

            wp_cache_delete('HYOKA_site_review_stats', 'HYOKA_reviews_v2');
            wp_cache_delete('HYOKA_site_aggregate_rating', 'HYOKA_reviews_v2');
        }
    }

    /**
     * @return string[]
     */
    public static function getActiveProductPageWidgetIds(): array
    {
        $active = [];
        foreach (ProductReview::getProductPageWidgetIds() as $widget_id) {
            if (self::isWidgetActive($widget_id)) {
                $active[] = $widget_id;
            }
        }

        return $active;
    }

    /**
     * @return string[]
     */
    public static function getActiveFooterWidgetIds(): array
    {
        $active = [];
        foreach (ProductReview::getFooterWidgetIds() as $widget_id) {
            if (self::isWidgetActive($widget_id)) {
                $active[] = $widget_id;
            }
        }

        return $active;
    }

    /**
     * Live widget markup for uncached storefront requests (mount-point hydration).
     *
     * @param array<string, mixed> $params
     * @return array{active: string[], widgets: array<string, string>, footer_active: string[], footer_widgets: array<string, string>}
     */
    public static function fetchProductWidgetMarkup(array $params): array
    {
        $product_id = absint($params['product_id'] ?? 0);
        $requested  = [];

        if (! empty($params['widget_ids']) && is_array($params['widget_ids'])) {
            foreach ($params['widget_ids'] as $widget_id) {
                $widget_id = sanitize_key((string) $widget_id);
                if ($widget_id !== '' && self::isValidWidgetId($widget_id)) {
                    $requested[] = $widget_id;
                }
            }
        }

        $requested = array_values(array_unique($requested));
        $active    = self::getActiveProductPageWidgetIds();
        $widgets   = [];
        $candidates = $requested !== [] ? $requested : ProductReview::getProductPageWidgetIds();

        foreach ($candidates as $widget_id) {
            if (! in_array($widget_id, $active, true)) {
                continue;
            }

            $html = ProductReview::buildWidgetHtml($widget_id, $product_id);
            if ($html !== '') {
                $widgets[$widget_id] = $html;
            }
        }

        $footer_active  = self::getActiveFooterWidgetIds();
        $footer_widgets = [];
        foreach ($footer_active as $widget_id) {
            $html = ProductReview::buildWidgetHtml($widget_id, 0);
            if ($html !== '') {
                $footer_widgets[$widget_id] = $html;
            }
        }

        return [
            'active'          => $active,
            'widgets'         => $widgets,
            'footer_active'   => $footer_active,
            'footer_widgets'  => $footer_widgets,
        ];
    }

    /**
     * Admin edit of core review fields (rating, title, content, status).
     *
     * @param array<string, mixed> $fields
     */

    public static function updateReview(int $review_id, array $fields): bool
    {
        $review_id = absint($review_id);
        if ($review_id <= 0) {
            return false;
        }

        $model = new Review();
        $row   = $model->findById($review_id);
        if (! is_array($row)) {
            return false;
        }

        $update = [];
        $now_gmt = current_time('mysql', true);
        $admin_user_id = (int) get_current_user_id();
        $did_edit_content = false;

        $old_content_decoded = Review::decodeReviewContent($row);
        $old_title  = $old_content_decoded['title'];
        $old_text   = $old_content_decoded['text'];
        $old_author = $old_content_decoded['author'];

        if (array_key_exists('rating', $fields)) {
            $update['rating'] = max(1, min(5, absint($fields['rating'])));
        }

        $content_arr = null;
        if (array_key_exists('title', $fields) || array_key_exists('content', $fields) || array_key_exists('author', $fields)) {
            $content_arr = $old_content_decoded;

            if (array_key_exists('content', $fields)) {
                $next_text = sanitize_textarea_field((string) $fields['content']);
                $content_arr['text'] = $next_text;
                if (trim($next_text) !== trim($old_text)) {
                    $did_edit_content = true;
                }
            }
            if (array_key_exists('title', $fields)) {
                $next_title = sanitize_text_field((string) $fields['title']);
                $content_arr['title'] = $next_title;
                if (trim($next_title) !== trim($old_title)) {
                    $did_edit_content = true;
                }
            }
            if (array_key_exists('author', $fields)) {
                $next_author = sanitize_text_field((string) $fields['author']);
                $content_arr['author'] = $next_author;
                if (trim($next_author) !== trim($old_author)) {
                    $did_edit_content = true;
                }
            }
        }

        if ($content_arr !== null) {
            $update['content'] = self::encodeReviewContent($content_arr);
        }

        if (array_key_exists('status', $fields)) {
            $update['status'] = Review::normalizeStatus((string) $fields['status']);
        }

        if ($update === []) {
            return false;
        }

        $update['updated_at'] = $now_gmt;

        if ($did_edit_content) {
            $settings = UserReplies::settings($row);

            $meta = [];
            if (isset($settings['edit_meta']) && is_array($settings['edit_meta'])) {
                $meta = $settings['edit_meta'];
            }

            $meta['edited_at']  = $now_gmt;
            $meta['edited_by']  = $admin_user_id;
            $meta['edit_count'] = (int) ($meta['edit_count'] ?? 0) + 1;

            $settings['edit_meta'] = $meta;
            $settings_json         = wp_json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($settings_json === false) {
                return false;
            }
            $update['settings'] = $settings_json;
        }

        $success = $model->update($review_id, $update);
        if ($success) {
            self::clearReviewCache(absint($row['product_id'] ?? 0));

            if ($did_edit_content) {
                $product_id = absint($row['product_id'] ?? 0);
                $email = isset($row['email']) ? (string) $row['email'] : '';
                $email = strtolower(trim(sanitize_email($email)));

                $new_title = isset($content_arr['title']) ? (string) $content_arr['title'] : $old_title;
                $new_text  = isset($content_arr['text']) ? (string) $content_arr['text'] : $old_text;

                $user = $admin_user_id > 0 ? get_userdata($admin_user_id) : null;
                $admin_name = $user ? (string) $user->display_name : '';

                $entry = [
                    'type'          => 'review_edit',
                    'review_id'      => $review_id,
                    'product_id'     => $product_id,
                    'email'          => $email,
                    'admin_user_id'  => $admin_user_id,
                    'admin_name'     => $admin_name,
                    'edited_at'      => $now_gmt,
                    'before'         => [
                        'title'   => $old_title,
                        'content' => $old_text,
                    ],
                    'after'          => [
                        'title'   => $new_title,
                        'content' => $new_text,
                    ],
                ];

                if ($product_id > 0 && $email !== '') {
                    Customer::appendAuditForReviewEdit($product_id, $email, $entry, $new_title, $new_text);
                }
            }
        }

        return $success;
    }

    // —— Widget settings (store: Review, handle: here) ——

    /**
     * @param mixed $status Raw status from storage.
     */
    private static function isWidgetStatusActive($status): bool
    {
        return in_array(
            strtolower(trim((string) $status)),
            ['active', '1', 'true', 'yes', 'on'],
            true
        );
    }

    public static function isWidgetActive(string $widget_id): bool
    {
        $widget_id = sanitize_key($widget_id);
        if ($widget_id === '') {
            return false;
        }

        $statuses = self::getAllWidgetStatuses();

        return ($statuses[$widget_id] ?? 'inactive') === 'active';
    }

    /** @var array<string, string>|null */
    private static $widget_statuses_cache = null;

    /**
     * @return array<string, string> widget_id => active|inactive for every catalog widget.
     */
    public static function getAllWidgetStatuses(): array
    {
        if (self::$widget_statuses_cache !== null) {
            return self::$widget_statuses_cache;
        }

        $saved = Review::getWidgetStatuses();
        $all   = [];

        foreach (ProductReview::getWidgetIds() as $id) {
            $raw      = $saved[$id] ?? 'inactive';
            $all[$id] = self::isWidgetStatusActive($raw) ? 'active' : 'inactive';
        }

        self::$widget_statuses_cache = $all;

        return $all;
    }

    public static function getWidgetPlacement(string $widget_id): string
    {
        $placements = Review::getWidgetPlacements();
        $placement  = $placements[$widget_id] ?? '';

        return strtolower((string) $placement) === 'shortcode' ? 'shortcode' : '';
    }

    public static function getWidgetStatusLabel(string $widget_id): string
    {
        return self::isWidgetActive($widget_id) ? 'Active' : 'Inactive';
    }

    public static function getWidgetStyle(string $widget_id): array
    {
        $all      = Review::getWidgetStyles();
        $defaults = Wp::getDefaultStyle($widget_id);
        if (! isset($all[$widget_id]) || ! is_array($all[$widget_id])) {
            return $defaults;
        }

        $style = array_merge($defaults, $all[$widget_id]);
        // Arbitrary CSS insertion is not allowed (WordPress plugin guidelines).
        unset($style['custom_css']);

        return $style;
    }

    public static function saveWidgetStyle(string $widget_id, array $style): bool
    {
        $all      = Review::getWidgetStyles();
        $existing = (isset($all[$widget_id]) && is_array($all[$widget_id])) ? $all[$widget_id] : [];
        $merged   = array_merge($existing, $style);
        // Strip legacy arbitrary CSS so it cannot persist or be re-rendered.
        unset($merged['custom_css']);
        $all[$widget_id] = $merged;

        $success = Review::saveWidgetStyles($all);

        if ($success) {
            update_option('hyoka_widget_last_update', time());
            self::clearReviewCache();
        }

        return $success;
    }

    public static function isValidWidgetId(string $widget_id): bool
    {
        if ($widget_id === '') {
            return false;
        }

        return in_array($widget_id, ProductReview::getWidgetIds(), true);
    }

    public static function getWidgetSettingsFromPost(): array
    {
        // Request bag is bound in Ajax::verifyNonce() after check_ajax_referer().
        // No $_REQUEST / $_GET fallback — that path is unused and triggers Plugin Check.
        $widget_id = Wp::postKey('widget_id');

        $enabled = null;
        if (Wp::hasPost('enabled')) {
            // Accept 1/0 (admin UI) and true/false strings (older bundles / FormData).
            $enabled = Wp::postBoolean('enabled', false);
        }

        $placement = null;
        if (Wp::hasPost('placement')) {
            $placement = Wp::postText('placement');
        }

        return [
            'widget_id' => $widget_id,
            'enabled'   => $enabled,
            'placement' => $placement,
        ];
    }

    /**
     * @param array{widget_id: string, enabled: ?bool, placement: ?string} $data
     * @return array{ok: bool, message?: string, code?: string, status?: string, enabled?: bool, placement?: string}
     */
    public static function updateWidgetSettings(array $data): array
    {
        $widget_id = $data['widget_id'] ?? '';
        $enabled   = $data['enabled'] ?? null;
        $placement = $data['placement'] ?? null;

        if (! self::isValidWidgetId($widget_id)) {
            return [
                'ok'      => false,
                'message' => 'Unknown widget_id (not in catalog).',
                'code'    => 'unknown_widget',
            ];
        }

        if ($enabled === null && $placement === null) {
            return [
                'ok'      => false,
                'message' => 'Missing enabled or placement in the request.',
                'code'    => 'missing_fields',
            ];
        }

        $success = true;

        if ($enabled !== null || $placement !== null) {
            $settings   = Review::getWidgetSettings();
            $statuses   = is_array($settings['statuses'] ?? null) ? $settings['statuses'] : [];
            $placements = is_array($settings['placements'] ?? null) ? $settings['placements'] : [];

            foreach (ProductReview::getWidgetIds() as $id) {
                if (! isset($statuses[$id])) {
                    $statuses[$id] = 'inactive';
                }
            }

            if ($enabled !== null) {
                $statuses[$widget_id] = $enabled ? 'active' : 'inactive';

                if ($enabled || $placement === null) {
                    unset($placements[$widget_id]);
                }
            }

            if ($placement !== null) {
                if (strtolower($placement) === 'shortcode') {
                    $placements[$widget_id] = 'shortcode';
                } else {
                    unset($placements[$widget_id]);
                }
            }

            $settings['statuses']   = $statuses;
            $settings['placements'] = $placements;
            $success                = Review::saveWidgetSettings($settings);

            if ($success) {
                self::$widget_statuses_cache = null;
                update_option('hyoka_widget_last_update', time());
                self::clearReviewCache();
            }
        }

        if (! $success) {
            global $wpdb;
            $db_hint = (defined('WP_DEBUG') && WP_DEBUG && $wpdb->last_error)
                ? ' ' . $wpdb->last_error
                : '';

            return [
                'ok'      => false,
                'message' => 'Could not save widget settings. Please try again.' . $db_hint,
                'code'    => 'save_failed',
            ];
        }

        if ($enabled !== null) {
            if (self::isWidgetActive($widget_id) !== (bool) $enabled) {
                return [
                    'ok'      => false,
                    'message' => 'Widget status did not persist. Please try again.',
                    'code'    => 'persist_failed',
                ];
            }
        }

        if ($enabled === null) {
            $message = 'Widget settings saved.';
        } else {
            $message = $enabled
                ? 'Widget activated successfully.'
                : 'Widget deactivated successfully.';
        }

        return [
            'ok'        => true,
            'message'   => $message,
            'status'    => self::getWidgetStatusLabel($widget_id),
            'enabled'   => self::isWidgetActive($widget_id),
            'placement' => self::getWidgetPlacement($widget_id),
        ];
    }

    /**
     * Admin reviews table response $data for wp_send_json_success.
     *
     * @return array{reviews: array, total: int, counts: array, page: int, per_page: int}
     */
    public static function getReviewsForAdmin(): array
    {
        // Reads from Wp request bag bound in Ajax::verifyNonce() after check_ajax_referer().
        $settings           = EmailSender::getSettings();
        $default_per_page   = max(1, min(100, (int) ($settings['reviews_per_page'] ?? 10)));
        $requested_per_page = Wp::postInt('per_page');
        $per_page           = $requested_per_page > 0
            ? min(500, max(1, $requested_per_page))
            : $default_per_page;

        $view_raw = Wp::postKey('view');
        $view     = in_array($view_raw, ['questions', 'store_reviews', 'replies', 'customer_replies'], true)
            ? $view_raw
            : '';

        $args = [
            'status'   => Wp::postText('status', 'All'),
            'page'     => max(1, Wp::postInt('page', 1)),
            'per_page' => $per_page,
            'search'   => Wp::postText('search'),
            'view'     => $view,
            'rating'   => Wp::postInt('rating'),
            'orderby'  => Wp::postKey('orderby', 'created_at'),
            'order'    => Wp::postText('order', 'DESC'),
        ];

        $review_model = new Review();
        if ($view === 'customer_replies') {
            $list = (new UserReply())->getFilteredPendingList($args);
        } else {
            $list = $review_model->getFilteredList($args);
        }

        $counts = $review_model->getCountsByStatus('');
        $counts['CustomerReplies'] = UserReply::countPendingVisitorReplies();
        $counts['EmailDetails']    = Customer::countCustomers();

        return [
            'reviews'  => self::formatReviewsForAdmin($list['data']),
            'total'    => $list['total'],
            'counts'   => $counts,
            'page'     => $list['page'],
            'per_page' => $list['per_page'],
        ];
    }

    public static function bulkUpdateReviewStatus(array $review_ids, string $status): int
    {
        $count = 0;
        foreach ($review_ids as $id) {
            if (ProductReview::publishReview((int) $id, $status)) {
                $count++;
            }
        }

        return $count;
    }

    public static function bulkDeleteReviews(array $review_ids): int
    {
        $count = 0;
        foreach ($review_ids as $id) {
            if (self::deleteReview((int) $id)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Frontend list can use a different product scope than summary stats (e.g. site-wide list + product stats).
     *
     * @return array{reviews: array, count: int, stats: array, page: int, per_page: int}
     */
    public static function getFrontendReviewsPage(
        int $reviews_product_id,
        int $stats_product_id,
        int $page,
        int $per_page = 10,
        int $rating = 0
    ): array {
        $page     = max(1, $page);
        $per_page = max(1, $per_page);
        $rating   = max(0, min(5, absint($rating)));

        $list_args = [
            'product_id' => $reviews_product_id,
            'limit'      => $per_page,
            'status'     => 'approved',
            'page'       => $page,
        ];
        if ($rating > 0) {
            $list_args['rating'] = $rating;
        }

        $reviews = Review::fetchReviewList($list_args);
        $stats_scope = $stats_product_id > 0
            ? $stats_product_id
            : ($reviews_product_id > 0 ? $reviews_product_id : 0);
        $stats_args = ['product_reviews_only' => true];
        if ($stats_scope > 0) {
            $stats_args['product_id'] = $stats_scope;
        }
        $stats = Review::fetchReviewStats($stats_args);

        if ($rating > 0) {
            $count_args = ['status' => 'approved', 'rating' => $rating];
            if ($reviews_product_id > 0) {
                $related = self::getRelatedProductIds($reviews_product_id);
                if (count($related) > 1) {
                    $count_args['product_ids'] = $related;
                } else {
                    $count_args['product_id'] = $reviews_product_id;
                }
            }
            $total = (new Review())->countMany($count_args);
        } elseif ($reviews_product_id > 0) {
            $list_stats_args = ['product_id' => $reviews_product_id, 'product_reviews_only' => true];
            $list_stats      = Review::fetchReviewStats($list_stats_args);
            $total           = (int) ($list_stats['count'] ?? 0);
        } else {
            $list_stats = Review::fetchReviewStats(['product_reviews_only' => true]);
            $total      = (int) ($list_stats['count'] ?? 0);
        }

        return [
            'reviews'  => $reviews,
            'count'    => $total,
            'stats'    => $stats,
            'page'     => $page,
            'per_page' => $per_page,
            'rating'   => $rating,
        ];
    }

    /**
     * @return array{ok: bool, message: string, likes?: int}
     */
    public static function likeReview(int $review_id): array
    {
        if ($review_id <= 0) {
            return ['ok' => false, 'message' => 'Invalid review ID.'];
        }

        $model = new Review();
        $row   = $model->findById($review_id);
        $email = is_array($row) ? (string) ($row['email'] ?? '') : '';
        if (! is_array($row) || Review::isSystemEmail($email)) {
            return ['ok' => false, 'message' => 'Review not found.'];
        }

        if (! $model->incrementLikes($review_id)) {
            return ['ok' => false, 'message' => 'Failed to like review.'];
        }

        $row = $model->findById($review_id);
        if (! is_array($row)) {
            return ['ok' => false, 'message' => 'Review not found.'];
        }

        self::clearReviewCache(absint($row['product_id'] ?? 0));

        return [
            'ok'      => true,
            'message' => 'Review liked.',
            'likes'   => (int) ($row['likes'] ?? 0),
        ];
    }

    /**
     * Append uploaded media items to an existing review.
     *
     * @param array<int, array<string, mixed>> $new_items
     */
    public static function appendReviewMedia(int $review_id, array $new_items): bool
    {
        $review_id = absint($review_id);
        if ($review_id <= 0 || $new_items === []) {
            return false;
        }

        $model = new Review();
        $row   = $model->findById($review_id);
        if (! is_array($row)) {
            return false;
        }

        $existing_raw = Wp::parseStoredMediaJson($row['media'] ?? '');

        $merged = Meta::normalizeMediaItems(array_merge($existing_raw, $new_items));
        if ($merged === []) {
            return false;
        }

        $media_json = wp_json_encode($merged, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($media_json === false) {
            return false;
        }

        $success = $model->update($review_id, [
            'media'      => $media_json,
            'updated_at' => current_time('mysql', true),
        ]);

        if ($success) {
            self::clearReviewCache(absint($row['product_id'] ?? 0));
        }

        return $success;
    }

    // —— Row shaping for admin / frontend ——

    /**
     * JSON for hyoka_reviews.content (omits title when empty).
     *
     * @param array{text?: string, title?: string, author?: string} $parts
     */
    public static function encodeReviewContent(array $parts): string
    {
        $payload = [
            'text'   => (string) ($parts['text'] ?? ''),
            'author' => sanitize_text_field((string) ($parts['author'] ?? '')),
        ];
        $title = sanitize_text_field((string) ($parts['title'] ?? ''));
        if ($title !== '') {
            $payload['title'] = $title;
        }

        $json = wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($json) ? $json : '';
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array<string, mixed>>
     */
    protected static function formatReviewsForAdmin(array $rows): array
    {
        $product_ids = array_unique(array_filter(array_map(static function ($r) {
            return absint($r['product_id'] ?? 0);
        }, $rows)));

        $review_ids = array_unique(array_filter(array_map(static function ($r) {
            return absint($r['id'] ?? 0);
        }, $rows)));

        $product_data         = self::getProductsByIds($product_ids);
        $source_data          = self::getReviewSourcesByIds($review_ids);
        $customer_source_data = self::getReviewSourcesFromCustomerByIds($review_ids);
        $stats_data           = self::getProductStatsByIds($product_ids);

        return array_map(static function ($r) use ($product_data, $source_data, $customer_source_data, $stats_data) {
            $product_id = absint($r['product_id'] ?? 0);
            $review_id  = absint($r['id'] ?? 0);
            $p_data     = $product_data[$product_id] ?? [];
            if ($product_id > 0) {
                $p_data['id']           = $product_id;
                $p_data['url']          = get_permalink($product_id) ?: '';
                $p_data['avg_rating']   = (float) ($stats_data[$product_id]['average'] ?? 0);
                $p_data['review_count'] = (int) ($stats_data[$product_id]['count'] ?? 0);
            }

            return self::formatReviewRow(
                $r,
                $p_data,
                $source_data[$review_id] ?? '',
                $customer_source_data[$review_id] ?? ''
            );
        }, $rows);
    }

    /**
     * @param array<string, mixed> $review
     * @return array<string, mixed>
     */
    public static function attachProductMeta(array $review): array
    {
        $review['id'] = absint($review['id'] ?? 0);
        $product_id = absint($review['product_id'] ?? 0);
        $review['product_title'] = $product_id ? get_the_title($product_id) : '';
        $review['product_link']  = $product_id ? get_permalink($product_id) : '';
        $review['product_image'] = self::resolveProductImageUrl($product_id);

        $content_data = Review::decodeReviewContent($review);
        if ($content_data['text'] !== '' || $content_data['title'] !== '' || $content_data['author'] !== '') {
            $review['content'] = $content_data['text'] !== '' ? $content_data['text'] : ($review['content'] ?? '');
            $review['author']  = $content_data['author'] !== '' ? $content_data['author'] : ($review['author'] ?? '');
            $review['title']   = $content_data['title'] !== '' ? $content_data['title'] : ($review['title'] ?? '');
        }

        $review['date']  = gmdate('M d, Y', strtotime($review['created_at'] ?? 'now'));
        $review['likes'] = (int) ($review['likes'] ?? 0);

        $review['user_replies']  = UserReplies::forStorefront($review);
        $review['replies_count'] = count($review['user_replies']);

        return $review;
    }

    /**
     * Build carousel slides from approved reviews and their image/video attachments.
     *
     * @param array<int, array<string, mixed>> $reviews
     * @param string[]                         $allowed_types image, video
     * @return array<int, array{review: array<string, mixed>, media: array{url: string, type: string, id: int}}>
     */
    public static function buildMediaCarouselSlides(array $reviews, array $allowed_types, int $max_slides = 6): array
    {
        $allowed = [];
        foreach ($allowed_types as $type) {
            $type = sanitize_key((string) $type);
            if ($type !== '') {
                $allowed[] = $type;
            }
        }
        if ($allowed === []) {
            return [];
        }

        $max_slides = max(1, $max_slides);
        $slides     = [];

        foreach ($reviews as $review) {
            if (! is_array($review)) {
                continue;
            }
            if (Review::normalizeStatus((string) ($review['status'] ?? '')) !== 'approved') {
                continue;
            }

            $media = Wp::parseStoredMediaJson($review['media'] ?? '');
            foreach ($media as $item) {
                if (! is_array($item)) {
                    continue;
                }
                $type = sanitize_key((string) ($item['type'] ?? 'image'));
                if (! in_array($type, $allowed, true)) {
                    continue;
                }
                $url = (string) ($item['url'] ?? '');
                if ($url === '') {
                    continue;
                }

                $slides[] = [
                    'review' => $review,
                    'media'  => [
                        'url'  => $url,
                        'type' => $type,
                        'id'   => absint($item['id'] ?? 0),
                    ],
                ];

                if (count($slides) >= $max_slides) {
                    return $slides;
                }
            }
        }

        return $slides;
    }

    /**
     * @param array<string, mixed> $r
     * @param array<string, mixed> $p_data
     * @return array<string, mixed>
     */
    protected static function formatReviewRow(array $r, array $p_data = [], string $import_source = '', string $customer_source = ''): array
    {
        $content_data = Review::decodeReviewContent($r);
        $text   = $content_data['text'] !== '' ? $content_data['text'] : ($r['content'] ?? '');
        $title  = $content_data['title'];
        $author = $content_data['author'] !== '' ? $content_data['author'] : 'Anonymous';

        $words    = array_filter(explode(' ', $author));
        $initials = strtoupper(substr($words[0] ?? 'A', 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));

        $settings = UserReplies::settings($r);

        $meta = (isset($settings['edit_meta']) && is_array($settings['edit_meta'])) ? $settings['edit_meta'] : [];
        $edited_at = isset($meta['edited_at']) ? (string) $meta['edited_at'] : '';
        $is_edited = $edited_at !== '';

        $edited_by_id = isset($meta['edited_by']) ? (int) $meta['edited_by'] : 0;
        $edited_by_name = '';
        if ($edited_by_id > 0) {
            $user = get_userdata($edited_by_id);
            if ($user instanceof \WP_User) {
                $edited_by_name = (string) $user->display_name;
            }
        }

        $media = Wp::parseStoredMediaJson($r['media'] ?? '');
        $email = sanitize_email((string) ($r['email'] ?? ''));
        $customer_summary = $email !== '' ? Customer::getCustomerSummaryByEmail($email) : [
            'orders_count'  => 0,
            'reviews_count' => 0,
        ];

        $product_id   = absint($r['product_id'] ?? 0);
        $store_review = trim((string) ($r['store_review'] ?? ''));
        if ($store_review === '' && $product_id === 0 && trim((string) ($r['question'] ?? '')) === '') {
            $store_review = trim($text);
        }

        return [
            'id'       => $r['id'],
            'reviewer' => [
                'initials' => $initials ?: 'A',
                'name'     => $author,
                'verified' => ! empty($r['is_verified']),
                'email'    => $email,
            ],
            'customer' => [
                'orders_count'  => (int) ($customer_summary['orders_count'] ?? 0),
                'reviews_count' => (int) ($customer_summary['reviews_count'] ?? 0),
            ],
            'product' => [
                'id'           => absint($p_data['id'] ?? ($r['product_id'] ?? 0)),
                'image'        => $p_data['image'] ?? '',
                'name'         => $p_data['name'] ?? 'Unknown Product',
                'sku'          => $p_data['sku'] ?? '',
                'url'          => (string) ($p_data['url'] ?? ''),
                'avg_rating'   => (float) ($p_data['avg_rating'] ?? 0),
                'review_count' => (int) ($p_data['review_count'] ?? 0),
            ],
            'review' => [
                'title'       => $title,
                'content'     => $text,
                'attachments' => count($media),
                'comments'    => UserReplies::approvedCount($r),
            ],
            'media'                => $media,
            'pending_user_replies' => UserReplies::pendingCount($r),
            'store_review' => $store_review,
            'question'     => $r['question'] ?? '',
            'reply'        => $r['reply'] ?? '',
            'user_replies' => UserReplies::forAdmin($r),
            'rating'       => (int) ($r['rating'] ?? 0),
            'likes'        => (int) ($r['likes'] ?? 0),
            'status'       => ucfirst($r['status'] ?? 'pending'),
            'source'       => self::resolveReviewSourceLabel($r, $import_source, $customer_source),
            'date'         => gmdate('F j, Y', strtotime($r['created_at'] ?? 'now')),
            'created_at'   => (string) ($r['created_at'] ?? ''),
            'edited'       => $is_edited,
            'edited_at'    => $edited_at,
            'edited_by'    => $edited_by_id,
            'edited_by_name' => $edited_by_name,
            'edit_count'   => isset($meta['edit_count']) ? (int) $meta['edit_count'] : 0,
        ];
    }

    /**
     * @param array<int, int> $review_ids
     * @return array<int, string>
     */
    protected static function getReviewSourcesByIds(array $review_ids): array
    {
        $review_ids = array_values(array_unique(array_filter(array_map('absint', $review_ids))));
        if ($review_ids === []) {
            return [];
        }

        global $wpdb;
        $placeholders = implode(',', array_fill(0, count($review_ids), '%d'));
        $table        = ImportRecord::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table from getTableName(); IN() placeholders are fixed %d tokens built before prepare().
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT review_id, source FROM {$table} WHERE review_id IN ($placeholders)",
                ...$review_ids
            ),
            ARRAY_A
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        $sources = [];
        if (! is_array($results)) {
            return $sources;
        }

        foreach ($results as $row) {
            $review_id = absint($row['review_id'] ?? 0);
            if ($review_id <= 0) {
                continue;
            }
            $sources[$review_id] = sanitize_key((string) ($row['source'] ?? ''));
        }

        return $sources;
    }

    /**
     * Resolve widget/email source from hyoka_customer.review snapshots.
     *
     * @param array<int, int> $review_ids
     * @return array<int, string>
     */
    protected static function getReviewSourcesFromCustomerByIds(array $review_ids): array
    {
        $review_ids = array_values(array_unique(array_filter(array_map('absint', $review_ids))));
        if ($review_ids === []) {
            return [];
        }

        global $wpdb;

        $wanted  = array_flip($review_ids);
        $sources = [];
        $likes   = array_map(
            static function (int $review_id): string {
                return '%"review_id":' . $review_id . '%';
            },
            $review_ids
        );
        $placeholders = implode(' OR ', array_fill(0, count($likes), 'review LIKE %s'));
        $table        = Customer::getTableName();

        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table from getTableName(); LIKE placeholders are fixed %s tokens built before prepare().
        $rows = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT review FROM {$table} WHERE ($placeholders)",
                ...$likes
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        if (! is_array($rows)) {
            return $sources;
        }

        foreach ($rows as $raw) {
            if (! is_string($raw) || trim($raw) === '') {
                continue;
            }
            $decoded = json_decode($raw, true);
            if (! is_array($decoded)) {
                continue;
            }
            $review_id = absint($decoded['review_id'] ?? 0);
            if ($review_id <= 0 || ! isset($wanted[$review_id])) {
                continue;
            }
            $source = sanitize_key((string) ($decoded['source'] ?? ''));
            if ($source !== '') {
                $sources[$review_id] = $source;
            }
        }

        return $sources;
    }

    /**
     * @param array<string, mixed> $review
     */
    protected static function resolveReviewSourceLabel(array $review, string $import_source = '', string $customer_source = ''): string
    {
        if ($import_source !== '') {
            return self::formatReviewSourceLabel($import_source);
        }

        if ($customer_source !== '') {
            return self::formatReviewSourceLabel($customer_source);
        }

        if (! empty($review['is_verified'])) {
            return 'Email';
        }

        return 'Widget';
    }

    protected static function formatReviewSourceLabel(string $source): string
    {
        $source = sanitize_key($source);
        $labels = [
            'widget' => 'Widget',
            'invite' => 'Email',
            'email'  => 'Email',
            'manual' => 'Manual',
            'csv'    => 'Import',
        ];

        if (isset($labels[$source])) {
            return $labels[$source];
        }

        if ($source === '') {
            return 'Widget';
        }

        return ucwords(str_replace(['_', '-'], ' ', $source));
    }

    /**
     * @param array<int, int> $product_ids
     * @return array<int, array{average: float, count: int}>
     */
    protected static function getProductStatsByIds(array $product_ids): array
    {
        $stats = [];
        foreach ($product_ids as $product_id) {
            $product_id = absint($product_id);
            if ($product_id <= 0) {
                continue;
            }
            $row = Review::fetchReviewStats(['product_id' => $product_id]);
            $stats[$product_id] = [
                'average' => (float) ($row['average'] ?? 0),
                'count'   => (int) ($row['count'] ?? 0),
            ];
        }

        return $stats;
    }

    protected static function resolveProductImageUrl(int $product_id): string
    {
        if ($product_id <= 0) {
            return '';
        }

        $url = get_the_post_thumbnail_url($product_id, 'thumbnail');
        if (is_string($url) && $url !== '') {
            return esc_url_raw(wp_unslash($url));
        }

        if (! function_exists('wc_get_product')) {
            return '';
        }

        $product = wc_get_product($product_id);
        if (! $product) {
            return '';
        }

        $parent_id = (int) $product->get_parent_id();
        if ($parent_id > 0) {
            $parent_url = get_the_post_thumbnail_url($parent_id, 'thumbnail');
            if (is_string($parent_url) && $parent_url !== '') {
                return esc_url_raw(wp_unslash($parent_url));
            }
        }

        $image_id = (int) $product->get_image_id();
        if ($image_id > 0) {
            $image_url = wp_get_attachment_image_url($image_id, 'thumbnail');
            if (is_string($image_url) && $image_url !== '') {
                return esc_url_raw(wp_unslash($image_url));
            }
        }

        return '';
    }

    /**
     * @param array<int, int> $product_ids
     * @return array<int, array{name: string, sku: string, image: string}>
     */
    protected static function getProductsByIds(array $product_ids): array
    {
        $product_ids = array_values(array_unique(array_filter(array_map('absint', $product_ids))));
        if ($product_ids === []) {
            return [];
        }

        global $wpdb;
        $placeholders = implode(',', array_fill(0, count($product_ids), '%d'));

        // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Dynamic IN() placeholders are generated entirely from %d tokens before prepare(); core tables via $wpdb->posts/$wpdb->postmeta.
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT p.ID, p.post_title AS name, pm.meta_value AS sku
                FROM {$wpdb->posts} p
                LEFT JOIN {$wpdb->postmeta} pm ON (p.ID = pm.post_id AND pm.meta_key = '_sku')
                WHERE p.ID IN ($placeholders)",
                ...$product_ids
            ),
            ARRAY_A
        );
        // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

        $batch_data = [];
        if (! is_array($results)) {
            return $batch_data;
        }

        foreach ($results as $row) {
            $product_id = absint($row['ID'] ?? 0);
            $batch_data[$product_id] = [
                'name'  => $row['name'] ?? 'Unknown Product',
                'sku'   => $row['sku'] ?? '',
                'image' => self::resolveProductImageUrl($product_id),
            ];
        }

        return $batch_data;
    }

    /**
     * @param array<string, mixed> $params
     * @return array
     */
    public static function fetchProductReviews(array $params): array
    {
        $product_id       = isset($params['product_id']) ? absint($params['product_id']) : Wp::postInt('product_id');
        $stats_product_id = isset($params['stats_product_id']) ? absint($params['stats_product_id']) : Wp::postInt('stats_product_id', $product_id);
        $page             = isset($params['page']) ? max(1, absint($params['page'])) : max(1, Wp::postInt('page', 1));
        $per_page         = isset($params['per_page']) ? max(1, absint($params['per_page'])) : max(1, Wp::postInt('per_page', 10));
        $rating           = isset($params['rating']) ? absint($params['rating']) : Wp::postInt('rating');

        return self::getFrontendReviewsPage($product_id, $stats_product_id, $page, $per_page, $rating);
    }

    /**
     * @param array<string, mixed> $params
     * @return array{ok: bool, message: string, likes?: int}
     */
    public static function handleLikeReviewRequest(array $params): array
    {
        $review_id = isset($params['review_id']) ? absint($params['review_id']) : Wp::postInt('review_id');
        return self::likeReview($review_id);
    }
}
