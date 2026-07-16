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
use Hyoka\App\Helper\Customers;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\Review;

defined('ABSPATH') || exit;

class EmailService
{
    /**
     * Template id => setting key that enables it (optional gates).
     *
     * @var array<string, array{enabled: string, requires_automation?: bool, requires_admin_notifications?: bool}>
     */
    private const TEMPLATE_RULES = [
        'store_review_fallback' => ['enabled' => 'review_request_enabled'],
        'reminder'              => ['enabled' => 'reminder_enabled', 'requires_automation' => true],
        'reply_notification'    => ['enabled' => 'reply_notification_enabled', 'requires_automation' => true],
        'media_reminder'        => ['enabled' => 'media_reminder_enabled', 'requires_automation' => true],
        'review_confirmation'   => ['enabled' => 'review_confirmation_enabled', 'requires_automation' => true],
    ];

    /** @var array<string, string> */
    private const SHARED_LAYOUT_DEFAULTS = [
        'greeting' => 'Hi {customer_name},',
        'signOff'  => 'Thanks! — The {site_name} team',
    ];

    /** @var array<string, array<string, string>> */
    private const LAYOUT_DEFAULTS = [
        'store_review_fallback' => [
            'storeBrand' => '{site_name}',
            'intro'      => 'Thank you for shopping with {site_name}. We\'d love to hear about your overall experience with our store — your feedback helps us improve and helps other customers choose with confidence.',
            'buttonText' => 'Leave a review',
            'starsHint'  => 'Or tap a star to rate your experience',
        ],
        'reminder' => [
            'storeBrand' => '{site_name}',
            'intro'      => 'We noticed you haven\'t left a review for {product_name} yet. Your feedback only takes a minute and helps other shoppers make confident decisions.',
            'productName' => '',
            'buttonText' => '',
            'starsHint'  => 'Or tap a star to rate your experience',
        ],
        'reply_notification' => [
            'heading'     => 'Your review got a reply!',
            'intro'       => 'Thanks for leaving a review for {product_name}. Your review:',
            'reviewTitle' => '',
            'reviewBody'  => '',
            'replyIntro'  => "Here's the reply from {site_name}:",
            'replyBody'   => '',
        ],
        'review_confirmation' => [
            'heading'     => 'Thanks for your review!',
            'intro'       => 'Thanks for submitting your review for {product_name}.',
            'reviewTitle' => '',
            'reviewBody'  => '',
            'ctaHint'     => 'You can view the product using the link below.',
            'buttonText'  => '',
        ],
        'media_reminder' => [
            'heading'     => 'Got a picture to add?',
            'intro'       => 'Thanks for your review for {product_name}!',
            'prompt'      => 'Would you like to add a photo to your review? It only takes a few seconds — and it can make a big difference for other shoppers.',
            'reviewLabel' => 'Your review:',
            'reviewTitle' => '',
            'reviewBody'  => '',
            'buttonText'  => 'Upload media',
        ],
    ];

    /** @var string[] */
    private const KNOWN_TEMPLATES = [
        'store_review_fallback',
        'reminder',
        'review_confirmation',
        'reply_notification',
        'media_reminder',
    ];

    public static function isTemplateEnabled(string $template_id): bool
    {
        $rule = self::TEMPLATE_RULES[$template_id] ?? null;
        if ($rule === null) {
            return false;
        }

        $settings = EmailSender::getSettings();
        if (! empty($rule['requires_automation']) && empty($settings['automation_enabled'])) {
            return false;
        }
        if (! empty($rule['requires_admin_notifications']) && empty($settings['admin_notifications_enabled'])) {
            return false;
        }

        $key = $rule['enabled'];

        return ! empty($settings[$key]);
    }

    /**
     * Legacy templates often omit {product_image}, {product_name_html}, and {review_button_html}; ensure the
     * rendered body still includes image, linked product name, and an inline-styled review CTA.
     *
     * @param array<string, string> $replacements
     */
    private static function mergeFollowupHtml(string $templateBody, string $inner, array $replacements): string
    {
        $out = $inner;
        $img = $replacements['{product_image}'] ?? '';
        if ($img !== '' && strpos($templateBody, '{product_image}') === false) {
            $out = '<div style="text-align:center;margin:0 0 16px;">' . $img . '</div>' . $out;
        }

        $rawName = (string) ($replacements['{product_name}'] ?? '');
        if ($rawName !== '' && strpos($templateBody, '{product_name_html}') === false) {
            $out = str_replace('<strong>' . $rawName . '</strong>', $replacements['{product_name_html}'], $out);
        }

        $btn = $replacements['{review_button_html}'] ?? '';
        if ($btn !== '' && trim($btn) !== '' && strpos($templateBody, '{review_button_html}') === false) {
            $out .= "\n" . $btn;
        }

        return $out;
    }

    public static function wrapEmailHtml(
        string $heading_html,
        string $inner_body_html,
        string $primary_color,
        string $accent_color,
        string $font_key
    ): string {
        $primary = Wp::sanitizeHexColor($primary_color, '#F59E0B');
        $font    = esc_attr(Wp::fontStackCss($font_key));

        $heading_safe    = esc_html($heading_html);
        $inner_body_html = Wp::sanitizeEmailInnerHtml($inner_body_html);

        $bg_color = '#F9FAFB';

        $body_style    = 'margin:0;padding:0;background-color:' . esc_attr($bg_color) . ';font-family:' . $font . ';-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;';
        $wrapper_style = 'width:100%;table-layout:fixed;background-color:' . esc_attr($bg_color) . ';padding-bottom:40px;';
        $table_style   = 'border-collapse:collapse;';
        $main_style    = 'background-color:#ffffff;margin:0 auto;width:100%;max-width:600px;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;';
        $header_style  = 'background-color:' . esc_attr($primary) . ';padding:40px 20px;text-align:center;';
        $h1_style      = 'margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;';
        $content_style = 'padding:40px 30px;color:#374151;font-size:16px;line-height:1.6;';
        $footer_style  = 'padding:20px;text-align:center;color:#9CA3AF;font-size:13px;';

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $heading_safe . '</title>
</head>
<body style="' . $body_style . '">
    <div style="' . $wrapper_style . '">
        <table role="presentation" width="100%" style="' . $table_style . '">
            <tr>
                <td align="center" style="padding:40px 10px 0;">
                    <table role="presentation" width="100%" style="' . $main_style . '">
                        <tr>
                            <td style="' . $header_style . '">
                                <h1 style="' . $h1_style . '">' . $heading_safe . '</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="' . $content_style . '">
                                ' . $inner_body_html . '
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="' . $footer_style . '">
                    &copy; ' . gmdate('Y') . ' ' . esc_html(get_bloginfo('name')) . '. All rights reserved.
                </td>
            </tr>
        </table>
    </div>
</body>
</html>';
    }

    /**
     * @param array<string, mixed> $row
     * @param string               $review_invite_url Fresh review link for this send (new token per email).
     * @param string               $button_primary    Hex for inline CTA background (many clients strip head styles).
     * @return array<string, string>|null
     */
    public static function buildEmailVars(array $row, string $review_invite_url = '', string $button_primary = '#F59E0B'): ?array
    {
        $customer = Customers::parseCustomer($row['customer'] ?? '');
        $email = sanitize_email($customer['email']);
        if (empty($email)) {
            return null;
        }

        $product_id = (int) ($row['product_id'] ?? 0);
        $product = Customers::parseProduct($row['product'] ?? '');

        $product_name = $product['title'] !== ''
            ? $product['title']
            : ($product_id ? (string) get_the_title($product_id) : '');
        if ($product_name === '') {
            $product_name = 'your recent purchase';
        }

        $customer_name = $customer['name'] !== '' ? $customer['name'] : 'Customer';
        $review_submitted = Customer::hasSubmittedReview($row);

        $permalink = '';
        if ($product_id > 0) {
            if (function_exists('wc_get_product')) {
                $wc_product = wc_get_product($product_id);
                if ($wc_product) {
                    $permalink = (string) $wc_product->get_permalink();
                }
            }
            if ($permalink === '') {
                $permalink = (string) get_permalink($product_id);
            }
        }

        $raw_product_link = $product['link'] !== '' ? $product['link'] : $permalink;
        if ($raw_product_link !== '') {
            $raw_product_link = self::ensureAbsoluteUrl($raw_product_link);
        } elseif ($permalink !== '') {
            $raw_product_link = self::ensureAbsoluteUrl($permalink);
        }

        if ($review_submitted) {
            $raw_review_link = $raw_product_link;
        } else {
            $raw_review_link = $review_invite_url !== '' ? $review_invite_url : $raw_product_link;
            if ($raw_review_link === '' && $permalink !== '') {
                $raw_review_link = $permalink;
            }
        }
        if ($raw_review_link === '') {
            $raw_review_link = home_url('/');
        }

        $product_url = $raw_product_link !== '' ? esc_url_raw($raw_product_link) : '';
        $review_url  = $review_submitted
            ? $product_url
            : esc_url_raw($raw_review_link);

        $primary_hex = Wp::sanitizeHexColor($button_primary, '#F59E0B');
        $settings    = EmailSender::getSettings();
        $layout      = self::mergedLayout('store_review_fallback', $settings);
        $btn_label   = trim(strtr((string) ($layout['buttonText'] ?? ''), []));
        if ($btn_label === '') {
            $btn_label = __('Leave a review', 'hyoka');
        }

        $name_esc = esc_html((string) $product_name);
        $product_href = $raw_product_link !== '' ? esc_url($raw_product_link) : '';
        $product_name_html = $product_href !== ''
            ? '<a href="' . esc_attr($product_href) . '" style="color:#111827;font-weight:700;text-decoration:underline;">' . $name_esc . '</a>'
            : '<strong>' . $name_esc . '</strong>';

        $review_button_html = $review_submitted
            ? ''
            : self::buildReviewButtonHtml($review_url, $primary_hex, $btn_label, $settings, 'store_review_fallback', 'buttonText');
        $product_image_url  = self::resolveProductImageUrl($product, $product_id);

        return [
            '{customer_name}'      => sanitize_text_field($customer_name),
            '{product_name}'       => (string) $product_name,
            '{product_name_html}'  => $product_name_html,
            '{product_image_url}'  => $product_image_url,
            '{product_image}'      => self::buildProductImageHtml($product_image_url, (string) $product_name),
            '{product_url}'        => $product_url,
            '{review_url}'         => $review_url,
            '{review_button_html}' => $review_button_html,
            '{site_name}'          => (string) get_bloginfo('name'),
            '{site_url}'           => esc_url_raw(wp_unslash(home_url())),
            '{order_id}'           => '',
        ];
    }

    /**
     * Remove order-number lines from email HTML (legacy templates may still include them).
     */
    private static function stripOrderIdMarkup(string $html): string
    {
        if ($html === '') {
            return $html;
        }

        $patterns = [
            '/<p[^>]*>\s*Order\s*#\{order_id\}\s*<\/p>/i',
            '/<p[^>]*>\s*Order\s*#\d+\s*<\/p>/i',
            '/<div[^>]*>\s*Order\s*#\{order_id\}\s*<\/div>/i',
            '/<div[^>]*>\s*Order\s*#\d+\s*<\/div>/i',
            '/Order\s*#\{order_id\}/i',
            '/Order\s*#\d+/i',
        ];

        foreach ($patterns as $pattern) {
            $html = preg_replace($pattern, '', $html) ?? $html;
        }

        return trim($html);
    }

    /**
     * @param array<string, mixed> $el
     */
    private static function elementReferencesOrderId(array $el): bool
    {
        $content = (string) ($el['content'] ?? '') . (string) ($el['text'] ?? '');

        return strpos($content, '{order_id}') !== false;
    }

    /**
     * Address used as wp_mail From for follow-ups (PHPMailer rejects wordpress@localhost).
     */
    public static function getFromEmail(): string
    {
        return apply_filters('hyoka_followup_from_email', EmailSender::resolveFromEmail());
    }

    /**
     * Display name for follow-up From header (single line, no CR/LF).
     */
    public static function getFromName(): string
    {
        $settings = EmailSender::getSettings();
        $name     = EmailSender::sanitizeFromName((string) ($settings['email_from_name'] ?? ''));

        if ($name === '') {
            $name = EmailSender::defaultFromName();
        }

        return apply_filters('hyoka_followup_from_name', $name);
    }

    /**
     * Send a templated email when the matching rule is enabled.
     *
     * @param array<string, string> $replacements Token map for subject/body.
     * @param array<string, mixed>  $options      reply_text, bcc_admin_copy.
     */
    public static function sendTemplateEmail(
        string $template_id,
        string $to_email,
        array $replacements,
        ?string &$failure_reason = null,
        array $options = []
    ): bool {
        $failure_reason = null;
        $template_id    = sanitize_key($template_id);
        $to_email       = sanitize_email($to_email);

        if ($to_email === '' || ! is_email($to_email)) {
            $failure_reason = __('Invalid recipient email.', 'hyoka');
            return false;
        }

        if (! self::isTemplateEnabled($template_id)) {
            $failure_reason = __('This email template rule is disabled.', 'hyoka');
            return false;
        }

        $settings     = EmailSender::getSettings();
        $primary_hex  = Wp::sanitizeHexColor((string) ($settings['primary_color'] ?? ''), '#F59E0B');

        if (! in_array($template_id, self::KNOWN_TEMPLATES, true)) {
            $failure_reason = __('Unknown email template.', 'hyoka');
            return false;
        }

        $render_options = [];
        if ($template_id === 'reply_notification') {
            $reply_text = sanitize_textarea_field(trim((string) ($options['reply_text'] ?? '')));
            if ($reply_text === '') {
                $failure_reason = __('Reply text is empty.', 'hyoka');
                return false;
            }
            $render_options['reply_text'] = $reply_text;
        }

        [$subject, $heading] = self::resolveSubjectHeading($template_id, $settings, $replacements);
        $inner_html          = self::renderLayoutTemplate($template_id, $replacements, $settings, $primary_hex, $render_options);

        if ($inner_html === '' && $template_id === 'store_review_fallback') {
            $template_body = self::stripOrderIdMarkup((string) ($settings['body'] ?? ''));
            $inner_html    = strtr($template_body, $replacements);
            $inner_html    = self::mergeFollowupHtml($template_body, $inner_html, $replacements);
        }

        if ($inner_html === '') {
            $failure_reason = __('Email template body is empty.', 'hyoka');
            return false;
        }

        $inner_html = self::stripOrderIdMarkup($inner_html);
        $inner_html = self::appendReviewLinkCta($inner_html, $replacements);

        $body = self::wrapEmailHtml(
            $heading,
            $inner_html,
            (string) ($settings['primary_color'] ?? '#F59E0B'),
            (string) ($settings['accent_color'] ?? '#FDB022'),
            (string) ($settings['font_family'] ?? 'system')
        );

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . self::getFromName() . ' <' . self::getFromEmail() . '>',
            'Reply-To: ' . self::getFromEmail(),
        ];

        if (! empty($options['bcc_admin_copy']) && ! empty($settings['admin_notifications_enabled']) && ! empty($settings['admin_send_email_copy'])) {
            $bccs = EmailSender::parseEmailList((string) ($settings['admin_notification_emails'] ?? ''));
            if ($bccs !== []) {
                $headers[] = 'Bcc: ' . implode(',', $bccs);
            }
        }

        $mail_failed_message = '';
        $on_failed           = static function ($error) use (&$mail_failed_message): void {
            if ($error instanceof \WP_Error) {
                $mail_failed_message = $error->get_error_message();
            }
        };

        $from_email = self::getFromEmail();
        $from_name  = self::getFromName();
        $from_filter = static function () use ($from_email): string {
            return $from_email;
        };
        $from_name_filter = static function () use ($from_name): string {
            return $from_name;
        };

        add_filter('wp_mail_from', $from_filter);
        add_filter('wp_mail_from_name', $from_name_filter);
        add_action('wp_mail_failed', $on_failed, 10, 1);
        $ok = (bool) wp_mail($to_email, $subject, $body, $headers);
        remove_action('wp_mail_failed', $on_failed, 10);
        remove_filter('wp_mail_from', $from_filter);
        remove_filter('wp_mail_from_name', $from_name_filter);

        if (! $ok) {
            $failure_reason = $mail_failed_message !== ''
                ? $mail_failed_message
                : __('wp_mail returned false. Please check your server or plugin settings.', 'hyoka');
        }

        return $ok;
    }

    /**
     * WooCommerce follow-up row (invite link + order checks).
     *
     * @param array<string, mixed> $row
     */
    public static function sendToCustomer(array $row, ?string &$failure_reason = null, string $email_kind = 'request'): bool
    {
        $failure_reason = null;
        $template_id    = $email_kind === 'reminder' ? 'reminder' : 'store_review_fallback';

        if (Customer::hasSubmittedReview($row)) {
            $failure_reason = __('Customer already submitted a review for this purchase.', 'hyoka');
            return false;
        }

        $order_id = (int) ($row['order_id'] ?? 0);
        if (function_exists('wc_get_order')) {
            if ($order_id <= 0) {
                $failure_reason = 'Missing order for this purchase row.';
                return false;
            }
            $order = wc_get_order($order_id);
            if (! $order || $order->get_status() !== 'completed') {
                $failure_reason = 'Follow-up is only sent when the WooCommerce order status is Completed.';
                return false;
            }
        }

        $row_pk = (int) ($row['id'] ?? 0);
        if ($row_pk <= 0) {
            $invite = null;
        } else {
            $invite = Link::refreshInviteForCustomer($row_pk);
        }
        if ($invite === null || empty($invite['url'])) {
            $failure_reason = __('Could not create a unique review link for this email. Check that the purchase row can store an invite token.', 'hyoka');
            return false;
        }

        $settings     = EmailSender::getSettings();
        $primary_hex  = Wp::sanitizeHexColor((string) ($settings['primary_color'] ?? ''), '#F59E0B');
        $replacements = self::buildEmailVars($row, (string) $invite['url'], $primary_hex);
        if ($replacements === null) {
            $failure_reason = 'Missing or invalid customer email for this purchase row.';
            return false;
        }

        $email = sanitize_email(Customers::parseCustomer($row['customer'] ?? '')['email']);

        return self::sendTemplateEmail(
            $template_id,
            $email,
            $replacements,
            $failure_reason,
            ['bcc_admin_copy' => true]
        );
    }

    /**
     * @param array<string, mixed> $settings
     * @return array{0: string, 1: string}
     */
    private static function resolveSubjectHeading(string $template_id, array $settings, array $replacements): array
    {
        if ($template_id === 'store_review_fallback') {
            $subject = trim(strtr(sanitize_text_field((string) ($settings['subject'] ?? '')), $replacements));
            $heading = trim(strtr(sanitize_text_field((string) ($settings['email_heading'] ?? '')), $replacements));
            if ($subject === '') {
                $subject = __("We'd love your feedback", 'hyoka');
            }
            if ($heading === '') {
                $heading = __('How was your experience with us?', 'hyoka');
            }

            return [$subject, $heading];
        }

        if ($template_id === 'reminder') {
            $subject = trim(strtr(sanitize_text_field((string) ($settings['reminder_subject'] ?? '')), $replacements));
            $heading = trim(strtr(sanitize_text_field((string) ($settings['reminder_email_heading'] ?? '')), $replacements));
            if ($subject === '') {
                $subject = __('Reminder: We would still love your review', 'hyoka');
            }
            if ($heading === '') {
                $heading = __('Still have a moment to leave a review?', 'hyoka');
            }

            return [$subject, $heading];
        }

        $layout  = self::mergedLayout($template_id, $settings);
        $heading = trim(strtr(sanitize_text_field((string) ($layout['heading'] ?? '')), $replacements));
        if ($heading === '') {
            $defaults = self::LAYOUT_DEFAULTS[$template_id]['heading'] ?? '';
            $heading  = trim(strtr(sanitize_text_field($defaults), $replacements));
        }
        if ($heading === '') {
            $heading = __('Notification from {site_name}', 'hyoka');
            $heading = strtr($heading, $replacements);
        }

        return [$heading, $heading];
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string, string>
     */
    private static function mergedLayout(string $template_id, array $settings): array
    {
        $saved = $settings['email_layouts'][$template_id] ?? [];
        if (! is_array($saved)) {
            $saved = [];
        }

        if ($template_id === 'store_review_fallback') {
            $legacy = $settings['email_layouts']['smart_email'] ?? [];
            if ($saved === [] && is_array($legacy) && $legacy !== []) {
                $saved = $legacy;
            }
        }

        unset($saved['_extras']);

        $defaults = array_merge(
            self::SHARED_LAYOUT_DEFAULTS,
            self::LAYOUT_DEFAULTS[$template_id] ?? []
        );

        return array_merge($defaults, $saved);
    }

    /**
     * @param array<string, string>  $replacements
     * @param array<string, mixed>   $settings
     * @param array<string, string>  $options
     */
    private static function renderLayoutTemplate(
        string $template_id,
        array $replacements,
        array $settings,
        string $primary_hex,
        array $options = []
    ): string {
        if (in_array($template_id, ['store_review_fallback', 'reminder'], true)) {
            return self::renderReviewRequestLayout($template_id, $replacements, $settings, $primary_hex);
        }

        $layout = self::mergedLayout($template_id, $settings);
        $html   = self::layoutTextBlock((string) ($layout['heading'] ?? ''), $replacements, 'h2', $settings, $template_id, 'heading', $primary_hex);
        $html  .= self::layoutTextBlock((string) ($layout['greeting'] ?? ''), $replacements, 'p', $settings, $template_id, 'greeting', $primary_hex);
        $html  .= self::layoutTextBlock((string) ($layout['intro'] ?? ''), $replacements, 'p', $settings, $template_id, 'intro', $primary_hex);

        [$review_title, $review_body] = self::resolveReviewQuote($layout, $replacements);

        if ($template_id === 'media_reminder') {
            $html .= self::layoutTextBlock((string) ($layout['prompt'] ?? ''), $replacements, 'p', $settings, $template_id, 'prompt', $primary_hex);
            $label = trim(strtr((string) ($layout['reviewLabel'] ?? ''), $replacements));
            if ($label !== '') {
                $html .= '<p style="margin:16px 0 8px;font-weight:600;color:#344054;">' . esc_html($label) . '</p>';
            }
        }

        if ($review_title !== '' || $review_body !== '') {
            $html .= self::layoutQuoteBox($review_title, $review_body);
        }

        if ($template_id === 'reply_notification') {
            $html .= self::layoutTextBlock((string) ($layout['replyIntro'] ?? ''), $replacements, 'p', $settings, $template_id, 'replyIntro', $primary_hex);
            $reply_text = (string) ($options['reply_text'] ?? '');
            if ($reply_text !== '') {
                $html .= '<div style="margin:16px 0;padding:16px;background:#ffffff;border:1px solid #eaecf0;border-radius:8px;">'
                    . '<span style="color:#374151;line-height:1.6;">' . esc_html($reply_text) . '</span></div>';
            }
        }

        if ($template_id === 'review_confirmation') {
            $html .= self::layoutTextBlock((string) ($layout['ctaHint'] ?? ''), $replacements, 'p', $settings, $template_id, 'ctaHint', $primary_hex);
            $btn_label = trim(strtr((string) ($layout['buttonText'] ?? ''), $replacements));
            if ($btn_label !== '') {
                $product_url = (string) ($replacements['{product_url}'] ?? '');
                $html .= self::buildReviewButtonHtml($product_url, $primary_hex, $btn_label, $settings, $template_id, 'buttonText');
            }
        }

        if ($template_id === 'media_reminder') {
            $btn_label = trim(strtr((string) ($layout['buttonText'] ?? ''), $replacements));
            if ($btn_label === '') {
                $btn_label = __('Upload media', 'hyoka');
            }
            $html .= self::buildReviewButtonHtml((string) ($replacements['{review_url}'] ?? ''), $primary_hex, $btn_label, $settings, $template_id, 'buttonText');
        }

        $html .= self::layoutTextBlock((string) ($layout['signOff'] ?? ''), $replacements, 'p', $settings, $template_id, 'signOff', $primary_hex);
        $html .= self::renderLayoutExtras($template_id, $replacements, $settings, $primary_hex);

        return $html;
    }

    /**
     * @param array<string, string> $replacements
     * @param array<string, mixed>  $settings
     */
    private static function renderReviewRequestLayout(
        string $template_id,
        array $replacements,
        array $settings,
        string $primary_hex
    ): string {
        $layout = self::mergedLayout($template_id, $settings);
        $html   = '';

        $store_brand = trim(strtr((string) ($layout['storeBrand'] ?? ''), $replacements));
        if ($store_brand !== '') {
            $brand_style = self::getBlockStyle($settings, $template_id, 'storeBrand', $primary_hex);
            $html .= '<p style="' . esc_attr(self::inlineStyleFromBlock($brand_style, ['margin' => '0 0 20px'])) . '">'
                . wp_kses_post($store_brand) . '</p>';
        }

        $html .= self::layoutTextBlock((string) ($layout['greeting'] ?? ''), $replacements, 'p', $settings, $template_id, 'greeting', $primary_hex);
        $html .= self::layoutTextBlock((string) ($layout['intro'] ?? ''), $replacements, 'p', $settings, $template_id, 'intro', $primary_hex);

        if ($template_id === 'store_review_fallback') {
            $html .= self::layoutLinkedProductImageBlock($replacements);
            $html .= self::layoutLinkedProductNameBlock($layout, $replacements, $settings, $template_id, $primary_hex);
        }

        if ($template_id === 'reminder') {
            $html .= self::layoutLinkedProductNameBlock($layout, $replacements, $settings, $template_id, $primary_hex);
            $html .= self::layoutLinkedProductImageBlock($replacements);
        }

        if (self::reviewInviteCtaEnabled($replacements)) {
            $btn_label = trim(strtr((string) ($layout['buttonText'] ?? ''), $replacements));
            if ($btn_label === '') {
                $btn_label = __('Leave a review', 'hyoka');
            }
            $html .= self::buildReviewButtonHtml((string) ($replacements['{review_url}'] ?? ''), $primary_hex, $btn_label, $settings, $template_id, 'buttonText');
        }
        $html .= self::layoutStarsBlock($layout, $replacements, $primary_hex, $settings, $template_id);

        $html .= self::layoutTextBlock((string) ($layout['signOff'] ?? ''), $replacements, 'p', $settings, $template_id, 'signOff', $primary_hex);
        $html .= self::renderLayoutExtras($template_id, $replacements, $settings, $primary_hex);

        return $html;
    }

    /**
     * @param array<string, string> $replacements
     */
    private static function layoutLinkedProductImageBlock(array $replacements): string
    {
        $img = $replacements['{product_image}'] ?? '';
        if ($img === '') {
            return '';
        }

        $product_url = (string) ($replacements['{product_url}'] ?? '');
        if ($product_url !== '') {
            $img = '<a href="' . esc_url($product_url) . '" style="text-decoration:none;">' . $img . '</a>';
        }

        return '<div style="text-align:center;margin:0 0 16px;">' . $img . '</div>';
    }

    /**
     * @param array<string, string> $layout
     * @param array<string, string> $replacements
     */
    private static function layoutLinkedProductNameBlock(
        array $layout,
        array $replacements,
        array $settings = [],
        string $template_id = '',
        string $primary_hex = '#F59E0B'
    ): string {
        $product_line = trim(strtr((string) ($layout['productName'] ?? ''), $replacements));
        if ($product_line === '' && ! empty($replacements['{product_name}'])) {
            $product_line = (string) $replacements['{product_name}'];
        }
        if ($product_line === '') {
            return '';
        }

        $product_html = ! empty($replacements['{product_name_html}'])
            ? (string) $replacements['{product_name_html}']
            : esc_html($product_line);

        $style = $settings !== []
            ? self::getBlockStyle($settings, $template_id, 'productName', $primary_hex)
            : ['fontWeight' => '600', 'color' => '#111827', 'textAlign' => 'center', 'fontSize' => '16px', 'lineHeight' => '1.4'];

        return '<p style="' . esc_attr(self::inlineStyleFromBlock($style, ['margin' => '0 0 8px'])) . '">'
            . wp_kses_post($product_html) . '</p>';
    }

    /**
     * @param array{title?: string, image?: string, link?: string} $product
     */
    private static function resolveProductImageUrl(array $product, int $product_id): string
    {
        if ($product_id > 0) {
            $from_product = self::resolveProductImageFromId($product_id);
            if ($from_product !== '') {
                return $from_product;
            }
        }

        $url = isset($product['image']) ? trim((string) $product['image']) : '';
        if ($url !== '') {
            return self::ensureAbsoluteUrl($url);
        }

        return '';
    }

    private static function resolveProductImageFromId(int $product_id): string
    {
        if ($product_id <= 0) {
            return '';
        }

        if (function_exists('wc_get_product')) {
            $wc_product = wc_get_product($product_id);
            if ($wc_product) {
                $img_id = (int) $wc_product->get_image_id();
                if ($img_id > 0) {
                    $src = wp_get_attachment_image_url($img_id, 'medium');
                    if (is_string($src) && $src !== '') {
                        return self::ensureAbsoluteUrl($src);
                    }
                }
            }
        }

        $thumb_id = (int) get_post_thumbnail_id($product_id);
        if ($thumb_id > 0) {
            $src = wp_get_attachment_image_url($thumb_id, 'medium');
            if (is_string($src) && $src !== '') {
                return self::ensureAbsoluteUrl($src);
            }
        }

        return '';
    }

    private static function ensureAbsoluteUrl(string $url): string
    {
        $url = trim(wp_unslash($url));
        if ($url === '') {
            return '';
        }

        if (preg_match('#^https?://#i', $url)) {
            return esc_url_raw($url);
        }

        if (str_starts_with($url, '//')) {
            return esc_url_raw(set_url_scheme($url, is_ssl() ? 'https' : 'http'));
        }

        return esc_url_raw(home_url($url));
    }

    private static function buildProductImageHtml(string $image_url, string $product_name): string
    {
        if ($image_url === '') {
            return '';
        }

        return '<img src="' . esc_url($image_url) . '" alt="' . esc_attr($product_name) . '" width="150" height="150" style="display:block;margin:0 auto;max-width:200px;height:auto;border-radius:8px;border:1px solid #eaecf0;">';
    }

    /**
     * @param array<string, string> $layout
     * @param array<string, string> $replacements
     * @return array{0: string, 1: string}
     */
    private static function resolveReviewQuote(array $layout, array $replacements): array
    {
        $review_title = trim(strtr((string) ($layout['reviewTitle'] ?? ''), $replacements));
        $review_body  = trim(strtr((string) ($layout['reviewBody'] ?? ''), $replacements));
        if ($review_title === '' && isset($replacements['{review_title}'])) {
            $review_title = trim($replacements['{review_title}']);
        }
        if ($review_body === '' && isset($replacements['{review_body}'])) {
            $review_body = trim($replacements['{review_body}']);
        }

        return [$review_title, $review_body];
    }

    /**
     * @param array<string, string> $layout
     * @param array<string, string> $replacements
     */
    private static function layoutStarsBlock(
        array $layout,
        array $replacements,
        string $primary_hex,
        array $settings = [],
        string $template_id = ''
    ): string {
        $hint = trim(strtr((string) ($layout['starsHint'] ?? ''), $replacements));
        $star_style = $settings !== []
            ? self::getBlockStyle($settings, $template_id, 'starsHint', $primary_hex)
            : ['starColor' => $primary_hex, 'fontSize' => '13px', 'color' => '#667085', 'textAlign' => 'center'];
        $star_color = Wp::sanitizeHexColor((string) ($star_style['starColor'] ?? ''), $primary_hex);
        $stars_html = self::buildStarsHtml($star_color);

        $review_url = (string) ($replacements['{review_url}'] ?? '');
        $link_open  = $review_url !== '' && self::reviewInviteCtaEnabled($replacements)
            ? '<a href="' . esc_url($review_url) . '" style="text-decoration:none;">'
            : '';
        $link_close = $link_open !== '' ? '</a>' : '';

        $html = '<div style="text-align:center;margin:20px 0;">'
            . $link_open . '<div style="margin-bottom:8px;">' . $stars_html . '</div>' . $link_close;
        if ($hint !== '') {
            $hint_style = self::inlineStyleFromBlock($star_style, ['margin' => '4px 0 0']);
            $html .= '<div style="' . esc_attr($hint_style) . '">' . esc_html($hint) . '</div>';
        }
        $html .= '</div>';

        return $html;
    }

    private static function buildStarsHtml(string $star_color, string $star_size = '24px'): string
    {
        $color = esc_attr($star_color);
        $size  = esc_attr($star_size);
        $html  = '';
        for ($i = 0; $i < 5; $i++) {
            $html .= '<span style="color:' . $color . ';font-size:' . $size . ';line-height:1;">★</span>';
        }

        return $html;
    }

    private static function layoutQuoteBox(string $review_title, string $review_body): string
    {
        if ($review_title === '' && $review_body === '') {
            return '';
        }

        $quote = '<span style="font-size:52px;line-height:1;color:#9ca3af;display:block;margin-bottom:12px;">&ldquo;</span>';
        if ($review_title !== '') {
            $quote .= '<strong style="display:block;margin-bottom:8px;color:#111827;">'
                . esc_html($review_title) . '</strong>';
        }
        if ($review_body !== '') {
            $quote .= '<span style="color:#4b5563;">' . esc_html($review_body) . '</span>';
        }

        return '<div style="margin:16px 0;padding:24px;background:#f3f4f6;border-radius:8px;text-align:center;">'
            . $quote . '</div>';
    }

    /**
     * @param array<string, string>  $replacements
     * @param array<string, mixed> $settings
     */
    private static function renderLayoutExtras(
        string $template_id,
        array $replacements,
        array $settings,
        string $primary_hex
    ): string {
        $html = '';
        foreach (EmailSender::normalizeEmailLayoutExtras($settings['email_layouts'][$template_id]['_extras'] ?? []) as $el) {
            if (is_array($el) && ! self::elementReferencesOrderId($el)) {
                $html .= self::renderElement($el, $replacements, $primary_hex);
            }
        }

        return $html;
    }

    public static function buildMediaUploadUrl(int $product_id, int $review_id = 0, string $email = ''): string
    {
        unset($product_id);

        $review_id = absint($review_id);
        $email     = sanitize_email($email);

        if ($review_id > 0 && $email !== '' && is_email($email)) {
            return MediaUpload::buildUrl($review_id, $email);
        }

        return esc_url_raw(home_url('/'));
    }

    public static function buildReviewButtonHtml(
        string $review_url,
        string $primary_hex,
        string $label,
        array $settings = [],
        string $template_id = '',
        string $block_key = 'buttonText'
    ): string {
        $href = esc_url($review_url);
        if ($href === '') {
            return '';
        }

        $btn_style = $settings !== []
            ? self::getBlockStyle($settings, $template_id, $block_key, $primary_hex)
            : ['bgColor' => $primary_hex, 'color' => '#ffffff', 'fontSize' => '16px', 'fontWeight' => '600', 'textAlign' => 'center'];
        $bg_color    = Wp::sanitizeHexColor((string) ($btn_style['bgColor'] ?? ''), $primary_hex);
        $text_color  = Wp::sanitizeHexColor((string) ($btn_style['color'] ?? ''), '#ffffff');
        $font_size   = Wp::sanitizeCssLength((string) ($btn_style['fontSize'] ?? '16px'), '16px');
        $font_weight = Wp::sanitizeCssFontWeight((string) ($btn_style['fontWeight'] ?? '600'), '600');

        return '<p style="text-align:center;margin:24px 0 0;">'
            . '<a href="' . esc_url($href) . '" style="display:inline-block;padding:12px 24px;background-color:'
            . esc_attr($bg_color) . ';color:' . esc_attr($text_color) . ' !important;text-decoration:none;border-radius:6px;font-weight:'
            . esc_attr($font_weight) . ';font-size:' . esc_attr($font_size) . ';">'
            . esc_html($label)
            . '</a></p>';
    }

    /**
     * @param array<string, string> $replacements
     */
    private static function reviewInviteCtaEnabled(array $replacements): bool
    {
        return trim((string) ($replacements['{review_button_html}'] ?? '')) !== '';
    }

    /**
     * @param array<string, string> $replacements
     */
    private static function appendReviewLinkCta(string $inner_html, array $replacements): string
    {
        $btn = $replacements['{review_button_html}'] ?? '';
        if ($btn === '' || strpos($inner_html, '{review_button_html}') !== false) {
            return $inner_html;
        }
        if (self::innerHtmlHasReviewButton($inner_html)) {
            return $inner_html;
        }

        return $inner_html . "\n" . $btn;
    }

    private static function innerHtmlHasReviewButton(string $inner_html): bool
    {
        return preg_match('/display:\s*inline-block[^"\']*padding:\s*12px/i', $inner_html) === 1;
    }

    private static function renderElement(array $el, array $replacements, string $primary_hex): string
    {
        $type = $el['type'] ?? '';
        $html = '';

        $textAlign  = Wp::sanitizeTextAlign((string) ($el['textAlign'] ?? 'left'));
        $fontSize   = Wp::sanitizeCssLength((string) ($el['fontSize'] ?? '14px'), '14px');
        $fontWeight = Wp::sanitizeCssFontWeight((string) ($el['fontWeight'] ?? '400'), '400');
        $textColor  = Wp::sanitizeHexColor((string) ($el['color'] ?? '#4b5563'), '#4b5563');
        $style_base = 'text-align:' . $textAlign . ';font-size:' . $fontSize . ';font-weight:' . $fontWeight . ';color:' . $textColor . ';';

        switch ($type) {
            case 'text':
                $content = strtr($el['content'] ?? '', $replacements);
                $html = '<div style="' . esc_attr($style_base . 'margin-bottom:15px;line-height:1.6;') . '">' . wp_kses_post($content) . '</div>';
                break;
            case 'image':
                $url = trim(strtr($el['url'] ?? '', $replacements));
                if ($url === '') {
                    break;
                }
                if (strpos($url, '<img') !== false) {
                    $html = '<div style="text-align:center;margin-bottom:20px;">'
                        . Wp::sanitizeEmailInnerHtml($url)
                        . '</div>';
                } else {
                    $html = '<div style="text-align:center;margin-bottom:20px;">'
                        . '<img src="' . esc_url(self::ensureAbsoluteUrl($url)) . '" alt="" style="max-width:100%;height:auto;border-radius:8px;display:inline-block;" />'
                        . '</div>';
                }
                break;
            case 'video':
                $url = esc_url(strtr($el['url'] ?? '', $replacements));
                if ($url !== '') {
                    $html = '<div style="text-align:center;margin-bottom:20px;padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #eaecf0;">'
                        . '<div style="margin-bottom:10px;">' . esc_html__('Video Content', 'hyoka') . '</div>'
                        . '<a href="' . esc_url($url) . '" style="color:' . esc_attr($primary_hex) . ';text-decoration:underline;">'
                        . esc_html__('Watch Video', 'hyoka') . '</a>'
                        . '</div>';
                }
                break;
            case 'button':
                if (! self::reviewInviteCtaEnabled($replacements)) {
                    break;
                }
                $text = strtr($el['text'] ?? 'Click Here', $replacements);
                $url  = esc_url((string) ($replacements['{review_url}'] ?? ''));
                if ($url === '') {
                    break;
                }
                $html = '<div style="text-align:center;margin:25px 0;">'
                    . '<a href="' . esc_url($url) . '" style="display:inline-block;padding:12px 30px;background-color:'
                    . esc_attr($primary_hex) . ';color:#ffffff !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:'
                    . esc_attr($fontSize) . ';">'
                    . esc_html($text)
                    . '</a></div>';
                break;
            case 'rating':
            case 'stars':
                $starColor = Wp::sanitizeHexColor((string) ($el['starColor'] ?? $primary_hex), $primary_hex);
                $hintText  = esc_html(strtr($el['hintText'] ?? '', $replacements));
                $hintSize  = Wp::sanitizeCssLength((string) ($el['hintFontSize'] ?? '13px'), '13px');
                $hintColor = Wp::sanitizeHexColor((string) ($el['hintColor'] ?? '#4b5563'), '#4b5563');
                $align     = Wp::sanitizeTextAlign((string) ($el['textAlign'] ?? 'center'));
                $starSize  = Wp::sanitizeCssLength((string) ($el['starSize'] ?? '24px'), '24px');
                $starsHtml = self::buildStarsHtml($starColor, $starSize);
                $html = '<div style="text-align:' . esc_attr($align) . ';margin:15px 0;">'
                    . '<div style="margin-bottom:8px;">' . $starsHtml . '</div>';
                if ($hintText !== '') {
                    $html .= '<div style="font-size:' . esc_attr($hintSize) . ';color:' . esc_attr($hintColor) . ';">' . $hintText . '</div>';
                }
                $html .= '</div>';
                break;
            case 'divider':
                $lineColor = Wp::sanitizeHexColor((string) ($el['color'] ?? '#eaecf0'), '#eaecf0');
                $html      = '<hr style="border:0;border-top:2px solid ' . esc_attr($lineColor) . ';margin:20px 0;" />';
                break;
            case 'spacer':
                $height = Wp::sanitizeCssLength((string) ($el['height'] ?? '24px'), '24px');
                $html   = '<div style="height:' . esc_attr($height) . ';line-height:0;font-size:0;">&nbsp;</div>';
                break;
            case 'link':
                $linkText  = esc_html(strtr($el['text'] ?? 'Learn more', $replacements));
                $linkUrl   = esc_url(strtr((string) ($el['url'] ?? '#'), $replacements));
                $linkColor = Wp::sanitizeHexColor((string) ($el['color'] ?? $primary_hex), $primary_hex);
                $html      = '<div style="text-align:center;margin:15px 0;">'
                    . '<a href="' . esc_url($linkUrl) . '" style="color:' . esc_attr($linkColor) . ';font-size:'
                    . esc_attr($fontSize) . ';font-weight:600;text-decoration:underline;">'
                    . $linkText . '</a></div>';
                break;
        }

        return $html;
    }

    /**
     * @param array<string, mixed> $review_row
     * @return array<string, string>|null
     */
    public static function buildReplacementsFromReview(array $review_row): ?array
    {
        $email = sanitize_email((string) ($review_row['email'] ?? ''));
        if ($email === '' || ! is_email($email)) {
            return null;
        }

        $content_data = Review::decodeReviewContent($review_row);

        $author = $content_data['author'] !== '' ? $content_data['author'] : (string) ($review_row['author'] ?? '');
        if ($author === '') {
            $author = 'Customer';
        }

        $review_title = $content_data['title'] !== '' ? $content_data['title'] : (string) ($review_row['title'] ?? '');
        $review_body  = $content_data['text'];
        if ($review_body === '') {
            $review_body = (string) ($review_row['question'] ?? '');
        }

        $product_id = absint($review_row['product_id'] ?? 0);
        $product_name = $product_id > 0 ? (string) get_the_title($product_id) : '';
        if ($product_name === '') {
            $product_name = __('your product', 'hyoka');
        }

        $permalink = $product_id > 0 ? (string) get_permalink($product_id) : '';
        $product_url = $permalink !== '' ? esc_url($permalink) : '';
        $name_esc    = esc_html($product_name);
        $product_name_html = $product_url !== ''
            ? '<a href="' . esc_url($permalink) . '" style="color:#111827;font-weight:700;text-decoration:underline;">' . $name_esc . '</a>'
            : '<strong>' . $name_esc . '</strong>';

        $product_image_url = self::resolveProductImageUrl([], $product_id);
        $image_html        = self::buildProductImageHtml($product_image_url, $product_name);

        $primary_hex = Wp::sanitizeHexColor((string) (EmailSender::getSettings()['primary_color'] ?? ''), '#F59E0B');
        $review_url  = Link::resolveReviewUrl($product_id, $email);
        $review_button_html = '';

        return [
            '{customer_name}'      => sanitize_text_field($author),
            '{product_name}'       => $product_name,
            '{product_name_html}'  => $product_name_html,
            '{product_image_url}'  => $product_image_url,
            '{product_image}'      => $image_html,
            '{product_url}'        => $product_url,
            '{review_url}'         => esc_url($review_url),
            '{review_button_html}' => $review_button_html,
            '{site_name}'          => (string) get_bloginfo('name'),
            '{site_url}'           => esc_url_raw(wp_unslash(home_url())),
            '{order_id}'           => '',
            '{review_title}'       => sanitize_text_field($review_title),
            '{review_body}'        => sanitize_textarea_field($review_body),
            '{question_text}'      => sanitize_textarea_field((string) ($review_row['question'] ?? '')),
        ];
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string, string>
     */
    private static function getBlockStyle(array $settings, string $template_id, string $block_key, string $primary_hex): array
    {
        $preset_key = self::blockStylePresetKey($block_key);
        $preset     = self::blockStylePreset($preset_key);
        $global     = self::globalBlockStyleOverrides($settings, $block_key, $preset_key);
        $saved      = [];
        if (isset($settings['email_layout_block_styles'][$template_id][$block_key])
            && is_array($settings['email_layout_block_styles'][$template_id][$block_key])) {
            $saved = $settings['email_layout_block_styles'][$template_id][$block_key];
        }

        $merged = array_merge($preset, $global, $saved);

        if (empty($merged['color']) && $preset_key === 'storeBrand') {
            $merged['color'] = $primary_hex;
        }
        if (empty($merged['starColor'])) {
            $merged['starColor'] = Wp::sanitizeHexColor((string) ($settings['star_color'] ?? ''), $primary_hex);
        }
        if (empty($merged['bgColor']) && $preset_key === 'button') {
            $merged['bgColor'] = Wp::sanitizeHexColor((string) ($settings['button_color'] ?? ''), $primary_hex);
        }
        if ($preset_key === 'button' && empty($merged['color'])) {
            $merged['color'] = Wp::sanitizeHexColor((string) ($settings['button_text_color'] ?? ''), '#ffffff');
        }

        return $merged;
    }

    private static function blockStylePresetKey(string $block_key): string
    {
        $map = [
            'heading'      => 'heading',
            'storeBrand'   => 'storeBrand',
            'greeting'     => 'greeting',
            'intro'        => 'text',
            'productName'  => 'heading',
            'starsHint'    => 'stars',
            'signOff'      => 'text',
            'ctaHint'      => 'text',
            'replyIntro'   => 'text',
            'prompt'       => 'text',
            'buttonText'   => 'button',
        ];

        return $map[ $block_key ] ?? 'text';
    }

    /**
     * @return array<string, string>
     */
    private static function blockStylePreset(string $preset_key): array
    {
        $presets = [
            'heading' => [
                'fontSize' => '24px',
                'fontWeight' => '700',
                'color' => '#111827',
                'textAlign' => 'center',
                'lineHeight' => '1.3',
            ],
            'storeBrand' => [
                'fontSize' => '16px',
                'fontWeight' => '700',
                'color' => '',
                'textAlign' => 'center',
                'lineHeight' => '1.3',
            ],
            'greeting' => [
                'fontSize' => '14px',
                'fontWeight' => '400',
                'color' => '#4b5563',
                'textAlign' => 'left',
                'lineHeight' => '1.5',
            ],
            'text' => [
                'fontSize' => '14px',
                'fontWeight' => '400',
                'color' => '#4b5563',
                'textAlign' => 'center',
                'lineHeight' => '1.5',
            ],
            'button' => [
                'fontSize' => '15px',
                'fontWeight' => '700',
                'color' => '#ffffff',
                'textAlign' => 'center',
                'bgColor' => '',
                'lineHeight' => '1.4',
            ],
            'stars' => [
                'fontSize' => '13px',
                'fontWeight' => '400',
                'color' => '#4b5563',
                'textAlign' => 'center',
                'starColor' => '',
                'lineHeight' => '1.5',
            ],
        ];

        return $presets[ $preset_key ] ?? $presets['text'];
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string, string>
     */
    private static function globalBlockStyleOverrides(array $settings, string $block_key, string $preset_key): array
    {
        $overrides = [];
        $header_blocks = ['heading', 'productName'];
        $body_blocks   = [
            'intro', 'greeting', 'starsHint', 'signOff', 'ctaHint', 'replyIntro', 'prompt',
        ];

        if (in_array($block_key, $header_blocks, true)) {
            if (! empty($settings['email_header_size'])) {
                $overrides['fontSize'] = Wp::sanitizeCssLength((string) $settings['email_header_size'], '24px');
            }
            if (! empty($settings['text_color'])) {
                $overrides['color'] = Wp::sanitizeHexColor((string) $settings['text_color'], '#111827');
            }
        } elseif (in_array($block_key, $body_blocks, true)) {
            if (! empty($settings['email_text_size'])) {
                $overrides['fontSize'] = Wp::sanitizeCssLength((string) $settings['email_text_size'], '14px');
            }
            if (! empty($settings['text_color'])) {
                $overrides['color'] = Wp::sanitizeHexColor((string) $settings['text_color'], '#4b5563');
            }
        }

        if ($preset_key === 'stars' && ! empty($settings['star_color'])) {
            $overrides['starColor'] = Wp::sanitizeHexColor((string) $settings['star_color'], '#F59E0B');
        }
        if ($preset_key === 'button') {
            if (! empty($settings['button_color'])) {
                $overrides['bgColor'] = Wp::sanitizeHexColor((string) $settings['button_color'], '#F59E0B');
            }
            if (! empty($settings['button_text_color'])) {
                $overrides['color'] = Wp::sanitizeHexColor((string) $settings['button_text_color'], '#ffffff');
            }
        }

        return $overrides;
    }

    /**
     * @param array<string, string> $style
     * @param array<string, string> $extra
     */
    private static function inlineStyleFromBlock(array $style, array $extra = []): string
    {
        $merged = array_merge($style, $extra);
        $parts  = [];

        if (! empty($merged['fontSize'])) {
            $parts[] = 'font-size:' . Wp::sanitizeCssLength((string) $merged['fontSize'], '14px');
        }
        if (! empty($merged['fontWeight'])) {
            $parts[] = 'font-weight:' . Wp::sanitizeCssFontWeight((string) $merged['fontWeight'], '400');
        }
        if (! empty($merged['color'])) {
            $parts[] = 'color:' . Wp::sanitizeHexColor((string) $merged['color'], '#4b5563');
        }
        if (! empty($merged['textAlign'])) {
            $parts[] = 'text-align:' . Wp::sanitizeTextAlign((string) $merged['textAlign']);
        }
        if (! empty($merged['lineHeight'])) {
            $parts[] = 'line-height:' . Wp::sanitizeCssLineHeight((string) $merged['lineHeight'], '1.6');
        }
        if (! empty($merged['margin'])) {
            $parts[] = 'margin:' . Wp::sanitizeCssMargin((string) $merged['margin'], '0');
        }

        return implode(';', $parts);
    }

    /**
     * @param array<string, mixed> $settings
     */
    private static function layoutTextBlock(
        string $text,
        array $replacements,
        string $tag = 'p',
        array $settings = [],
        string $template_id = '',
        string $block_key = '',
        string $primary_hex = '#F59E0B'
    ): string {
        $text = trim(strtr($text, $replacements));
        if ($text === '') {
            return '';
        }

        $style = $settings !== [] && $block_key !== ''
            ? self::getBlockStyle($settings, $template_id, $block_key, $primary_hex)
            : ['color' => '#4b5563', 'lineHeight' => '1.6', 'fontSize' => '14px'];
        $inline = self::inlineStyleFromBlock($style, ['margin' => '0 0 16px']);

        return '<' . $tag . ' style="' . esc_attr($inline) . '">'
            . wp_kses_post($text)
            . '</' . $tag . '>';
    }
}
