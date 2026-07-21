<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Import;

use Hyoka\App\Helper\Import;
use Hyoka\App\Helper\Matcher;
use Hyoka\App\Model\Customer;
use Hyoka\App\Model\ImportRecord;
use Hyoka\App\Model\Review;
use Hyoka\App\Model\Reviewing;

defined('ABSPATH') || exit;

abstract class Base
{
    protected string $id;

    protected string $label;

    protected string $source_type;

    public function __construct(string $id, string $label, string $source_type = 'file')
    {
        $this->id          = sanitize_key($id);
        $this->label       = $label;
        $this->source_type = sanitize_key($source_type) ?: 'file';
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getFieldDefinitions(): array
    {
        return [
            ['key' => 'title', 'label' => __('Review title', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'body', 'label' => __('Review body', 'hyoka-product-reviews'), 'required' => true],
            ['key' => 'rating', 'label' => __('Rating', 'hyoka-product-reviews'), 'required' => true],
            ['key' => 'review_date', 'label' => __('Review date', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'reviewer_name', 'label' => __('Reviewer name', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'reviewer_email', 'label' => __('Reviewer email', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'reply', 'label' => __('Reply', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'picture_urls', 'label' => __('Picture URLs', 'hyoka-product-reviews'), 'required' => false],
            ['key' => 'source', 'label' => __('Source', 'hyoka-product-reviews'), 'required' => false],
        ];
    }

    public function normalizeRow(
        array $row,
        array $column_map,
        array $product_match,
        array $product_mappings,
        int $match_col
    ): array {
        $legacy = Import::normalizeRow($row, $column_map, $product_match, $product_mappings, $match_col);
        $legacy['import']['type']               = $this->id;
        $legacy['import']['source']             = $this->id;
        $legacy['import']['source_type']        = $this->source_type;
        $legacy['import']['product_match_type'] = sanitize_key((string) ($product_match['type'] ?? ''));

        return Normalized::fromLegacyRow($legacy, $this->id, $this->source_type);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function getHeaderAliases(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function getAdminConfig(): array
    {
        return [
            'default_product_match'       => 'product_id',
            'upload_help'                 => '',
            'product_match_hint'          => '',
            'recommended_product_columns' => [ 'product_id', 'product_handle', 'product_sku' ],
        ];
    }

    /**
     * @param array<string, mixed> $normalized
     * @param array<string, mixed> $product_match
     * @return array<string, mixed>
     */
    protected function finalizeProviderRow(array $normalized, array $product_match, string $default_match_type, string $external_app): array
    {
        $normalized['source']      = $this->id;
        $normalized['source_type'] = $this->source_type;
        $normalized['import_meta']['provider']     = $this->id;
        $normalized['import_meta']['external_app'] = $external_app;

        $identifier = (string) ($normalized['import_meta']['product_identifier'] ?? '');
        $match_type = sanitize_key((string) ($product_match['type'] ?? $default_match_type));

        if ((int) ($normalized['product_id'] ?? 0) <= 0 && $identifier !== '') {
            $resolved = Matcher::matchProducts($match_type, [ $identifier ]);
            if (! empty($resolved[ $identifier ]['id'])) {
                $normalized['product_id'] = absint($resolved[ $identifier ]['id']);
            }
        }

        return $normalized;
    }

    /**
     * @param array<string, mixed> $normalized Normalized review row from import pipeline.
     * @return int|false Review ID or false.
     */
    public function insertReview(array $normalized, string $job_id = '')
    {
        $data = Normalized::toWriterRow($normalized);

        $product_id = absint($data['product_id'] ?? 0);
        $body       = sanitize_textarea_field($data['content'] ?? '');
        $is_store   = $product_id <= 0;
        $author     = sanitize_text_field($data['author'] ?? '');
        if ($author === '') {
            $author = __('Imported reviewer', 'hyoka-product-reviews');
        }

        $source      = sanitize_key((string) ($data['source'] ?? $this->id)) ?: $this->id;
        $source_type = sanitize_key((string) ($data['source_type'] ?? $this->source_type)) ?: $this->source_type;
        $import_meta = is_array($data['import_meta'] ?? null) ? $data['import_meta'] : [];
        if (is_array($data['import'] ?? null)) {
            $import_meta = array_merge($import_meta, $data['import']);
        }
        $import_meta['type'] = $source;

        $media = [];
        if (! empty($data['media']) && is_array($data['media'])) {
            foreach ($data['media'] as $item) {
                if (! is_array($item) || empty($item['url'])) {
                    continue;
                }
                $media[] = [
                    'url'            => esc_url_raw(wp_unslash((string) $item['url'])),
                    'type'           => sanitize_key((string) ($item['type'] ?? 'image')) ?: 'image',
                    'isUserUploaded' => false,
                ];
            }
        }

        $content_json = Reviewing::encodeReviewContent([
            'text'   => $is_store ? '' : $body,
            'title'  => $data['title'] ?? '',
            'author' => $author,
        ]);

        $settings = wp_json_encode([
            'source'         => $source,
            'source_type'    => $source_type,
            'verified_buyer' => ! empty($data['is_verified']) ? 1 : 0,
            'is_featured'    => ! empty($data['is_featured']) ? 1 : 0,
            'import_meta'    => $import_meta,
        ]);
        if ($settings === false) {
            return false;
        }

        $media_json = null;
        if ($media !== []) {
            $media_json = wp_json_encode($media, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($media_json === false) {
                return false;
            }
        }

        $insert_data = [
            'product_id'   => $product_id,
            'rating'       => max(1, min(5, absint($data['rating'] ?? 5))),
            'content'      => $content_json,
            'store_review' => $is_store ? $body : '',
            'email'        => sanitize_email($data['email'] ?? ''),
            'status'       => sanitize_key((string) ($data['status'] ?? 'pending')) ?: 'pending',
            'is_verified'  => ! empty($data['is_verified']) ? 1 : 0,
            'media'        => $media_json,
            'reply'        => ! empty($data['reply']) ? sanitize_textarea_field((string) $data['reply']) : null,
            'settings'     => $settings,
            'created_at'   => ! empty($data['created_at']) ? $data['created_at'] : current_time('mysql', true),
            'updated_at'   => current_time('mysql', true),
        ];

        $model     = new Review();
        $review_id = $model->create($insert_data);
        if (! $review_id) {
            return false;
        }

        Reviewing::clearReviewCache($product_id);

        $normalized_for_import = Normalized::fromLegacyRow(
            array_merge($data, [
                'author'      => $author,
                'source'      => $source,
                'source_type' => $source_type,
                'import_meta' => $import_meta,
            ]),
            $source,
            $source_type
        );
        $normalized_for_import['import_meta']['review_id'] = (int) $review_id;

        $import_model = new ImportRecord();
        $import_model->createFromNormalized($normalized_for_import, $job_id, (int) $review_id);

        $snapshot = Customer::buildReviewJson(
            (int) $review_id,
            (int) $insert_data['rating'],
            sanitize_text_field($data['title'] ?? ''),
            $body,
            $author,
            sanitize_email($data['email'] ?? ''),
            $source
        );

        Customer::insertCsvImportRow(
            $product_id,
            Matcher::productDataForImport($product_id),
            $author,
            sanitize_email($data['email'] ?? ''),
            $import_meta,
            $insert_data['created_at'],
            $snapshot
        );

        return $review_id;
    }
}
