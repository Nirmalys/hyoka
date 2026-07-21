<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\Woocommerce\Email;

use Hyoka\App\Helper\Wp;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\Meta;
use Hyoka\App\Helper\Customers;
use Hyoka\App\Model\Review;

defined('ABSPATH') || exit;

class EmailSender
{
    /** Legacy WordPress option name (migrated into hyoka_reviews plugin_settings row). */
    public const SETTINGS_OPTION = 'hyoka_email_followup_settings';

    public const CRON_HOOK = 'hyoka_followup_email_cron';

    private const DEFAULT_SPAM_KEYWORDS =
    'free money, click here, viagra, casino, lottery, winner, http://, bit.ly, buy now, limited offer';

    private const DEFAULT_PROFANITY_KEYWORDS =
    'damn, hell, crap, stupid, hate, sucks, idiot, worst, garbage, scam';

    /** First release default for reminder delay; migrated to 3 days. */
    private const LEGACY_REMINDER_DAYS_AFTER = 7;

    private const REMINDER_DAYS_MIGRATED_OPTION = 'hyoka_reminder_days_migrated';

    public static function getSettings(): array
    {
        $defaults = [
            'automation_enabled'              => true,
            'review_request_enabled'          => true,
            'review_request_schedule_enabled' => true,
            'enabled'                => true,
            'days_after'             => 7,
            'subject'                => 'We would love your review — {product_name}',
            'email_heading'          => 'Share your experience, {customer_name}!',
            'body'                   => "<p>Hi {customer_name},</p>\n<div style=\"text-align:center;\">{product_image}</div>\n<p>Thanks for buying {product_name_html}. We would love to hear your feedback.</p>\n{review_button_html}",
            'primary_color'          => '#F59E0B',
            'accent_color'           => '#FDB022',
            'font_family'            => 'system',
            'last_save_context'      => '',
            'spam_filter_enabled'       => false,
            'spam_filter_keywords'      => self::DEFAULT_SPAM_KEYWORDS,
            'profanity_filter_enabled'  => false,
            'profanity_filter_keywords' => self::DEFAULT_PROFANITY_KEYWORDS,
            'auto_approve_enabled'      => false,
            'auto_approve_min_rating'   => 4,
            'reviews_per_page'          => 10,
            'email_from_name'           => '',
            'email_from_address'        => '',
            'reminder_enabled'          => false,
            'media_reminder_enabled'    => false,
            'reminder_days_after'       => 3,
            'reminder_subject'          => 'Reminder: We would still love your review',
            'reminder_email_heading'    => 'Still have a moment to leave a review?',
            'admin_notifications_enabled'     => false,
            'reply_notification_enabled'      => true,
            'review_confirmation_enabled'     => true,
            'admin_notification_emails'       => '',
            'admin_notify_new_review'         => true,
            'admin_notify_new_question'       => true,
            'admin_send_email_copy'           => false,
            'negative_review_threshold'       => '0',
            'negative_notification_alt_enabled' => false,
            'negative_notification_alt_emails'  => '',
            'show_verified_purchase_badge'    => true,
            'show_audit_log_details'          => true,
            'allow_photos'                    => true,
            'allow_videos'                    => true,
            'form_title'                      => 'Write a Review',
            'form_subtitle'                   => '',
            'submit_button_text'              => 'Submit Review',
            'form_show_name'                  => true,
            'form_show_email'                 => false,
            'form_show_location'              => false,
            'form_show_title'                 => false,
            'form_show_review'                => true,
            'form_show_rating'                => true,
            'email_header_size'               => '24px',
            'email_text_size'                 => '14px',
            'star_color'                      => '#F59E0B',
            'button_color'                    => '#F59E0B',
            'button_text_color'               => '#ffffff',
            'text_color'                      => '#111827',
            'email_preheader'                 => '',
        ];

        $review_model = new Review();
        $stored       = $review_model->getPluginSettings();
        if (empty($stored)) {
            $legacy = get_option(self::SETTINGS_OPTION, []);
            if (is_array($legacy) && ! empty($legacy)) {
                $stored = $legacy;
                $review_model->savePluginSettings($stored);
                delete_option(self::SETTINGS_OPTION);
            }
        }

        $merged = array_merge($defaults, $stored);

        if (! array_key_exists('automation_enabled', $stored) && array_key_exists('enabled', $stored)) {
            $merged['automation_enabled'] = filter_var($stored['enabled'], FILTER_VALIDATE_BOOLEAN);
        }

        $merged['automation_enabled']      = filter_var($merged['automation_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['enabled']                 = $merged['automation_enabled'];
        if (! self::storedHasKey($stored, 'review_request_enabled')) {
            $merged['review_request_enabled'] = true;
        }
        $merged['review_request_enabled'] = filter_var($merged['review_request_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);
        if (! self::storedHasKey($stored, 'review_request_schedule_enabled')) {
            $merged['review_request_schedule_enabled'] = $merged['review_request_enabled'];
        }
        $merged['review_request_schedule_enabled'] = filter_var(
            $merged['review_request_schedule_enabled'] ?? true,
            FILTER_VALIDATE_BOOLEAN
        );
        $merged['days_after']              = max(1, (int) ($merged['days_after'] ?? 7));
        $merged['subject']                 = (string) ($merged['subject'] ?? '');
        $merged['email_heading']           = (string) ($merged['email_heading'] ?? $defaults['email_heading']);
        $merged['body']                    = (string) ($merged['body'] ?? '');
        $merged['primary_color']           = sanitize_hex_color((string) ($merged['primary_color'] ?? $defaults['primary_color'])) ?: $defaults['primary_color'];
        $merged['accent_color']            = sanitize_hex_color((string) ($merged['accent_color'] ?? $defaults['accent_color'])) ?: $defaults['accent_color'];
        $merged['font_family']             = Wp::sanitizeFontKey((string) ($merged['font_family'] ?? 'system'));
        $merged['spam_filter_enabled']       = filter_var($merged['spam_filter_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['spam_filter_keywords']      = self::keywordListOrDefault(
            (string) ($merged['spam_filter_keywords'] ?? ''),
            self::DEFAULT_SPAM_KEYWORDS
        );
        $merged['profanity_filter_enabled']  = filter_var($merged['profanity_filter_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['profanity_filter_keywords'] = self::keywordListOrDefault(
            (string) ($merged['profanity_filter_keywords'] ?? ''),
            self::DEFAULT_PROFANITY_KEYWORDS
        );
        $merged['auto_approve_enabled']      = filter_var($merged['auto_approve_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['auto_approve_min_rating'] = max(1, min(5, (int) ($merged['auto_approve_min_rating'] ?? 4)));
        $merged['reviews_per_page']        = max(1, min(100, (int) ($merged['reviews_per_page'] ?? 10)));
        $merged['email_from_name']         = self::sanitizeFromName((string) ($merged['email_from_name'] ?? ''));
        $merged['email_from_address']      = sanitize_email((string) ($merged['email_from_address'] ?? ''));
        $merged['reminder_enabled']        = filter_var($merged['reminder_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['media_reminder_enabled']  = filter_var($merged['media_reminder_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['reminder_days_after']     = max(1, (int) ($merged['reminder_days_after'] ?? 3));
        $merged['reminder_days_after']     = self::normalizeReminderDaysAfter($merged['reminder_days_after'], $stored);
        $merged['reminder_subject']        = sanitize_text_field((string) ($merged['reminder_subject'] ?? ''));
        $merged['reminder_email_heading']  = sanitize_text_field((string) ($merged['reminder_email_heading'] ?? ''));
        $merged['admin_notifications_enabled'] = filter_var($merged['admin_notifications_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (! self::storedHasKey($stored, 'reply_notification_enabled')) {
            $merged['reply_notification_enabled'] = true;
        }
        if (! self::storedHasKey($stored, 'review_confirmation_enabled')) {
            $merged['review_confirmation_enabled'] = true;
        }
        $merged['reply_notification_enabled']  = filter_var($merged['reply_notification_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['review_confirmation_enabled'] = filter_var($merged['review_confirmation_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['admin_notification_emails']   = (string) ($merged['admin_notification_emails'] ?? '');
        $merged['admin_notify_new_review']     = filter_var($merged['admin_notify_new_review'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['admin_notify_new_question']   = filter_var($merged['admin_notify_new_question'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['admin_send_email_copy']       = filter_var($merged['admin_send_email_copy'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['negative_review_threshold']   = (string) ($merged['negative_review_threshold'] ?? '0');
        $merged['negative_notification_alt_enabled'] = filter_var($merged['negative_notification_alt_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['negative_notification_alt_emails']  = (string) ($merged['negative_notification_alt_emails'] ?? '');
        $merged['show_verified_purchase_badge'] = filter_var($merged['show_verified_purchase_badge'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['show_audit_log_details']       = filter_var($merged['show_audit_log_details'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['allow_photos']                 = filter_var($merged['allow_photos'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['allow_videos']                 = filter_var($merged['allow_videos'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['form_title']                   = sanitize_text_field((string) ($merged['form_title'] ?? $defaults['form_title']));
        $merged['form_subtitle']                = sanitize_text_field((string) ($merged['form_subtitle'] ?? $defaults['form_subtitle']));
        $merged['submit_button_text']           = sanitize_text_field((string) ($merged['submit_button_text'] ?? $defaults['submit_button_text']));
        $merged['form_show_name']               = filter_var($merged['form_show_name'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['form_show_email']              = filter_var($merged['form_show_email'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['form_show_location']           = filter_var($merged['form_show_location'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['form_show_title']              = filter_var($merged['form_show_title'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['form_show_review']             = filter_var($merged['form_show_review'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['form_show_rating']             = filter_var($merged['form_show_rating'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $merged['email_header_size']            = Wp::sanitizeCssLength(
            (string) ($merged['email_header_size'] ?? $defaults['email_header_size']),
            (string) $defaults['email_header_size']
        );
        $merged['email_text_size']              = Wp::sanitizeCssLength(
            (string) ($merged['email_text_size'] ?? $defaults['email_text_size']),
            (string) $defaults['email_text_size']
        );
        $merged['email_elements']               = Wp::sanitizeElementsArray(
            is_array($merged['email_elements'] ?? null) ? $merged['email_elements'] : []
        );
        $merged['form_elements']                = Wp::sanitizeElementsArray(
            is_array($merged['form_elements'] ?? null) ? $merged['form_elements'] : []
        );
        $merged['star_color']                   = sanitize_hex_color((string) ($merged['star_color'] ?? '')) ?: '#F59E0B';
        $merged['button_color']                 = sanitize_hex_color((string) ($merged['button_color'] ?? '')) ?: '#F59E0B';
        $merged['button_text_color']            = sanitize_hex_color((string) ($merged['button_text_color'] ?? '')) ?: '#ffffff';
        $merged['text_color']                   = sanitize_hex_color((string) ($merged['text_color'] ?? '')) ?: '#111827';
        $merged['email_preheader']              = sanitize_text_field((string) ($merged['email_preheader'] ?? ''));
        $merged['email_layouts']                = self::normalizeEmailLayouts($merged['email_layouts'] ?? []);
        $merged['email_layout_block_styles']    = self::normalizeEmailLayoutBlockStyles($merged['email_layout_block_styles'] ?? []);
        if ($merged['reminder_subject'] === '') {
            $merged['reminder_subject'] = $defaults['reminder_subject'];
        }
        if ($merged['reminder_email_heading'] === '') {
            $merged['reminder_email_heading'] = $defaults['reminder_email_heading'];
        }
        if ($merged['email_from_name'] === '' && ! self::storedHasKey($stored, 'email_from_name')) {
            $merged['email_from_name'] = self::defaultFromName();
        }
        if ($merged['email_from_address'] === '' || ! is_email($merged['email_from_address'])) {
            $merged['email_from_address'] = self::defaultFromEmail();
        }
        $ctx                               = (string) ($merged['last_save_context'] ?? '');
        $merged['last_save_context']       = in_array($ctx, ['automation', 'template', 'submission_form', 'full'], true) ? $ctx : '';

        return $merged;
    }

    private static function keywordListOrDefault(string $value, string $default): string
    {
        return trim($value) === '' ? $default : $value;
    }

    /**
     * Parse a whitespace/comma/newline separated email list.
     *
     * @return string[] Lowercased, unique, max $max emails.
     */
    public static function parseEmailList(string $raw, int $max = 3): array
    {
        $parts = preg_split('/[\s,\r\n]+/', $raw) ?: [];
        $out   = [];
        foreach ($parts as $part) {
            $email = strtolower(trim(sanitize_email((string) $part)));
            if ($email === '' || ! is_email($email)) {
                continue;
            }
            $out[ $email ] = true;
            if (count($out) >= max(1, $max)) {
                break;
            }
        }

        return array_keys($out);
    }

    /**
     * @param mixed $raw
     * @return array<string, array<string, string>>
     */
    public static function normalizeEmailLayouts($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw     = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($raw)) {
            return [];
        }

        $clean = [];
        foreach ($raw as $templateId => $blocks) {
            if (! is_string($templateId) || ! is_array($blocks)) {
                continue;
            }
            $tid = sanitize_key($templateId);
            if ($tid === '') {
                continue;
            }
            $clean[$tid] = [];
            foreach ($blocks as $key => $value) {
                if (! is_string($key)) {
                    continue;
                }
                $sanitized_key = sanitize_key($key);
                if ($sanitized_key === '') {
                    continue;
                }
                if ($sanitized_key === '_extras') {
                    $clean[$tid]['_extras'] = self::normalizeEmailLayoutExtras($value);
                    continue;
                }
                $clean[$tid][$sanitized_key] = sanitize_textarea_field((string) $value);
            }
        }

        return $clean;
    }

    /**
     * @param mixed $raw
     * @return array<int, array<string, mixed>>
     */
    public static function normalizeEmailLayoutExtras($raw): array
    {
        if (is_string($raw)) {
            if ($raw === '' || $raw === 'Array') {
                return [];
            }
            $decoded = json_decode($raw, true);
            $raw     = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($raw)) {
            return [];
        }

        $json = wp_json_encode($raw);
        if ($json === false) {
            return [];
        }

        return Wp::parseJsonElements($json);
    }

    /**
     * @param mixed $raw
     * @return array<string, array<string, array<string, string>>>
     */
    public static function normalizeEmailLayoutBlockStyles($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw     = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($raw)) {
            return [];
        }

        $allowedStyleKeys = [
            'fontSize',
            'fontWeight',
            'color',
            'textAlign',
            'lineHeight',
            'starColor',
            'bgColor',
        ];

        $clean = [];
        foreach ($raw as $templateId => $blocks) {
            if (! is_string($templateId) || ! is_array($blocks)) {
                continue;
            }
            $tid = sanitize_key($templateId);
            if ($tid === '') {
                continue;
            }
            $clean[$tid] = [];
            foreach ($blocks as $blockKey => $styles) {
                if (! is_string($blockKey) || ! is_array($styles)) {
                    continue;
                }
                $bk = sanitize_key($blockKey);
                if ($bk === '') {
                    continue;
                }
                $cleanStyles = [];
                foreach ($styles as $styleKey => $value) {
                    if (! is_string($styleKey) || ! in_array($styleKey, $allowedStyleKeys, true)) {
                        continue;
                    }
                    $raw = (string) $value;
                    switch ($styleKey) {
                        case 'color':
                        case 'starColor':
                        case 'bgColor':
                            $cleanStyles[$styleKey] = sanitize_hex_color($raw) ?: '#4b5563';
                            break;
                        case 'fontSize':
                            $cleanStyles[$styleKey] = Wp::sanitizeCssLength($raw, '14px');
                            break;
                        case 'fontWeight':
                            $cleanStyles[$styleKey] = Wp::sanitizeCssFontWeight($raw, '400');
                            break;
                        case 'textAlign':
                            $cleanStyles[$styleKey] = Wp::sanitizeTextAlign($raw);
                            break;
                        case 'lineHeight':
                            $cleanStyles[$styleKey] = Wp::sanitizeCssLineHeight($raw, '1.6');
                            break;
                        default:
                            $cleanStyles[$styleKey] = sanitize_text_field($raw);
                            break;
                    }
                }
                if ($cleanStyles !== []) {
                    $clean[$tid][$bk] = $cleanStyles;
                }
            }
        }

        return $clean;
    }

    /**
     * Default follow-up delay is 3 days. One-time migration from legacy saved value 7.
     *
     * @param array<string, mixed> $stored Raw plugin_settings row before merge defaults.
     */
    private static function normalizeReminderDaysAfter(int $days, array $stored): int
    {
        if ($days !== self::LEGACY_REMINDER_DAYS_AFTER) {
            return $days;
        }

        if (get_option(self::REMINDER_DAYS_MIGRATED_OPTION) === '1') {
            return $days;
        }

        if ($stored !== []) {
            $review_model = new Review();
            $current      = $review_model->getPluginSettings();
            if (is_array($current) && $current !== []) {
                $current['reminder_days_after'] = 3;
                $review_model->savePluginSettings($current);
            }
        }
        update_option(self::REMINDER_DAYS_MIGRATED_OPTION, '1', false);

        return 3;
    }

    /**
     * @param array<string, mixed> $stored
     */
    private static function storedHasKey(array $stored, string $key): bool
    {
        return $stored !== [] && array_key_exists($key, $stored);
    }

    public static function defaultFromName(): string
    {
        $name = wp_specialchars_decode((string) get_bloginfo('name'), ENT_QUOTES);
        $name = trim(str_replace(["\r", "\n", "\0"], ' ', $name));

        return $name !== '' ? $name : 'WordPress';
    }

    public static function defaultFromEmail(): string
    {
        $host = wp_parse_url(network_home_url(), PHP_URL_HOST);
        $host = is_string($host) ? strtolower((string) preg_replace('/^www\./', '', $host)) : '';
        if ($host === '' || $host === 'localhost' || strpos($host, '127.') === 0) {
            $host = 'site.local';
        }

        $candidate = 'noreply@' . $host;
        if (is_email($candidate)) {
            return $candidate;
        }

        $admin = sanitize_email((string) get_option('admin_email', ''));
        if ($admin !== '' && is_email($admin)) {
            return $admin;
        }

        return 'noreply@site.local';
    }

    /**
     * Resolved From address: saved setting when valid, otherwise site admin email.
     */
    public static function resolveFromEmail(): string
    {
        $settings = self::getSettings();
        $saved    = sanitize_email((string) ($settings['email_from_address'] ?? ''));

        if ($saved !== '' && is_email($saved)) {
            return $saved;
        }

        return self::defaultFromEmail();
    }

    public static function sanitizeFromName(string $name): string
    {
        $name = wp_specialchars_decode($name, ENT_QUOTES);
        $name = trim(str_replace(["\r", "\n", "\0"], ' ', $name));

        return sanitize_text_field($name);
    }

    /**
     * File input accept value for review media uploads.
     *
     * @param string|null $widget_id Optional widget id for carousel-specific rules.
     */
    public static function reviewAcceptMedia(?string $widget_id = null): string
    {
        $settings = self::getSettings();
        $photos   = filter_var($settings['allow_photos'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $videos   = filter_var($settings['allow_videos'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $widget   = sanitize_key((string) ($widget_id ?? ''));

        if ($widget === 'video-carousel') {
            return $videos ? 'video/*' : 'none';
        }
        if ($widget === 'card-carousel') {
            return $photos ? 'image/*' : 'none';
        }

        if (! $photos && ! $videos) {
            return 'none';
        }
        if ($photos && ! $videos) {
            return 'image/*';
        }
        if (! $photos && $videos) {
            return 'video/*';
        }

        return 'image/*,video/*';
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function saveSettings(array $data): bool
    {
        $automation = filter_var($data['automation_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (! isset($data['automation_enabled']) && isset($data['enabled'])) {
            $automation = filter_var($data['enabled'], FILTER_VALIDATE_BOOLEAN);
        }

        $clean = [
            'automation_enabled'              => $automation,
            'review_request_enabled'          => filter_var($data['review_request_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'review_request_schedule_enabled' => filter_var($data['review_request_schedule_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'enabled'                 => $automation,
            'days_after'              => max(1, (int) ($data['days_after'] ?? 7)),
            'subject'                 => sanitize_text_field((string) ($data['subject'] ?? '')),
            'email_heading'           => sanitize_text_field((string) ($data['email_heading'] ?? '')),
            'body'                    => wp_kses_post((string) ($data['body'] ?? '')),
            'primary_color'           => sanitize_hex_color((string) ($data['primary_color'] ?? '')) ?: '#F59E0B',
            'accent_color'            => sanitize_hex_color((string) ($data['accent_color'] ?? '')) ?: '#FDB022',
            'font_family'             => Wp::sanitizeFontKey((string) ($data['font_family'] ?? 'system')),
            'email_elements'            => Wp::sanitizeElementsArray(
                is_array($data['email_elements'] ?? null) ? $data['email_elements'] : []
            ),
            'form_elements'             => Wp::sanitizeElementsArray(
                is_array($data['form_elements'] ?? null) ? $data['form_elements'] : []
            ),
            'spam_filter_enabled'       => filter_var($data['spam_filter_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'spam_filter_keywords'      => sanitize_textarea_field((string) ($data['spam_filter_keywords'] ?? '')),
            'profanity_filter_enabled'  => filter_var($data['profanity_filter_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'profanity_filter_keywords' => sanitize_textarea_field((string) ($data['profanity_filter_keywords'] ?? '')),
            'auto_approve_enabled'      => filter_var($data['auto_approve_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'auto_approve_min_rating'   => max(1, min(5, (int) ($data['auto_approve_min_rating'] ?? 4))),
            'reviews_per_page'          => max(1, min(100, (int) ($data['reviews_per_page'] ?? 10))),
            'email_from_name'           => self::sanitizeFromName((string) ($data['email_from_name'] ?? '')),
            'email_from_address'        => sanitize_email((string) ($data['email_from_address'] ?? '')),
            'reminder_enabled'          => filter_var($data['reminder_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'media_reminder_enabled'    => filter_var($data['media_reminder_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'reminder_days_after'       => max(1, (int) ($data['reminder_days_after'] ?? 3)),
            'reminder_subject'          => sanitize_text_field((string) ($data['reminder_subject'] ?? '')),
            'reminder_email_heading'    => sanitize_text_field((string) ($data['reminder_email_heading'] ?? '')),
            'admin_notifications_enabled'     => filter_var($data['admin_notifications_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'reply_notification_enabled'      => filter_var($data['reply_notification_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'review_confirmation_enabled'     => filter_var($data['review_confirmation_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'admin_notification_emails'       => sanitize_textarea_field((string) ($data['admin_notification_emails'] ?? '')),
            'admin_notify_new_review'         => filter_var($data['admin_notify_new_review'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'admin_notify_new_question'       => filter_var($data['admin_notify_new_question'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'admin_send_email_copy'           => filter_var($data['admin_send_email_copy'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'negative_review_threshold'       => sanitize_text_field((string) ($data['negative_review_threshold'] ?? '0')),
            'negative_notification_alt_enabled' => filter_var($data['negative_notification_alt_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'negative_notification_alt_emails'  => sanitize_textarea_field((string) ($data['negative_notification_alt_emails'] ?? '')),
            'show_verified_purchase_badge'    => filter_var($data['show_verified_purchase_badge'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'show_audit_log_details'          => filter_var($data['show_audit_log_details'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'allow_photos'                    => filter_var($data['allow_photos'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'allow_videos'                    => filter_var($data['allow_videos'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'form_title'                      => sanitize_text_field((string) ($data['form_title'] ?? 'Write a Review')),
            'form_subtitle'                   => sanitize_text_field((string) ($data['form_subtitle'] ?? '')),
            'submit_button_text'              => sanitize_text_field((string) ($data['submit_button_text'] ?? 'Submit Review')),
            'form_show_name'                  => filter_var($data['form_show_name'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'form_show_email'                 => filter_var($data['form_show_email'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'form_show_location'              => filter_var($data['form_show_location'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'form_show_title'                 => filter_var($data['form_show_title'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'form_show_review'                => filter_var($data['form_show_review'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'form_show_rating'                => filter_var($data['form_show_rating'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'email_header_size'               => Wp::sanitizeCssLength((string) ($data['email_header_size'] ?? '24px'), '24px'),
            'email_text_size'                 => Wp::sanitizeCssLength((string) ($data['email_text_size'] ?? '14px'), '14px'),
            'star_color'                      => sanitize_hex_color((string) ($data['star_color'] ?? '')) ?: '#F59E0B',
            'button_color'                    => sanitize_hex_color((string) ($data['button_color'] ?? '')) ?: '#F59E0B',
            'button_text_color'               => sanitize_hex_color((string) ($data['button_text_color'] ?? '')) ?: '#ffffff',
            'text_color'                      => sanitize_hex_color((string) ($data['text_color'] ?? '')) ?: '#111827',
            'email_preheader'                 => sanitize_text_field((string) ($data['email_preheader'] ?? '')),
            'email_layouts'                   => self::normalizeEmailLayouts($data['email_layouts'] ?? []),
            'email_layout_block_styles'       => self::normalizeEmailLayoutBlockStyles($data['email_layout_block_styles'] ?? []),
        ];
        $ctx = isset($data['last_save_context']) ? sanitize_key((string) $data['last_save_context']) : '';
        $clean['last_save_context'] = in_array($ctx, ['automation', 'template', 'submission_form', 'full'], true) ? $ctx : '';
        if ($clean['subject'] === '') {
            $clean['subject'] = 'How was your recent purchase from {site_name}?';
        }
        if ($clean['email_heading'] === '') {
            $clean['email_heading'] = 'Thanks for your purchase, {customer_name}!';
        }
        if ($clean['reminder_subject'] === '') {
            $clean['reminder_subject'] = 'Reminder: We would still love your review';
        }
        if ($clean['reminder_email_heading'] === '') {
            $clean['reminder_email_heading'] = 'Still have a moment to leave a review?';
        }

        if ((int) $clean['reminder_days_after'] === self::LEGACY_REMINDER_DAYS_AFTER) {
            update_option(self::REMINDER_DAYS_MIGRATED_OPTION, '1', false);
        }

        return (new Review())->savePluginSettings($clean);
    }

    /**
     * @return array{settings: array, font_choices: array}
     */
    public static function getAdminData(): array
    {
        return [
            'settings'     => self::getSettings(),
            'font_choices' => Wp::getFontChoices(),
        ];
    }

    /**
     * @param array<string, mixed> $current
     */
    private static function boolSettingFromPost(string $key, bool $default, array $current): bool
    {
        if (Wp::hasPost($key)) {
            return Wp::postBoolean($key, $default);
        }

        return (bool) ($current[ $key ] ?? $default);
    }

    private static function automationEnabledFromPost(array $current): bool
    {
        if (Wp::hasPost('automation_enabled')) {
            return Wp::postBoolean('automation_enabled');
        }
        if (Wp::hasPost('enabled')) {
            return Wp::postBoolean('enabled');
        }

        return (bool) ($current['automation_enabled'] ?? false);
    }

    /**
     * @param array<string, mixed> $current
     */
    private static function textSettingFromPost(string $key, array $current, string $fallback = ''): string
    {
        if (Wp::hasPost($key)) {
            return Wp::postText($key);
        }

        return (string) ($current[ $key ] ?? $fallback);
    }

    /**
     * @param array<string, mixed> $current
     */
    private static function textareaSettingFromPost(string $key, array $current, string $fallback = ''): string
    {
        if (Wp::hasPost($key)) {
            return Wp::postTextarea($key);
        }

        return (string) ($current[ $key ] ?? $fallback);
    }

    /**
     * @param array<string, mixed> $current
     */
    private static function emailSettingFromPost(string $key, array $current): string
    {
        if (Wp::hasPost($key)) {
            return Wp::postEmail($key);
        }

        return (string) ($current[ $key ] ?? '');
    }

    /**
     * @param array<string, mixed> $current
     */
    private static function fromNameSettingFromPost(array $current): string
    {
        if (Wp::hasPost('email_from_name')) {
            return self::sanitizeFromName(Wp::postText('email_from_name'));
        }

        return (string) ($current['email_from_name'] ?? '');
    }

    /**
     * @param array<string, mixed> $current
     * @return array<string, mixed>
     */
    private static function automationFieldsFromPost(array $current, string $save_context, bool $include_review_request_enabled = false): array
    {
        $automation = self::automationEnabledFromPost($current);
        $spam_enabled = self::boolSettingFromPost('spam_filter_enabled', false, $current);
        $auto_enabled = self::boolSettingFromPost('auto_approve_enabled', false, $current);
        $profanity_enabled = self::boolSettingFromPost('profanity_filter_enabled', false, $current);
        $auto_min_rating = max(1, min(5, Wp::postInt('auto_approve_min_rating', (int) ($current['auto_approve_min_rating'] ?? 4))));

        $fields = [
            'automation_enabled'              => $automation,
            'enabled'                         => $automation,
            'review_request_schedule_enabled' => self::boolSettingFromPost('review_request_schedule_enabled', true, $current),
            'days_after'                      => max(1, Wp::postInt('days_after', 7)),
            'admin_notifications_enabled'     => self::boolSettingFromPost('admin_notifications_enabled', false, $current),
            'reply_notification_enabled'      => self::boolSettingFromPost('reply_notification_enabled', true, $current),
            'review_confirmation_enabled'     => self::boolSettingFromPost('review_confirmation_enabled', true, $current),
            'admin_notification_emails'       => self::textareaSettingFromPost('admin_notification_emails', $current),
            'admin_notify_new_review'         => self::boolSettingFromPost('admin_notify_new_review', true, $current),
            'admin_notify_new_question'       => self::boolSettingFromPost('admin_notify_new_question', true, $current),
            'admin_send_email_copy'           => self::boolSettingFromPost('admin_send_email_copy', false, $current),
            'negative_review_threshold'       => self::textSettingFromPost('negative_review_threshold', $current, '0'),
            'negative_notification_alt_enabled' => self::boolSettingFromPost('negative_notification_alt_enabled', false, $current),
            'negative_notification_alt_emails'  => self::textareaSettingFromPost('negative_notification_alt_emails', $current),
            'show_verified_purchase_badge'    => self::boolSettingFromPost('show_verified_purchase_badge', true, $current),
            'show_audit_log_details'          => self::boolSettingFromPost('show_audit_log_details', true, $current),
            'spam_filter_enabled'             => $spam_enabled,
            'spam_filter_keywords'            => self::textareaSettingFromPost('spam_filter_keywords', $current),
            'profanity_filter_enabled'        => $profanity_enabled,
            'profanity_filter_keywords'       => self::textareaSettingFromPost('profanity_filter_keywords', $current),
            'auto_approve_enabled'            => $auto_enabled,
            'auto_approve_min_rating'         => $auto_min_rating,
            'reviews_per_page'                => max(1, min(100, Wp::postInt('reviews_per_page', (int) ($current['reviews_per_page'] ?? 10)))),
            'email_from_name'                 => self::fromNameSettingFromPost($current),
            'email_from_address'              => self::emailSettingFromPost('email_from_address', $current),
            'reminder_enabled'                => self::boolSettingFromPost('reminder_enabled', false, $current),
            'media_reminder_enabled'          => self::boolSettingFromPost('media_reminder_enabled', false, $current),
            'reminder_days_after'             => max(1, Wp::postInt('reminder_days_after', (int) ($current['reminder_days_after'] ?? 3))),
            'reminder_subject'                => self::textSettingFromPost('reminder_subject', $current),
            'reminder_email_heading'          => self::textSettingFromPost('reminder_email_heading', $current),
            'last_save_context'               => $save_context,
        ];

        if ($include_review_request_enabled) {
            $fields['review_request_enabled'] = self::boolSettingFromPost('review_request_enabled', true, $current);
        }

        return $fields;
    }

    /**
     * @return array<string, mixed>
     */
    public static function getSettingsFromPost(): array
    {
        // Reads from Wp request bag bound in Ajax::verifyNonce() after check_ajax_referer().
        $ctx = Wp::postKey('save_context', 'full');
        if (! in_array($ctx, ['automation', 'template', 'submission_form', 'full'], true)) {
            $ctx = 'full';
        }
        $current = self::getSettings();

        if ($ctx === 'automation') {
            return array_merge($current, self::automationFieldsFromPost($current, 'automation', true));
        }

        if ($ctx === 'template') {
            $email_layouts_raw             = Wp::postTextarea('email_layouts');
            $email_layout_block_styles_raw = Wp::postTextarea('email_layout_block_styles');

            return array_merge($current, [
                'subject'           => Wp::postText('subject'),
                'email_heading'     => Wp::postText('email_heading'),
                'reminder_subject'  => self::textSettingFromPost('reminder_subject', $current),
                'reminder_email_heading' => self::textSettingFromPost('reminder_email_heading', $current),
                'body'              => Wp::postKsesPost('body'),
                'primary_color'     => Wp::postText('primary_color'),
                'accent_color'      => Wp::postText('accent_color'),
                'font_family'       => Wp::postText('font_family', 'system'),
                'email_elements'    => Wp::parseJsonElements(Wp::postTextarea('email_elements')),
                'form_elements'     => Wp::parseJsonElements(Wp::postTextarea('form_elements')),
                'allow_photos'      => self::boolSettingFromPost('allow_photos', true, $current),
                'allow_videos'      => self::boolSettingFromPost('allow_videos', true, $current),
                'email_layouts'     => self::normalizeEmailLayouts($email_layouts_raw),
                'email_layout_block_styles' => self::normalizeEmailLayoutBlockStyles(
                    $email_layout_block_styles_raw
                ),
                'email_header_size'   => Wp::postText('email_header_size', '24px'),
                'email_text_size'     => Wp::postText('email_text_size', '14px'),
                'star_color'          => Wp::postText('star_color'),
                'button_color'        => Wp::postText('button_color'),
                'button_text_color'   => Wp::postText('button_text_color'),
                'text_color'          => Wp::postText('text_color'),
                'email_preheader'     => Wp::postText('email_preheader'),
                'last_save_context' => 'template',
            ]);
        }

        if ($ctx === 'submission_form') {
            return array_merge($current, [
                'form_title'         => Wp::postText('form_title', 'Write a Review'),
                'submit_button_text' => Wp::postText('submit_button_text', 'Submit Review'),
                'primary_color'      => Wp::postText('primary_color'),
                'allow_photos'       => self::boolSettingFromPost('allow_photos', true, $current),
                'allow_videos'       => self::boolSettingFromPost('allow_videos', true, $current),
                'form_show_name'     => self::boolSettingFromPost('form_show_name', true, $current),
                'form_show_email'    => self::boolSettingFromPost('form_show_email', false, $current),
                'form_show_location' => self::boolSettingFromPost('form_show_location', false, $current),
                'form_show_title'    => self::boolSettingFromPost('form_show_title', false, $current),
                'form_show_review'   => self::boolSettingFromPost('form_show_review', true, $current),
                'form_show_rating'   => self::boolSettingFromPost('form_show_rating', true, $current),
                'last_save_context'  => 'submission_form',
            ]);
        }

        return array_merge(
            $current,
            self::automationFieldsFromPost($current, 'full', true),
            [
                'subject'                   => Wp::postText('subject'),
                'email_heading'             => Wp::postText('email_heading'),
                'body'                      => Wp::postKsesPost('body'),
                'primary_color'             => Wp::postText('primary_color'),
                'accent_color'              => Wp::postText('accent_color'),
                'font_family'               => Wp::postText('font_family', 'system'),
                'email_elements'            => Wp::parseJsonElements(Wp::postTextarea('email_elements')),
                'form_elements'             => Wp::parseJsonElements(Wp::postTextarea('form_elements')),
                'email_layouts'             => self::normalizeEmailLayouts(Wp::postTextarea('email_layouts')),
                'email_layout_block_styles' => self::normalizeEmailLayoutBlockStyles(
                    Wp::postTextarea('email_layout_block_styles')
                ),
                'last_save_context'         => 'full',
            ]
        );
    }

    /**
     * @return array{message: string, settings: array, font_choices: array}
     */
    public static function saveSettingsFromAjax(): array
    {
        $data = self::getSettingsFromPost();

        self::saveSettings($data);

        $now_automation = filter_var($data['automation_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($now_automation) {
            self::processAutomationIfEnabled();
        }

        return array_merge(
            ['message' => 'Follow-up Email Settings saved.'],
            self::getAdminData()
        );
    }

    /**
     * @return array{ok: bool, message: string, customer?: array, mail_error?: string}
     */
    public static function sendEmailNow(int $id): array
    {
        if ($id <= 0) {
            return ['ok' => false, 'message' => 'Invalid customer row.'];
        }

        $row = Customer::getCustomerRow($id);
        if ($row === null) {
            return ['ok' => false, 'message' => 'Customer not found.'];
        }

        if (! empty($row['email_sent'])) {
            return ['ok' => false, 'message' => 'Follow-up email was already sent for this purchase.'];
        }

        $mail_error = '';
        if (! EmailService::sendToCustomer($row, $mail_error)) {
            $hint = $mail_error !== '' ? $mail_error : 'Unknown error.';

            return [
                'ok'         => false,
                'message'    => 'Could not send email: ' . $hint,
                'mail_error' => $mail_error,
            ];
        }

        Meta::markCustomerEmailSent($id, 'manual');

        return [
            'ok'       => true,
            'message'  => 'Follow-up email sent.',
            'customer' => Customers::getCustomerById($id),
        ];
    }

    /**
     * @return array{sent: int, attempted: int, errors: array<int, array{id: int, message: string}>}
     */
    public static function sendDueEmails(int $days_after, int $limit, string $send_source, bool $collect_errors = false): array
    {
        $rows   = Customer::getCustomersDueForEmail($days_after, $limit);
        $sent   = 0;
        $errors = [];

        foreach ($rows as $row) {
            $rid        = (int) ($row['id'] ?? 0);
            $mail_error = '';
            if (! EmailService::sendToCustomer($row, $mail_error)) {
                if ($collect_errors) {
                    $errors[] = [
                        'id'      => $rid,
                        'message' => $mail_error !== '' ? $mail_error : 'Send failed.',
                    ];
                }
                continue;
            }
            if ($rid > 0) {
                Meta::markCustomerEmailSent($rid, $send_source);
                $sent++;
            }
        }

        return [
            'sent'      => $sent,
            'attempted' => count($rows),
            'errors'    => $errors,
        ];
    }

    /**
     * @param array{page?: int, per_page?: int, search?: string, send_source?: string, require_sent?: bool} $args
     * @return array<string, mixed>
     */
    public static function getCustomersAdminData(array $args): array
    {
        self::maybeRunAutomatedSends();

        $data             = Customers::getCustomersForAdmin($args);
        $data['settings'] = self::getSettings();

        return $data;
    }

    /**
     * Run the automation email queue when automation is enabled (order hooks, cron, admin tick).
     */
    public static function processAutomationIfEnabled(): void
    {
        self::runCron();
    }

    /**
     * Process due follow-ups when automation is on (throttled for admin loads; cron still runs).
     */
    public static function maybeRunAutomatedSends(): void
    {
        $settings = self::getSettings();
        if (empty($settings['automation_enabled'])) {
            return;
        }

        $key  = 'hyoka_followup_automation_tick';
        $last = (int) get_transient($key);
        if ($last > 0 && (time() - $last) < 15 * MINUTE_IN_SECONDS) {
            return;
        }

        self::processAutomationIfEnabled();
        set_transient($key, time(), 15 * MINUTE_IN_SECONDS);
    }

    /**
     * @param array<string, array{interval: int, display: string}> $schedules
     * @return array<string, array{interval: int, display: string}>
     */
    public static function addCronSchedules(array $schedules): array
    {
        $schedules['hyoka_every_15_minutes'] = [
            'interval' => 15 * MINUTE_IN_SECONDS,
            'display'  => __('Every 15 minutes (Hyoka)', 'hyoka-product-reviews'),
        ];

        return $schedules;
    }

    /**
     * Register WP-Cron for automated follow-up sends (every 15 minutes when automation is on).
     */
    public static function initCron(): void
    {
        add_filter('cron_schedules', [self::class, 'addCronSchedules']);
        add_action(self::CRON_HOOK, [self::class, 'runCron']);

        if (! get_option('hyoka_cron_15min_migrated')) {
            $timestamp = wp_next_scheduled(self::CRON_HOOK);
            while ($timestamp) {
                wp_unschedule_event($timestamp, self::CRON_HOOK);
                $timestamp = wp_next_scheduled(self::CRON_HOOK);
            }
            update_option('hyoka_cron_15min_migrated', '1', false);
        }

        if (! wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 5 * MINUTE_IN_SECONDS, 'hyoka_every_15_minutes', self::CRON_HOOK);
        }
    }

    /**
     * Cron callback: send up to 50 pending follow-ups when automation is enabled.
     */
    public static function runCron(): void
    {
        $settings = self::getSettings();
        if (empty($settings['automation_enabled'])) {
            return;
        }

        if (! empty($settings['review_request_schedule_enabled'])) {
            self::sendDueEmails((int) $settings['days_after'], 50, 'automation');
        }

        if (! empty($settings['reminder_enabled'])) {
            self::sendDueReminders((int) $settings['reminder_days_after'], 50);
        }
    }

    /**
     * @return array{sent: int, attempted: int, errors: array<int, array{id: int, message: string}>}
     */
    public static function sendDueReminders(int $days_after_reminder, int $limit, bool $collect_errors = false): array
    {
        $rows   = Customer::getCustomersDueForReminder($days_after_reminder, $limit);
        $sent   = 0;
        $errors = [];

        foreach ($rows as $row) {
            $rid        = (int) ($row['id'] ?? 0);
            $mail_error = '';
            if (! EmailService::sendToCustomer($row, $mail_error, 'reminder')) {
                if ($collect_errors) {
                    $errors[] = [
                        'id'      => $rid,
                        'message' => $mail_error !== '' ? $mail_error : 'Send failed.',
                    ];
                }
                continue;
            }
            if ($rid > 0) {
                Meta::markReminderSent($rid);
                $sent++;
            }
        }

        return [
            'sent'      => $sent,
            'attempted' => count($rows),
            'errors'    => $errors,
        ];
    }

    public static function clearCronSchedule(): void
    {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
    }
}
