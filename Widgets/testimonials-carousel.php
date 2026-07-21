<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Testimonials Carousel Template
 *
 * @var array $reviews
 */

$hyoka_reviews = $reviews ?? [];
$hyoka_widget  = $widget ?? [];
$hyoka_style   = $style ?? [];
$hyoka_layout  = ($hyoka_style['widget_layout'] ?? 'carousel') === 'grid' ? 'grid' : 'carousel';

include __DIR__ . '/partials/carousel-rating-vars.php';

?>

<div
    id="HYOKA-testimonials-carousel"
    class="HYOKA-testimonials-widget HYOKA-review-widget <?php echo esc_attr($hyoka_layout === 'grid' ? 'is-grid' : ''); ?>"
    data-widget-id="<?php echo esc_attr($hyoka_widget['id'] ?? 'testimonials-carousel'); ?>"
    data-widget-type="<?php echo esc_attr($hyoka_widget['type'] ?? 'Shortcode'); ?>"
    data-layout="<?php echo esc_attr($hyoka_layout); ?>">
    <?php include __DIR__ . '/partials/testimonials-header.php'; ?>

    <?php
    \Hyoka\App\Helper\SubmissionFormRender::echoInlinePanelForWidget(0, 'testimonials-carousel');
    ?>

    <?php if ($hyoka_reviews === []) : ?>
        <p class="HYOKA-widget-empty"><?php esc_html_e('No approved store reviews to display yet.', 'hyoka-product-reviews'); ?></p>
    <?php elseif ($hyoka_layout === 'grid') : ?>
        <div class="HYOKA-testimonials-grid">
            <?php foreach ($hyoka_reviews as $hyoka_review) : ?>
                <div class="HYOKA-testimonials-grid-item">
                    <?php
                    $hyoka_show_quote = false;
                    include __DIR__ . '/partials/testimonial-card.php';
                    ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <div class="HYOKA-carousel-wrapper">
            <div class="HYOKA-carousel-container">
                <div class="HYOKA-carousel-track">
                    <?php foreach ($hyoka_reviews as $hyoka_review) : ?>
                        <div class="HYOKA-carousel-item">
                            <?php
                            $hyoka_show_quote = true;
                            include __DIR__ . '/partials/testimonial-card.php';
                            ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="HYOKA-carousel-nav">
                <button type="button" class="HYOKA-nav-prev" title="<?php esc_attr_e('Previous', 'hyoka-product-reviews'); ?>">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <button type="button" class="HYOKA-nav-next" title="<?php esc_attr_e('Next', 'hyoka-product-reviews'); ?>">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        </div>
    <?php endif; ?>
</div>
