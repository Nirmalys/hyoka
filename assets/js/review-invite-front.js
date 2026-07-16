(function ($) {
    'use strict';

    $(function () {
        var cfg = window.hyokaInviteReview || {};
        var $form = $('#hyoka-invite-form');
        var $rating = $('#hyoka-rating');
        var $msg = $('#hyoka-msg');
        var $submit = $form.find('button[type="submit"]');
        var $mediaInput = $form.find('.hyoka-invite-media');
        var ajaxNonce = cfg.nonce || cfg.ajax_nonce || '';
        var restUrlBase = cfg.restUrl || '';
        var restNonce = cfg.restNonce || '';
        var uploadedMedia = [];
        var uploadsPending = 0;

        function applyStarVisual(selected) {
            var n = parseInt(String(selected), 10);
            if (!n || n < 1) {
                n = 0;
            }
            $('#hyoka-stars button').each(function () {
                var btnRating = parseInt(String($(this).data('rating')), 10);
                $(this).toggleClass('is-selected', n > 0 && btnRating <= n);
            });
        }

        function getUploadStatus() {
            var $status = $form.find('.hyoka-invite-upload-status');
            if (!$status.length) {
                $status = $('<div class="hyoka-invite-upload-status" aria-live="polite"></div>');
                $mediaInput.after($status);
            }
            return $status;
        }

        function uploadMediaFile(file) {
            return new Promise(function (resolve, reject) {
                if (!cfg.mediaUploadNonce || !cfg.ajaxUrl) {
                    reject('Media upload not authorized. Please reload the page.');
                    return;
                }

                var formData = new FormData();
                formData.append('_wpnonce', cfg.mediaUploadNonce);
                formData.append('action', 'upload-attachment');
                formData.append('async-upload', file);
                formData.append('name', file.name);

                $.ajax({
                    url: cfg.ajaxUrl,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        var data = response;
                        if (typeof response === 'string') {
                            try {
                                data = JSON.parse(response);
                            } catch (e) {
                                reject('Upload failed for ' + file.name);
                                return;
                            }
                        }

                        var success = data && data.success !== false;
                        var mediaData = data && data.data ? data.data : data;

                        if (success && mediaData && mediaData.id) {
                            var type = file.type.indexOf('video') !== -1 ? 'video' : 'image';
                            var uploadedUrl =
                                mediaData.url || mediaData.source_url || mediaData.guid || '';
                            resolve({
                                id: mediaData.id,
                                url: uploadedUrl,
                                type: type,
                                attachmentId: mediaData.id,
                                isUserUploaded: true,
                            });
                        } else {
                            var msg =
                                data && data.data && data.data.message
                                    ? data.data.message
                                    : 'Upload failed for ' + file.name;
                            reject(msg);
                        }
                    },
                    error: function () {
                        reject('Network error while uploading ' + file.name);
                    },
                });
            });
        }

        applyStarVisual(0);

        $('#hyoka-stars').on('click', 'button', function () {
            var r = $(this).data('rating');
            if (r) {
                $rating.val(String(r));
                applyStarVisual(r);
            }
        });

        $mediaInput.on('change', function () {
            var files = this.files;
            if (!files || !files.length) {
                return;
            }

            var $status = getUploadStatus();

            $.each(files, function (i, file) {
                var $item = $(
                    '<div class="hyoka-invite-upload-item">Uploading ' +
                        $('<span>').text(file.name).html() +
                        '…</div>'
                );
                $status.append($item);
                uploadsPending++;

                uploadMediaFile(file)
                    .then(function (media) {
                        uploadedMedia.push(media);
                        $item.text(file.name + ' — uploaded');
                    })
                    .catch(function (errMsg) {
                        $item.text(file.name + ' — ' + errMsg);
                    })
                    .finally(function () {
                        uploadsPending--;
                    });
            });

            this.value = '';
        });

        $form.on('submit', function (e) {
            e.preventDefault();
            $msg.hide().removeClass('err ok').empty();

            if (uploadsPending > 0) {
                $msg
                    .show()
                    .addClass('err')
                    .text('Please wait — media is still uploading.');
                return;
            }

            var ratingVal = parseInt(String($rating.val() || ''), 10);
            if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
                $msg
                    .show()
                    .addClass('err')
                    .text(
                        (cfg.strings && cfg.strings.pickRating) ||
                            'Please tap the stars to choose your rating.'
                    );
                return;
            }

            var formData = new FormData($form[0]);
            if (ajaxNonce) {
                formData.set('_ajax_nonce', ajaxNonce);
            }
            var action = cfg.action || 'hyoka_submit_review';
            formData.set('action', action);

            var submitLabel = $submit.text();
            $submit.prop('disabled', true);
            if (cfg.strings && cfg.strings.submitting) {
                $submit.text(cfg.strings.submitting);
            }

            if (!restUrlBase || !restNonce || !window.fetch) {
                $msg
                    .show()
                    .addClass('err')
                    .text((cfg.strings && cfg.strings.error) || 'Unable to submit review.');
                $submit.prop('disabled', false).text(submitLabel);
                return;
            }

            var payload = {
                action: 'submit_review',
                product_id:
                    parseInt(String(formData.get('product_id') || cfg.product_id || 0), 10) || 0,
                rating:
                    parseInt(
                        String(formData.get('rating') || formData.get('hyoka_rating') || ''),
                        10
                    ) || ratingVal,
                review_title: String(formData.get('review_title') || ''),
                review_content: String(
                    formData.get('review_content') ||
                        formData.get('review') ||
                        formData.get('content') ||
                        ''
                ),
                author_name: String(formData.get('author_name') || formData.get('name') || ''),
                author_email: String(formData.get('author_email') || formData.get('email') || ''),
                invite_token: String(
                    formData.get('invite_token') || formData.get('hyoka_invite') || ''
                ),
                review_type: String(formData.get('review_type') || 'review'),
                store_review: String(formData.get('store_review') || ''),
                media_json: JSON.stringify(uploadedMedia),
            };

            fetch(restUrlBase.replace(/\/?$/, '/') + 'frontend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': restNonce,
                },
                body: JSON.stringify(payload),
            })
                .then(function (r) {
                    return r.json();
                })
                .then(function (data) {
                    $msg.show();
                    if (data && data.success) {
                        var thanks =
                            (data.data && data.data.message) ||
                            'Thank you! Your review was submitted.';
                        $msg.addClass('ok');
                        $msg.text(thanks);
                        $form.hide();
                        $('.hyoka-invite-product-link').hide();
                        $('.hyoka-invite-intro').hide();
                        $('#hyoka-stars').closest('label, .hyoka-invite-stars').hide();
                    } else {
                        $msg.addClass('err');
                        $msg.text(
                            data && data.data && data.data.message
                                ? data.data.message
                                : (cfg.strings && cfg.strings.error) || 'Error'
                        );
                    }
                })
                .catch(function () {
                    $msg
                        .show()
                        .addClass('err')
                        .text((cfg.strings && cfg.strings.networkError) || 'Network error');
                })
                .finally(function () {
                    if (!$msg.hasClass('ok')) {
                        $submit.prop('disabled', false).text(submitLabel);
                    }
                });
        });
    });
})(jQuery);
