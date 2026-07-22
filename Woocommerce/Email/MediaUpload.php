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
use Hyoka\App\Helper\Wp;
use Hyoka\App\Model\Review;
use Hyoka\App\Model\Reviewing;

defined('ABSPATH') || exit;

class MediaUpload
{
    public const QUERY_ARG = 'hyoka_media';
    public const TOKEN_ARG = 'hyoka_media_token';

    public static function init(): void
    {
        add_action('template_redirect', [self::class, 'handleUploadPost'], -1);
        add_action('template_redirect', [self::class, 'renderMediaPage'], 0);
    }

    public static function createToken(int $review_id, string $email): string
    {
        $review_id = absint($review_id);
        $email     = strtolower(sanitize_email($email));

        if ($review_id <= 0 || $email === '') {
            return '';
        }

        return hash_hmac('sha256', $review_id . '|' . $email . '|media', wp_salt('auth'));
    }

    public static function buildUrl(int $review_id, string $email): string
    {
        $review_id = absint($review_id);
        $email     = sanitize_email($email);
        $token     = self::createToken($review_id, $email);

        if ($review_id <= 0 || $token === '') {
            return esc_url_raw(home_url('/'));
        }

        return esc_url_raw(add_query_arg([
            self::QUERY_ARG => (string) $review_id,
            self::TOKEN_ARG => $token,
        ], home_url('/')));
    }

    public static function verifyToken(int $review_id, string $email, string $token): bool
    {
        $expected = self::createToken($review_id, $email);

        return $expected !== '' && hash_equals($expected, (string) $token);
    }

    private static function isPostRequest(): bool
    {
        $method = isset($_SERVER['REQUEST_METHOD'])
            ? sanitize_text_field(wp_unslash((string) $_SERVER['REQUEST_METHOD']))
            : '';

        return $method === 'POST';
    }

    public static function handleUploadPost(): void
    {
        if (is_admin() || ! self::isPostRequest()) {
            return;
        }

        // Intent gate only: this hook runs on every front-end POST. Skip unrelated forms
        // (checkout, contact, comments, etc.) before verifying our media-form nonce.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing via public query arg; CSRF verified immediately below.
        if (! isset($_GET[self::QUERY_ARG])) {
            return;
        }

        // CSRF first — do not inspect $_FILES / $_POST until the media-form nonce passes.
        check_ajax_referer('media-form', 'media_nonce');

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- check_ajax_referer() above.
        if (empty($_FILES['review_media']) || ! is_array($_FILES['review_media'])) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- check_ajax_referer() above.
        $review_id = isset($_POST['review_id']) ? absint(wp_unslash($_POST['review_id'])) : 0;
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- check_ajax_referer() above.
        $token = isset($_POST['media_token'])
            ? sanitize_text_field(wp_unslash((string) $_POST['media_token']))
            : '';

        if ($review_id <= 0 || $token === '') {
            wp_send_json_error(['message' => __('Invalid request.', 'hyoka-product-reviews')]);
        }

        $model = new Review();
        $row   = $model->findById($review_id);
        if (! is_array($row)) {
            wp_send_json_error(['message' => __('Review not found.', 'hyoka-product-reviews')]);
        }

        $email = sanitize_email((string) ($row['email'] ?? ''));
        if ($email === '' || ! self::verifyToken($review_id, $email, $token)) {
            wp_send_json_error(['message' => __('This upload link is invalid or has expired.', 'hyoka-product-reviews')]);
        }

        // Sanitize early / validate before WordPress processes the upload.
        // phpcs:disable WordPress.Security.NonceVerification.Missing -- check_ajax_referer() already ran at the top of this handler.
        $name = isset($_FILES['review_media']['name'])
            ? sanitize_file_name(wp_unslash((string) $_FILES['review_media']['name']))
            : '';
        $tmp_name = '';
        if (isset($_FILES['review_media']['tmp_name'])) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- tmp_name is a PHP-generated upload path, not user input. It is validated with is_uploaded_file().
            $tmp_name = wp_unslash((string) $_FILES['review_media']['tmp_name']);
        }
        $error = isset($_FILES['review_media']['error'])
            ? absint($_FILES['review_media']['error'])
            : UPLOAD_ERR_NO_FILE;
        $size = isset($_FILES['review_media']['size'])
            ? absint($_FILES['review_media']['size'])
            : 0;
        // phpcs:enable WordPress.Security.NonceVerification.Missing

        if ($name === '' || $tmp_name === '' || $error !== UPLOAD_ERR_OK || ! is_uploaded_file($tmp_name)) {
            wp_send_json_error(['message' => __('Upload failed.', 'hyoka-product-reviews')]);
        }

        // Early type check via WordPress (extension + file contents), not the client-supplied MIME.
        $wp_filetype = wp_check_filetype_and_ext($tmp_name, $name);
        $type        = ! empty($wp_filetype['type']) ? (string) $wp_filetype['type'] : '';
        if (
            $type === ''
            || (strpos($type, 'image/') !== 0 && strpos($type, 'video/') !== 0)
        ) {
            wp_send_json_error(['message' => __('Only images and videos are allowed.', 'hyoka-product-reviews')]);
        }

        // Prefer WordPress-corrected filename when the extension was remapped.
        if (! empty($wp_filetype['proper_filename'])) {
            $name = sanitize_file_name((string) $wp_filetype['proper_filename']);
        }

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Array is rebuilt from sanitized and validated values before media_handle_upload().
        $_FILES['review_media'] = [
            'name'     => $name,
            'type'     => $type,
            'tmp_name' => $tmp_name,
            'error'    => $error,
            'size'     => $size,
        ];

        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $attachment_id = media_handle_upload('review_media', 0);
        if (is_wp_error($attachment_id)) {
            wp_send_json_error(['message' => $attachment_id->get_error_message()]);
        }

        $mime = get_post_mime_type($attachment_id);
        if (! is_string($mime) || $mime === '') {
            wp_delete_attachment($attachment_id, true);
            wp_send_json_error(['message' => __('Unsupported file type.', 'hyoka-product-reviews')]);
        }

        $is_video = strpos($mime, 'video/') === 0;
        $is_image = strpos($mime, 'image/') === 0;
        if (! $is_video && ! $is_image) {
            wp_delete_attachment($attachment_id, true);
            wp_send_json_error(['message' => __('Only images and videos are allowed.', 'hyoka-product-reviews')]);
        }

        $url = wp_get_attachment_url($attachment_id);
        if (! is_string($url) || $url === '') {
            wp_delete_attachment($attachment_id, true);
            wp_send_json_error(['message' => __('Upload failed.', 'hyoka-product-reviews')]);
        }

        $item = [
            'id'             => absint($attachment_id),
            'url'            => esc_url_raw($url),
            'type'           => $is_video ? 'video' : 'image',
            'attachmentId'   => absint($attachment_id),
            'isUserUploaded' => true,
        ];

        if (! Reviewing::appendReviewMedia($review_id, [$item])) {
            wp_delete_attachment($attachment_id, true);
            wp_send_json_error(['message' => __('Could not save media to your review.', 'hyoka-product-reviews')]);
        }

        wp_send_json_success([
            'media'   => $item,
            'message' => __('Media uploaded successfully.', 'hyoka-product-reviews'),
        ]);
    }

    public static function renderMediaPage(): void
    {
        if (is_admin()) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public tokenized link.
        $review_id = isset($_GET[self::QUERY_ARG]) ? absint(wp_unslash($_GET[self::QUERY_ARG])) : 0;
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public tokenized link.
        $token = isset($_GET[self::TOKEN_ARG]) ? sanitize_text_field(wp_unslash($_GET[self::TOKEN_ARG])) : '';

        if ($review_id <= 0 || $token === '') {
            return;
        }

        $row = (new \Hyoka\App\Model\Review())->findById($review_id);
        if (! is_array($row)) {
            self::renderError(__('This upload link is invalid.', 'hyoka-product-reviews'));
            return;
        }

        $email = sanitize_email((string) ($row['email'] ?? ''));
        if ($email === '' || ! self::verifyToken($review_id, $email, $token)) {
            self::renderError(__('This upload link is invalid or has expired.', 'hyoka-product-reviews'));
            return;
        }

        $existing_media = Wp::parseStoredMediaJson($row['media'] ?? '');
        if ($existing_media !== []) {
            self::renderComplete(
                __('Media was already added to this review. This upload link is no longer available.', 'hyoka-product-reviews')
            );
            return;
        }

        $product_id = absint($row['product_id'] ?? 0);
        $title      = $product_id > 0 ? (string) get_the_title($product_id) : __('Product', 'hyoka-product-reviews');
        $permalink  = $product_id > 0 ? esc_url_raw((string) get_permalink($product_id)) : '';

        $settings = EmailSender::getSettings();

        Assets::enqueueMediaUploadPage(
            $settings,
            [
                'uploadUrl'   => self::buildUrl($review_id, $email),
                'reviewId'    => $review_id,
                'mediaToken'  => $token,
                'mediaNonce'  => wp_create_nonce('media-form'),
                'productUrl'  => $permalink !== '' ? $permalink : home_url('/'),
                'strings'    => [
                    'networkError' => __('Network error.', 'hyoka-product-reviews'),
                    'error'        => __('Something went wrong.', 'hyoka-product-reviews'),
                    'uploading'    => __('Uploading…', 'hyoka-product-reviews'),
                    'success'      => __('Media uploaded successfully. Thank you!', 'hyoka-product-reviews'),
                    'pickFile'     => __('Please choose a photo or video to upload.', 'hyoka-product-reviews'),
                ],
            ]
        );

        nocache_headers();
        status_header(200);

        $heading = sprintf(
            /* translators: %s: product name */
            __('Add photos or videos to your review for %s', 'hyoka-product-reviews'),
            $title
        );

        header('Content-Type: text/html; charset=' . esc_attr((string) get_bloginfo('charset')));
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        echo '<title>' . esc_html($heading) . '</title>';
        wp_print_styles(Assets::HANDLE_INVITE_EMAIL);
        echo '</head><body>';
        echo '<div class="wrapper"><table role="presentation" width="100%"><tr><td align="center" style="padding:40px 10px 0;">';
        echo '<table role="presentation" class="main"><tr><td class="header"><h1>' . esc_html($heading) . '</h1></td></tr>';
        echo '<tr><td class="content">';
        if ($permalink !== '') {
            echo '<p class="hyoka-media-product-link"><a href="' . esc_url($permalink) . '">' . esc_html($title) . '</a></p>';
        } else {
            echo '<p class="hyoka-media-product-link"><strong>' . esc_html($title) . '</strong></p>';
        }
        echo '<p class="hyoka-media-intro">' . esc_html__('Choose files below to attach them to your review.', 'hyoka-product-reviews') . '</p>';
        echo '<form id="hyoka-media-form" class="hyoka-media-form" method="post" action="#" enctype="multipart/form-data">';
        echo '<label for="hyoka-media-input">' . esc_html__('Photos / videos', 'hyoka-product-reviews') . '</label>';
        echo '<input type="file" id="hyoka-media-input" class="hyoka-media-input" name="review_media" accept="image/*,video/*" multiple>';
        echo '<button type="submit" class="hyoka-invite-submit">' . esc_html__('Upload media', 'hyoka-product-reviews') . '</button>';
        echo '</form>';
        echo '<div id="hyoka-media-msg" class="hyoka-invite-msg" aria-live="polite"></div>';
        echo '<div class="hyoka-media-upload-status" aria-live="polite"></div>';
        echo '</td></tr></table></td></tr></table></div>';
        wp_print_scripts(Assets::HANDLE_MEDIA_UPLOAD);
        echo '</body></html>';
        exit;
    }

    private static function renderError(string $message): void
    {
        nocache_headers();
        status_header(404);
        self::renderPlainMessage(__('Upload link', 'hyoka-product-reviews'), $message);
    }

    private static function renderComplete(string $message): void
    {
        nocache_headers();
        status_header(200);
        self::renderPlainMessage(__('Upload complete', 'hyoka-product-reviews'), $message);
    }

    private static function renderPlainMessage(string $title, string $message): void
    {
        header('Content-Type: text/html; charset=' . esc_attr((string) get_bloginfo('charset')));
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        $font = Wp::fontStackCss('system');
        echo '<title>' . esc_html($title) . '</title></head><body style="font-family:' . esc_attr($font) . ';padding:40px;">';
        echo '<p>' . esc_html($message) . '</p>';
        echo '</body></html>';
        exit;
    }
}
