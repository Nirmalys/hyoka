<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Controller\Rest;

use Hyoka\App\Helper\UserReplies;
use Hyoka\App\Helper\Wp;
use Hyoka\App\Model\Reviewing;

defined('ABSPATH') || exit;

class Endpoint
{
    /**
     * Mutating front-end actions that require a CSRF (wp_rest) nonce.
     *
     * @var array<int, string>
     */
    private const CSRF_ACTIONS = [
        'submit_review',
        'like_review',
        'submit_review_reply',
    ];

    public static function registerRoutes(): void
    {
        register_rest_route('hyoka/v1', '/frontend', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'handleFrontendRequests'],
            // Public storefront route: capability is not required for guests.
            // CSRF for writes is enforced inside the callback (nonce ≠ authorization).
            'permission_callback' => '__return_true',
        ]);
    }

    public static function handleFrontendRequests(\WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        if (! is_array($params)) {
            $params = [];
        }

        $action = isset($params['action']) ? sanitize_key((string) $params['action']) : '';

        // Fail closed for mutating actions: verify CSRF before any handler runs.
        // Do not nest business logic inside the nonce success branch in a way that
        // leaves a fall-through path without verification.
        if (in_array($action, self::CSRF_ACTIONS, true)) {
            $nonce_check = self::verifyRestNonce($request);
            if (is_wp_error($nonce_check)) {
                return $nonce_check;
            }
        }

        // Bind JSON params after CSRF for writes (and for reads that pass params).
        // Helpers like Wp::post* / Meta media_json fall back to this bag only.
        Wp::setRequest($params);

        switch ($action) {
            case 'fetch_product_widgets':
                return self::handleFetchProductWidgets($params);

            case 'submit_review':
                return self::handleSubmitReview($params);

            case 'fetch_product_reviews':
                return self::handleFetchProductReviews($params);

            case 'like_review':
                return self::handleLikeReview($params);

            case 'submit_review_reply':
                return self::handleSubmitReviewReply($params);

            default:
                return new \WP_Error(
                    'invalid_action',
                    __('Invalid action', 'hyoka'),
                    ['status' => 400]
                );
        }
    }

    /**
     * CSRF check for mutating REST actions (fail closed — no bypass path).
     *
     * Checks are intentionally separate (empty vs invalid) rather than a single
     * `$nonce === '' || ! wp_verify_nonce(...)` expression so the failure path
     * is obvious and never continues into mutating handlers without a verified nonce.
     *
     * @return true|\WP_Error
     */
    private static function verifyRestNonce(\WP_REST_Request $request)
    {
        $nonce = sanitize_text_field(
            wp_unslash((string) $request->get_header('x-wp-nonce'))
        );

        // Missing token — reject before calling wp_verify_nonce().
        if ($nonce === '') {
            return new \WP_Error(
                'missing_nonce',
                __('Missing security token.', 'hyoka'),
                ['status' => 403]
            );
        }

        // Invalid / expired token — reject; do not proceed to handlers.
        if (! wp_verify_nonce($nonce, 'wp_rest')) {
            return new \WP_Error(
                'invalid_nonce',
                __('Invalid security token.', 'hyoka'),
                ['status' => 403]
            );
        }

        return true;
    }

    private static function handleFetchProductWidgets(array $params): \WP_REST_Response
    {
        $data = Reviewing::fetchProductWidgetMarkup($params);

        return new \WP_REST_Response(
            [
                'success' => true,
                'data'    => $data,
            ],
            200
        );
    }

    private static function handleSubmitReview(array $params): \WP_REST_Response
    {
        try {
            $result = \Hyoka\Woocommerce\Product\ProductReview::submitReview($params);
        } catch (\Throwable $e) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Log unexpected failures for admins without exposing details to clients when WP_DEBUG is off.
            error_log($e->__toString());

            $result = [
                'ok'      => false,
                'message' => (
                    defined('WP_DEBUG') && WP_DEBUG
                        ? $e->getMessage()
                        : __('An unexpected error occurred. Please try again.', 'hyoka')
                ),
            ];
        }

        $ok = ! empty($result['ok']);
        return new \WP_REST_Response(
            [
                'success' => $ok,
                'data'    => $result,
            ],
            $ok ? 200 : 400
        );
    }

    private static function handleFetchProductReviews(array $params): \WP_REST_Response
    {
        $data = Reviewing::fetchProductReviews($params);

        return new \WP_REST_Response(
            [
                'success' => true,
                'data'    => $data,
            ],
            200
        );
    }

    private static function handleLikeReview(array $params): \WP_REST_Response
    {
        $data = Reviewing::handleLikeReviewRequest($params);
        $ok   = ! empty($data['ok']);

        return new \WP_REST_Response(
            [
                'success' => $ok,
                'data'    => $data,
            ],
            $ok ? 200 : 400
        );
    }

    private static function handleSubmitReviewReply(array $params): \WP_REST_Response
    {
        $review_id = isset($params['review_id']) ? absint($params['review_id']) : 0;
        $author    = isset($params['author_name']) ? sanitize_text_field((string) $params['author_name']) : '';
        $email     = isset($params['author_email']) ? sanitize_email((string) $params['author_email']) : '';
        $content   = isset($params['reply_content']) ? sanitize_textarea_field((string) $params['reply_content']) : '';

        $data = UserReplies::submit($review_id, $author, $content, $email);
        $ok   = ! empty($data['ok']);
        if ($ok) {
            Reviewing::clearReviewCache((int) ($data['product_id'] ?? 0));
            unset($data['product_id']);
        }

        return new \WP_REST_Response(
            [
                'success' => $ok,
                'data'    => $data,
            ],
            $ok ? 200 : 400
        );
    }
}
