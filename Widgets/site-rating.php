<?php

/** site rating widget **/

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

$hyoka_site_average = $hyoka_site_average ?? $hyoka_average ?? 0;
$hyoka_site_count   = $hyoka_site_count ?? $hyoka_count ?? 0;
$hyoka_style   = $style ?? [];
$hyoka_widget  = $widget ?? [];
$hyoka_show_title = ! isset($hyoka_style['show_widget_title']) || ! empty($hyoka_style['show_widget_title']);
$hyoka_show_verified = ! isset($hyoka_style['show_verified_badge']) || ! empty($hyoka_style['show_verified_badge']);
?>

<div
    class="HYOKA-site-rating-widget HYOKA-review-widget"
    data-widget-id="<?php echo esc_attr($hyoka_widget['id'] ?? 'site-rating'); ?>"
    data-widget-type="<?php echo esc_attr($hyoka_widget['type'] ?? 'Shortcode'); ?>">
    <?php if ($hyoka_show_title && ($hyoka_style['widget_title'] ?? '') !== '') : ?>
        <h3 class="HYOKA-widget-title"><?php echo esc_html((string) $hyoka_style['widget_title']); ?></h3>
    <?php endif; ?>
    <div class="HYOKA-site-rating-flex">
        <div class="HYOKA-site-rating-stars">
            <?php for ($hyoka_i = 1; $hyoka_i <= 5; $hyoka_i++) : ?>
                <?php
                $hyoka_filled = $hyoka_i <= floor($hyoka_site_average);
                $hyoka_half   = ! $hyoka_filled && $hyoka_i <= ceil($hyoka_site_average);
                ?>
                <span class="HYOKA-star <?php echo esc_attr($hyoka_filled ? 'is-filled' : ($hyoka_half ? 'is-half' : 'is-empty')); ?>">★</span>
            <?php endfor; ?>
        </div>
        <div class="HYOKA-site-rating-score">
            <span class="HYOKA-avg-score"><?php echo esc_html($hyoka_site_average); ?></span>
            <span class="HYOKA-score-sep">/</span>
            <span class="HYOKA-max-score">5.0</span>
        </div>
    </div>
    <div class="HYOKA-site-rating-info">
        <span class="HYOKA-total-count"><?php
                                        /* translators: %d: total number of reviews. */
                                        printf(esc_html__('Based on %d reviews', 'hyoka-product-reviews'), (int) $hyoka_site_count);
                                        ?></span>
        <?php if ($hyoka_show_verified) : ?>
        <div class="HYOKA-verified-badge">
            <svg class="HYOKA-check-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clip-rule="evenodd" />
            </svg>
            <span class="HYOKA-verified-text"><?php esc_html_e('Verified Store', 'hyoka-product-reviews'); ?></span>
        </div>
        <?php endif; ?>
    </div>
</div>