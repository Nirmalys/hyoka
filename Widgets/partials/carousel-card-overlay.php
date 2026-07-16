<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/**
 * Media card footer overlay (stars + author).
 *
 * @var array<string, mixed> $hyoka_review
 * @var bool $hyoka_always_verified
 */

$hyoka_rating   = (int) ($hyoka_review['rating'] ?? 5);
$hyoka_author   = (string) ($hyoka_review['author'] ?? '');
$hyoka_verified = ! empty($hyoka_always_verified)
    || ! empty($hyoka_review['is_verified'])
    || ($hyoka_review['status'] ?? '') === 'approved';
?>
<div class="HYOKA-card-stars">
    <?php echo esc_html(str_repeat('★', $hyoka_rating)); ?>
</div>
<div class="HYOKA-author-info">
    <span class="HYOKA-author-name"><?php echo esc_html($hyoka_author); ?></span>
    <?php if ($hyoka_verified) : ?>
        <span class="HYOKA-verified-check">✓</span>
    <?php endif; ?>
</div>
