<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App\Model;

use Hyoka\App\Helper\Wp;

defined('ABSPATH') || exit;
class Meta
{
    /**
     * @return array{email_sent: int, email_sent_at: string, email_send_source: string, reminder_sent: int, reminder_sent_at: string}
     */
    public static function defaultEmailMeta(): array
    {
        return [
            'email_sent'        => 0,
            'email_sent_at'     => '',
            'email_send_source' => '',
            'reminder_sent'     => 0,
            'reminder_sent_at'  => '',
        ];
    }

    /**
     * @return array{email_sent: int, email_sent_at: string, email_send_source: string, reminder_sent: int, reminder_sent_at: string}
     */
    public static function parseEmailJson($email_raw): array
    {
        $defaults = self::defaultEmailMeta();
        if (! is_string($email_raw) || trim($email_raw) === '') {
            return $defaults;
        }
        $tmp = json_decode($email_raw, true);
        if (! is_array($tmp)) {
            return $defaults;
        }

        return [
            'email_sent'        => ! empty($tmp['email_sent']) ? 1 : 0,
            'email_sent_at'     => isset($tmp['email_sent_at']) ? (string) $tmp['email_sent_at'] : '',
            'email_send_source' => isset($tmp['email_send_source']) ? (string) $tmp['email_send_source'] : '',
            'reminder_sent'     => ! empty($tmp['reminder_sent']) ? 1 : 0,
            'reminder_sent_at'  => isset($tmp['reminder_sent_at']) ? (string) $tmp['reminder_sent_at'] : '',
        ];
    }

    /**
     * @param array{email_sent?: int, email_sent_at?: string, email_send_source?: string, reminder_sent?: int, reminder_sent_at?: string} $meta
     */
    public static function encodeEmailJson(array $meta): string
    {
        $merged = array_merge(self::defaultEmailMeta(), $meta);
        $payload = [
            'email_sent'        => ! empty($merged['email_sent']) ? 1 : 0,
            'email_sent_at'     => (string) ($merged['email_sent_at'] ?? ''),
            'email_send_source' => (string) ($merged['email_send_source'] ?? ''),
            'reminder_sent'     => ! empty($merged['reminder_sent']) ? 1 : 0,
            'reminder_sent_at'  => (string) ($merged['reminder_sent_at'] ?? ''),
        ];

        $json = wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($json) ? $json : '';
    }

    /**
     * Flatten email JSON onto a row for callers that expect email_sent, etc.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function hydrateRowWithEmail(array $row): array
    {
        $meta = self::parseEmailJson(isset($row['email']) ? (string) $row['email'] : '');
        $row['email_sent']        = $meta['email_sent'];
        $row['email_sent_at']     = $meta['email_sent_at'];
        $row['email_send_source'] = $meta['email_send_source'];
        $row['reminder_sent']     = $meta['reminder_sent'];
        $row['reminder_sent_at']  = $meta['reminder_sent_at'];

        return $row;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array<string, mixed>>
     */
    public static function hydrateRowsWithEmail(array $rows): array
    {
        return array_map([self::class, 'hydrateRowWithEmail'], $rows);
    }

    /**
     * Merge partial email metadata into hka_customer.email for one row.
     *
     * @param array<string, mixed> $patch
     */
    public static function updateEmailMeta(int $id, array $patch): bool
    {
        if ($id <= 0 || $patch === []) {
            return false;
        }

        global $wpdb;
        $table = Customer::getTableName();
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table comes from Customer::getTableName() ($wpdb->prefix + plugin-owned table); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        $raw = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT email FROM {$table} WHERE id = %d LIMIT 1",
                $id
            )
        );
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $meta = self::parseEmailJson(is_string($raw) ? $raw : '');
        $meta = array_merge($meta, $patch);

        return Customer::updateRow(
            $id,
            [
                'email'      => self::encodeEmailJson($meta),
                'updated_at' => current_time('mysql', true),
            ]
        );
    }

    /**
     * Decode hka_customer.invite JSON: token_hash, expires_at, consumed_at.
     *
     * @return array{token_hash: string, expires_at: string, consumed_at: string, invite_plain: string}
     */
    public static function parseInviteJson($invite_raw): array
    {
        $tmp = Wp::decodeJsonColumn($invite_raw, []);

        return [
            'token_hash'   => isset($tmp['token_hash']) && $tmp['token_hash'] !== null ? (string) $tmp['token_hash'] : '',
            'expires_at'   => isset($tmp['expires_at']) && $tmp['expires_at'] !== null ? (string) $tmp['expires_at'] : '',
            'consumed_at'  => isset($tmp['consumed_at']) && $tmp['consumed_at'] !== null ? (string) $tmp['consumed_at'] : '',
            'invite_plain' => isset($tmp['invite_plain']) && $tmp['invite_plain'] !== null ? (string) $tmp['invite_plain'] : '',
        ];
    }

    public static function saveInviteOnCustomer(int $row_id, string $token_hash, string $expires_at_gmt, string $plain_token = ''): bool
    {
        if ($row_id <= 0 || $token_hash === '') {
            return false;
        }
        global $wpdb;
        $now = current_time('mysql', true);

        $payload = [
            'token_hash'  => $token_hash,
            'expires_at'  => $expires_at_gmt,
            'consumed_at' => null,
        ];
        if ($plain_token !== '') {
            $payload['invite_plain'] = $plain_token;
        }

        $invite = wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($invite === false) {
            return false;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Direct $wpdb->update() on the plugin-owned custom table; no WordPress API equivalent.
        $result = $wpdb->update(
            Customer::getTableName(),
            [
                'invite'     => $invite,
                'updated_at' => $now,
            ],
            ['id' => $row_id],
            ['%s', '%s'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function getCustomerByInviteHash(string $token_hash): ?array
    {
        $now_gmt = gmdate('Y-m-d H:i:s');

        return self::findCustomerRowByInviteField(
            'token_hash',
            $token_hash,
            [$now_gmt],
            static function (array $inv) use ($token_hash, $now_gmt): bool {
                return $inv['token_hash'] === $token_hash
                    && $inv['expires_at'] !== ''
                    && $inv['expires_at'] > $now_gmt
                    && $inv['consumed_at'] === '';
            }
        );
    }

    /**
     * Find a customer row by invite token hash (ignores expiry; used to detect expired links).
     *
     * @return array<string, mixed>|null
     */
    public static function getCustomerRowByInviteHash(string $token_hash): ?array
    {
        return self::findCustomerRowByInviteField(
            'token_hash',
            $token_hash,
            [],
            static function (array $inv) use ($token_hash): bool {
                return $inv['token_hash'] === $token_hash;
            }
        );
    }

    /**
     * Find a customer row by the plain invite token stored in invite JSON.
     *
     * @return array<string, mixed>|null
     */
    public static function getCustomerRowByInvitePlain(string $plain_token): ?array
    {
        $plain_token = trim($plain_token);

        return self::findCustomerRowByInviteField(
            'invite_plain',
            $plain_token,
            [],
            static function (array $inv) use ($plain_token): bool {
                return $inv['invite_plain'] === $plain_token;
            }
        );
    }

    /**
     * @param 'token_hash'|'invite_plain' $json_field
     * @param array<int, scalar>          $extra_args
     * @param callable(array<string, string>):bool $matches_invite
     * @return array<string, mixed>|null
     */
    private static function findCustomerRowByInviteField(
        string $json_field,
        string $value,
        array $extra_args,
        callable $matches_invite
    ): ?array {
        if ($value === '' || ! in_array($json_field, ['token_hash', 'invite_plain'], true)) {
            return null;
        }

        global $wpdb;

        $table = Customer::getTableName();
        // phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table is generated by Customer::getTableName() using $wpdb->prefix and a fixed plugin table name; Customer::CUSTOMER_COLUMNS is a fixed class constant (not user input); SQL values are parameterized with $wpdb->prepare(); custom tables require direct database queries.
        if ($json_field === 'token_hash' && $extra_args !== []) {
            $row = $wpdb->get_row(
                $wpdb->prepare(
                    'SELECT ' . Customer::CUSTOMER_COLUMNS . " FROM {$table}
                 WHERE invite IS NOT NULL AND invite != ''
                   AND JSON_VALID(invite)
                   AND JSON_UNQUOTE(JSON_EXTRACT(invite, '$.token_hash')) = %s
                   AND JSON_UNQUOTE(JSON_EXTRACT(invite, '$.expires_at')) > %s
                   AND JSON_EXTRACT(invite, '$.consumed_at') IS NULL
                 LIMIT 1",
                    $value,
                    $extra_args[0]
                ),
                ARRAY_A
            );
        } elseif ($json_field === 'token_hash') {
            $row = $wpdb->get_row(
                $wpdb->prepare(
                    'SELECT ' . Customer::CUSTOMER_COLUMNS . " FROM {$table}
                 WHERE invite IS NOT NULL AND invite != ''
                   AND JSON_VALID(invite)
                   AND JSON_UNQUOTE(JSON_EXTRACT(invite, '$.token_hash')) = %s
                 LIMIT 1",
                    $value
                ),
                ARRAY_A
            );
        } else {
            $row = $wpdb->get_row(
                $wpdb->prepare(
                    'SELECT ' . Customer::CUSTOMER_COLUMNS . " FROM {$table}
                 WHERE invite IS NOT NULL AND invite != ''
                   AND JSON_VALID(invite)
                   AND JSON_UNQUOTE(JSON_EXTRACT(invite, '$.invite_plain')) = %s
                 LIMIT 1",
                    $value
                ),
                ARRAY_A
            );
        }

        $matched = null;
        if (is_array($row)) {
            $inv = self::parseInviteJson($row['invite'] ?? '');
            if ($matches_invite($inv)) {
                $matched = self::hydrateRowWithEmail($row);
            }
        }

        if ($matched === null) {
            $like_field = $json_field === 'token_hash' ? 'token_hash' : 'invite_plain';
            $like       = '%"' . $like_field . '":"' . $wpdb->esc_like($value) . '"%';
            $candidates = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT ' . Customer::CUSTOMER_COLUMNS . " FROM {$table}
                 WHERE invite IS NOT NULL AND invite LIKE %s
                 LIMIT 30",
                    $like
                ),
                ARRAY_A
            );

            if (is_array($candidates)) {
                foreach ($candidates as $cand) {
                    $inv = self::parseInviteJson($cand['invite'] ?? '');
                    if ($matches_invite($inv)) {
                        $matched = self::hydrateRowWithEmail($cand);
                        break;
                    }
                }
            }
        }
        // phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return $matched;
    }

    /**
     * Mark an invite as used while keeping token fields so the link can be resolved later.
     */
    public static function markInviteConsumed(int $row_id): bool
    {
        if ($row_id <= 0) {
            return false;
        }

        $row = Customer::getCustomerRow($row_id);
        if ($row === null) {
            return false;
        }

        $inv = self::parseInviteJson($row['invite'] ?? '');
        if ($inv['token_hash'] === '' && $inv['invite_plain'] === '') {
            return true;
        }
        if ($inv['consumed_at'] !== '') {
            return true;
        }

        global $wpdb;
        $now = current_time('mysql', true);

        $invite = wp_json_encode(
            [
                'token_hash'   => $inv['token_hash'] !== '' ? $inv['token_hash'] : null,
                'invite_plain' => $inv['invite_plain'] !== '' ? $inv['invite_plain'] : null,
                'expires_at'   => $now,
                'consumed_at'  => $now,
            ],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        if ($invite === false) {
            return false;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Direct $wpdb->update() on the plugin-owned custom table; no WordPress API equivalent.
        $result = $wpdb->update(
            Customer::getTableName(),
            [
                'invite'     => $invite,
                'updated_at' => $now,
            ],
            ['id' => $row_id],
            ['%s', '%s'],
            ['%d']
        );

        if ($result === false) {
            return false;
        }

        self::updateEmailMeta(
            $row_id,
            [
                'reminder_sent'    => 1,
                'reminder_sent_at' => $now,
            ]
        );

        return true;
    }

    public static function markCustomerEmailSent(int $id, ?string $send_source = null): bool
    {
        $now   = current_time('mysql', true);
        $patch = [
            'email_sent'    => 1,
            'email_sent_at' => $now,
        ];

        $allowed_sources = ['automation', 'manual'];
        if ($send_source !== null && in_array($send_source, $allowed_sources, true)) {
            $patch['email_send_source'] = $send_source;
        }

        return self::updateEmailMeta($id, $patch);
    }

    public static function markReminderSent(int $id): bool
    {
        return self::updateEmailMeta(
            $id,
            [
                'reminder_sent'    => 1,
                'reminder_sent_at' => current_time('mysql', true),
            ]
        );
    }

    /**
     * @param mixed $raw
     * @return array<int, array<string, mixed>>
     */
    public static function normalizeMediaItems($raw): array
    {
        $media_data = [];
        if (! is_array($raw)) {
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                $raw     = is_array($decoded) ? $decoded : [];
            } else {
                return [];
            }
        }

        foreach ($raw as $item) {
            if (! is_array($item)) {
                continue;
            }
            $attachment_id = isset($item['attachmentId'])
                ? absint($item['attachmentId'])
                : (isset($item['id']) ? absint($item['id']) : 0);

            if ($attachment_id <= 0) {
                continue;
            }

            $mime = get_post_mime_type($attachment_id);
            if (! is_string($mime) || $mime === '') {
                continue;
            }

            $is_video = strpos($mime, 'video/') === 0;
            $is_image = strpos($mime, 'image/') === 0;
            if (! $is_video && ! $is_image) {
                continue;
            }

            $url = wp_get_attachment_url($attachment_id);
            if (! $url) {
                continue;
            }

            $media_data[] = [
                'id'             => $attachment_id,
                'url'            => esc_url_raw(wp_unslash($url)),
                'type'           => $is_video ? 'video' : 'image',
                'attachmentId'   => $attachment_id,
                'isUserUploaded' => true,
            ];
        }

        return $media_data;
    }

    /**
     * @param array<string, mixed> $params
     * @return array<int, array<string, mixed>>
     */
    public static function getMediaFromParams(array $params = []): array
    {
        if (isset($params['media_json'])) {
            return self::normalizeMediaItems($params['media_json']);
        }

        return [];
    }

    /**
     * Read review media from the current request ($_POST media_json and/or $_FILES).
     *
     * Caller must verify the request nonce at the AJAX/REST entry point before calling.
     * This helper only sanitizes, validates, and normalizes upload data — it does not authorize.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getMediaFromPost(): array
    {
        // phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce verified by caller; $_FILES tmp_name is a PHP upload path validated via is_uploaded_file() / wp_check_filetype_and_ext().
        $media_json = '';
        if (isset($_POST['media_json']) && is_scalar($_POST['media_json'])) {
            $media_json = sanitize_textarea_field(wp_unslash((string) $_POST['media_json']));
        }
        $media_data = $media_json !== '' ? self::normalizeMediaItems($media_json) : [];

        if (
            ! empty($_FILES['review_media'])
            && is_array($_FILES['review_media'])
            && isset($_FILES['review_media']['name'])
            && is_array($_FILES['review_media']['name'])
        ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';

            foreach (array_keys($_FILES['review_media']['name']) as $key) {
                $name = isset($_FILES['review_media']['name'][$key])
                    ? sanitize_file_name(wp_unslash((string) $_FILES['review_media']['name'][$key]))
                    : '';
                if ($name === '') {
                    continue;
                }

                $error = isset($_FILES['review_media']['error'][$key])
                    ? absint($_FILES['review_media']['error'][$key])
                    : UPLOAD_ERR_NO_FILE;
                if ($error !== UPLOAD_ERR_OK) {
                    continue;
                }

                $tmp_name = isset($_FILES['review_media']['tmp_name'][$key])
                    ? wp_unslash((string) $_FILES['review_media']['tmp_name'][$key])
                    : '';
                $size = isset($_FILES['review_media']['size'][$key])
                    ? absint($_FILES['review_media']['size'][$key])
                    : 0;

                if ($tmp_name === '' || ! is_uploaded_file($tmp_name)) {
                    continue;
                }

                // Early type check via WordPress (extension + file contents), not the client-supplied MIME.
                $wp_filetype = wp_check_filetype_and_ext($tmp_name, $name);
                $type        = ! empty($wp_filetype['type']) ? (string) $wp_filetype['type'] : '';
                if (
                    $type === ''
                    || (strpos($type, 'image/') !== 0 && strpos($type, 'video/') !== 0)
                ) {
                    continue;
                }

                // Prefer WordPress-corrected filename when the extension was remapped.
                if (! empty($wp_filetype['proper_filename'])) {
                    $name = sanitize_file_name((string) $wp_filetype['proper_filename']);
                }

                $file = [
                    'name'     => $name,
                    'type'     => $type,
                    'tmp_name' => $tmp_name,
                    'error'    => $error,
                    'size'     => $size,
                ];

                $_FILES['hyoka_single_upload'] = $file;
                try {
                    $attachment_id = media_handle_upload('hyoka_single_upload', 0);
                } finally {
                    unset($_FILES['hyoka_single_upload']);
                }

                if (is_wp_error($attachment_id)) {
                    continue;
                }

                $mime = get_post_mime_type($attachment_id);
                if (! is_string($mime) || $mime === '') {
                    wp_delete_attachment($attachment_id, true);
                    continue;
                }

                $is_video = strpos($mime, 'video/') === 0;
                $is_image = strpos($mime, 'image/') === 0;
                if (! $is_video && ! $is_image) {
                    wp_delete_attachment($attachment_id, true);
                    continue;
                }

                $url = wp_get_attachment_url($attachment_id);
                if (! is_string($url) || $url === '') {
                    wp_delete_attachment($attachment_id, true);
                    continue;
                }

                $media_data[] = [
                    'id'             => absint($attachment_id),
                    'url'            => esc_url_raw($url),
                    'type'           => $is_video ? 'video' : 'image',
                    'attachmentId'   => absint($attachment_id),
                    'isUserUploaded' => true,
                ];
            }
        }
        // phpcs:enable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

        return $media_data;
    }
}
