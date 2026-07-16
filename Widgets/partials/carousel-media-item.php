<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Single media carousel card (image or video).
 *
 * @var array<string, mixed> $hyoka_review
 * @var array{url: string, type: string, id: int} $hyoka_media_item
 * @var string $hyoka_item_class
 */

$hyoka_media_item = is_array($hyoka_media_item ?? null) ? $hyoka_media_item : [];
$hyoka_media_url  = (string) ($hyoka_media_item['url'] ?? '');
$hyoka_is_video   = ($hyoka_media_item['type'] ?? '') === 'video';
$hyoka_item_class = trim((string) ($hyoka_item_class ?? ''));
?>
<div class="HYOKA-carousel-item <?php echo esc_attr($hyoka_item_class); ?>">
    <div class="HYOKA-review-card <?php echo esc_attr($hyoka_is_video ? 'HYOKA-video-card-type' : ''); ?>">
        <div class="HYOKA-card-image <?php echo esc_attr($hyoka_is_video ? 'HYOKA-video-container' : ''); ?>">
            <?php if ($hyoka_media_url !== '') : ?>
                <?php if ($hyoka_is_video) : ?>
                    <video src="<?php echo esc_url($hyoka_media_url); ?>" class="HYOKA-carousel-video" muted playsinline></video>
                    <div class="HYOKA-play-overlay">
                        <span class="HYOKA-play-icon">▶</span>
                    </div>
                <?php else : ?>
                    <img src="<?php echo esc_url($hyoka_media_url); ?>" alt="<?php echo esc_attr($hyoka_review['author'] ?? ''); ?>">
                <?php endif; ?>
            <?php endif; ?>
            <div class="HYOKA-card-content">
                <?php
                $hyoka_always_verified = $hyoka_is_video;
                include __DIR__ . '/carousel-card-overlay.php';
                ?>
            </div>
        </div>
    </div>
</div>
