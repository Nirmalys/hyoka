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

class Matcher
{
    /**
     * @return array{products: array<int, array<string, mixed>>, total: int, page: int, per_page: int}
     */
    public static function searchProducts(string $search, int $page = 1, int $per_page = 10): array
    {
        if (! function_exists('wc_get_product')) {
            return ['products' => [], 'total' => 0, 'page' => $page, 'per_page' => $per_page];
        }

        $page     = max(1, $page);
        $per_page = max(1, min(25, $per_page));
        $search   = sanitize_text_field($search);

        $args = [
            'status'   => ['publish', 'private'],
            'limit'    => $per_page,
            'page'     => $page,
            'return'   => 'ids',
            'type'     => ['simple', 'variable', 'grouped', 'external'],
            'paginate' => true,
        ];

        if ($search !== '') {
            if (ctype_digit($search)) {
                $args['include'] = [absint($search)];
            } else {
                $args['s'] = $search;
            }
        }

        $results  = wc_get_products($args);
        $ids      = $results->products;
        $total    = (int) $results->total;

        $products = [];
        foreach ($ids as $product_id) {
            $formatted = self::formatProduct((int) $product_id);
            if ($formatted !== null) {
                $products[] = $formatted;
            }
        }

        return [
            'products' => $products,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
        ];
    }

    /**
     * @param array<int, string> $identifiers
     * @return array<string, array<string, mixed>|null>
     */
    public static function matchProducts(string $match_type, array $identifiers): array
    {
        $match_type = sanitize_key($match_type);
        $allowed    = ['product_id', 'product_url', 'product_handle', 'product_sku', 'manual'];
        if (! in_array($match_type, $allowed, true)) {
            $match_type = 'product_id';
        }

        $out = [];
        foreach ($identifiers as $raw) {
            $key = trim((string) $raw);
            if ($key === '' || array_key_exists($key, $out)) {
                continue;
            }
            if ($match_type === 'manual') {
                $out[$key] = null;
                continue;
            }
            $product_id = self::resolveProductId($match_type, $key);
            $out[$key]  = $product_id > 0 ? self::formatProduct($product_id) : null;
        }

        return $out;
    }

    /**
     * @return array{title: string, image: string, link: string}
     */
    public static function productDataForImport(int $product_id): array
    {
        if ($product_id <= 0 || get_post_type($product_id) !== 'product') {
            return ['title' => '', 'image' => '', 'link' => ''];
        }

        $thumb = get_the_post_thumbnail_url($product_id, 'thumbnail');

        return [
            'title' => (string) get_the_title($product_id),
            'image' => $thumb ? esc_url_raw(wp_unslash($thumb)) : '',
            'link'  => esc_url_raw(wp_unslash((string) get_permalink($product_id))),
        ];
    }

    protected static function resolveProductId(string $match_type, string $value): int
    {
        if (! function_exists('wc_get_product')) {
            return 0;
        }

        switch ($match_type) {
            case 'product_id':
                $id = absint($value);
                return ($id > 0 && get_post_type($id) === 'product') ? $id : 0;
            case 'product_sku':
                if (function_exists('wc_get_product_id_by_sku')) {
                    return absint(wc_get_product_id_by_sku($value));
                }
                return 0;
            case 'product_handle':
                $post = get_page_by_path(sanitize_title($value), OBJECT, 'product');
                return $post ? (int) $post->ID : 0;
            case 'product_url':
                $path = wp_parse_url($value, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return 0;
                }
                $slug = sanitize_title(basename(untrailingslashit($path)));
                $post = get_page_by_path($slug, OBJECT, 'product');
                if ($post) {
                    return (int) $post->ID;
                }
                $post_id = url_to_postid($value);
                return get_post_type($post_id) === 'product' ? (int) $post_id : 0;
            default:
                return 0;
        }
    }

    /**
     * @return array{id: int, name: string, sku: string, image: string, handle: string}|null
     */
    protected static function formatProduct(int $product_id): ?array
    {
        if ($product_id <= 0 || get_post_type($product_id) !== 'product') {
            return null;
        }

        $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
        $thumb   = get_the_post_thumbnail_url($product_id, 'thumbnail');

        return [
            'id'     => $product_id,
            'name'   => get_the_title($product_id),
            'sku'    => $product ? (string) $product->get_sku() : '',
            'handle' => (string) get_post_field('post_name', $product_id),
            'image'  => $thumb ? esc_url_raw(wp_unslash($thumb)) : '',
        ];
    }
}
