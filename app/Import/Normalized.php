<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Import;

defined('ABSPATH') || exit;

final class Normalized
{
    /**
     * @return array<string, mixed>
     */
    public static function empty(string $source = 'csv', string $source_type = 'file'): array
    {
        return [
            'product_id'         => 0,
            'order_id'           => 0,
            'reviewer_name'      => '',
            'reviewer_email'     => '',
            'rating'             => 0,
            'rating_raw'         => '',
            'title'              => '',
            'content'            => '',
            'reply'              => '',
            'media'              => [],
            'invalid_media_urls' => [],
            'created_at'         => current_time('mysql', true),
            'invalid_date'       => false,
            'source'             => sanitize_key($source) ?: 'csv',
            'source_type'        => sanitize_key($source_type) ?: 'file',
            'verified_buyer'     => 0,
            'is_featured'        => 0,
            'status'             => 'pending',
            'import_meta'        => [],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function fromLegacyRow(array $row, string $source = 'csv', string $source_type = 'file'): array
    {
        $import_meta = is_array($row['import'] ?? null) ? $row['import'] : [];
        $import_meta['legacy'] = true;

        $base = self::empty($source, $source_type);

        $resolved_source = sanitize_key((string) ($import_meta['source'] ?? $row['source'] ?? $source));

        return array_merge($base, [
            'source'             => $resolved_source !== '' ? $resolved_source : $source,
            'source_type'        => sanitize_key((string) ($import_meta['source_type'] ?? $row['source_type'] ?? $source_type)) ?: $source_type,
            'product_id'         => absint($row['product_id'] ?? 0),
            'order_id'           => absint($row['order_id'] ?? 0),
            'reviewer_name'      => sanitize_text_field((string) ($row['author'] ?? $row['reviewer_name'] ?? '')),
            'reviewer_email'     => sanitize_email((string) ($row['email'] ?? $row['reviewer_email'] ?? '')),
            'rating'             => (int) ($row['rating'] ?? 0),
            'rating_raw'         => (string) ($row['rating_raw'] ?? (string) ($row['rating'] ?? '')),
            'rating_valid'       => ! empty($row['rating_valid']),
            'title'              => sanitize_text_field((string) ($row['title'] ?? '')),
            'content'            => (string) ($row['content'] ?? ''),
            'reply'              => (string) ($row['reply'] ?? ''),
            'media'              => is_array($row['media'] ?? null) ? $row['media'] : [],
            'invalid_media_urls' => is_array($row['invalid_media_urls'] ?? null) ? $row['invalid_media_urls'] : [],
            'created_at'         => (string) ($row['created_at'] ?? $base['created_at']),
            'invalid_date'       => ! empty($row['invalid_date']),
            'verified_buyer'     => ! empty($row['is_verified']) ? 1 : 0,
            'is_featured'        => ! empty($row['is_featured']) ? 1 : 0,
            'status'             => sanitize_key((string) ($row['status'] ?? 'pending')) ?: 'pending',
            'import_meta'        => $import_meta,
        ]);
    }

    /**
     * @param array<string, mixed> $normalized
     * @return array<string, mixed> Row shape expected by Base::insertReview().
     */
    public static function toWriterRow(array $normalized): array
    {
        return [
            'product_id'         => $normalized['product_id'],
            'order_id'           => $normalized['order_id'],
            'rating'             => $normalized['rating'],
            'rating_raw'         => $normalized['rating_raw'],
            'rating_valid'       => ! empty($normalized['rating_valid']),
            'title'              => $normalized['title'],
            'content'            => $normalized['content'],
            'author'             => $normalized['reviewer_name'],
            'email'              => $normalized['reviewer_email'],
            'reply'              => $normalized['reply'],
            'media'              => $normalized['media'],
            'invalid_media_urls' => $normalized['invalid_media_urls'],
            'created_at'         => $normalized['created_at'],
            'invalid_date'       => $normalized['invalid_date'],
            'is_verified'        => $normalized['verified_buyer'],
            'is_featured'        => $normalized['is_featured'],
            'status'             => $normalized['status'],
            'source'             => $normalized['source'],
            'source_type'        => $normalized['source_type'],
            'import_meta'        => $normalized['import_meta'],
        ];
    }

    /**
     * @param array<string, mixed> $normalized
     * @return array<int, string>
     */
    public static function validate(array $normalized): array
    {
        $data   = self::toWriterRow($normalized);
        $errors = [];

        $body = (string) ($data['content'] ?? '');
        if ($body === '') {
            $errors[] = __('Review body is required.', 'hyoka');
        } elseif (mb_strlen($body) < 3) {
            $errors[] = __('Review body must be at least 3 characters.', 'hyoka');
        } elseif (mb_strlen($body) > 10000) {
            $errors[] = __('Review body is too long (max 10,000 characters).', 'hyoka');
        }

        if (empty($data['rating_valid'])) {
            $errors[] = __('Rating must be a number from 1 to 5.', 'hyoka');
        }

        $title = (string) ($data['title'] ?? '');
        if ($title !== '' && mb_strlen($title) > 200) {
            $errors[] = __('Review title must be 200 characters or fewer.', 'hyoka');
        }

        $email = (string) ($data['email'] ?? '');
        if ($email !== '' && ! is_email($email)) {
            $errors[] = __('Reviewer email is not valid.', 'hyoka');
        }

        if (! empty($data['invalid_date'])) {
            $errors[] = __('Review date is not a valid date.', 'hyoka');
        }

        if (! empty($data['invalid_media_urls']) && is_array($data['invalid_media_urls'])) {
            foreach ($data['invalid_media_urls'] as $bad_url) {
                $errors[] = sprintf(
                    /* translators: %s: URL */
                    __('Invalid picture URL: %s', 'hyoka'),
                    esc_html((string) $bad_url)
                );
            }
        }

        return $errors;
    }
}
