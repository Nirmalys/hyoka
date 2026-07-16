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

use Hyoka\App\Helper\ImportSanitizer;

defined('ABSPATH') || exit;

class ImportRecord
{
    protected string $table;

    public function __construct()
    {
        $this->table = self::getTableName();
    }

    /**
     * Prefixed import table name (plugin-owned identifier, not user input).
     */
    public static function getTableName(): string
    {
        global $wpdb;

        return $wpdb->prefix . 'hyoka_import';
    }

    /**
     * $wpdb format strings for known import columns.
     * Keep $int_cols in sync when adding integer columns to the import schema.
     *
     * @param array<string, mixed> $data Column map.
     * @return array<int, string>
     */
    private function columnFormats(array $data): array
    {
        $int_cols = ['product_id', 'order_id', 'rating', 'is_verified', 'review_id'];
        $formats  = [];
        foreach (array_keys($data) as $col) {
            $formats[] = in_array($col, $int_cols, true) ? '%d' : '%s';
        }

        return $formats;
    }

    /**
     * @param array<string, mixed> $normalized Normalized review array.
     * @param string               $job_id
     * @param int                  $review_id  Live review ID after promotion.
     */
    public function createFromNormalized(array $normalized, string $job_id, int $review_id = 0): int
    {
        global $wpdb;

        $job_id     = sanitize_text_field($job_id);
        $product_id = absint($normalized['product_id'] ?? 0);
        $is_store   = $product_id <= 0;
        $body       = sanitize_textarea_field((string) ($normalized['content'] ?? ''));
        $author     = sanitize_text_field((string) ($normalized['reviewer_name'] ?? ''));

        $content_json = Reviewing::encodeReviewContent([
            'text'   => $is_store ? '' : $body,
            'title'  => (string) ($normalized['title'] ?? ''),
            'author' => $author !== '' ? $author : __('Imported reviewer', 'hyoka'),
        ]);

        $media = [];
        if (! empty($normalized['media']) && is_array($normalized['media'])) {
            foreach ($normalized['media'] as $item) {
                if (! is_array($item) || empty($item['url'])) {
                    continue;
                }
                $media[] = [
                    'url'  => esc_url_raw((string) $item['url']),
                    'type' => sanitize_key((string) ($item['type'] ?? 'image')) ?: 'image',
                ];
            }
        }

        $email      = sanitize_email((string) ($normalized['reviewer_email'] ?? ''));
        $email_hash = $email !== '' ? hash('sha256', strtolower($email)) : '';

        $import_meta = is_array($normalized['import_meta'] ?? null) ? $normalized['import_meta'] : [];
        $import_meta['job_id']      = sanitize_text_field($job_id);
        $import_meta['imported_at'] = current_time('mysql', true);

        $settings = wp_json_encode([
            'source'         => sanitize_key((string) ($normalized['source'] ?? 'csv')),
            'source_type'    => sanitize_key((string) ($normalized['source_type'] ?? 'file')),
            'verified_buyer' => ! empty($normalized['verified_buyer']) ? 1 : 0,
            'is_featured'    => ! empty($normalized['is_featured']) ? 1 : 0,
            'import_meta'    => $import_meta,
        ]);
        if ($settings === false) {
            return 0;
        }

        $media_json = null;
        if ($media !== []) {
            $media_json = wp_json_encode($media, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($media_json === false) {
                return 0;
            }
        }

        $import_meta_json = wp_json_encode($import_meta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($import_meta_json === false) {
            return 0;
        }

        $now        = current_time('mysql', true);
        $created_at = ImportSanitizer::parseReviewDate((string) ($normalized['created_at'] ?? ''), false)['value'];

        $row = [
            'import_job_id'        => sanitize_text_field($job_id),
            'batch_status'         => $review_id > 0 ? 'imported' : 'queued',
            'source'               => sanitize_key((string) ($normalized['source'] ?? 'csv')),
            'source_type'          => sanitize_key((string) ($normalized['source_type'] ?? 'file')),
            'product_id'           => $product_id,
            'order_id'             => absint($normalized['order_id'] ?? 0),
            'rating'               => max(1, min(5, absint($normalized['rating'] ?? 5))),
            'content'              => $content_json,
            'store_review'         => $is_store ? $body : '',
            'status'               => 'pending',
            'is_verified'          => ! empty($normalized['verified_buyer']) ? 1 : 0,
            'media'                => $media_json,
            'email'                => $email,
            'customer_email_hash'  => $email_hash,
            'reply'                => ! empty($normalized['reply']) ? sanitize_textarea_field((string) $normalized['reply']) : null,
            'review_id'            => $review_id > 0 ? $review_id : null,
            'import_meta'          => $import_meta_json,
            'settings'             => $settings,
            'created_at'           => $created_at !== '' ? $created_at : $now,
            'updated_at'           => $now,
        ];

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $ok = $wpdb->insert($this->table, $row, $this->columnFormats($row));
        if ($ok === false) {
            return 0;
        }

        return (int) $wpdb->insert_id;
    }
}
