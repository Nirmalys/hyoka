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

use Hyoka\App\Import\Party\Apps;

defined('ABSPATH') || exit;

class Validate
{
    public const CRON_HOOK = 'hyoka_csv_import_batch';

    public const BATCH_SIZE = 25;

    public const JOB_OPTION_PREFIX = 'hyoka_csv_import_';

    protected static function ensureCronHook(): void
    {
        if (! has_action(self::CRON_HOOK, [self::class, 'cronProcessBatch'])) {
            add_action(self::CRON_HOOK, [self::class, 'cronProcessBatch'], 10, 1);
        }
    }

    /**
     *
     * @param array<string, mixed> $payload
     * @return array{ok: bool, message: string, job_id?: string}
     */
    public static function startBackgroundImport(array $payload): array
    {
        $validation = Import::validateImportPayload($payload);
        if (empty($validation['ok'])) {
            return $validation;
        }

        $parsed = Import::parsePayload($payload);
        if (empty($parsed['ok'])) {
            return $parsed;
        }

        $job_id = wp_generate_uuid4();
        $job    = [
            'id'                => $job_id,
            'status'            => 'processing',
            'total'             => count($parsed['rows']),
            'offset'            => 0,
            'imported'          => 0,
            'failed'            => 0,
            'errors'            => [],
            'column_map'        => $parsed['column_map'],
            'product_match'     => $parsed['product_match'],
            'product_mappings'  => $parsed['product_mappings'],
            'rows'              => $parsed['rows'],
            'import_source'     => $parsed['import_source'] ?? 'csv',
            'started_at'        => time(),
            'completed_at'      => null,
        ];

        self::ensureCronHook();
        self::saveJob($job_id, $job);
        wp_schedule_single_event(time() + 1, self::CRON_HOOK, [$job_id]);

        return [
            'ok'      => true,
            'message' => __('Import started. Reviews will appear as Pending for admin approval.', 'hyoka-product-reviews'),
            'job_id'  => $job_id,
            'total'   => $job['total'],
        ];
    }

    public static function processBatch(string $job_id): void
    {
        $job_id = sanitize_text_field($job_id);
        if ($job_id === '') {
            return;
        }

        $job = self::getJob($job_id);
        if ($job === null || ($job['status'] ?? '') !== 'processing') {
            return;
        }

        $column_map       = $job['column_map'];
        $product_match    = $job['product_match'];
        $product_mappings = $job['product_mappings'];
        $rows             = $job['rows'];
        $offset           = (int) ($job['offset'] ?? 0);
        $total            = (int) ($job['total'] ?? 0);
        $match_col        = isset($product_match['column']) ? (int) $product_match['column'] : -1;
        $importer         = Apps::resolve((string) ($job['import_source'] ?? 'csv'));

        $end = min($offset + self::BATCH_SIZE, $total);
        for ($index = $offset; $index < $end; $index++) {
            if (! isset($rows[$index]) || ! is_array($rows[$index])) {
                ++$job['failed'];
                continue;
            }

            $row        = $rows[$index];
            $parsed     = Import::normalizeImportRow($importer, $row, $column_map, $product_match, $product_mappings, $match_col);
            $normalized = $parsed['normalized'];
            $row_errors = $parsed['errors'];
            if ($row_errors !== []) {
                ++$job['failed'];
                $job['errors'][$index] = $row_errors;
                continue;
            }

            $review_id = $importer->insertReview($normalized, $job_id);
            if ($review_id) {
                ++$job['imported'];
            } else {
                ++$job['failed'];
                $job['errors'][$index] = [__('Could not save review.', 'hyoka-product-reviews')];
            }
        }

        $job['offset'] = $end;
        if ($end >= $total) {
            $job['status']       = 'completed';
            $job['completed_at'] = time();
            self::deleteJob($job_id);
            self::saveJob($job_id, $job, 3600);
        } else {
            self::ensureCronHook();
            self::saveJob($job_id, $job);
            wp_schedule_single_event(time() + 5, self::CRON_HOOK, [$job_id]);
        }
    }

    /**
     * @param mixed $job_id
     */
    public static function cronProcessBatch($job_id): void
    {
        if (! is_string($job_id)) {
            return;
        }
        self::processBatch(sanitize_text_field($job_id));
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function getJobStatus(string $job_id): ?array
    {
        $job_id = sanitize_text_field($job_id);
        if ($job_id === '') {
            return null;
        }

        $job = self::getJob($job_id);
        if ($job === null) {
            return null;
        }

        if (($job['status'] ?? '') === 'processing' && (int) ($job['offset'] ?? 0) < (int) ($job['total'] ?? 0)) {
            self::processBatch($job_id);
            $job = self::getJob($job_id);
        }

        if ($job === null) {
            return null;
        }

        $total     = max(1, (int) ($job['total'] ?? 1));
        $processed = min((int) ($job['offset'] ?? 0), $total);
        $percent   = (int) floor(($processed / $total) * 100);

        return [
            'job_id'    => $job_id,
            'status'    => $job['status'] ?? 'unknown',
            'total'     => (int) ($job['total'] ?? 0),
            'processed' => $processed,
            'imported'  => (int) ($job['imported'] ?? 0),
            'failed'    => (int) ($job['failed'] ?? 0),
            'percent'   => $job['status'] === 'completed' ? 100 : $percent,
            'errors'    => $job['errors'] ?? [],
            'message'   => self::statusMessage($job),
        ];
    }

    /**
     * @param array<string, mixed> $job
     */
    protected static function statusMessage(array $job): string
    {
        if (($job['status'] ?? '') === 'completed') {
            return sprintf(
                /* translators: 1: imported, 2: failed */
                __('Import complete. %1$d reviews are pending approval (%2$d skipped). Open Reviews to approve them for widgets.', 'hyoka-product-reviews'),
                (int) ($job['imported'] ?? 0),
                (int) ($job['failed'] ?? 0)
            );
        }

        return sprintf(
            /* translators: 1: processed, 2: total */
            __('Importing… %1$d of %2$d rows processed.', 'hyoka-product-reviews'),
            min((int) ($job['offset'] ?? 0), (int) ($job['total'] ?? 0)),
            (int) ($job['total'] ?? 0)
        );
    }

    /**
     * @param array<string, mixed> $job
     */
    protected static function saveJob(string $job_id, array $job, int $ttl = 86400): void
    {
        set_transient(self::JOB_OPTION_PREFIX . $job_id, $job, $ttl);
    }

    /**
     * @return array<string, mixed>|null
     */
    protected static function getJob(string $job_id): ?array
    {
        $job = get_transient(self::JOB_OPTION_PREFIX . $job_id);
        return is_array($job) ? $job : null;
    }

    protected static function deleteJob(string $job_id): void
    {
        delete_transient(self::JOB_OPTION_PREFIX . $job_id);
    }
}
