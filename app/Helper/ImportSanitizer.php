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

defined('ABSPATH') || exit;

class ImportSanitizer
{
    /**
     * @return array{value: int, raw: string, valid: bool}
     */
    public static function normalizeRating(string $raw): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return ['value' => 0, 'raw' => '', 'valid' => false];
        }

        if (preg_match('/^([1-5])(?:\.0+)?$/', $raw, $matches)) {
            $int = (int) $matches[1];

            return [
                'value' => $int,
                'raw'   => (string) $int,
                'valid' => true,
            ];
        }

        if (is_numeric($raw)) {
            $float = (float) $raw;
            if ($float >= 1 && $float <= 5) {
                $int = (int) round($float);

                return [
                    'value' => $int,
                    'raw'   => (string) $int,
                    'valid' => true,
                ];
            }
        }

        return ['value' => 0, 'raw' => $raw, 'valid' => false];
    }

    /**
     *
     * @return array{media: array<int, array{url: string, type?: string}>, invalid: array<int, string>}
     */
    public static function parseMediaField(string $raw, bool $collect_invalid = false): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return ['media' => [], 'invalid' => []];
        }

        if ($raw[0] === '[' || $raw[0] === '{') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return self::mediaFromDecodedList($decoded, $collect_invalid);
            }
        }

        return self::parseDelimitedUrls($raw, $collect_invalid);
    }

    /**
     * @param array<mixed> $decoded
     * @return array{media: array<int, array{url: string, type?: string}>, invalid: array<int, string>}
     */
    private static function mediaFromDecodedList(array $decoded, bool $collect_invalid): array
    {
        $media   = [];
        $invalid = [];

        foreach ($decoded as $item) {
            $url = '';
            $type = 'image';
            if (is_string($item)) {
                $url = trim($item);
            } elseif (is_array($item)) {
                $url  = trim((string) ($item['url'] ?? $item['src'] ?? $item['hidden'] ?? ''));
                $type = sanitize_key((string) ($item['type'] ?? 'image')) ?: 'image';
            }
            if ($url === '') {
                continue;
            }
            $clean = esc_url_raw($url);
            if ($clean !== '' && wp_http_validate_url($clean)) {
                $media[] = ['url' => $clean, 'type' => strpos($type, 'video') !== false ? 'video' : 'image'];
            } elseif ($collect_invalid) {
                $invalid[] = $url;
            }
        }

        return ['media' => $media, 'invalid' => $invalid];
    }

    /**
     * @return array{media: array<int, array{url: string}>, invalid: array<int, string>}
     */
    private static function parseDelimitedUrls(string $raw, bool $collect_invalid): array
    {
        $parts   = preg_split('/[\s,|]+/', $raw) ?: [];
        $media   = [];
        $invalid = [];

        foreach ($parts as $url) {
            $url = trim($url, " \t\n\r\0\x0B\"'");
            if ($url === '') {
                continue;
            }
            $clean = esc_url_raw($url);
            if ($clean !== '' && wp_http_validate_url($clean)) {
                $media[] = ['url' => $clean, 'type' => 'image'];
            } elseif ($collect_invalid) {
                $invalid[] = $url;
            }
        }

        return ['media' => $media, 'invalid' => $invalid];
    }

    /**
     *
     * @return array{value: string, invalid: bool}
     */
    public static function parseReviewDate(string $raw, bool $track_invalid = false): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return ['value' => current_time('mysql', true), 'invalid' => false];
        }

        $timestamp = strtotime($raw);
        if ($timestamp === false) {
            return [
                'value'   => current_time('mysql', true),
                'invalid' => $track_invalid,
            ];
        }

        return [
            'value'   => gmdate('Y-m-d H:i:s', $timestamp),
            'invalid' => false,
        ];
    }
}
