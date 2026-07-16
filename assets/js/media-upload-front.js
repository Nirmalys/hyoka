(function ($) {
    'use strict';

    $(function () {
        var cfg = window.hyokaMediaUpload || {};
        var $form = $('#hyoka-media-form');
        var $input = $('#hyoka-media-input');
        var $msg = $('#hyoka-media-msg');
        var $submit = $form.find('button[type="submit"]');
        var $status = $('.hyoka-media-upload-status');
        var uploadsPending = 0;

        if (!$form.length || !$input.length) {
            return;
        }

        $form.on('submit', function (event) {
            event.preventDefault();

            var files = $input[0].files;
            if (!files || !files.length) {
                $msg.removeClass('success').addClass('error').text(cfg.strings.pickFile || 'Please choose a file.');
                return;
            }

            $msg.removeClass('error success').text('');
            $submit.prop('disabled', true);

            var hadError = false;
            uploadsPending = files.length;

            $.each(files, function (i, file) {
                var $item = $(
                    '<div class="hyoka-media-upload-item">' +
                        (cfg.strings.uploading || 'Uploading…') +
                        ' ' +
                        $('<span>').text(file.name).html() +
                        '</div>'
                );
                $status.append($item);

                var formData = new FormData();
                formData.append('review_id', String(cfg.reviewId || 0));
                formData.append('media_token', cfg.mediaToken || '');
                formData.append('media_nonce', cfg.mediaNonce || '');
                formData.append('review_media', file);

                $.ajax({
                    url: cfg.uploadUrl || window.location.href,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                })
                    .done(function (response) {
                        if (response && response.success) {
                            $item.addClass('is-success').text(
                                file.name + ' — ' + ((response.data && response.data.message) || cfg.strings.success)
                            );
                        } else {
                            hadError = true;
                            var errMsg =
                                (response && response.data && response.data.message) ||
                                cfg.strings.error ||
                                'Upload failed.';
                            $item.addClass('is-error').text(file.name + ' — ' + errMsg);
                        }
                    })
                    .fail(function () {
                        hadError = true;
                        $item.addClass('is-error').text(
                            file.name + ' — ' + (cfg.strings.networkError || 'Network error.')
                        );
                    })
                    .always(function () {
                        uploadsPending -= 1;
                        if (uploadsPending <= 0) {
                            $input.val('');
                            if (!hadError) {
                                $msg.addClass('success').text(cfg.strings.success || 'Uploaded successfully.');
                                $form.hide();
                                $('.hyoka-media-product-link').hide();
                                $('.hyoka-media-intro').hide();
                                $status.addClass('is-complete');
                            } else {
                                $submit.prop('disabled', false);
                            }
                        }
                    });
            });
        });
    });
})(jQuery);
