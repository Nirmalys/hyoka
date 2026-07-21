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

use Hyoka\App\Helper\Assets;
use Hyoka\App\Helper\SubmissionFormRender;
use Hyoka\App\Helper\Customers;
use Hyoka\App\Helper\Wp;

defined('ABSPATH') || exit;

class ReviewInvite
{
    public static function init(): void
    {
        add_action('template_redirect', [self::class, 'renderInvitePage'], 0);
    }

    public static function renderInvitePage(): void
    {
        if (is_admin()) {
            return;
        }

        // Reading a signed invite token from the URL.
        //
        // This is not a form submission or CSRF-protected action.
        // The unguessable invite token is the authorization mechanism.
        // Validation is performed by:
        // - SHA-256 hash lookup
        // - expiry check
        // - single-use (consumed) check
        // - completed-order / customer-row resolution
        //
        // A WordPress nonce cannot be used here: invite links live ~30 days,
        // recipients are typically logged out, and WP nonces are session-scoped.
        // Actual review submission is protected separately with hyoka_nonce / wp_rest.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Invite bearer token is validated separately (hash/expiry/single-use); not a form POST.
        $query = (isset($_GET) && is_array($_GET)) ? wp_unslash($_GET) : [];
        $plain = Link::getInviteFromRequest(is_array($query) ? $query : []);
        if ($plain === null) {
            return;
        }

        $status = Link::getInviteStatus($plain);
        if ($status !== 'valid') {
            $message = Link::inviteStatusMessage($status);
            if ($message === '') {
                $message = __('This review link is invalid.', 'hyoka-product-reviews');
            }
            self::renderError($message);
            return;
        }

        $resolved = Link::getInviteByToken($plain);
        if ($resolved === null) {
            self::renderError(Link::inviteStatusMessage('invalid'));
            return;
        }

        $row = $resolved['row'];
        $product = Customers::parseProduct($row['product'] ?? '');
        $customer = Customers::parseCustomer($row['customer'] ?? '');
        $product_id = (int) ($row['product_id'] ?? 0);

        $title = $product['title'] !== ''
            ? $product['title']
            : ($product_id > 0 ? (string) get_the_title($product_id) : __('Product', 'hyoka-product-reviews'));
        $permalink = $product['link'] !== ''
            ? $product['link']
            : ($product_id > 0 ? esc_url_raw((string) get_permalink($product_id)) : '');

        $nonce = wp_create_nonce('hyoka_nonce');
        $permalink_js = $permalink !== '' ? $permalink : home_url('/');
        $settings = EmailSender::getSettings();

        $form_title = (string) ($settings['form_title'] ?? '');
        if ($form_title === '') {
            $form_title = sprintf(
                /* translators: %s: product name */
                __('Thank you! Rate %s', 'hyoka-product-reviews'),
                $title
            );
        }

        Assets::enqueueInvitePage(
            $settings,
            [
                'ajaxUrl'       => admin_url('admin-ajax.php'),
                'nonce'         => $nonce,
                'ajax_nonce'    => $nonce,
                'restUrl'       => esc_url_raw(rest_url('hyoka/v1/')),
                'restNonce'     => wp_create_nonce('wp_rest'),
                'action'        => 'hyoka_submit_review',
                'pluginVersion' => HYOKA_VERSION,
                'productUrl'        => $permalink_js,
                'product_id'        => $product_id,
                'mediaUploadNonce'  => wp_create_nonce('media-form'),
                'strings'           => [
                    'networkError' => __('Network error.', 'hyoka-product-reviews'),
                    'error'        => __('Something went wrong.', 'hyoka-product-reviews'),
                    'submitting'   => __('Submitting…', 'hyoka-product-reviews'),
                    'pickRating'   => __('Please tap the stars to choose your rating.', 'hyoka-product-reviews'),
                ],
            ]
        );

        nocache_headers();
        status_header(200);

        $product_link_html = $permalink !== ''
            ? '<p class="hyoka-invite-product-link"><a href="' . esc_url($permalink) . '">' . esc_html($title) . '</a></p>'
            : '<p class="hyoka-invite-product-link"><strong>' . esc_html($title) . '</strong></p>';

        header('Content-Type: text/html; charset=' . get_option('blog_charset'));
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        echo '<title>' . esc_html($form_title) . '</title>';
        wp_print_styles(Assets::HANDLE_INVITE_EMAIL);
        echo '</head><body>';
        echo '<div class="wrapper"><table role="presentation" width="100%"><tr><td align="center" style="padding:40px 10px 0;">';
        echo '<table role="presentation" class="main"><tr><td class="header"><h1>' . esc_html($form_title) . '</h1></td></tr>';
        echo '<tr><td class="content">';
        echo wp_kses(
            $product_link_html,
            [
                'p' => [
                    'class' => true,
                ],
                'a' => [
                    'href'  => true,
                    'class' => true,
                ],
                'strong' => [],
            ]
        );

        echo '<form id="hyoka-invite-form" class="hyoka-invite-form" method="post" action="#" enctype="multipart/form-data">';
        echo '<input type="hidden" name="action" value="hyoka_submit_review">';
        echo '<input type="hidden" name="_ajax_nonce" value="' . esc_attr($nonce) . '">';
        echo '<input type="hidden" name="invite_token" value="' . esc_attr($plain) . '">';
        echo '<input type="hidden" name="product_id" value="' . esc_attr((string) $product_id) . '">';
        echo '<input type="hidden" name="review_type" value="review">';

        $invite_fields_html = SubmissionFormRender::renderInviteFormFields($settings, $customer);
        echo wp_kses($invite_fields_html, Wp::reviewFormAllowedHtml());

        echo '</form>';
        echo '<div id="hyoka-msg" class="hyoka-invite-msg"></div>';

        echo '</td></tr></table></td></tr></table></div>';
        wp_print_scripts(Assets::HANDLE_REVIEW_INVITE);
        echo '</body></html>';
        exit;
    }

    private static function renderError(string $message): void
    {
        nocache_headers();
        status_header(404);
        header('Content-Type: text/html; charset=' . get_option('blog_charset'));
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        $font = Wp::fontStackCss('system');
        echo '<title>' . esc_html__('Review link', 'hyoka-product-reviews') . '</title></head><body style="font-family:' . esc_attr($font) . ';padding:40px;">';
        echo '<p>' . esc_html($message) . '</p>';
        echo '</body></html>';
        exit;
    }
}
