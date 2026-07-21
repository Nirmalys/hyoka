<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Testimonials carousel header (title, subtitle, rating summary).
 *
 * @var array<string, mixed> $hyoka_style
 * @var float $hyoka_avg_rating
 * @var string $hyoka_avg_rating_formatted
 * @var int $hyoka_review_count
 */

$hyoka_subtitle = (string) ($hyoka_style['widget_subtitle'] ?? '');
$hyoka_show_title = ! isset($hyoka_style['show_widget_title']) || ! empty($hyoka_style['show_widget_title']);
$hyoka_write_btn = (string) ($hyoka_style['write_review_button_text'] ?? __('Write a review', 'hyoka-product-reviews'));
$hyoka_title    = ($hyoka_style['widget_title'] ?? '') !== ''
    ? (string) $hyoka_style['widget_title']
    : (string) __('Customers are saying', 'hyoka-product-reviews');
?>
<div class="HYOKA-carousel-header">
    <?php if ($hyoka_show_title) : ?>
        <h2 class="HYOKA-carousel-main-title"><?php echo esc_html($hyoka_title); ?></h2>
    <?php endif; ?>
    <?php if ($hyoka_subtitle !== '') : ?>
        <p class="HYOKA-widget-subtitle"><?php echo esc_html($hyoka_subtitle); ?></p>
    <?php endif; ?>
    <div class="HYOKA-rating-summary">
        <div class="HYOKA-summary-stars">
            <?php for ($hyoka_i = 1; $hyoka_i <= 5; $hyoka_i++) : ?>
                <span class="HYOKA-star"><?php echo esc_html($hyoka_i <= round($hyoka_avg_rating) ? '★' : '☆'); ?></span>
            <?php endfor; ?>
        </div>
        <span class="HYOKA-rating-text"><?php echo esc_html($hyoka_avg_rating_formatted); ?> ★ (<?php echo esc_html((string) $hyoka_review_count); ?>)</span>
        <div class="HYOKA-verified-badge-top">
            <svg class="HYOKA-verified-icon-svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" fill-rule="evenodd"></path>
            </svg>
            <?php esc_html_e('Verified', 'hyoka-product-reviews'); ?>
        </div>
        <button type="button" class="HYOKA-submit-button HYOKA-open-review-form HYOKA-header-cta"><?php echo esc_html($hyoka_write_btn); ?></button>
    </div>
</div>
