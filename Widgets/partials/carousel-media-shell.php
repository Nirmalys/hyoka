<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Side-nav media carousel shell (card + video carousels).
 *
 * @var string $hyoka_track_id
 * @var string $hyoka_empty_message
 * @var array<int, array{review: array<string, mixed>, media: array{url: string, type: string, id: int}}> $hyoka_media_slides
 */

$hyoka_track_id      = (string) ($hyoka_track_id ?? '');
$hyoka_empty_message = (string) ($hyoka_empty_message ?? '');
$hyoka_media_slides  = is_array($hyoka_media_slides ?? null) ? $hyoka_media_slides : [];
?>
<div class="HYOKA-carousel-container has-side-nav">
    <button type="button" class="HYOKA-nav-prev side-nav" aria-label="<?php esc_attr_e('Previous', 'hyoka'); ?>">❮</button>

    <div class="HYOKA-carousel-track" id="<?php echo esc_attr($hyoka_track_id); ?>">
        <?php if ($hyoka_media_slides === []) : ?>
            <p class="HYOKA-widget-empty"><?php echo esc_html($hyoka_empty_message); ?></p>
        <?php endif; ?>
        <?php foreach ($hyoka_media_slides as $hyoka_index => $hyoka_slide) : ?>
            <?php
            $hyoka_review     = is_array($hyoka_slide['review'] ?? null) ? $hyoka_slide['review'] : [];
            $hyoka_media_item = is_array($hyoka_slide['media'] ?? null) ? $hyoka_slide['media'] : [];
            $hyoka_item_class = (($hyoka_media_item['type'] ?? '') === 'video' && (int) $hyoka_index === 2) ? 'is-focused' : '';
            include __DIR__ . '/carousel-media-item.php';
            ?>
        <?php endforeach; ?>
    </div>

    <button type="button" class="HYOKA-nav-next side-nav" aria-label="<?php esc_attr_e('Next', 'hyoka'); ?>">❯</button>
</div>
