<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Helper;

defined('ABSPATH') || exit;

class Wp
{
    /**
     * @var array<string, string>
     */
    private const FONT_STACKS = [
        'system'    => "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        'arial'     => 'Arial, Helvetica, sans-serif',
        'georgia'   => "Georgia, 'Times New Roman', Times, serif",
        'verdana'   => 'Verdana, Geneva, sans-serif',
        'trebuchet' => "'Trebuchet MS', Helvetica, sans-serif",
        'times'     => "'Times New Roman', Times, serif",
    ];

    public static function sanitizeHexColor(string $color, string $fallback): string
    {
        $color = trim($color);
        if ($color !== '' && $color[0] !== '#') {
            if (preg_match('/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $color)) {
                $color = '#' . $color;
            }
        }
        if (preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $color)) {
            if (strlen($color) === 4) {
                $color = sprintf(
                    '#%s%s%s%s%s%s',
                    $color[1],
                    $color[1],
                    $color[2],
                    $color[2],
                    $color[3],
                    $color[3]
                );
            }
            return strtolower($color);
        }
        return $fallback;
    }

    public static function sanitizeFontKey(string $key): string
    {
        $key = strtolower(preg_replace('/[^a-z]/', '', $key));
        if ($key === '') {
            return 'system';
        }
        return array_key_exists($key, self::FONT_STACKS) ? $key : 'system';
    }

    /**
     * @return array<string, string> key => label for admin UI
     */
    public static function getFontChoices(): array
    {
        return [
            'system'    => 'System / Sans-serif',
            'arial'     => 'Arial',
            'georgia'   => 'Georgia',
            'verdana'   => 'Verdana',
            'trebuchet' => 'Trebuchet MS',
            'times'     => 'Times New Roman',
        ];
    }

    public static function fontStackCss(string $key): string
    {
        $key = self::sanitizeFontKey($key);

        return self::FONT_STACKS[$key];
    }

    public static function sanitizeTextAlign(string $align): string
    {
        $align = strtolower(sanitize_key($align));

        return in_array($align, ['left', 'center', 'right'], true) ? $align : 'center';
    }

    /**
     * Safe CSS length for font-size / height style attributes (rejects `;` injection).
     *
     * Whitelist: 0, 12px, 1rem, 0.5em, 100%. Rejects calc(), url(), and property injection.
     */
    public static function sanitizeCssLength(string $value, string $fallback = '14px'): string
    {
        $value = trim(sanitize_text_field($value));
        if ($value !== '' && preg_match('/^(0|\d+(\.\d+)?(px|em|rem|%))$/i', $value)) {
            return $value;
        }

        return $fallback;
    }

    /**
     * Safe CSS font-weight for style attributes.
     *
     * Allowlist: 100–900, normal, bold.
     */
    public static function sanitizeCssFontWeight(string $value, string $fallback = '400'): string
    {
        $value = strtolower(trim(sanitize_text_field($value)));
        $allowed = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold'];

        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    /**
     * Safe CSS line-height (unitless, length, or keyword normal).
     */
    public static function sanitizeCssLineHeight(string $value, string $fallback = '1.6'): string
    {
        $value = strtolower(trim(sanitize_text_field($value)));
        if (
            $value === 'normal'
            || ($value !== '' && preg_match('/^\d+(\.\d+)?(px|em|rem|%)?$/i', $value))
        ) {
            return $value;
        }

        return $fallback;
    }

    /**
     * Safe CSS margin shorthand (up to 4 length tokens).
     */
    public static function sanitizeCssMargin(string $value, string $fallback = '0'): string
    {
        $value = trim(sanitize_text_field($value));
        if (
            $value !== ''
            && preg_match('/^(\d+(\.\d+)?(px|em|rem|%)?)(\s+\d+(\.\d+)?(px|em|rem|%)?){0,3}$/i', $value)
        ) {
            return $value;
        }

        return $fallback;
    }

    /**
     * Plugin-owned table suffixes. Prefer Model::getTableName() interpolated into
     * prepare() SQL with scoped PHPCS suppressions (Plugin Check does not treat
     * escapeTableName() as a trusted sanitizer). Core tables may stay as $wpdb->posts, etc.
     */
    public const TABLE_REVIEWS  = 'hyoka_reviews';

    public const TABLE_CUSTOMER = 'hyoka_customer';

    public const TABLE_IMPORT   = 'hyoka_import';

    /**
     * Escape a plugin table name for safe interpolation into $wpdb->prepare() SQL.
     * Only pass trusted identifiers from getTableName() — never user input.
     * Prefer getTableName() + scoped PHPCS suppressions for Plugin Check compatibility.
     */
    public static function escapeTableName(string $table): string
    {
        return esc_sql($table);
    }

    /**
     * Escaped backticked table identifier for rare non-prepare SQL only.
     * Prefer getTableName() + "FROM {$table}" inside prepare() query strings.
     */
    public static function sqlTable(string $which): string
    {
        global $wpdb;

        $map = [
            'reviews'  => $wpdb->prefix . self::TABLE_REVIEWS,
            'customer' => $wpdb->prefix . self::TABLE_CUSTOMER,
            'import'   => $wpdb->prefix . self::TABLE_IMPORT,
        ];

        $which = sanitize_key($which);
        $name  = $map[$which] ?? $map['reviews'];

        return '`' . self::escapeTableName($name) . '`';
    }

    /**
     * Allowed HTML tags for widget mount / stack markup (wp_kses context).
     *
     * @return array<string, array<string, bool>>
     */
    public static function widgetMountAllowedHtml(): array
    {
        return [
            'div' => [
                'class'                => true,
                'data-hyoka-widget'    => true,
                'data-hyoka-mount'     => true,
                'data-hyoka-shortcode' => true,
                'data-hyoka-auto'      => true,
            ],
            'span' => [
                'class'       => true,
                'aria-hidden' => true,
            ],
        ];
    }

    /**
     * Allowed HTML for full storefront widget markup (templates + nested review form).
     *
     * Inline style is allowed only on tags that plugin templates actually use with style="".
     *
     * @return array<string, array<string, bool>>
     */
    public static function widgetContentAllowedHtml(): array
    {
        $allowed = wp_kses_allowed_html('post');

        $common = [
            'class'       => true,
            'id'          => true,
            'title'       => true,
            'role'        => true,
            'aria-hidden' => true,
            'aria-label'  => true,
            'aria-live'   => true,
            'hidden'      => true,
        ];

        $data_attrs = [
            'data-hyoka-widget'    => true,
            'data-widget-id'       => true,
            'data-widget-type'     => true,
            'data-layout'          => true,
            'data-star'            => true,
            'data-id'              => true,
            'data-user-replies'    => true,
            'data-value'           => true,
            'data-rating'          => true,
            'data-rating-required' => true,
        ];

        foreach (['div', 'span', 'p', 'section', 'article', 'h2', 'h3', 'h4', 'strong', 'small', 'a', 'img', 'ul', 'ol', 'li'] as $tag) {
            if (! isset($allowed[$tag])) {
                $allowed[$tag] = [];
            }
            $allowed[$tag] = array_merge($allowed[$tag], $common, $data_attrs);
        }

        // Strip inherited post-content style attrs; re-allow only where templates need them.
        foreach ($allowed as $tag => $attrs) {
            if (is_array($attrs) && isset($attrs['style']) && ! in_array($tag, ['div', 'p', 'strong'], true)) {
                unset($allowed[$tag]['style']);
            }
        }
        foreach (['div', 'p', 'strong'] as $tag) {
            $allowed[$tag]['style'] = true;
        }

        $allowed['button'] = array_merge($common, $data_attrs, [
            'type'     => true,
            'disabled' => true,
        ]);

        $allowed['video'] = array_merge($common, [
            'src'         => true,
            'muted'       => true,
            'playsinline' => true,
            'controls'    => true,
            'poster'      => true,
            'loop'        => true,
            'autoplay'    => true,
        ]);

        $allowed['svg'] = array_merge($common, [
            'xmlns'           => true,
            'width'           => true,
            'height'          => true,
            'viewbox'         => true,
            'fill'            => true,
            'stroke'          => true,
            'stroke-width'    => true,
            'stroke-linecap'  => true,
            'stroke-linejoin' => true,
        ]);

        $allowed['path'] = [
            'd'               => true,
            'fill'            => true,
            'fill-rule'       => true,
            'clip-rule'       => true,
            'stroke'          => true,
            'stroke-width'    => true,
            'stroke-linecap'  => true,
            'stroke-linejoin' => true,
        ];

        foreach (self::reviewFormAllowedHtml() as $tag => $attrs) {
            $allowed[$tag] = array_merge($allowed[$tag] ?? [], $attrs);
        }

        return $allowed;
    }

    /**
     * Allowed HTML tags for storefront review forms (wp_kses context).
     *
     * @return array<string, array<string, bool>>
     */
    public static function reviewFormAllowedHtml(): array
    {
        return [
            'div' => [
                'class'  => true,
                'hidden' => true,
            ],
            'form' => [
                'class'    => true,
                'method'   => true,
                'action'   => true,
                'enctype'  => true,
            ],
            'input' => [
                'type'                 => true,
                'name'                 => true,
                'value'                => true,
                'class'                => true,
                'placeholder'          => true,
                'required'             => true,
                'multiple'             => true,
                'accept'               => true,
                'id'                   => true,
                'readonly'             => true,
                'data-rating-required' => true,
            ],
            'button' => [
                'type'        => true,
                'class'       => true,
                'data-value'  => true,
                'aria-label'  => true,
                'data-rating' => true,
            ],
            'h4' => [
                'class' => true,
            ],
            'label' => [
                'class' => true,
                'for'   => true,
            ],
            'span' => [
                'class' => true,
            ],
            'textarea' => [
                'class'       => true,
                'name'        => true,
                'rows'        => true,
                'required'    => true,
                'placeholder' => true,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function getDefaultStyle(string $widget_id): array
    {
        $titles = [
            'product-review'        => 'Customer Reviews',
            'video-carousel'        => 'Video Reviews',
            'card-carousel'         => 'Review Highlights',
            'testimonials-carousel' => 'What Our Customers Say',
            'site-rating'           => 'Store Rating',
        ];
        $title = $titles[$widget_id] ?? 'Customer Reviews';

        return [
            'widget_title'           => $title,
            'widget_subtitle'        => 'Real feedback from verified buyers',
            'primary_color'          => '#F59E0B',
            'accent_color'           => '#FDB022',
            'font_family'            => 'system',
            'card_radius'            => '12',
            'card_gap'               => '24',
            'border_color'           => '#EAECF0',
            'background_color'       => '#FFFFFF',
            'text_color'             => '#1D2939',
            'show_star_rating'       => true,
            'widget_layout'          => 'carousel',
            'widget_elements'        => [],
            'header_font_size'       => '24px',
            'header_font_weight'     => '700',
            'header_text_color'      => '#1D2939',
            'header_text_align'      => 'center',
            'card_title_font_size'   => '15px',
            'card_title_font_weight' => '700',
            'card_title_text_color'  => '#1D2939',
            'card_body_font_size'    => '13px',
            'card_body_font_weight'  => '400',
            'card_body_text_color'   => '#667085',
            'mock_rating_avg'        => '4.8',
            'mock_rating_count'      => 120,
            'star_size'              => '16px',
            'star_align'             => 'left',
            'show_widget_title'      => true,
            'default_sorting'        => 'newest',
            'reviews_per_page'       => 10,
            'widget_theme'           => 'standard',
            'layout_columns'         => 3,
            'star_color'             => '#F59E0B',
            'button_color'           => '#F59E0B',
            'button_text_color'      => '#131720',
            'show_review_date'       => true,
            'show_verified_badge'    => true,
            'show_product_name'      => true,
            'write_review_button_text' => 'Write a review',
            'reply_author_name'      => 'Store Owner',
            'show_search_bar'        => false,
            'show_rating_filters'    => false,
            'expanded_media_gallery' => false,
            'image_style'            => 'rounded',
            'reviewer_name_format'   => 'full',
            'show_reviewer_location' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function getWidgetStyleFromPost(): array
    {
        // Reads from request bag bound in Ajax::verifyNonce() after check_ajax_referer().
        $elements = self::parseJsonElements(self::postTextarea('widget_elements'));

        $data = [
            'widget_title'           => self::postText('widget_title'),
            'widget_subtitle'        => self::postText('widget_subtitle'),
            'primary_color'          => self::postText('primary_color', '#F59E0B'),
            'accent_color'           => self::postText('accent_color', '#FDB022'),
            'font_family'            => self::postText('font_family', 'system'),
            'card_radius'            => self::postInt('card_radius', 12),
            'card_gap'               => self::postInt('card_gap', 24),
            'border_color'           => self::postText('border_color', '#EAECF0'),
            'background_color'       => self::postText('background_color', '#FFFFFF'),
            'text_color'             => self::postText('text_color', '#1D2939'),
            'show_star_rating'       => self::postBoolean('show_star_rating', true),
            'widget_layout'          => self::postKey('widget_layout', 'carousel'),
            'widget_elements'        => $elements,
            'header_font_size'       => self::postText('header_font_size', '24px'),
            'header_font_weight'     => self::postText('header_font_weight', '700'),
            'header_text_color'      => self::postText('header_text_color', '#1D2939'),
            'header_text_align'      => self::sanitizeTextAlign(self::postKey('header_text_align', 'center')),
            'card_title_font_size'   => self::postText('card_title_font_size', '15px'),
            'card_title_font_weight' => self::postText('card_title_font_weight', '700'),
            'card_title_text_color'  => self::postText('card_title_text_color', '#1D2939'),
            'card_body_font_size'    => self::postText('card_body_font_size', '13px'),
            'card_body_font_weight'  => self::postText('card_body_font_weight', '400'),
            'card_body_text_color'   => self::postText('card_body_text_color', '#667085'),
            'mock_rating_avg'        => self::postText('mock_rating_avg', '4.8'),
            'mock_rating_count'      => self::postInt('mock_rating_count', 120),
            'star_size'              => self::postText('star_size', '16px'),
            'star_align'             => self::sanitizeTextAlign(self::postKey('star_align', 'left')),
            'show_widget_title'      => self::postBoolean('show_widget_title', true),
            'default_sorting'        => self::postKey('default_sorting', 'newest'),
            'reviews_per_page'       => self::postInt('reviews_per_page', 10),
            'widget_theme'           => self::postKey('widget_theme', 'standard'),
            'layout_columns'         => self::postInt('layout_columns', 3),
            'star_color'             => self::postText('star_color', '#F59E0B'),
            'button_color'           => self::postText('button_color', '#F59E0B'),
            'button_text_color'      => self::postText('button_text_color', '#131720'),
            'show_review_date'       => self::postBoolean('show_review_date', true),
            'show_verified_badge'    => self::postBoolean('show_verified_badge', true),
            'show_product_name'      => self::postBoolean('show_product_name', true),
            'write_review_button_text' => self::postText('write_review_button_text', 'Write a review'),
            'reply_author_name'      => self::postText('reply_author_name', 'Store Owner'),
            'show_search_bar'        => self::postBoolean('show_search_bar', false),
            'show_rating_filters'    => self::postBoolean('show_rating_filters', false),
            'expanded_media_gallery' => self::postBoolean('expanded_media_gallery', false),
            'image_style'            => self::postKey('image_style', 'rounded'),
            'reviewer_name_format'   => self::postKey('reviewer_name_format', 'full'),
            'show_reviewer_location' => self::postBoolean('show_reviewer_location', false),
        ];

        if (! in_array($data['widget_layout'], ['carousel', 'grid', 'list'], true)) {
            $data['widget_layout'] = 'carousel';
        }

        return $data;
    }

    /**
     * @param array<string, mixed> $style
     */
    public static function hasCustomWidgetAppearance(string $widget_id, array $style): bool
    {
        $defaults = self::getDefaultStyle($widget_id);
        $keys     = [
            'background_color',
            'border_color',
            'text_color',
            'primary_color',
            'accent_color',
            'header_font_size',
            'header_font_weight',
            'header_text_color',
            'header_text_align',
            'card_title_font_size',
            'card_title_font_weight',
            'card_title_text_color',
            'card_body_font_size',
            'card_body_font_weight',
            'card_body_text_color',
            'font_family',
            'card_radius',
            'card_gap',
            'star_size',
            'star_align',
            'widget_theme',
            'star_color',
            'button_color',
            'button_text_color',
            'layout_columns',
            'image_style',
            'widget_layout',
        ];

        foreach ($keys as $key) {
            if (self::widgetStyleValueDiffers($key, $style[$key] ?? null, $defaults[$key] ?? null)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param mixed $value
     * @param mixed $default
     */
    private static function widgetStyleValueDiffers(string $key, $value, $default): bool
    {
        if (in_array($key, ['background_color', 'border_color', 'text_color', 'primary_color', 'accent_color', 'header_text_color', 'card_title_text_color', 'card_body_text_color', 'star_color', 'button_color', 'button_text_color'], true)) {
            $left  = self::sanitizeHexColor((string) $value, (string) $default);
            $right = self::sanitizeHexColor((string) $default, '#000000');

            return strcasecmp($left, $right) !== 0;
        }

        if (in_array($key, ['card_radius', 'card_gap', 'layout_columns'], true)) {
            return (int) $value !== (int) $default;
        }

        if ($key === 'font_family') {
            return self::sanitizeFontKey((string) $value) !== self::sanitizeFontKey((string) $default);
        }

        if ($key === 'header_text_align' || $key === 'star_align') {
            return self::sanitizeTextAlign((string) $value) !== self::sanitizeTextAlign((string) $default);
        }

        if ($key === 'widget_theme' || $key === 'image_style' || $key === 'widget_layout') {
            return sanitize_key((string) $value) !== sanitize_key((string) $default);
        }

        return sanitize_text_field((string) $value) !== sanitize_text_field((string) $default);
    }

    /**
     * @param array<string, mixed> $style
     */
    public static function getWidgetRootClass(string $widget_id, array $style): string
    {
        $widget_theme = sanitize_key((string) ($style['widget_theme'] ?? 'standard'));
        if (! in_array($widget_theme, ['minimal', 'standard', 'bold'], true)) {
            $widget_theme = 'standard';
        }

        $classes = ['hyoka-root', 'hyoka-theme-' . $widget_theme];

        if (self::hasCustomWidgetAppearance($widget_id, $style)) {
            $classes[] = 'hyoka-widget-styled';
        }

        if (isset($style['show_star_rating']) && empty($style['show_star_rating'])) {
            $classes[] = 'hyoka-hide-stars';
        }
        if (isset($style['show_widget_title']) && empty($style['show_widget_title'])) {
            $classes[] = 'hyoka-hide-widget-title';
        }
        if (isset($style['show_review_date']) && empty($style['show_review_date'])) {
            $classes[] = 'hyoka-hide-review-date';
        }
        if (isset($style['show_verified_badge']) && empty($style['show_verified_badge'])) {
            $classes[] = 'hyoka-hide-verified-badge';
        }
        if (isset($style['show_product_name']) && empty($style['show_product_name'])) {
            $classes[] = 'hyoka-hide-product-name';
        }
        if (isset($style['show_search_bar']) && empty($style['show_search_bar'])) {
            $classes[] = 'hyoka-hide-search-bar';
        }
        if (isset($style['show_rating_filters']) && empty($style['show_rating_filters'])) {
            $classes[] = 'hyoka-hide-rating-filters';
        }

        return implode(' ', $classes);
    }

    /**
     * Build widget theme CSS from sanitized style tokens.
     *
     * Security boundary: every interpolated value is validated before assembly.
     * The returned string is passed directly to wp_add_inline_style().
     *
     * @param array<string, mixed> $style
     */
    public static function getWidgetCssVariablesBlock(string $widget_id, array $style): string
    {
        $widget_id = sanitize_key($widget_id);
        if ($widget_id === '' || ! self::hasCustomWidgetAppearance($widget_id, $style)) {
            return '';
        }

        $primary     = self::sanitizeHexColor((string) ($style['primary_color'] ?? ''), '#F59E0B');
        $accent      = self::sanitizeHexColor((string) ($style['accent_color'] ?? ''), '#FDB022');
        $border      = self::sanitizeHexColor((string) ($style['border_color'] ?? ''), '#EAECF0');
        $background  = self::sanitizeHexColor((string) ($style['background_color'] ?? ''), '#FFFFFF');
        $text        = self::sanitizeHexColor((string) ($style['text_color'] ?? ''), '#1D2939');
        $header_text = self::sanitizeHexColor((string) ($style['header_text_color'] ?? ''), '#1D2939');
        $title_text  = self::sanitizeHexColor((string) ($style['card_title_text_color'] ?? ''), '#1D2939');
        $body_text   = self::sanitizeHexColor((string) ($style['card_body_text_color'] ?? ''), '#667085');
        $star_color  = self::sanitizeHexColor((string) ($style['star_color'] ?? ''), $primary);
        $button_bg   = self::sanitizeHexColor((string) ($style['button_color'] ?? ''), $primary);
        $button_text = self::sanitizeHexColor((string) ($style['button_text_color'] ?? ''), '#131720');
        $radius      = max(0, min(48, (int) ($style['card_radius'] ?? 12)));
        $gap         = max(0, min(64, (int) ($style['card_gap'] ?? 24)));
        $star_align  = self::sanitizeTextAlign((string) ($style['star_align'] ?? 'left'));
        $image_style = sanitize_key((string) ($style['image_style'] ?? 'rounded'));
        $image_radius = $image_style === 'circle' ? '9999px' : ($image_style === 'square' ? '0px' : $radius . 'px');
        $star_justify = $star_align === 'center' ? 'center' : ($star_align === 'right' ? 'flex-end' : 'flex-start');
        $bg_custom    = strcasecmp($background, '#ffffff') !== 0;
        $border_custom = strcasecmp($border, '#eaecf0') !== 0;
        $shell_bg     = $bg_custom ? $background : 'transparent';
        $widget_theme = sanitize_key((string) ($style['widget_theme'] ?? 'standard'));
        if (! in_array($widget_theme, ['minimal', 'standard', 'bold'], true)) {
            $widget_theme = 'standard';
        }

        if ($widget_theme === 'bold') {
            $shell_border = '2px solid ' . $border;
            $shell_shadow = 'none';
        } elseif ($border_custom || $widget_theme !== 'standard') {
            $shell_border = '1px solid ' . $border;
            $shell_shadow = $widget_theme === 'standard' ? '0 2px 16px rgba(0,0,0,0.05)' : 'none';
        } else {
            $shell_border = 'none';
            $shell_shadow = '0 2px 16px rgba(0,0,0,0.05)';
        }

        $selector = '.hyoka-root.hyoka-widget-styled[data-hyoka-widget="' . $widget_id . '"]';

        return $selector . '{'
            . '--hyoka-primary:' . $primary . ';'
            . '--hyoka-accent:' . $accent . ';'
            . '--hyoka-border:' . $border . ';'
            . '--hyoka-bg:' . $shell_bg . ';'
            . '--hyoka-text:' . $text . ';'
            . '--hyoka-header-text:' . $header_text . ';'
            . '--hyoka-card-title:' . $title_text . ';'
            . '--hyoka-card-body:' . $body_text . ';'
            . '--hyoka-star-color:' . $star_color . ';'
            . '--hyoka-button-bg:' . $button_bg . ';'
            . '--hyoka-button-text:' . $button_text . ';'
            . '--hyoka-card-radius:' . $radius . 'px;'
            . '--hyoka-card-gap:' . $gap . 'px;'
            . '--hyoka-star-size:' . self::sanitizeCssLength((string) ($style['star_size'] ?? ''), '16px') . ';'
            . '--hyoka-image-radius:' . $image_radius . ';'
            . '--hyoka-layout-columns:' . max(1, min(6, (int) ($style['layout_columns'] ?? 3))) . ';'
            . '--hyoka-font:' . self::fontStackCss((string) ($style['font_family'] ?? 'system')) . ';'
            . '--hyoka-header-size:' . self::sanitizeCssLength((string) ($style['header_font_size'] ?? ''), '24px') . ';'
            . '--hyoka-header-weight:' . self::sanitizeCssFontWeight((string) ($style['header_font_weight'] ?? ''), '700') . ';'
            . '--hyoka-header-align:' . self::sanitizeTextAlign((string) ($style['header_text_align'] ?? 'center')) . ';'
            . '--hyoka-title-size:' . self::sanitizeCssLength((string) ($style['card_title_font_size'] ?? ''), '15px') . ';'
            . '--hyoka-title-weight:' . self::sanitizeCssFontWeight((string) ($style['card_title_font_weight'] ?? ''), '700') . ';'
            . '--hyoka-body-size:' . self::sanitizeCssLength((string) ($style['card_body_font_size'] ?? ''), '13px') . ';'
            . '--hyoka-body-weight:' . self::sanitizeCssFontWeight((string) ($style['card_body_font_weight'] ?? ''), '400') . ';'
            . '--hyoka-star-justify:' . $star_justify . ';'
            . '--hyoka-shell-border:' . $shell_border . ';'
            . '--hyoka-shell-shadow:' . $shell_shadow . ';'
            . '}';
    }

    /**
     * @param mixed $value Raw input.
     */
    public static function sanitizeBooleanInput($value, bool $default = false): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (bool) $value;
        }
        if (! is_scalar($value)) {
            return $default;
        }

        $filtered = filter_var(
            sanitize_text_field((string) $value),
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        return $filtered ?? $default;
    }

    /**
     * @param array<string, mixed> $settings
     */
    public static function settingBoolean(array $settings, string $key, bool $default = false): bool
    {
        if (! array_key_exists($key, $settings)) {
            return $default;
        }

        return self::sanitizeBooleanInput($settings[$key], $default);
    }

    /**
     * @param mixed $raw
     * @param array<string, mixed> $default
     * @return array<string, mixed>
     */
    public static function decodeJsonColumn($raw, array $default = []): array
    {
        if (is_array($raw)) {
            return $raw;
        }
        if (! is_string($raw)) {
            return $default;
        }

        $trimmed = trim($raw);
        if ($trimmed === '' || $trimmed === 'null') {
            return $default;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : $default;
    }

    /**
     * Unslashed request bag bound by Ajax/REST after nonce verification.
     * Helpers read from this array only — they never touch $_POST directly.
     *
     * @var array<string, mixed>|null
     */
    private static $request = null;

    /**
     * Bind an already-unslashed request array after check_ajax_referer() / REST nonce.
     *
     * @param array<string, mixed> $request Typically wp_unslash( $_POST ).
     */
    public static function setRequest(array $request): void
    {
        self::$request = $request;
    }

    public static function clearRequest(): void
    {
        self::$request = null;
    }

    /**
     * @return array<string, mixed>
     */
    private static function requestBag(): array
    {
        return is_array(self::$request) ? self::$request : [];
    }

    /**
     * Pure sanitizers — prefer these when the value is already taken from a
     * nonce-verified request (same function as check_ajax_referer / wp_verify_nonce).
     *
     * @param mixed $value
     */
    public static function sanitizeTextarea($value, string $default = ''): string
    {
        if (! is_scalar($value)) {
            return $default;
        }

        return sanitize_textarea_field(wp_unslash((string) $value));
    }

    /**
     * @param mixed $value
     */
    public static function sanitizeText($value, string $default = ''): string
    {
        if (! is_scalar($value)) {
            return $default;
        }

        return sanitize_text_field(wp_unslash((string) $value));
    }

    /**
     * @param mixed $value
     */
    public static function sanitizeEmailValue($value, string $default = ''): string
    {
        if (! is_scalar($value)) {
            return $default;
        }

        return sanitize_email(wp_unslash((string) $value));
    }

    /**
     * Request-bag helpers. Not an authorization boundary.
     *
     * Call Wp::setRequest() from the AJAX/REST entry point after
     * check_ajax_referer() / wp_verify_nonce(). These methods only read and
     * sanitize values from that already-verified bag — they never touch $_POST.
     */
    public static function postBoolean(string $key, bool $default = false): bool
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        $value = self::sanitizeText($request[$key], '');

        if ($value === '0') {
            return false;
        }

        if ($value === '1') {
            return true;
        }

        return self::sanitizeBooleanInput($value, $default);
    }

    public static function postText(string $key, string $default = ''): string
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return self::sanitizeText($request[$key], $default);
    }

    public static function postTextarea(string $key, string $default = ''): string
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return self::sanitizeTextarea($request[$key], $default);
    }

    public static function postEmail(string $key, string $default = ''): string
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return self::sanitizeEmailValue($request[$key], $default);
    }

    public static function postKsesPost(string $key, string $default = ''): string
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return wp_kses_post(wp_unslash((string) $request[$key]));
    }

    public static function hasPost(string $key): bool
    {
        $request = self::requestBag();

        return isset($request[$key]) && is_scalar($request[$key]);
    }

    public static function postKey(string $key, string $default = ''): string
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return sanitize_key(self::sanitizeText($request[$key], $default));
    }

    public static function postInt(string $key, int $default = 0): int
    {
        $request = self::requestBag();
        if (! isset($request[$key]) || ! is_scalar($request[$key])) {
            return $default;
        }

        return absint($request[$key]);
    }

    /**
     * @return array<int, int>
     */
    public static function postIntList(string $key): array
    {
        $request = self::requestBag();
        if (! isset($request[$key])) {
            return [];
        }

        $raw = $request[$key];

        if (is_string($raw)) {
            $parts = array_filter(array_map('trim', explode(',', sanitize_text_field(wp_unslash($raw)))));

            return array_values(array_filter(array_map('absint', $parts)));
        }

        if (! is_array($raw)) {
            return [];
        }

        $ids = [];
        foreach ($raw as $item) {
            if (is_scalar($item)) {
                $ids[] = absint(sanitize_text_field((string) $item));
            }
        }

        return array_values(array_filter($ids));
    }

    /**
     * @return array<int, string>
     */
    public static function parseJsonStringList(string $raw_json): array
    {
        if ($raw_json === '') {
            return [];
        }

        $decoded = json_decode($raw_json, true);
        if (! is_array($decoded)) {
            return [];
        }

        $out = [];
        foreach ($decoded as $item) {
            if (is_scalar($item)) {
                $out[] = sanitize_text_field((string) $item);
            }
        }

        return $out;
    }

    /**
     * @return array<int, array{url: string, type: string, id: int}>
     */
    public static function parseStoredMediaJson($raw): array
    {
        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        $out = [];
        foreach ($decoded as $item) {
            if (! is_array($item)) {
                continue;
            }
            $url = isset($item['url']) ? esc_url_raw((string) $item['url']) : '';
            if ($url === '') {
                continue;
            }
            $out[] = [
                'url'  => $url,
                'type' => isset($item['type']) ? sanitize_key((string) $item['type']) : 'image',
                'id'   => isset($item['id']) ? absint($item['id']) : 0,
            ];
        }

        return $out;
    }

    public static function sanitizeEmailInnerHtml(string $html): string
    {
        $allowed = wp_kses_allowed_html('post');
        $layout_attrs = [
            'align'         => true,
            'bgcolor'       => true,
            'border'        => true,
            'cellpadding'   => true,
            'cellspacing'   => true,
            'class'         => true,
            'style'         => true,
            'width'         => true,
            'height'        => true,
            'role'          => true,
            'valign'        => true,
            'colspan'       => true,
            'rowspan'       => true,
        ];
        foreach (['table', 'tbody', 'thead', 'tfoot', 'tr', 'th', 'td'] as $tag) {
            if (!isset($allowed[$tag])) {
                $allowed[$tag] = [];
            }
            $allowed[$tag] = array_merge($allowed[$tag], $layout_attrs);
        }
        $inline_attrs = [
            'class' => true,
            'style' => true,
            'align' => true,
        ];
        foreach (['div', 'p', 'span', 'a', 'h1', 'h2', 'h3', 'img', 'strong', 'em', 'b', 'i', 'u'] as $tag) {
            if (!isset($allowed[$tag])) {
                $allowed[$tag] = [];
            }
            $allowed[$tag] = array_merge($allowed[$tag], $inline_attrs);
        }
        if (isset($allowed['a'])) {
            $allowed['a']['href']   = true;
            $allowed['a']['target'] = true;
            $allowed['a']['rel']    = true;
        }
        if (isset($allowed['img'])) {
            $allowed['img']['src'] = true;
            $allowed['img']['alt'] = true;
        }

        return wp_kses($html, $allowed);
    }

    /**
     * @param array<mixed> $elements
     * @return array<int, array<string, mixed>>
     */
    public static function sanitizeElementsArray(array $elements): array
    {
        $out = [];
        foreach ($elements as $el) {
            if (! is_array($el)) {
                continue;
            }
            $item = [];
            foreach ($el as $key => $value) {
                $k = sanitize_key((string) $key);
                if ($k === '') {
                    continue;
                }
                if (is_array($value)) {
                    $nested = self::sanitizeElementsArray($value);
                    if ($nested !== []) {
                        $item[$k] = $nested;
                    }
                } elseif (is_bool($value)) {
                    $item[$k] = $value;
                } elseif (is_int($value) || is_float($value)) {
                    $item[$k] = $value;
                } elseif (is_string($value)) {
                    $item[$k] = ($k === 'url')
                        ? esc_url_raw(wp_unslash($value))
                        : sanitize_text_field(wp_unslash($value));
                }
            }
            $out[] = $item;
        }

        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function parseJsonElements(string $raw_json): array
    {
        if ($raw_json === '') {
            return [];
        }

        $decoded = json_decode($raw_json, true);

        return is_array($decoded) ? self::sanitizeElementsArray($decoded) : [];
    }
}
