<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Import\Party;

use Hyoka\App\Import\Base;

defined('ABSPATH') || exit;

class Apps extends Base
{
    /** @var array<string, Base>|null */
    private static $importers = null;

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function getProviderConfigs(): array
    {
        return [
            'csv' => [
                'label'                       => __('CSV / Excel spreadsheet', 'hyoka'),
                'default_product_match'       => 'product_id',
                'finalize_match_type'         => 'product_id',
                'external_app'                => '',
                'uses_finalize_provider'      => false,
                'uses_curated_status'         => false,
                'upload_help'                 => __('Upload a CSV export or save your Excel sheet as CSV. Use our template if you are building a file from scratch.', 'hyoka'),
                'product_match_hint'          => '',
                'recommended_product_columns' => ['product_id', 'product_handle', 'product_sku'],
            ],
            'judgeme' => [
                'label'                       => __('Judge.me', 'hyoka'),
                'default_product_match'       => 'product_handle',
                'finalize_match_type'         => 'product_handle',
                'external_app'                => 'Judge.me',
                'uses_finalize_provider'      => true,
                'uses_curated_status'         => true,
                'upload_help'                 => __('In Judge.me: Manage Reviews → Import & Export → Export published reviews. Upload that CSV here.', 'hyoka'),
                'product_match_hint'          => __('Judge.me exports usually include product_handle (WooCommerce slug) or product_id. Handle matching works best for most stores.', 'hyoka'),
                'recommended_product_columns' => ['product_handle', 'product_id', 'product_sku'],
            ],
            'yotpo' => [
                'label'                       => __('Yotpo', 'hyoka'),
                'default_product_match'       => 'product_sku',
                'finalize_match_type'         => 'product_sku',
                'external_app'                => 'Yotpo',
                'uses_finalize_provider'      => true,
                'uses_curated_status'         => false,
                'upload_help'                 => __('In Yotpo: Reviews → Export reviews (CSV). Upload the export file here — we map Yotpo column names automatically.', 'hyoka'),
                'product_match_hint'          => __('Yotpo exports often include Product SKU or Product ID. SKU matching is recommended for WooCommerce stores.', 'hyoka'),
                'recommended_product_columns' => ['product_sku', 'product_id', 'product_handle'],
            ],
        ];
    }


    /** @var array<string, array<int, string>> */
    private const HEADER_ALIASES = [
        'title'          => [
            'title',
            'review_title',
            'review title',
        ],
        'body'           => [
            'body',
            'review',
            'review_body',
            'review_content',
            'review content',
            'content',
        ],
        'rating'         => [
            'rating',
            'star_rating',
            'review_score',
            'review score',
            'stars',
            'score',
        ],
        'review_date'    => [
            'review_date',
            'review date',
            'created_at',
            'date',
            'reviewed_at',
            'review_created_at',
            'review created date',
        ],
        'reviewer_name'  => [
            'reviewer_name',
            'reviewer display name',
            'reviewer',
            'author',
            'customer_name',
            'name',
        ],
        'reviewer_email' => [
            'reviewer_email',
            'reviewer email',
            'email',
            'customer_email',
        ],
        'reply'          => [
            'reply',
            'public_reply',
            'store_reply',
            'merchant_reply',
            'comment',
            'merchant_comment',
            'merchant comment',
        ],
        'picture_urls'   => [
            'picture_urls',
            'pictures',
            'review_pictures',
            'published_image_url',
            'published image url',
            'photos',
            'images',
            'image_urls',
            'imageurl',
            'image_url',
            'product_image_url',
        ],
        'source'         => [
            'source',
            'review_source',
            'review source',
        ],
        'curated'        => [
            'curated',
            'published',
            'approved',
            'state',
        ],
        'product_id'     => [
            'product_id',
            'product id',
            'shopify_product_id',
            'woocommerce_product_id',
            'external_product_id',
        ],
        'product_handle' => [
            'product_handle',
            'product handle',
            'handle',
            'product_slug',
            'slug',
        ],
        'product_sku'    => [
            'sku',
            'product_sku',
            'product sku',
        ],
    ];

    /** @var array<string, mixed> */
    private array $config;

    public function __construct(string $provider_id)
    {
        $provider_id = sanitize_key($provider_id);
        $configs     = self::getProviderConfigs();
        $config      = $configs[$provider_id] ?? null;

        if (! is_array($config)) {
            $provider_id = 'csv';
            $config      = $configs['csv'];
        }

        $this->config = $config;

        parent::__construct($provider_id, (string) $config['label'], 'file');
    }

    /**
     * @return array<string, mixed>
     */
    public function getAdminConfig(): array
    {
        return [
            'default_product_match'       => (string) $this->config['default_product_match'],
            'upload_help'                 => (string) $this->config['upload_help'],
            'product_match_hint'          => (string) $this->config['product_match_hint'],
            'recommended_product_columns' => (array) $this->config['recommended_product_columns'],
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function getHeaderAliases(): array
    {
        return self::HEADER_ALIASES;
    }

    public function normalizeRow(
        array $row,
        array $column_map,
        array $product_match,
        array $product_mappings,
        int $match_col
    ): array {
        $normalized = parent::normalizeRow($row, $column_map, $product_match, $product_mappings, $match_col);

        if (empty($this->config['uses_finalize_provider'])) {
            return $normalized;
        }

        $normalized = $this->finalizeProviderRow(
            $normalized,
            $product_match,
            (string) $this->config['finalize_match_type'],
            (string) $this->config['external_app']
        );

        if (! empty($this->config['uses_curated_status'])) {
            $normalized = $this->applyCuratedStatus($normalized, $row, $column_map);
        }

        return $normalized;
    }

    /**
     * @return array<string, Base>
     */
    public static function all(): array
    {
        if (self::$importers !== null) {
            return self::$importers;
        }

        $list = [];
        foreach (array_keys(self::getProviderConfigs()) as $provider_id) {
            $list[$provider_id] = new self((string) $provider_id);
        }

        self::$importers = apply_filters('hyoka_import_registry', $list);

        return self::$importers;
    }

    public static function get(string $id): ?Base
    {
        $id  = sanitize_key($id);
        $all = self::all();

        return isset($all[$id]) ? $all[$id] : null;
    }

    public static function resolve(string $id): Base
    {
        $importer = self::get($id);

        return $importer ?? new self('csv');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getProvidersForAdmin(): array
    {
        $providers = [
            [
                'id'          => 'judgeme',
                'label'       => __('Judge.me', 'hyoka'),
                'description' => __('Import reviews exported from Judge.me (CSV). Map columns and match products by ID, SKU, or handle.', 'hyoka'),
                'status'      => 'active',
                'import_type' => 'file',
                'accent'      => 'violet',
                'icon'        => 'judgeme',
            ],
            [
                'id'          => 'yotpo',
                'label'       => __('Yotpo', 'hyoka'),
                'description' => __('Import reviews exported from Yotpo (CSV). Supports Yotpo column names and product matching.', 'hyoka'),
                'status'      => 'active',
                'import_type' => 'file',
                'accent'      => 'blue',
                'icon'        => 'yotpo',
            ],
            [
                'id'          => 'csv',
                'label'       => __('CSV / Excel', 'hyoka'),
                'description' => __('Generic spreadsheet import for any review export or custom template.', 'hyoka'),
                'status'      => 'active',
                'import_type' => 'file',
                'accent'      => 'orange',
                'icon'        => 'spreadsheet',
            ],
        ];

        foreach ($providers as $index => $provider) {
            $id       = (string) ($provider['id'] ?? '');
            $importer = self::get($id);
            if ($importer !== null) {
                $providers[$index]['config']          = $importer->getAdminConfig();
                $providers[$index]['header_aliases'] = $importer->getHeaderAliases();
            }
        }

        return apply_filters('hyoka_import_providers', $providers);
    }

    /**
     * @param array<string, mixed> $normalized
     * @param array<int, mixed>    $row
     * @param array<string, int>   $column_map
     * @return array<string, mixed>
     */
    private function applyCuratedStatus(array $normalized, array $row, array $column_map): array
    {
        $curated_col = isset($column_map['curated']) ? (int) $column_map['curated'] : -1;
        if ($curated_col < 0 || ! isset($row[$curated_col])) {
            return $normalized;
        }

        $curated_raw = strtolower(trim((string) $row[$curated_col]));
        if (in_array($curated_raw, ['ok', 'yes', 'true', '1', 'published'], true)) {
            $normalized['status'] = 'approved';
        }

        return $normalized;
    }
}
