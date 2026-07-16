<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Testimonial card body (grid + carousel).
 *
 * @var array<string, mixed> $hyoka_review
 * @var bool $hyoka_show_quote
 */

$hyoka_rating        = (int) ($hyoka_review['rating'] ?? 5);
$hyoka_author        = (string) ($hyoka_review['author'] ?? __('Anonymous', 'hyoka'));
$hyoka_content       = trim((string) ($hyoka_review['content'] ?? ''));
$hyoka_product_title = (string) ($hyoka_review['product_title'] ?? '');
$hyoka_product_link  = (string) ($hyoka_review['product_link'] ?? '#');
$hyoka_show_quote    = ! empty($hyoka_show_quote);
$hyoka_verified      = ! empty($hyoka_review['is_verified']) || ($hyoka_review['status'] ?? '') === 'approved';
$hyoka_show_verified = ! isset($hyoka_style['show_verified_badge']) || ! empty($hyoka_style['show_verified_badge']);
$hyoka_show_product  = ! isset($hyoka_style['show_product_name']) || ! empty($hyoka_style['show_product_name']);
?>
<div class="HYOKA-testimonial-card">
    <?php if ($hyoka_show_quote) : ?>
        <div class="HYOKA-quote-icon">
            <svg fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H7.1c.5-2.2 2.5-4 4.9-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6.9c.5-2.2 2.5-4 4.9-4V8z" />
            </svg>
        </div>
    <?php endif; ?>

    <?php if ($hyoka_content !== '') : ?>
        <p class="HYOKA-testimonial-text"><?php echo '"' . esc_html($hyoka_content) . '"'; ?></p>
    <?php endif; ?>

    <div class="HYOKA-testimonial-stars">
        <?php for ($hyoka_i = 1; $hyoka_i <= 5; $hyoka_i++) : ?>
            <svg class="HYOKA-star-svg <?php echo esc_attr($hyoka_i <= $hyoka_rating ? 'is-active' : ''); ?>" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        <?php endfor; ?>
    </div>

    <div class="HYOKA-testimonial-author">
        <strong><?php echo esc_html($hyoka_author); ?></strong>
        <?php if ($hyoka_verified && $hyoka_show_verified) : ?>
            <svg class="HYOKA-verified-check-svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
        <?php endif; ?>
    </div>

    <?php if ($hyoka_show_product && $hyoka_product_title !== '') : ?>
        <a href="<?php echo esc_url($hyoka_product_link); ?>" class="HYOKA-testimonial-product-link">
            <?php echo esc_html($hyoka_product_title); ?>
        </a>
    <?php endif; ?>
</div>
