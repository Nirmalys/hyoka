<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Shared carousel header summary (video + card).
 *
 * Expected vars:
 * - string $title
 * - float|int $hyoka_avg_rating_value (preferred) OR $avg_rating (legacy)
 * - int $hyoka_review_count_value (preferred) OR $review_count (legacy)
 */

$hyoka_title = isset($title) ? (string) $title : '';
$hyoka_avg_rating = isset($hyoka_avg_rating_value)
    ? (float) $hyoka_avg_rating_value
    : (isset($avg_rating) ? (float) $avg_rating : 0);
$hyoka_review_count = isset($hyoka_review_count_value)
    ? (int) $hyoka_review_count_value
    : (isset($review_count) ? (int) $review_count : 0);
$hyoka_avg_rating_formatted = number_format($hyoka_avg_rating, 1);
?>

<div class="HYOKA-carousel-header">
    <h2 class="HYOKA-carousel-main-title"><?php echo esc_html($hyoka_title); ?></h2>
    <div class="HYOKA-rating-summary">
        <div class="HYOKA-summary-stars">
            <?php echo esc_html(str_repeat('★', (int) round($hyoka_avg_rating))); ?>
            <?php echo esc_html(str_repeat('☆', 5 - (int) round($hyoka_avg_rating))); ?>
        </div>
        <span class="HYOKA-rating-text"><?php echo esc_html($hyoka_avg_rating_formatted); ?> ★ (<?php echo esc_html((string) $hyoka_review_count); ?>)</span>
        <div class="HYOKA-verified-badge-top">
            <span class="HYOKA-verified-icon">✓</span>
            <span class="HYOKA-verified-text"><?php esc_html_e('Verified', 'hyoka'); ?></span>
        </div>
    </div>
    <div class="HYOKA-review-cta-inline" style="margin-top: 1.5rem;">
        <button type="button" class="HYOKA-submit-button HYOKA-open-review-form"><?php esc_html_e('Write a review', 'hyoka'); ?></button>
    </div>
</div>

