<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Controller;

use Hyoka\App\Helper\DashboardStats;
use Hyoka\App\Helper\Matcher;
use Hyoka\App\Helper\Validate;
use Hyoka\App\Helper\Import;
use Hyoka\App\Helper\Wp;
use Hyoka\App\Import\Party\Apps;
use Hyoka\App\Helper\UserReplies;
use Hyoka\App\Model\Reviewing;
use Hyoka\Woocommerce\Product\ProductReview;
use Hyoka\Woocommerce\Email\EmailSender;
use Hyoka\App\Helper\Customers;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\Review;

defined('ABSPATH') || exit;

class Ajax
{
    /**
     * Initialize AJAX hooks.
     */
    public static function init()
    {
        add_filter('wp_json_encode_options', [self::class, 'filterAjaxJsonOptions'], 10, 2);

        add_action('wp_ajax_hyoka_submit_review', [self::class, 'handleSubmitReview']);

        add_action('wp_ajax_hyoka_fetch_dashboard_stats', [self::class, 'handleFetchDashboardStats']);
        add_action('wp_ajax_hyoka_fetch_reviews', [self::class, 'handleFetchReviews']);
        add_action('wp_ajax_hyoka_fetch_product_reviews', [self::class, 'handleFetchProductReviews']);

        add_action('wp_ajax_hyoka_update_widget_settings', [self::class, 'handleUpdateWidgetSettings']);
        add_action('wp_ajax_hyoka_fetch_widgets', [self::class, 'handleFetchWidgets']);
        add_action('wp_ajax_hyoka_get_widget_styles', [self::class, 'handleGetWidgetStyles']);
        add_action('wp_ajax_hyoka_save_widget_styles', [self::class, 'handleSaveWidgetStyles']);

        add_action('wp_ajax_hyoka_update_review_status', [self::class, 'handleUpdateReviewStatus']);
        add_action('wp_ajax_hyoka_save_reply', [self::class, 'handleSaveReply']);
        add_action('wp_ajax_hyoka_update_user_reply_status', [self::class, 'handleUpdateUserReplyStatus']);
        add_action('wp_ajax_hyoka_edit_review', [self::class, 'handleEditReview']);
        add_action('wp_ajax_hyoka_fetch_review_audit', [self::class, 'handleFetchReviewAudit']);
        add_action('wp_ajax_hyoka_delete_review', [self::class, 'handleDeleteReview']);
        add_action('wp_ajax_hyoka_bulk_update_status', [self::class, 'handleBulkUpdateStatus']);
        add_action('wp_ajax_hyoka_bulk_delete_reviews', [self::class, 'handleBulkDeleteReviews']);

        add_action('wp_ajax_hyoka_get_followup_settings', [self::class, 'handleGetFollowupSettings']);
        add_action('wp_ajax_hyoka_save_followup_settings', [self::class, 'handleSaveFollowupSettings']);
        add_action('wp_ajax_hyoka_fetch_email_customers', [self::class, 'handleFetchEmailCustomers']);
        add_action('wp_ajax_hyoka_get_followup_compose', [self::class, 'handleGetFollowupCompose']);
        add_action('wp_ajax_hyoka_send_followup_manual', [self::class, 'handleSendFollowupManual']);

        add_action('wp_ajax_hyoka_like_review', [self::class, 'handleLikeReview']);

        add_action('wp_ajax_hyoka_search_products', [self::class, 'handleSearchProducts']);
        add_action('wp_ajax_hyoka_csv_match_products', [self::class, 'handleCsvMatchProducts']);
        add_action('wp_ajax_hyoka_csv_import_validate', [self::class, 'handleCsvImportValidate']);
        add_action('wp_ajax_hyoka_csv_import_start', [self::class, 'handleCsvImportStart']);
        add_action('wp_ajax_hyoka_csv_import_status', [self::class, 'handleCsvImportStatus']);
        add_action('wp_ajax_hyoka_get_import_providers', [self::class, 'handleGetImportProviders']);
    }

    /**
     * Avoid escaped forward slashes (https:\/\/) in admin-ajax JSON for Hyoka actions.
     *
     * @param int $options
     * @param mixed $data
     * @return int
     */
    public static function filterAjaxJsonOptions($options, $data = null)
    {
        unset($data);
        if (! defined('DOING_AJAX') || ! DOING_AJAX) {
            return $options;
        }
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only wp_ajax action name for JSON encoding filter only.
        $action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash((string) $_REQUEST['action'])) : '';
        if ($action === '' || strpos($action, 'hyoka_') !== 0) {
            return $options;
        }

        return (int) $options | JSON_UNESCAPED_SLASHES;
    }

    /**
     * Capability gate for privileged admin AJAX (nonce is verified first in each handler).
     *
     * Nonce alone is not authorization — require manage_options when the action
     * creates/updates/deletes admin data.
     */
    private static function requireCapability(bool $require_manage_options = false): void
    {
        if ($require_manage_options && ! current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }
    }

    /**
     * Capability check + bind unslashed POST for helpers.
     *
     * Must be called immediately after check_ajax_referer() in each handler.
     * Helpers (Wp::post*) only sanitize the bound bag — they never touch $_POST
     * and are not an authorization boundary. Callers own nonce + capability checks.
     *
     * @param bool $require_manage_options Require manage_options for admin-only actions.
     */
    private static function verifyNonce(bool $require_manage_options = false): void
    {
        self::requireCapability($require_manage_options);

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- check_ajax_referer() already ran in the calling handler before this bind.
        $post = (isset($_POST) && is_array($_POST)) ? wp_unslash($_POST) : [];
        Wp::setRequest(is_array($post) ? $post : []);
    }

    public static function handleFetchWidgets()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        try {
            $data = ['widgets' => array_values(ProductReview::getWidgetsCatalog())];
            wp_send_json_success($data);
        } catch (\Throwable $e) {
            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG) ? $e->getMessage() : 'Failed to load widgets.',
            ]);
        }
    }

    public static function handleGetWidgetStyles()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $widget_id = Wp::postText('widget_id');
        if (! Reviewing::isValidWidgetId($widget_id)) {
            wp_send_json_error(['message' => 'Invalid widget_id.']);
            return;
        }

        $data = [
            'widget_id' => $widget_id,
            'style'     => Reviewing::getWidgetStyle($widget_id),
            'enabled'   => Reviewing::isWidgetActive($widget_id),
            'status'    => Reviewing::getWidgetStatusLabel($widget_id),
        ];
        wp_send_json_success($data);
    }

    public static function handleSaveWidgetStyles()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $widget_id = Wp::postText('widget_id');
        if (! Reviewing::isValidWidgetId($widget_id)) {
            wp_send_json_error(['message' => 'Invalid widget_id.']);
            return;
        }

        $data = Wp::getWidgetStyleFromPost();
        if (! Reviewing::saveWidgetStyle($widget_id, $data)) {
            global $wpdb;
            $db_hint = (defined('WP_DEBUG') && WP_DEBUG && ! empty($wpdb->last_error))
                ? ' ' . $wpdb->last_error
                : '';

            wp_send_json_error(['message' => 'Failed to save widget styles.' . $db_hint]);
            return;
        }

        wp_send_json_success([
            'message'   => 'Widget styles saved.',
            'widget_id' => $widget_id,
            'style'     => Reviewing::getWidgetStyle($widget_id),
        ]);
    }

    public static function handleUpdateWidgetSettings()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $parsed = Reviewing::getWidgetSettingsFromPost();
        if ($parsed['widget_id'] === '') {
            wp_send_json_error([
                'message' => 'Missing widget_id in the request. Check the browser Network tab: the POST body should include widget_id.',
                'code'    => 'missing_widget_id',
            ]);
            return;
        }

        $result = Reviewing::updateWidgetSettings($parsed);

        if (empty($result['ok'])) {
            wp_send_json_error([
                'message'   => $result['message'] ?? 'Could not save widget settings.',
                'code'      => $result['code'] ?? 'save_failed',
                'widget_id' => $parsed['widget_id'],
            ]);
            return;
        }

        wp_send_json_success([
            'message'   => $result['message'],
            'status'    => $result['status'],
            'enabled'   => $result['enabled'],
            'placement' => $result['placement'],
        ]);
    }

    public static function handleSubmitReview()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce();

        // Sanitize early at the entry point (submitReview also re-validates each field).
        $params = [
            'invite_token'   => Wp::postText('invite_token'),
            'rating'         => Wp::postInt('rating'),
            'review_content' => Wp::postTextarea('review_content'),
            'author_name'    => Wp::postText('author_name'),
            'author_email'   => Wp::postEmail('author_email'),
            'review_title'   => Wp::postText('review_title'),
            'product_id'     => Wp::postInt('product_id'),
            'review_type'    => Wp::postKey('review_type', 'review'),
            'store_review'   => Wp::postTextarea('store_review'),
        ];
        // File uploads only occur on this already nonce-protected review submission
        // path (check_ajax_referer above). The bag is passed into Meta::getMediaFromPost()
        // so that helper does not read $_FILES for authorization.
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified by check_ajax_referer() in this handler; uploads are validated in Meta via is_uploaded_file()/wp_check_filetype_and_ext().
        $files = (isset($_FILES) && is_array($_FILES)) ? $_FILES : [];
        $media = \Hyoka\App\Model\Meta::getMediaFromPost($files);
        if ($media !== []) {
            $media_json = wp_json_encode($media);
            if ($media_json === false) {
                wp_send_json_error(['message' => __('Unable to process media upload.', 'hyoka-product-reviews')]);
                return;
            }
            $params['media_json'] = $media_json;
        }

        $data = \Hyoka\Woocommerce\Product\ProductReview::submitReview($params);
        if (empty($data['ok'])) {
            wp_send_json_error(['message' => $data['message']]);
            return;
        }

        wp_send_json_success(['message' => $data['message']]);
    }

    public static function handleFetchReviews()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        try {
            $data = Reviewing::getReviewsForAdmin();
            wp_send_json_success($data);
        } catch (\Throwable $e) {
            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG) ? $e->getMessage() : 'Failed to load reviews.',
            ]);
        }
    }

    public static function handleFetchDashboardStats()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $days = max(7, min(90, Wp::postInt('days', 30)));

        wp_send_json_success([
            'stats' => DashboardStats::getOverview($days),
        ]);
    }

    public static function handleUpdateReviewStatus()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id  = Wp::postInt('review_id');
        $status_raw = Wp::postText('status');

        if (! $review_id || $status_raw === '') {
            wp_send_json_error(['message' => 'Invalid request.']);
            return;
        }

        $status = Review::normalizeStatus($status_raw);

        if (ProductReview::publishReview($review_id, $status)) {
            wp_send_json_success(['message' => 'Review status updated to ' . $status]);
            return;
        }

        wp_send_json_error(['message' => 'Failed to update review status.']);
    }

    public static function handleSaveReply()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id = Wp::postInt('review_id');
        $reply     = Wp::postTextarea('reply');

        if (! $review_id) {
            wp_send_json_error(['message' => 'Invalid review ID.']);
            return;
        }

        if (Review::updateReviewReply($review_id, $reply)) {
            wp_send_json_success(['message' => 'Reply saved successfully.']);
            return;
        }

        wp_send_json_error(['message' => 'Failed to save reply.']);
    }

    public static function handleUpdateUserReplyStatus()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id = Wp::postInt('review_id');
        $reply_id  = Wp::postText('reply_id');
        $status    = Wp::postText('status');

        if (! $review_id || $reply_id === '' || $status === '') {
            wp_send_json_error(['message' => 'Invalid request.']);
            return;
        }

        $result = UserReplies::updateStatus($review_id, $reply_id, $status);
        if (! empty($result['ok'])) {
            Reviewing::clearReviewCache((int) ($result['product_id'] ?? 0));
            wp_send_json_success(['message' => $result['message'] ?? 'Reply status updated.']);
            return;
        }

        wp_send_json_error(['message' => $result['message'] ?? 'Failed to update reply status.']);
    }

    public static function handleEditReview()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id = Wp::postInt('review_id');
        if (! $review_id) {
            wp_send_json_error(['message' => 'Invalid review ID.']);
            return;
        }

        $fields = [];

        if (Wp::hasPost('rating')) {
            $fields['rating'] = max(1, min(5, Wp::postInt('rating')));
        }
        if (Wp::hasPost('title')) {
            $fields['title'] = Wp::postText('title');
        }
        if (Wp::hasPost('content')) {
            $fields['content'] = Wp::postTextarea('content');
        }
        if (Wp::hasPost('author')) {
            $fields['author'] = Wp::postText('author');
        }
        if (Wp::hasPost('status')) {
            $fields['status'] = Review::normalizeStatus(Wp::postText('status'));
        }

        if ($fields === []) {
            wp_send_json_error(['message' => 'No changes were provided.']);
            return;
        }

        if (Reviewing::updateReview($review_id, $fields)) {
            wp_send_json_success(['message' => 'Review updated successfully.']);
            return;
        }

        wp_send_json_error(['message' => 'Failed to update review.']);
    }

    public static function handleFetchReviewAudit()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id = Wp::postInt('review_id');
        if (! $review_id) {
            wp_send_json_error(['message' => 'Invalid review ID.']);
            return;
        }

        $model = new Review();
        $row   = $model->findById($review_id);
        if (! is_array($row)) {
            wp_send_json_error(['message' => 'Review not found.']);
            return;
        }

        $product_id = absint($row['product_id'] ?? 0);
        $email      = sanitize_email($row['email'] ?? '');
        if ($product_id <= 0 || $email === '') {
            wp_send_json_success(['entries' => []]);
            return;
        }

        $entries = Customer::getAuditForReview($product_id, $email, $review_id);
        wp_send_json_success(['entries' => $entries]);
    }

    public static function handleDeleteReview()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_id = Wp::postInt('review_id');
        if (! $review_id) {
            wp_send_json_error(['message' => 'Invalid review ID.']);
            return;
        }

        if (Reviewing::deleteReview($review_id)) {
            wp_send_json_success(['message' => 'Review deleted successfully.']);
            return;
        }

        wp_send_json_error(['message' => 'Failed to delete review.']);
    }

    public static function handleBulkUpdateStatus()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_ids = Wp::postIntList('review_ids');
        $status_raw = Wp::postText('status');

        if ($review_ids === [] || $status_raw === '') {
            wp_send_json_error(['message' => 'Invalid request.']);
            return;
        }

        $status = Review::normalizeStatus($status_raw);
        $count  = Reviewing::bulkUpdateReviewStatus($review_ids, $status);
        if ($count > 0) {
            wp_send_json_success(['message' => sprintf('%d reviews updated successfully.', $count)]);
            return;
        }

        wp_send_json_error(['message' => 'Failed to update reviews.']);
    }

    public static function handleBulkDeleteReviews()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $review_ids = Wp::postIntList('review_ids');
        if ($review_ids === []) {
            wp_send_json_error(['message' => 'No reviews selected.']);
            return;
        }

        $count = Reviewing::bulkDeleteReviews($review_ids);
        if ($count > 0) {
            wp_send_json_success(['message' => sprintf('%d reviews deleted successfully.', $count)]);
            return;
        }

        wp_send_json_error(['message' => 'Failed to delete reviews.']);
    }

    public static function handleFetchProductReviews()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce();

        $data = Reviewing::fetchProductReviews([
            'product_id'       => Wp::postInt('product_id'),
            'stats_product_id' => Wp::postInt('stats_product_id'),
            'page'             => Wp::postInt('page', 1),
            'per_page'         => Wp::postInt('per_page', 10),
            'rating'           => Wp::postInt('rating'),
        ]);
        wp_send_json_success($data);
    }

    public static function handleGetFollowupSettings()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $data = EmailSender::getAdminData();
        wp_send_json_success($data);
    }

    public static function handleSaveFollowupSettings()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $data = EmailSender::saveSettingsFromAjax();
        wp_send_json_success($data);
    }

    public static function handleGetFollowupCompose()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $id = Wp::postInt('customer_row_id');
        if ($id <= 0) {
            wp_send_json_error(['message' => 'Invalid customer row.']);
            return;
        }

        $customer = Customers::getCustomerById($id);
        if ($customer === null) {
            wp_send_json_error(['message' => 'Customer not found.']);
            return;
        }

        wp_send_json_success(['customer' => $customer]);
    }

    public static function handleSendFollowupManual()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $id   = Wp::postInt('customer_row_id');
        $data = EmailSender::sendEmailNow($id);

        if (empty($data['ok'])) {
            $error = ['message' => $data['message']];
            if (isset($data['mail_error'])) {
                $error['mail_error'] = $data['mail_error'];
            }
            wp_send_json_error($error);
            return;
        }

        wp_send_json_success([
            'message'  => $data['message'],
            'customer' => $data['customer'],
        ]);
    }

    public static function handleFetchEmailCustomers()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $data = EmailSender::getCustomersAdminData([
            'page'         => max(1, Wp::postInt('page', 1)),
            'per_page'     => max(1, Wp::postInt('per_page', 10)),
            'search'       => Wp::postText('search'),
            'send_source'  => Wp::postText('send_source'),
            'require_sent' => Wp::postBoolean('require_sent', false),
        ]);
        wp_send_json_success($data);
    }

    public static function handleLikeReview()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce();

        $data = Reviewing::handleLikeReviewRequest([
            'review_id' => Wp::postInt('review_id'),
        ]);

        if (empty($data['ok'])) {
            wp_send_json_error(['message' => $data['message']]);
            return;
        }

        wp_send_json_success([
            'message' => $data['message'],
            'likes'   => $data['likes'],
        ]);
    }

    public static function handleSearchProducts()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $search = Wp::postText('search');
        $page   = max(1, Wp::postInt('page', 1));
        $data   = Matcher::searchProducts($search, $page, 10);
        wp_send_json_success($data);
    }

    public static function handleGetImportProviders()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        wp_send_json_success([
            'providers' => Apps::getProvidersForAdmin(),
        ]);
    }

    public static function handleCsvMatchProducts()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $match_type  = Wp::postKey('match_type', 'product_id');
        $identifiers = Wp::parseJsonStringList(Wp::postTextarea('identifiers', '[]'));

        $matches = Matcher::matchProducts($match_type, $identifiers);
        wp_send_json_success(['matches' => $matches]);
    }

    public static function handleCsvImportValidate()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $payload = Import::decodePayloadJson(Wp::postTextarea('payload', ''));
        if ($payload === null) {
            wp_send_json_error(['message' => 'Invalid import payload.']);
            return;
        }

        $result = Import::validateImportPayload($payload);
        if (empty($result['ok'])) {
            wp_send_json_error($result);
            return;
        }

        wp_send_json_success($result);
    }

    public static function handleCsvImportStart()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $payload = Import::decodePayloadJson(Wp::postTextarea('payload', ''));
        if ($payload === null) {
            wp_send_json_error(['message' => 'Invalid import payload.']);
            return;
        }

        $result = Validate::startBackgroundImport($payload);
        if (empty($result['ok'])) {
            wp_send_json_error($result);
            return;
        }

        wp_send_json_success($result);
    }

    public static function handleCsvImportStatus()
    {
        check_ajax_referer('hyoka_nonce', '_ajax_nonce');
        self::verifyNonce(true);

        $job_id = Wp::postText('job_id');
        if ($job_id === '') {
            wp_send_json_error(['message' => 'Missing import job ID.']);
            return;
        }

        $status = Validate::getJobStatus($job_id);
        if ($status === null) {
            wp_send_json_error(['message' => 'Import job not found or expired.']);
            return;
        }

        wp_send_json_success($status);
    }
}
