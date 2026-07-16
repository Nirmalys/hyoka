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

use Hyoka\App\Import\Normalized;
use Hyoka\App\Import\Party\Apps;
use Hyoka\App\Import\Base;

defined('ABSPATH') || exit;

class Import
{
    /**
     * @param array<string, mixed> $payload
     * @return array{ok: bool, message?: string, errors?: array<int, array<int, string>>, valid_count?: int, total?: int}
     */
    public static function validateImportPayload(array $payload): array
    {
        $parsed = self::parsePayload($payload);
        if (empty($parsed['ok'])) {
            return $parsed;
        }

        $importer  = Apps::resolve((string) ($payload['import_source'] ?? 'csv'));
        $match_col = isset($parsed['product_match']['column']) ? (int) $parsed['product_match']['column'] : -1;
        $errors    = [];
        foreach ($parsed['rows'] as $index => $row) {
            if (! is_array($row)) {
                continue;
            }
            $row_errors = self::normalizeImportRow($importer, $row, $parsed['column_map'], $parsed['product_match'], $parsed['product_mappings'], $match_col)['errors'];
            if ($row_errors !== []) {
                $errors[ $index ] = $row_errors;
            }
        }

        if ($errors !== []) {
            return [
                'ok'      => false,
                'message' => sprintf(
                    /* translators: %d: error count */
                    __('Found %d row(s) with validation errors. Fix your file or mapping before importing.', 'hyoka'),
                    count($errors)
                ),
                'errors'  => $errors,
                'total'   => count($parsed['rows']),
                'valid_count' => count($parsed['rows']) - count($errors),
            ];
        }

        return [
            'ok'          => true,
            'message'     => __('All rows passed validation.', 'hyoka'),
            'total'       => count($parsed['rows']),
            'valid_count' => count($parsed['rows']),
            'errors'      => [],
        ];
    }

    /**
     * Decode JSON import payload from admin textarea and sanitize structure.
     *
     * @return array<string, mixed>|null
     */
    public static function decodePayloadJson(string $raw): ?array
    {
        if ($raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return null;
        }

        return self::sanitizePayload($decoded);
    }

    /**
     * Sanitize decoded import JSON before validation/processing.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function sanitizePayload(array $payload): array
    {
        $column_map = [];
        if (isset($payload['column_map']) && is_array($payload['column_map'])) {
            foreach ($payload['column_map'] as $key => $value) {
                $col_key = sanitize_key((string) $key);
                if ($col_key === '') {
                    continue;
                }
                $column_map[ $col_key ] = ($value === null || $value === '') ? null : absint($value);
            }
        }

        $product_match = [];
        if (isset($payload['product_match']) && is_array($payload['product_match'])) {
            $product_match['type'] = isset($payload['product_match']['type'])
                ? sanitize_key((string) $payload['product_match']['type'])
                : 'product_id';
            if (isset($payload['product_match']['column']) && is_scalar($payload['product_match']['column'])) {
                $product_match['column'] = absint($payload['product_match']['column']);
            }
        }

        $product_mappings = [];
        if (isset($payload['product_mappings']) && is_array($payload['product_mappings'])) {
            foreach ($payload['product_mappings'] as $identifier => $product_id) {
                if (! is_scalar($identifier)) {
                    continue;
                }
                $id_key = sanitize_text_field((string) $identifier);
                if ($id_key === '') {
                    continue;
                }
                $product_mappings[ $id_key ] = absint($product_id);
            }
        }

        $rows = [];
        if (isset($payload['rows']) && is_array($payload['rows'])) {
            foreach ($payload['rows'] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $rows[] = array_map(
                    static function ($cell) {
                        return is_scalar($cell) ? sanitize_text_field((string) $cell) : '';
                    },
                    $row
                );
            }
        }

        $import_source = isset($payload['import_source'])
            ? sanitize_key((string) $payload['import_source'])
            : 'csv';

        return [
            'column_map'       => $column_map,
            'product_match'    => $product_match,
            'product_mappings' => $product_mappings,
            'rows'             => $rows,
            'import_source'    => $import_source !== '' ? $import_source : 'csv',
        ];
    }

    public static function parsePayload(array $payload): array
    {
        $payload   = self::sanitizePayload($payload);
        $column_map = $payload['column_map'];
        $product_match = $payload['product_match'];
        $product_mappings = $payload['product_mappings'];
        $rows = $payload['rows'];

        if ($rows === []) {
            return ['ok' => false, 'message' => __('No review rows to import.', 'hyoka')];
        }

        $body_col   = isset($column_map['body']) ? (int) $column_map['body'] : -1;
        $rating_col = isset($column_map['rating']) ? (int) $column_map['rating'] : -1;
        if ($body_col < 0 || $rating_col < 0) {
            return ['ok' => false, 'message' => __('Review body and rating columns are required.', 'hyoka')];
        }

        return [
            'ok'               => true,
            'column_map'       => $column_map,
            'product_match'    => $product_match,
            'product_mappings' => $product_mappings,
            'rows'             => $rows,
            'import_source'    => sanitize_key((string) ($payload['import_source'] ?? 'csv')) ?: 'csv',
        ];
    }

    /**
     * @param array<int, string>     $row
     * @param array<string, int|null> $column_map
     * @param array<string, mixed>   $product_match
     * @param array<string, int>     $product_mappings
     * @return array{normalized: array<string, mixed>, errors: array<int, string>}
     */
    public static function normalizeImportRow(
        Base $importer,
        array $row,
        array $column_map,
        array $product_match,
        array $product_mappings,
        int $match_col
    ): array {
        $normalized = $importer->normalizeRow($row, $column_map, $product_match, $product_mappings, $match_col);

        return [
            'normalized' => $normalized,
            'errors'     => Normalized::validate($normalized),
        ];
    }

    /**
     * @param array<int, string>           $row
     * @param array<string, int|null>      $column_map
     * @param array<string, mixed>         $product_match
     * @param array<string, int>           $product_mappings
     */
    public static function normalizeRow(
        array $row,
        array $column_map,
        array $product_match,
        array $product_mappings,
        int $match_col
    ): array {
        $body_col   = (int) $column_map['body'];
        $rating_col = (int) $column_map['rating'];

        $identifier = ($match_col >= 0) ? trim(self::cell($row, $match_col)) : '';
        $product_id = 0;
        if ($identifier !== '' && isset($product_mappings[$identifier])) {
            $product_id = absint($product_mappings[$identifier]);
        }

        $review_date_raw = self::cell($row, isset($column_map['review_date']) ? (int) $column_map['review_date'] : -1);
        $parsed_date     = ImportSanitizer::parseReviewDate($review_date_raw, true);

        $picture_raw = self::cell($row, isset($column_map['picture_urls']) ? (int) $column_map['picture_urls'] : -1);
        $media_parse = ImportSanitizer::parseMediaField($picture_raw, true);

        $source = self::cell($row, isset($column_map['source']) ? (int) $column_map['source'] : -1);

        $rating_cell = self::cell($row, $rating_col);
        $rating_norm = ImportSanitizer::normalizeRating($rating_cell);

        return [
            'product_id'         => $product_id,
            'rating'             => $rating_norm['value'],
            'rating_raw'         => $rating_norm['raw'],
            'rating_valid'       => $rating_norm['valid'],
            'title'              => self::cell($row, isset($column_map['title']) ? (int) $column_map['title'] : -1),
            'content'            => self::cell($row, $body_col),
            'author'             => self::cell($row, isset($column_map['reviewer_name']) ? (int) $column_map['reviewer_name'] : -1),
            'email'              => sanitize_email(self::cell($row, isset($column_map['reviewer_email']) ? (int) $column_map['reviewer_email'] : -1)),
            'reply'              => self::cell($row, isset($column_map['reply']) ? (int) $column_map['reply'] : -1),
            'media'              => $media_parse['media'],
            'invalid_media_urls' => $media_parse['invalid'],
            'created_at'         => $parsed_date['value'],
            'invalid_date'       => $parsed_date['invalid'],
            'import'             => array_filter([
                'type'               => 'csv',
                'source'             => $source !== '' ? sanitize_text_field($source) : null,
                'product_identifier' => $identifier !== '' ? sanitize_text_field($identifier) : null,
                'product_match_type' => sanitize_key((string) ($product_match['type'] ?? '')),
            ]),
            'status'             => 'pending',
            'is_verified'        => 0,
        ];
    }

    /**
     * @param array<int, string> $row
     */
    protected static function cell(array $row, int $col): string
    {
        if ($col < 0 || ! isset($row[$col])) {
            return '';
        }

        return trim((string) $row[$col]);
    }
}
