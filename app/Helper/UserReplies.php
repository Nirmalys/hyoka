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

use Hyoka\App\Model\Review;
use Hyoka\App\Model\UserReply;

defined('ABSPATH') || exit;

class UserReplies
{
    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function settings(array $row): array
    {
        return Review::parseSettingsColumn((string) ($row['settings'] ?? ''));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, array<string, mixed>>
     */
    public static function list(array $row, ?string $status = null): array
    {
        $replies = self::settings($row)['user_replies'] ?? [];

        if (! is_array($replies)) {
            return [];
        }

        return array_values(array_filter($replies, static function ($reply) use ($status) {
            if (! is_array($reply) || trim((string) ($reply['content'] ?? '')) === '') {
                return false;
            }
            if ($status === null) {
                return true;
            }

            return Review::normalizeStatus((string) ($reply['status'] ?? 'pending')) === $status;
        }));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, array<string, mixed>>
     */
    public static function approved(array $row): array
    {
        return self::list($row, 'approved');
    }

    /**
     * @param array<string, mixed> $row
     */
    public static function approvedCount(array $row): int
    {
        return count(self::approved($row));
    }

    /**
     * @param array<string, mixed> $row
     */
    public static function pendingCount(array $row): int
    {
        return count(self::list($row, 'pending'));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, array<string, mixed>>
     */
    public static function pending(array $row): array
    {
        return self::list($row, 'pending');
    }

    /**
     * @param array<int, array<string, mixed>> $replies
     * @return array<int, array<string, mixed>>
     */
    public static function format(array $replies, bool $for_admin = false): array
    {
        return array_values(array_filter(array_map(static function ($reply) use ($for_admin) {
            if (! is_array($reply)) {
                return null;
            }

            $content = trim((string) ($reply['content'] ?? ''));
            if ($content === '') {
                return null;
            }

            $created = (string) ($reply['created_at'] ?? '');
            $status  = Review::normalizeStatus((string) ($reply['status'] ?? 'pending'));
            $item    = [
                'id'      => (string) ($reply['id'] ?? ''),
                'author'  => sanitize_text_field((string) ($reply['author'] ?? 'Anonymous')),
                'content' => $content,
                'date'    => $created !== '' ? gmdate('M d, Y', strtotime($created)) : '',
            ];

            if ($for_admin) {
                $item['status'] = $status;

                return $item;
            }

            $item['pending'] = $status !== 'approved';
            $item['likes']   = max(0, (int) ($reply['likes'] ?? 0));

            return $item;
        }, $replies)));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, array<string, mixed>>
     */
    public static function forAdmin(array $row): array
    {
        return self::format(self::list($row), true);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, array<string, mixed>>
     */
    public static function forStorefront(array $row): array
    {
        return self::format(self::approved($row), false);
    }

    /**
     * @return array{ok: bool, message: string, reply?: array<string, mixed>, replies_count?: int, product_id?: int}
     */
    public static function submit(int $review_id, string $author, string $content, string $email = ''): array
    {
        $review_id = absint($review_id);
        $author    = sanitize_text_field(trim($author));
        $content   = sanitize_textarea_field(trim($content));
        $email     = sanitize_email(trim($email));

        if ($review_id <= 0) {
            return ['ok' => false, 'message' => __('Invalid review.', 'hyoka')];
        }
        if ($author === '') {
            return ['ok' => false, 'message' => __('Please enter your name.', 'hyoka')];
        }
        if ($content === '') {
            return ['ok' => false, 'message' => __('Please write a reply.', 'hyoka')];
        }
        if (mb_strlen($content) > 2000) {
            return ['ok' => false, 'message' => __('Reply is too long.', 'hyoka')];
        }

        $loaded = self::loadReview($review_id);
        if (empty($loaded['ok'])) {
            return $loaded;
        }

        $row = $loaded['row'];
        if (Review::normalizeStatus((string) ($row['status'] ?? '')) !== 'approved') {
            return ['ok' => false, 'message' => __('You can only reply to published reviews.', 'hyoka')];
        }

        $status = Moderation::resolveStatus($content, ['is_user_reply' => true]);
        if ($status === 'spam') {
            return ['ok' => false, 'message' => __('Your reply could not be posted.', 'hyoka')];
        }

        $settings = self::settings($row);
        if (! isset($settings['user_replies']) || ! is_array($settings['user_replies'])) {
            $settings['user_replies'] = [];
        }

        $reply = [
            'id'         => wp_generate_uuid4(),
            'author'     => $author,
            'email'      => $email,
            'content'    => $content,
            'status'     => $status,
            'likes'      => 0,
            'created_at' => current_time('mysql', true),
        ];

        $settings['user_replies'][] = $reply;

        if (! self::write($review_id, $settings)) {
            return ['ok' => false, 'message' => __('Failed to save your reply.', 'hyoka')];
        }

        $row['settings'] = wp_json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (! is_string($row['settings'])) {
            $row['settings'] = '';
        }
        $formatted = self::format([$reply], false)[0] ?? [];

        return [
            'ok'            => true,
            'message'       => $status === 'approved'
                ? __('Reply posted.', 'hyoka')
                : __('Thanks! Your reply will appear after moderation.', 'hyoka'),
            'reply'         => $formatted,
            'replies_count' => self::approvedCount($row),
            'product_id'    => absint($row['product_id'] ?? 0),
        ];
    }

    /**
     * @return array{ok: bool, message: string, product_id?: int}
     */
    public static function updateStatus(int $review_id, string $reply_id, string $status): array
    {
        $review_id = absint($review_id);
        $reply_id  = sanitize_text_field(trim($reply_id));
        $status    = Review::normalizeStatus($status);

        if ($review_id <= 0 || $reply_id === '') {
            return ['ok' => false, 'message' => __('Invalid reply.', 'hyoka')];
        }

        $loaded = self::loadReview($review_id);
        if (empty($loaded['ok'])) {
            return $loaded;
        }

        $settings = self::settings($loaded['row']);
        $replies  = $settings['user_replies'] ?? [];
        if (! is_array($replies) || $replies === []) {
            return ['ok' => false, 'message' => __('Reply not found.', 'hyoka')];
        }

        $found = false;
        foreach ($replies as $index => $reply) {
            if (! is_array($reply) || (string) ($reply['id'] ?? '') !== $reply_id) {
                continue;
            }
            $replies[$index]['status'] = $status;
            $found = true;
            break;
        }

        if (! $found) {
            return ['ok' => false, 'message' => __('Reply not found.', 'hyoka')];
        }

        $settings['user_replies'] = $replies;
        if (! self::write($review_id, $settings)) {
            return ['ok' => false, 'message' => __('Failed to update reply status.', 'hyoka')];
        }

        return [
            'ok'         => true,
            'message'    => __('Reply status updated.', 'hyoka'),
            'product_id' => absint($loaded['row']['product_id'] ?? 0),
        ];
    }

    /**
     * @return array{ok: bool, message: string, row?: array<string, mixed>}
     */
    private static function loadReview(int $review_id): array
    {
        $model = new UserReply();
        $row   = $model->findReviewById($review_id);
        if (! is_array($row)) {
            return ['ok' => false, 'message' => __('Review not found. It may have been removed — please refresh the page.', 'hyoka')];
        }

        $email = (string) ($row['email'] ?? '');
        if (Review::isSystemEmail($email)) {
            return ['ok' => false, 'message' => __('This review cannot receive replies.', 'hyoka')];
        }

        return [
            'ok'  => true,
            'row' => $row,
        ];
    }

    /**
     * @param array<string, mixed> $settings
     */
    private static function write(int $review_id, array $settings): bool
    {
        return (new UserReply())->updateSettings($review_id, $settings);
    }
}
