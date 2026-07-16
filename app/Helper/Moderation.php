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

use Hyoka\Woocommerce\Email\EmailSender;

defined('ABSPATH') || exit;

class Moderation
{
    /**
     * @param array<string, mixed> $options
     */
    public static function resolveStatus(string $haystack, array $options = []): string
    {
        $settings = EmailSender::getSettings();
        $haystack = mb_strtolower($haystack);

        if (self::matchesKeywords($haystack, (string) ($settings['spam_filter_keywords'] ?? ''), ! empty($settings['spam_filter_enabled']))) {
            return 'spam';
        }

        if (self::matchesKeywords($haystack, (string) ($settings['profanity_filter_keywords'] ?? ''), ! empty($settings['profanity_filter_enabled']))) {
            return 'pending';
        }

        if (! empty($options['is_user_reply'])) {
            return 'pending';
        }

        if (! empty($options['always_pending'])) {
            return 'pending';
        }

        if (empty($settings['auto_approve_enabled'])) {
            return 'pending';
        }

        $rating     = max(0, min(5, (int) ($options['rating'] ?? 0)));
        $min_rating = max(1, min(5, (int) ($settings['auto_approve_min_rating'] ?? 4)));
        if ($rating < $min_rating) {
            return 'pending';
        }

        return 'approved';
    }

    public static function matchesKeywords(string $haystack, string $keywords_raw, bool $enabled): bool
    {
        if (! $enabled || $keywords_raw === '') {
            return false;
        }

        $parts = preg_split('/[\r\n,]+/', $keywords_raw) ?: [];
        foreach ($parts as $part) {
            $word = trim(mb_strtolower($part));
            if ($word !== '' && mb_strpos($haystack, $word) !== false) {
                return true;
            }
        }

        return false;
    }
}
