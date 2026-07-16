<?php

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Include-scoped template variables, not WordPress globals.

/** @var array $hyoka_reviews */

$hyoka_total_rating = 0;
$hyoka_review_count = count($hyoka_reviews);
foreach ($hyoka_reviews as $hyoka_r) {
    $hyoka_total_rating += (int) ($hyoka_r['rating'] ?? 5);
}
$hyoka_avg_rating           = $hyoka_review_count > 0 ? round($hyoka_total_rating / $hyoka_review_count, 1) : 0;
$hyoka_avg_rating_formatted = number_format($hyoka_avg_rating, 1);
