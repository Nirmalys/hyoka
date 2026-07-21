<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\Woocommerce\Product;

use Hyoka\App\Helper\Assets;
use Hyoka\App\Helper\Moderation;
use Hyoka\App\Model\Meta;
use Hyoka\App\Model\Review;
use Hyoka\App\Model\Reviewing;
use Hyoka\Woocommerce\Email\EmailSender;
use Hyoka\Woocommerce\Email\Link;
use Hyoka\App\Helper\Customers;
use Hyoka\App\Helper\Wp;
use Hyoka\App\Model\Customer;
use Hyoka\Woocommerce\Email\EmailService;

defined('ABSPATH') || exit;

class ProductReview
{
    /** @var bool */
    private static $product_widgets_rendered = false;

    /** @var string[] Widget IDs that actually output HTML on this request. */
    private static $rendered_widget_ids = [];

    /** @var int Product ID used while building widget markup outside the main loop. */
    private static $render_product_id = 0;

    /** @var string[] */
    private const ALL_WIDGET_IDS = [
        'product-review',
        'video-carousel',
        'card-carousel',
        'testimonials-carousel',
        'site-rating',
    ];

    /** @var string[] */
    private const PRODUCT_PAGE_WIDGET_IDS = [
        'product-review',
        'video-carousel',
        'card-carousel',
        'site-rating',
    ];

    private const FOOTER_WIDGET_ID = 'testimonials-carousel';

    /**
     * @return string[]
     */
    public static function getWidgetIds(): array
    {
        return self::ALL_WIDGET_IDS;
    }

    /**
     * @return string[]
     */
    public static function getProductPageWidgetIds(): array
    {
        return self::PRODUCT_PAGE_WIDGET_IDS;
    }

    /**
     * @return string[]
     */
    public static function getFooterWidgetIds(): array
    {
        return [self::FOOTER_WIDGET_ID];
    }

    public static function init()
    {
        add_action('woocommerce_after_single_product', [self::class, 'renderProductWidgets'], 20);
        add_action('woocommerce_after_single_product_summary', [self::class, 'renderProductWidgets'], 100);

        add_action('wp_enqueue_scripts', [self::class, 'enqueueAssets']);

        add_shortcode('hyoka', [self::class, 'renderShortcode']);
        add_shortcode('hyoka_widget', [self::class, 'renderShortcode']);
    }

    /**
     * @param array<string, string>|string $atts
     */
    public static function renderShortcode($atts): string
    {
        if (! self::isProductSingleView()) {
            return '';
        }

        $atts = shortcode_atts(['type' => 'product-review'], $atts, 'hyoka');

        return self::renderWidget($atts['type'], false);
    }

    private static function isProductSingleView(): bool
    {
        if (function_exists('is_shop') && is_shop()) {
            return false;
        }

        if (function_exists('is_product_taxonomy') && is_product_taxonomy()) {
            return false;
        }

        if (function_exists('is_post_type_archive') && is_post_type_archive('product')) {
            return false;
        }

        return function_exists('is_product') && is_product();
    }

    private static function getCurrentProductId(): int
    {
        if (! self::isProductSingleView()) {
            return 0;
        }

        $product_id = function_exists('get_queried_object_id') ? (int) get_queried_object_id() : 0;
        if ($product_id > 0) {
            return $product_id;
        }

        return (int) get_the_ID();
    }

    public static function renderProductWidgets()
    {
        if (self::$product_widgets_rendered) {
            return;
        }

        if (! self::isProductSingleView()) {
            return;
        }

        self::$product_widgets_rendered = true;

        $html = '<div class="hyoka-widgets-stack" data-hyoka-auto="1">';

        foreach (self::PRODUCT_PAGE_WIDGET_IDS as $widget_id) {
            if (! Reviewing::isWidgetActive($widget_id)) {
                continue;
            }
            $html .= self::renderWidgetMount($widget_id, false);
        }

        $html .= '</div>';
        echo wp_kses($html, Wp::widgetMountAllowedHtml());
    }

    public static function enqueueAssets(): void
    {
        if (is_admin() && ! defined('DOING_AJAX') && (! function_exists('is_customize_preview') || ! is_customize_preview())) {
            return;
        }

        $on_product_page = self::isProductSingleView();
        $footer_active   = Reviewing::isWidgetActive(self::FOOTER_WIDGET_ID);
        if (
            ! $on_product_page
            && self::$rendered_widget_ids === []
            && ! $footer_active
        ) {
            return;
        }

        $asset_version = HYOKA_VERSION . '.' . (string) (int) get_option('hyoka_widget_last_update', 0);

        // Phase 2: generate CSS from sanitized tokens (Wp::getWidgetCssVariablesBlock).
        $widget_vars_css = '';
        foreach (self::getWidgetIds() as $widget_id) {
            if (! Reviewing::isWidgetActive($widget_id)) {
                continue;
            }
            $widget_vars_css .= Wp::getWidgetCssVariablesBlock(
                $widget_id,
                Reviewing::getWidgetStyle($widget_id)
            );
        }

        Assets::enqueueStorefrontStyles($asset_version, $widget_vars_css);

        if (! self::needsInteractiveScript()) {
            return;
        }

        Assets::enqueueStorefrontScript(
            $asset_version,
            self::getFrontendLocalizationData(self::shouldEmbedReviews())
        );
    }

    /**
     * @return string[]
     */
    private static function getRenderedWidgetIds(): array
    {
        return self::$rendered_widget_ids;
    }

    private static function registerRenderedWidget(string $widget_id): void
    {
        $widget_id = sanitize_key($widget_id);
        if ($widget_id === '' || ! in_array($widget_id, self::getWidgetIds(), true)) {
            return;
        }

        if (! in_array($widget_id, self::$rendered_widget_ids, true)) {
            self::$rendered_widget_ids[] = $widget_id;
        }
    }

    private static function needsInteractiveScript(): bool
    {
        return self::isProductSingleView()
            || self::$rendered_widget_ids !== []
            || Reviewing::isWidgetActive(self::FOOTER_WIDGET_ID);
    }

    private static function shouldEmbedReviews(): bool
    {
        if (in_array('product-review', self::getRenderedWidgetIds(), true)) {
            return true;
        }

        return self::isProductSingleView();
    }

    /**
     * Embed lightweight frontend data so JS can init without a blocking REST call.
     *
     * @return array<string, mixed>
     */
    public static function getFrontendLocalizationData(bool $include_reviews = false): array
    {
        $product_id = function_exists('is_product') && is_product()
            ? self::getCurrentProductId()
            : 0;
        $settings   = EmailSender::getSettings();
        $per_page   = max(1, min(100, (int) ($settings['reviews_per_page'] ?? 10)));

        $current_user = is_user_logged_in() ? wp_get_current_user() : null;
        $list_product_id = $product_id > 0 ? 0 : $product_id;

        $data = [
            'ajaxUrl'            => admin_url('admin-ajax.php'),
            'nonce'              => wp_create_nonce('hyoka_nonce'),
            'restUrl'            => esc_url_raw(rest_url('hyoka/v1/')),
            'restNonce'          => wp_create_nonce('wp_rest'),
            'product_id'         => $product_id,
            'reviewsProductId'   => $list_product_id,
            'statsProductId'     => $product_id,
            'reviewsPerPage'     => $per_page,
            'mediaUploadNonce'   => wp_create_nonce('media-form'),
            'hasEmbeddedReviews' => false,
            'currentUserName'    => $current_user instanceof \WP_User ? (string) $current_user->display_name : '',
            'currentUserEmail'   => $current_user instanceof \WP_User ? (string) $current_user->user_email : '',
            // Bootstrap widget state (may be stale when HTML is page-cached); REST refresh is source of truth.
            'active_widgets'       => $product_id > 0 ? Reviewing::getActiveProductPageWidgetIds() : [],
            'catalog_widgets'      => self::getProductPageWidgetIds(),
            'footer_widgets'       => self::getFooterWidgetIds(),
            'active_footer_widgets'  => Reviewing::getActiveFooterWidgetIds(),
            'refreshWidgets'       => $product_id > 0,
            'refreshFooterWidgets' => Reviewing::isWidgetActive(self::FOOTER_WIDGET_ID),
        ];

        if ($include_reviews) {
            $initial = Reviewing::getFrontendReviewsPage($list_product_id, $product_id, 1, $per_page);
            $data['initialReviews']     = $initial;
            $data['hasEmbeddedReviews'] = true;
        }

        return $data;
    }

    /**
     * Cache-safe mount point; widget HTML is hydrated via REST on the storefront.
     */
    public static function renderWidgetMount(string $widget_id, bool $echo = false): string
    {
        $widget_id = sanitize_key($widget_id);
        if (! isset(self::getWidgetsCatalog()[$widget_id])) {
            return '';
        }

        self::registerRenderedWidget($widget_id);

        // Non-empty inner node so HTML optimizers / minifiers do not strip the mount element.
        $output = '<div class="hyoka-root hyoka-root--pending" data-hyoka-widget="' . esc_attr($widget_id) . '" data-hyoka-mount="1">'
            . '<span class="hyoka-mount-placeholder" aria-hidden="true"></span>'
            . '</div>';

        if ($echo) {
            echo wp_kses($output, Wp::widgetMountAllowedHtml());
            return '';
        }

        return wp_kses($output, Wp::widgetMountAllowedHtml());
    }

    /**
     * Build full widget markup for live REST responses.
     */
    public static function buildWidgetHtml(string $widget_id, int $product_id = 0): string
    {
        if (
            is_admin()
            && ! defined('DOING_AJAX')
            && ! (defined('REST_REQUEST') && REST_REQUEST)
            && (! function_exists('is_customize_preview') || ! is_customize_preview())
        ) {
            return '';
        }

        $widget_id = sanitize_key($widget_id);
        if (! isset(self::getWidgetsCatalog()[$widget_id])) {
            return '';
        }

        if (! Reviewing::isWidgetActive($widget_id)) {
            return '';
        }

        $previous_product_id = self::$render_product_id;
        if ($product_id > 0) {
            self::$render_product_id = $product_id;
        }

        try {
            $data = [
                'widget' => self::getWidgetsCatalog()[$widget_id] ?? [],
                'style'  => Reviewing::getWidgetStyle($widget_id),
            ];

            $providers = self::getWidgetProviders();
            if (! isset($providers[$widget_id])) {
                return '';
            }

            $widget_data = $providers[$widget_id]();
            if ($widget_data === null) {
                return '';
            }

            $template = $widget_data['template'];
            $data     = array_merge($data, $widget_data['data']);
            $output       = self::renderTemplate($template, $data);
            $widget_style = $data['style'] ?? [];
            $root_class   = Wp::getWidgetRootClass($widget_id, $widget_style);

            return '<div class="' . esc_attr($root_class) . '" data-hyoka-widget="' . esc_attr($widget_id) . '">'
                . wp_kses($output, Wp::widgetContentAllowedHtml())
                . '</div>';
        } finally {
            self::$render_product_id = $previous_product_id;
        }
    }

    /**
     * Unified render function for all widgets.
     */
    public static function renderWidget(string $widget_id = 'product-review', bool $echo = false)
    {
        if (! self::isProductSingleView()) {
            return '';
        }

        if (! Reviewing::isWidgetActive($widget_id)) {
            return '';
        }

        self::registerRenderedWidget($widget_id);

        $mount = self::renderWidgetMount($widget_id, false);
        if ($mount === '') {
            return '';
        }

        $html = '<div class="hyoka-widgets-stack" data-hyoka-shortcode="1">' . $mount . '</div>';

        if ($echo) {
            echo wp_kses($html, Wp::widgetMountAllowedHtml());
            return '';
        }

        return wp_kses($html, Wp::widgetMountAllowedHtml());
    }

    public static function publishReview(int $review_id, string $status): bool
    {
        $normalized = Review::normalizeStatus($status);
        $data       = [
            'status'     => $normalized,
            'updated_at' => current_time('mysql', true),
        ];
        if ($normalized === 'approved') {
            $data['is_verified'] = 1;
        }

        $model  = new Review();
        $result = $model->update($review_id, $data);
        if ($result) {
            $row = $model->findById($review_id);
            Reviewing::clearReviewCache(absint($row['product_id'] ?? 0));
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $params Optional already-sanitized/request data (preferred).
     *                                     When empty, values are read from the nonce-bound
     *                                     Wp request bag (set in Ajax::verifyNonce).
     * @return array{ok: bool, message: string}
     */
    public static function submitReview(array $params = []): array
    {
        $invite_plain = isset($params['invite_token'])
            ? sanitize_text_field((string) $params['invite_token'])
            : \Hyoka\App\Helper\Wp::postText('invite_token');
        $invite_resolution = null;
        if ($invite_plain !== '') {
            $invite_status = Link::getInviteStatus($invite_plain);
            if ($invite_status !== 'valid') {
                $msg = Link::inviteStatusMessage($invite_status);
                return [
                    'ok'      => false,
                    'message' => $msg !== '' ? $msg : __('This review link is invalid.', 'hyoka-product-reviews'),
                ];
            }
            $invite_resolution = Link::getInviteByToken($invite_plain);
            if ($invite_resolution === null) {
                return [
                    'ok'      => false,
                    'message' => Link::inviteStatusMessage('invalid'),
                ];
            }
        }

        $rating     = isset($params['rating']) ? max(0, min(5, absint($params['rating']))) : max(0, min(5, Wp::postInt('rating')));
        $review     = isset($params['review_content']) ? sanitize_textarea_field((string) $params['review_content']) : Wp::postTextarea('review_content');
        $author     = isset($params['author_name']) ? sanitize_text_field((string) $params['author_name']) : Wp::postText('author_name');
        $email      = isset($params['author_email']) ? sanitize_email((string) $params['author_email']) : Wp::postEmail('author_email');
        $title      = isset($params['review_title']) ? sanitize_text_field((string) $params['review_title']) : Wp::postText('review_title');
        $product_id = isset($params['product_id']) ? absint($params['product_id']) : Wp::postInt('product_id');


        if ($invite_resolution !== null) {
            $invite_row     = $invite_resolution['row'];
            $row_product_id = (int) ($invite_row['product_id'] ?? 0);
            if ($row_product_id <= 0 || $row_product_id !== $product_id) {
                return [
                    'ok'      => false,
                    'message' => __('This review link does not match this product.', 'hyoka-product-reviews'),
                ];
            }
            $customer_decoded = Customers::parseCustomer($invite_row['customer'] ?? '');
            $email              = sanitize_email($customer_decoded['email']);
            if ($email === '') {
                return [
                    'ok'      => false,
                    'message' => __('Missing customer email for this invite.', 'hyoka-product-reviews'),
                ];
            }
        }

        $current_user = wp_get_current_user();
        if ($current_user->exists()) {
            if ($author === '') {
                $author = sanitize_text_field($current_user->display_name);
            }
            if ($invite_resolution === null && $email === '') {
                $email = sanitize_email($current_user->user_email);
            }
        }

        if ($author === '') {
            $author = 'Guest';
        }

        if ($rating < 1 || $rating > 5) {
            return [
                'ok'      => false,
                'message' => __('Please choose a star rating (tap 1-5 stars) before submitting.', 'hyoka-product-reviews'),
            ];
        }

        // Store / testimonials reviews use product_id = 0; only the review text is required.
        if ($review === '') {
            return [
                'ok'      => false,
                'message' => __('Please fill in all required fields.', 'hyoka-product-reviews'),
            ];
        }

        $review_type = isset($params['review_type'])
            ? sanitize_key((string) $params['review_type'])
            : Wp::postKey('review_type', 'review');
        if (! in_array($review_type, ['review', 'question'], true)) {
            $review_type = 'review';
        }
        $store_feedback = isset($params['store_review'])
            ? sanitize_textarea_field((string) $params['store_review'])
            : Wp::postTextarea('store_review');

        $status = Moderation::resolveStatus($title . ' ' . $review, ['rating' => $rating]);

        // Media must be supplied by the entry point (AJAX attaches via getMediaFromPost($files)
        // after check_ajax_referer; REST sends media_json in the verified request body).
        $media = Meta::getMediaFromParams($params);

        $data = [
            'product_id'   => $product_id,
            'rating'       => $rating,
            'title'        => $title,
            'content'      => $review,
            'author'       => $author,
            'email'        => $email,
            'store_review' => ($review_type === 'review') ? $store_feedback : null,
            'question'     => ($review_type === 'question') ? $store_feedback : null,
            'status'       => $status,
            'is_verified'  => $invite_resolution !== null ? 1 : 0,
            'media'        => $media,
        ];

        $review_id = Reviewing::addReview($data);
        if (! $review_id) {
            return ['ok' => false, 'message' => 'Failed to save review.'];
        }

        $source   = $invite_resolution !== null ? 'invite' : 'widget';
        $snapshot = Customer::buildReviewJson(
            (int) $review_id,
            $rating,
            $title,
            $review,
            $author,
            $email,
            $source
        );

        if ($invite_resolution !== null) {
            $row_pk = (int) ($invite_resolution['row']['id'] ?? 0);
            if ($row_pk > 0) {
                Meta::markInviteConsumed($row_pk);
                Customer::saveReviewOnCustomer($row_pk, $snapshot);
            }
        } else {
            Customer::saveReviewForProductEmail($product_id, $email, $snapshot);
        }

        // Admin notifications (if enabled).
        Reviewing::maybeSendAdminNotification(
            (int) $review_id,
            [
                'product_id' => $product_id,
                'rating'     => $rating,
                'title'      => $title,
                'content'    => $review,
                'author'     => $author,
                'email'      => $email,
            ],
            $review_type
        );

        if ($review_type === 'review' && $email !== '' && is_email($email)) {
            $row = (new Review())->findById((int) $review_id);
            if (is_array($row)) {
                $replacements = EmailService::buildReplacementsFromReview($row);
                if ($replacements !== null) {
                    $failure_reason = null;
                    EmailService::sendTemplateEmail(
                        'review_confirmation',
                        sanitize_email($email),
                        $replacements,
                        $failure_reason
                    );

                    if ($media === [] && EmailService::isTemplateEnabled('media_reminder')) {
                        $replacements['{review_url}'] = EmailService::buildMediaUploadUrl(
                            (int) ($row['product_id'] ?? 0),
                            (int) $review_id,
                            $email
                        );
                        EmailService::sendTemplateEmail(
                            'media_reminder',
                            sanitize_email($email),
                            $replacements,
                            $failure_reason
                        );
                    }
                }
            }
        }

        $success_message = $invite_resolution !== null
            ? (
                $status === 'approved'
                ? __('Thanks! Your review was submitted and is now visible on the store.', 'hyoka-product-reviews')
                : __('Thanks! Your review was submitted and will appear on the store after an administrator approves it.', 'hyoka-product-reviews')
            )
            : (
                $status === 'approved'
                ? __('Review submitted and approved automatically.', 'hyoka-product-reviews')
                : __('Review submitted successfully.', 'hyoka-product-reviews')
            );

        return ['ok' => true, 'message' => $success_message];
    }

    public static function getWidgetProviders(): array
    {
        return [
            'product-review' => function () {
                $current_id      = self::$render_product_id > 0 ? self::$render_product_id : (get_the_ID() ?: 0);
                $list_product_id = $current_id > 0 ? 0 : $current_id;
                $settings        = EmailSender::getSettings();
                $per_page        = max(1, min(100, (int) ($settings['reviews_per_page'] ?? 10)));
                $paged           = Reviewing::getFrontendReviewsPage($list_product_id, $current_id, 1, $per_page);

                return [
                    'template' => 'Widgets/review-form.php',
                    'data'     => [
                        'mock_reviews'       => $paged['reviews'],
                        'reviews_total'      => $paged['count'],
                        'reviews_per_page'   => $per_page,
                        'current_product_id' => $current_id,
                        'review_stats'       => $paged['stats'],
                    ]
                ];
            },
            'video-carousel' => function () {
                $reviews = Review::fetchReviewList([
                    'media_type' => 'video',
                    'limit'      => 24,
                    'status'     => 'approved',
                ]);
                $slides = Reviewing::buildMediaCarouselSlides($reviews, ['video'], 6);

                return [
                    'template'     => 'Widgets/video-carousel.php',
                    'data'         => [
                        'reviews'      => $reviews,
                        'media_slides' => $slides,
                    ],
                ];
            },
            'card-carousel' => function () {
                $reviews = Review::fetchReviewList([
                    'media_type' => 'visual',
                    'limit'      => 24,
                    'status'     => 'approved',
                ]);
                $slides = Reviewing::buildMediaCarouselSlides($reviews, ['image', 'video'], 6);

                return [
                    'template'     => 'Widgets/card-carousel.php',
                    'data'         => [
                        'reviews'      => $reviews,
                        'media_slides' => $slides,
                    ],
                ];
            },
            'testimonials-carousel' => function () {
                $reviews = Review::fetchReviewList([
                    'limit'  => 6,
                    'status' => 'approved',
                    'view'   => 'store_reviews',
                ]);
                $reviews = array_map(static function (array $review): array {
                    $store_text = trim((string) ($review['store_review'] ?? ''));
                    if ($store_text !== '') {
                        $review['content'] = $store_text;
                    }

                    return $review;
                }, $reviews);

                return ['template' => 'Widgets/testimonials-carousel.php', 'data' => ['reviews' => $reviews]];
            },
            'site-rating' => function () {
                $stats = Review::fetchReviewStats();
                return [
                    'template' => 'Widgets/site-rating.php',
                    'data'     => [
                        'hyoka_site_average' => $stats['average'],
                        'hyoka_site_count'   => $stats['count'],
                    ]
                ];
            }
        ];
    }

    public static function renderTemplate(string $template, array $args = [])
    {
        $template_path = HYOKA_PLUGIN_PATH . ltrim($template, '/');
        if (!file_exists($template_path)) {
            return '';
        }

        // phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Template variables are plugin-controlled and extracted with EXTR_SKIP before including an internal Widgets/ template only.
        extract($args, EXTR_SKIP);
        ob_start();
        include $template_path;
        return (string) ob_get_clean();
    }

    /**
     * Widget catalog for admin UI.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function getWidgetsCatalog(): array
    {
        return [
            'product-review' => [
                'id'          => 'product-review',
                'title'       => __('Product Review Widget', 'hyoka-product-reviews'),
                'description' => __('Collect customer reviews on product pages or embed the form on any page via shortcode.', 'hyoka-product-reviews'),
                'icon'        => 'Star',
                'status'      => Reviewing::getWidgetStatusLabel('product-review'),
                'enabled'     => Reviewing::isWidgetActive('product-review'),
                'placement'   => Reviewing::getWidgetPlacement('product-review'),
                'type'        => __('Product Page + Shortcode', 'hyoka-product-reviews'),
            ],
            'video-carousel' => [
                'id'          => 'video-carousel',
                'title'       => __('Video Carousel', 'hyoka-product-reviews'),
                'description' => __('Showcase your best video reviews in a carousel on product pages or any page via shortcode.', 'hyoka-product-reviews'),
                'icon'        => 'Play',
                'status'      => Reviewing::getWidgetStatusLabel('video-carousel'),
                'enabled'     => Reviewing::isWidgetActive('video-carousel'),
                'placement'   => Reviewing::getWidgetPlacement('video-carousel'),
                'type'        => __('Product Page + Shortcode', 'hyoka-product-reviews'),
            ],
            'card-carousel' => [
                'id'          => 'card-carousel',
                'title'       => __('Card Carousel', 'hyoka-product-reviews'),
                'description' => __('Display customer reviews in a card carousel on product pages or any page via shortcode.', 'hyoka-product-reviews'),
                'icon'        => 'LayoutTemplate',
                'status'      => Reviewing::getWidgetStatusLabel('card-carousel'),
                'enabled'     => Reviewing::isWidgetActive('card-carousel'),
                'placement'   => Reviewing::getWidgetPlacement('card-carousel'),
                'type'        => __('Product Page + Shortcode', 'hyoka-product-reviews'),
            ],
            'testimonials-carousel' => [
                'id'          => 'testimonials-carousel',
                'title'       => __('Testimonials Carousel', 'hyoka-product-reviews'),
                'description' => __('Showcase approved store reviews above the site footer on every page.', 'hyoka-product-reviews'),
                'icon'        => 'MessageCircle',
                'status'      => Reviewing::getWidgetStatusLabel('testimonials-carousel'),
                'enabled'     => Reviewing::isWidgetActive('testimonials-carousel'),
                'placement'   => Reviewing::getWidgetPlacement('testimonials-carousel'),
                'type'        => __('Above Footer', 'hyoka-product-reviews'),
            ],
            'site-rating' => [
                'id'          => 'site-rating',
                'title'       => __('Overall Site Rating', 'hyoka-product-reviews'),
                'description' => __('Display your store rating on product pages or any page via shortcode.', 'hyoka-product-reviews'),
                'icon'        => 'Star',
                'status'      => Reviewing::getWidgetStatusLabel('site-rating'),
                'enabled'     => Reviewing::isWidgetActive('site-rating'),
                'placement'   => Reviewing::getWidgetPlacement('site-rating'),
                'type'        => __('Product Page + Shortcode', 'hyoka-product-reviews'),
            ],
        ];
    }
}
