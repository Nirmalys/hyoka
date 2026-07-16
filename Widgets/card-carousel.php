<?php

/** card carousel widget **/

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/** @var array $reviews */
/** @var array $media_slides */
/** @var array $widget */

$hyoka_reviews = $reviews ?? [];
$hyoka_media_slides = $media_slides ?? [];
$hyoka_widget  = $widget ?? [];
$hyoka_style   = $style ?? [];

include __DIR__ . '/partials/carousel-rating-vars.php';
?>

<div class="HYOKA-review-widget HYOKA-card-carousel-wrapper" id="HYOKA-card-carousel" data-widget-id="<?php echo esc_attr($hyoka_widget['id'] ?? 'card-carousel'); ?>" data-widget-type="<?php echo esc_attr($hyoka_widget['type'] ?? 'Shortcode'); ?>">
    <?php
    $title = ($hyoka_style['widget_title'] ?? '') !== ''
        ? (string) $hyoka_style['widget_title']
        : (string) __('Customers are saying', 'hyoka');
    $hyoka_avg_rating_value = $hyoka_avg_rating;
    $hyoka_review_count_value = $hyoka_review_count;
    include __DIR__ . '/partials/carousel-summary.php';
    ?>

    <?php
    \Hyoka\App\Helper\SubmissionFormRender::echoInlinePanelForWidget(0, 'card-carousel');

    $hyoka_track_id = 'HYOKA-card-track';
    $hyoka_empty_message = (string) __('No approved photo or video reviews to display yet.', 'hyoka');
    include __DIR__ . '/partials/carousel-media-shell.php';
    ?>
</div>
