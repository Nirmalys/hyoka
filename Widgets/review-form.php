<?php

/** review form widget **/

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

$hyoka_widget = $widget ?? [];
$hyoka_style  = $style ?? [];
$hyoka_mock_reviews = $mock_reviews ?? [];
$hyoka_show_title = ! isset($hyoka_style['show_widget_title']) || ! empty($hyoka_style['show_widget_title']);
$hyoka_widget_title = ($hyoka_style['widget_title'] ?? '') !== ''
    ? (string) $hyoka_style['widget_title']
    : __('Customer Reviews', 'hyoka-product-reviews');
$hyoka_widget_subtitle = (string) ($hyoka_style['widget_subtitle'] ?? '');
$hyoka_write_btn = (string) ($hyoka_style['write_review_button_text'] ?? __('Write a review', 'hyoka-product-reviews'));
$hyoka_reply_author = (string) ($hyoka_style['reply_author_name'] ?? __('Store Reply', 'hyoka-product-reviews'));
$hyoka_show_date = ! isset($hyoka_style['show_review_date']) || ! empty($hyoka_style['show_review_date']);
$hyoka_show_product = ! isset($hyoka_style['show_product_name']) || ! empty($hyoka_style['show_product_name']);
$hyoka_product_id = $current_product_id ?? 0;
$hyoka_reviews_total = isset($reviews_total) ? (int) $reviews_total : count($hyoka_mock_reviews);
$hyoka_reviews_per_page = isset($reviews_per_page) ? max(1, (int) $reviews_per_page) : 10;
$hyoka_stats = $review_stats ?? [
    'average' => 0,
    'count' => 0,
    'histogram' => [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0]
];
?>

<div class="HYOKA-review-widget" data-widget-id="<?php echo esc_attr($hyoka_widget['id'] ?? 'product-review'); ?>" data-widget-type="<?php echo esc_attr($hyoka_widget['type'] ?? 'Product Page'); ?>">
    <?php if ($hyoka_show_title) : ?>
        <h3 class="HYOKA-widget-title"><?php echo esc_html($hyoka_widget_title); ?></h3>
    <?php endif; ?>
    <?php if ($hyoka_widget_subtitle !== '') : ?>
        <p class="HYOKA-widget-subtitle"><?php echo esc_html($hyoka_widget_subtitle); ?></p>
    <?php endif; ?>

    <div class="HYOKA-summary-section">
        <div class="HYOKA-main-stats">
            <div class="HYOKA-average-score"><?php echo esc_html($hyoka_stats['average']); ?></div>
            <div class="HYOKA-average-stars">
                <?php
                $hyoka_avg = (float) $hyoka_stats['average'];
                for ($hyoka_i = 1; $hyoka_i <= 5; $hyoka_i++) {
                    if ($hyoka_avg >= $hyoka_i) {
                        echo esc_html('★');
                    } elseif ($hyoka_avg >= $hyoka_i - 0.5) {
                        echo esc_html('½');
                    } else {
                        echo esc_html('☆');
                    }
                }
                ?>
            </div>
            <div class="HYOKA-total-count"><?php
                                            /* translators: %d: total number of reviews. */
                                            printf(esc_html__('Based on %d reviews', 'hyoka-product-reviews'), (int) $hyoka_stats['count']);
                                            ?></div>
        </div>
        <div class="HYOKA-histogram">
            <?php foreach (array_reverse($hyoka_stats['histogram'], true) as $hyoka_star => $hyoka_hist_count) :
                $hyoka_percentage = $hyoka_stats['count'] > 0 ? round(($hyoka_hist_count / $hyoka_stats['count']) * 100) : 0;
            ?>
                <div class="HYOKA-histogram-row" data-star="<?php echo esc_attr((string) $hyoka_star); ?>">
                    <span class="HYOKA-star-label"><?php
                                                    /* translators: %d: star rating from 1 to 5. */
                                                    printf(esc_html__('%d stars', 'hyoka-product-reviews'), (int) $hyoka_star);
                                                    ?></span>
                    <div class="HYOKA-bar-container">
                        <div class="HYOKA-bar-fill" style="width: <?php echo esc_attr($hyoka_percentage); ?>%;"></div>
                    </div>
                    <span class="HYOKA-count-label"><?php echo esc_html($hyoka_hist_count); ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="HYOKA-review-cta">
        <p><?php esc_html_e('Share your thoughts with other customers', 'hyoka-product-reviews'); ?></p>
        <button type="button" class="HYOKA-submit-button HYOKA-open-review-form"><?php echo esc_html($hyoka_write_btn); ?></button>
    </div>

    <?php
    \Hyoka\App\Helper\SubmissionFormRender::echoInlinePanelForWidget(
        $hyoka_product_id > 0 ? $hyoka_product_id : (int) get_the_ID(),
        'product-review'
    );
    ?>

    <div class="HYOKA-other-reviews-head">
        <h4 id="HYOKA-other-products-title">
            <?php
            /* translators: %d: total number of reviews. */
            echo esc_html(sprintf(__('Recent Reviews (%d)', 'hyoka-product-reviews'), $hyoka_reviews_total));
            ?>
        </h4>
    </div>
    <div id="HYOKA-reviews-list" class="HYOKA-reviews-list" aria-live="polite">
        <?php if (!empty($hyoka_mock_reviews)) : ?>
            <?php foreach ($hyoka_mock_reviews as $hyoka_review) : ?>
                <article
                    class="HYOKA-review-row"
                    data-id="<?php echo esc_attr($hyoka_review['id']); ?>"
                    data-user-replies='<?php echo esc_attr(wp_json_encode($hyoka_review['user_replies'] ?? [])); ?>'
                >
                    <div class="HYOKA-review-stars"><?php echo esc_html(str_repeat('★', (int)$hyoka_review['rating']) . str_repeat('☆', 5 - (int)$hyoka_review['rating'])); ?></div>
                    <div class="HYOKA-review-author">
                        <span class="HYOKA-avatar"><?php echo esc_html(strtoupper(substr($hyoka_review['author'] ?? 'A', 0, 1))); ?></span>
                        <div><strong><?php echo esc_html($hyoka_review['author'] ?? ''); ?></strong><?php if ($hyoka_show_date) : ?><small class="HYOKA-review-date"><?php echo esc_html($hyoka_review['date'] ?? ''); ?></small><?php endif; ?></div>
                    </div>
                    <p><?php echo esc_html($hyoka_review['content'] ?? ''); ?></p>

                    <?php if (!empty($hyoka_review['reply'])) : ?>
                        <div class="HYOKA-merchant-reply" style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-left: 3px solid var(--hyoka-star-color, var(--hyoka-primary, #F59E0B)); border-radius: 4px;">
                            <strong style="display: block; font-size: 0.8em; text-transform: uppercase; color: var(--hyoka-star-color, var(--hyoka-primary, #F59E0B)); margin-bottom: 5px;"><?php echo esc_html($hyoka_reply_author); ?></strong>
                            <p style="margin: 0; font-style: italic; color: #555;"><?php echo esc_html($hyoka_review['reply']); ?></p>
                        </div>
                    <?php endif; ?>

                    <?php
                    $hyoka_curr_id = (int)($hyoka_product_id ?? 0);
                    $hyoka_review_pid = (int)($hyoka_review['product_id'] ?? 0);
                    if ($hyoka_show_product && $hyoka_review_pid > 0 && $hyoka_review_pid !== $hyoka_curr_id && !empty($hyoka_review['product_title'])) :
                    ?>
                        <div class="HYOKA-review-product-link">
                            <?php if (!empty($hyoka_review['product_image'])) : ?>
                                <img src="<?php echo esc_url($hyoka_review['product_image']); ?>" alt="product" />
                            <?php endif; ?>
                            <div><a href="<?php echo esc_url($hyoka_review['product_link'] ?? '#'); ?>"><?php echo esc_html($hyoka_review['product_title']); ?></a></div>
                        </div>
                    <?php endif; ?>

                    <div class="HYOKA-review-actions">
                        <button type="button" class="HYOKA-action-btn HYOKA-like-btn" title="<?php esc_attr_e('Helpful', 'hyoka-product-reviews'); ?>">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M7 10v12" />
                                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2.83a2 2 0 0 0 1.74-1l.59-1.03a4.01 4.01 0 0 1 7.18 1.91V11.23Z" />
                            </svg>
                            <span><?php echo esc_html($hyoka_review['likes'] ?? '0'); ?></span>
                        </button>
                        <button type="button" class="HYOKA-action-btn HYOKA-comment-btn" aria-label="<?php esc_attr_e('Open discussion', 'hyoka-product-reviews'); ?>">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span><?php echo esc_html($hyoka_review['replies_count'] ?? '0'); ?></span>
                        </button>
                    </div>
                </article>
            <?php endforeach; ?>
        <?php else : ?>
            <p class="HYOKA-empty-reviews"><?php esc_html_e('No reviews available yet.', 'hyoka-product-reviews'); ?></p>
        <?php endif; ?>
    </div>

    <div class="HYOKA-pagination-container" style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="HYOKA-secondary-button HYOKA-prev-page" disabled><?php esc_html_e('Previous', 'hyoka-product-reviews'); ?></button>
        <span class="HYOKA-page-info"><?php
                                        /* translators: %d: current page number. */
                                        printf(esc_html__('Page %d', 'hyoka-product-reviews'), 1);
                                        ?></span>
        <button type="button" class="HYOKA-secondary-button HYOKA-next-page"<?php if ($hyoka_reviews_per_page >= $hyoka_reviews_total) { echo ' disabled'; } ?>><?php esc_html_e('Next', 'hyoka-product-reviews'); ?></button>
    </div>
</div>