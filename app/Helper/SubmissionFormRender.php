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

use Hyoka\Woocommerce\Email\EmailSender;

defined('ABSPATH') || exit;

class SubmissionFormRender
{
    /**
     * @param array<string, mixed> $settings
     * @return array<string, bool|string>
     */
    private static function getFormVisibilityFlags(array $settings, string $accept_media = ''): array
    {
        $show_name     = Wp::settingBoolean($settings, 'form_show_name', true);
        $show_email    = Wp::settingBoolean($settings, 'form_show_email', false);
        $show_location = Wp::settingBoolean($settings, 'form_show_location', false);
        $show_title    = Wp::settingBoolean($settings, 'form_show_title', false);
        $show_review   = Wp::settingBoolean($settings, 'form_show_review', true);
        $show_rating   = Wp::settingBoolean($settings, 'form_show_rating', true);
        $allow_photos  = Wp::settingBoolean($settings, 'allow_photos', true);
        $allow_videos  = Wp::settingBoolean($settings, 'allow_videos', true);

        $accept = $accept_media !== '' ? $accept_media : EmailSender::reviewAcceptMedia();
        $photos_enabled = $allow_photos && $accept !== 'video/*' && $accept !== 'none';
        $videos_enabled = $allow_videos && $accept !== 'image/*' && $accept !== 'none';

        return [
            'show_name'        => $show_name,
            'show_email'       => $show_email,
            'show_location'    => $show_location,
            'show_title'       => $show_title,
            'show_review'      => $show_review,
            'show_rating'      => $show_rating,
            'allow_photos'     => $allow_photos,
            'allow_videos'     => $allow_videos,
            'photos_enabled'   => $photos_enabled,
            'videos_enabled'   => $videos_enabled,
            'rating_value'     => $show_rating ? '' : '5',
        ];
    }

    /**
     * @param array<string, mixed> $settings
     */
    public static function renderInlinePanel(array $settings, int $product_id = 0, string $accept_media = 'image/*,video/*', bool $is_store_review = false): string
    {
        if (! $is_store_review && $product_id <= 0) {
            $product_id = (int) get_the_ID();
        } else {
            $product_id = max(0, $product_id);
        }
        $current_user = is_user_logged_in() ? wp_get_current_user() : null;
        $default_name = $current_user instanceof \WP_User ? (string) $current_user->display_name : '';
        $default_email = $current_user instanceof \WP_User ? (string) $current_user->user_email : '';

        $form_title = (string) ($settings['form_title'] ?? __('Write a Review', 'hyoka'));
        if ($form_title === '') {
            $form_title = __('Write a Review', 'hyoka');
        }
        $submit_label = (string) ($settings['submit_button_text'] ?? __('Submit Review', 'hyoka'));
        if ($submit_label === '') {
            $submit_label = __('Submit Review', 'hyoka');
        }

        [
            'show_name'      => $show_name,
            'show_email'     => $show_email,
            'show_location'  => $show_location,
            'show_title'     => $show_title,
            'show_review'    => $show_review,
            'show_rating'    => $show_rating,
            'photos_enabled' => $photos_enabled,
            'videos_enabled' => $videos_enabled,
            'rating_value'   => $rating_value,
        ] = self::getFormVisibilityFlags($settings, $accept_media);

        ob_start();
        ?>
        <div class="HYOKA-inline-review-panel" hidden>
            <form class="HYOKA-review-form HYOKA-review-form--styled" method="post" action="#" enctype="multipart/form-data">
                <input type="hidden" name="action" value="hyoka_submit_review" />
                <input type="hidden" name="product_id" value="<?php echo esc_attr((string) $product_id); ?>" />
                <input type="hidden" name="review_type" value="review" />
                <input type="hidden" class="HYOKA-rating-value" name="rating" value="<?php echo esc_attr($rating_value); ?>" data-rating-required="<?php echo esc_attr($show_rating ? '1' : '0'); ?>" />

                <div class="HYOKA-form-standard">
                    <div class="HYOKA-form-standard-header">
                        <h4 class="HYOKA-form-standard-title"><?php echo esc_html($form_title); ?></h4>
                        <?php if ($show_rating) : ?>
                            <div class="HYOKA-star-rating HYOKA-form-standard-stars" aria-label="<?php esc_attr_e('Your rating', 'hyoka'); ?>">
                                <?php for ($i = 1; $i <= 5; $i++) : ?>
                                    <button type="button" class="HYOKA-star-btn" data-value="<?php echo (int) $i; ?>" aria-label="<?php echo esc_attr(sprintf(/* translators: %d: star count */ __('%d stars', 'hyoka'), $i)); ?>">★</button>
                                <?php endfor; ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="HYOKA-form-standard-fields">
                        <?php if ($show_name) : ?>
                            <div class="HYOKA-form-group">
                                <input type="text" class="HYOKA-author-name" name="author_name" value="<?php echo esc_attr($default_name); ?>" placeholder="<?php esc_attr_e('Your name', 'hyoka'); ?>"<?php if ($default_name === '') { echo ' required'; } ?> />
                            </div>
                        <?php else : ?>
                            <input type="hidden" class="HYOKA-author-name" name="author_name" value="<?php echo esc_attr($default_name); ?>" />
                        <?php endif; ?>

                        <?php if ($show_email) : ?>
                            <div class="HYOKA-form-group">
                                <input type="email" class="HYOKA-author-email" name="author_email" value="<?php echo esc_attr($default_email); ?>" placeholder="<?php esc_attr_e('Your email', 'hyoka'); ?>"<?php if ($default_email === '') { echo ' required'; } ?> />
                            </div>
                        <?php else : ?>
                            <input type="hidden" class="HYOKA-author-email" name="author_email" value="<?php echo esc_attr($default_email); ?>" />
                        <?php endif; ?>

                        <?php if ($show_location) : ?>
                            <div class="HYOKA-form-group">
                                <input type="text" class="HYOKA-review-location" name="review_location" value="" placeholder="<?php esc_attr_e('Your location', 'hyoka'); ?>" />
                            </div>
                        <?php endif; ?>

                        <?php if ($show_title) : ?>
                            <div class="HYOKA-form-group">
                                <input type="text" class="HYOKA-review-title" name="review_title" value="" placeholder="<?php esc_attr_e('Title of your review', 'hyoka'); ?>" />
                            </div>
                        <?php endif; ?>

                        <?php if ($show_review) : ?>
                            <div class="HYOKA-form-group">
                                <textarea class="HYOKA-review-content" name="review_content" rows="4" required placeholder="<?php esc_attr_e('Tell us what you think...', 'hyoka'); ?>"></textarea>
                            </div>
                        <?php endif; ?>

                        <?php if ($photos_enabled || $videos_enabled) : ?>
                            <div class="HYOKA-form-media-grid">
                                <?php if ($photos_enabled) : ?>
                                    <label class="HYOKA-media-upload-card">
                                        <input type="file" class="HYOKA-review-media" name="review_media[]" accept="image/*" multiple>
                                        <span class="HYOKA-media-upload-card-label"><?php esc_html_e('Upload Image', 'hyoka'); ?></span>
                                    </label>
                                <?php endif; ?>
                                <?php if ($videos_enabled) : ?>
                                    <label class="HYOKA-media-upload-card">
                                        <input type="file" class="HYOKA-review-media" name="review_media[]" accept="video/*" multiple>
                                        <span class="HYOKA-media-upload-card-label"><?php esc_html_e('Upload Video', 'hyoka'); ?></span>
                                    </label>
                                <?php endif; ?>
                            </div>
                            <div class="HYOKA-upload-status"></div>
                        <?php endif; ?>

                        <button type="submit" class="HYOKA-submit-button HYOKA-submit-btn HYOKA-styled-submit HYOKA-form-standard-submit">
                            <?php echo esc_html($submit_label); ?>
                        </button>
                    </div>
                </div>

                <div class="HYOKA-form-message"></div>
            </form>
        </div>
        <?php
        return (string) ob_get_clean();
    }

    public static function echoInlinePanelForWidget(int $product_id = 0, string $widget_context = 'product-review'): void
    {
        $settings     = EmailSender::getSettings();
        $accept_media = EmailSender::reviewAcceptMedia($widget_context);
        $is_store     = in_array($widget_context, ['testimonials-carousel', 'site-rating'], true);

        $html = self::renderInlinePanel(
            $settings,
            $is_store ? 0 : $product_id,
            $accept_media,
            $is_store
        );

        echo wp_kses($html, Wp::reviewFormAllowedHtml());
    }

    /**
     * @param array<string, mixed> $settings
     * @param array{name: string, email: string} $customer
     */
    public static function renderInviteFormFields(array $settings, array $customer): void
    {
        $form_subtitle = (string) ($settings['form_subtitle'] ?? '');
        $submit_label = (string) ($settings['submit_button_text'] ?? __('Submit Review', 'hyoka'));
        if ($submit_label === '') {
            $submit_label = __('Submit Review', 'hyoka');
        }

        [
            'show_name'      => $show_name,
            'show_email'     => $show_email,
            'show_location'  => $show_location,
            'show_title'     => $show_title,
            'show_review'    => $show_review,
            'show_rating'    => $show_rating,
            'photos_enabled' => $photos_enabled,
            'videos_enabled' => $videos_enabled,
            'rating_value'   => $rating_value,
        ] = self::getFormVisibilityFlags($settings);

        $customer_name  = (string) ($customer['name'] ?? '');
        $customer_email = (string) ($customer['email'] ?? '');

        if ($form_subtitle !== '') {
            echo '<p class="subtitle">' . esc_html($form_subtitle) . '</p>';
        }

        if ($show_rating) {
            echo '<input type="hidden" id="hyoka-rating" name="rating" value="">';
            echo '<label>' . esc_html__('Your rating', 'hyoka') . '</label>';
            echo '<div class="hyoka-invite-stars" id="hyoka-stars" role="group" aria-label="' . esc_attr__('Rating', 'hyoka') . '">';
            for ($i = 1; $i <= 5; $i++) {
                $star_label = sprintf(/* translators: %d: star rating from 1 to 5. */ __('%d stars', 'hyoka'), $i);
                echo '<button type="button" data-rating="' . (int) $i . '" aria-label="' . esc_attr($star_label) . '">★</button>';
            }
            echo '</div>';
        } else {
            echo '<input type="hidden" id="hyoka-rating" name="rating" value="' . esc_attr($rating_value) . '">';
        }

        if ($show_name) {
            echo '<label>' . esc_html__('Your name', 'hyoka') . '</label>';
            echo '<input name="author_name" value="' . esc_attr($customer_name) . '" required>';
        } else {
            echo '<input type="hidden" name="author_name" value="' . esc_attr($customer_name) . '">';
        }

        if ($show_email) {
            echo '<label>' . esc_html__('Email', 'hyoka') . '</label>';
            echo '<input type="email" name="author_email" value="' . esc_attr($customer_email) . '"';
            if ($customer_email !== '') {
                echo ' readonly';
            }
            echo ' required>';
        } else {
            echo '<input type="hidden" name="author_email" value="' . esc_attr($customer_email) . '">';
        }

        if ($show_location) {
            echo '<label>' . esc_html__('Your location', 'hyoka') . '</label>';
            echo '<input name="review_location" value="" placeholder="' . esc_attr__('Your location', 'hyoka') . '">';
        }

        if ($show_title) {
            echo '<label>' . esc_html__('Title of your review', 'hyoka') . '</label>';
            echo '<input name="review_title" value="" placeholder="' . esc_attr__('Title of your review', 'hyoka') . '">';
        }

        if ($show_review) {
            echo '<label>' . esc_html__('Your review', 'hyoka') . '</label>';
            echo '<textarea name="review_content" rows="5" required placeholder="' . esc_attr__('Tell us what you think...', 'hyoka') . '"></textarea>';
        }

        if ($photos_enabled) {
            echo '<label for="hyoka-invite-media-photos">' . esc_html__('Add Photos (Optional)', 'hyoka') . '</label>';
            echo '<input type="file" id="hyoka-invite-media-photos" class="hyoka-invite-media" name="review_media[]" multiple accept="image/*" style="margin: 10px 0;">';
        }
        if ($videos_enabled) {
            echo '<label for="hyoka-invite-media-videos">' . esc_html__('Add Videos (Optional)', 'hyoka') . '</label>';
            echo '<input type="file" id="hyoka-invite-media-videos" class="hyoka-invite-media" name="review_media[]" multiple accept="video/*" style="margin: 10px 0;">';
        }
        if ($photos_enabled || $videos_enabled) {
            echo '<div class="hyoka-invite-upload-status" aria-live="polite"></div>';
        }

        echo '<div class="hyoka-invite-submit-wrap">';
        echo '<button type="submit" class="hyoka-invite-submit">' . esc_html($submit_label) . '</button>';
        echo '</div>';
    }

    /**
     * Build review-form theme CSS from sanitized settings tokens.
     *
     * Security boundary: every interpolated value is validated before assembly.
     * The returned string is passed directly to wp_add_inline_style().
     *
     * @param array<string, mixed> $settings
     */
    public static function getFormCssVariablesBlock(array $settings): string
    {
        $primary = Wp::sanitizeHexColor((string) ($settings['primary_color'] ?? ''), '#F59E0B');
        $text    = Wp::sanitizeHexColor((string) ($settings['text_color'] ?? ''), '#1D2939');
        $font    = Wp::fontStackCss((string) ($settings['font_family'] ?? 'system'));

        return '.HYOKA-review-form--styled{'
            . '--hyoka-form-primary:' . $primary . ';'
            . '--hyoka-form-text:' . $text . ';'
            . '--hyoka-form-font:' . $font . ';'
            . 'color:' . $text . ';'
            . '}';
    }

    /**
     * Build email invite page theme CSS from sanitized settings tokens.
     *
     * Security boundary: every interpolated value is validated before assembly.
     * The returned string is passed directly to wp_add_inline_style().
     *
     * @param array<string, mixed> $settings
     */
    public static function getEmailPageCssVariablesBlock(array $settings): string
    {
        $primary = Wp::sanitizeHexColor((string) ($settings['primary_color'] ?? ''), '#F59E0B');
        $accent  = Wp::sanitizeHexColor((string) ($settings['accent_color'] ?? ''), '#FDB022');
        $text    = Wp::sanitizeHexColor((string) ($settings['text_color'] ?? ''), '#111827');
        $font    = Wp::fontStackCss((string) ($settings['font_family'] ?? 'system'));

        return 'body{'
            . '--email-bg-color:#F9FAFB;'
            . '--email-primary-color:' . $primary . ';'
            . '--email-accent-color:' . $accent . ';'
            . '--hyoka-form-primary:' . $primary . ';'
            . '--hyoka-form-text:' . $text . ';'
            . 'font-family:' . $font . ';'
            . '}';
    }
}
