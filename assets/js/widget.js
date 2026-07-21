(function($) {
    if (window.hyokaLoaded) return;
    window.hyokaLoaded = true;

    function pageHasHyokaWidgets() {
        return $('.hyoka-root[data-hyoka-widget]:not(.hyoka-root--pending), .HYOKA-review-widget, #HYOKA-video-carousel, #HYOKA-card-carousel, #HYOKA-testimonials-carousel').length > 0;
    }

    function pageHasHyokaMounts() {
        return $('.hyoka-root[data-hyoka-widget]').length > 0;
    }

    function shouldRefreshProductWidgets() {
        return !!(hyokaData && hyokaData.refreshWidgets && hyokaData.product_id);
    }

    function shouldRefreshFooterWidgets() {
        return !!(hyokaData && hyokaData.refreshFooterWidgets);
    }

    function shouldRefreshAnyWidgets() {
        return shouldRefreshProductWidgets() || shouldRefreshFooterWidgets() || pageHasHyokaMounts();
    }

    function findSiteFooterElement() {
        var selectorList = [
            '.elementor-location-footer',
            '[data-elementor-type="footer"]',
            '.footer-widgets',
            '#footer-widgets',
            '#colophon',
            'footer#colophon',
            '.site-footer',
            'footer.site-footer',
            '.site-footer-wrap',
            '.ct-footer',
            '#footer',
            '.footer-main',
            'footer[role="contentinfo"]',
            'footer'
        ];
        var selector = selectorList.join(', ');
        var $matches = $(selector).filter(function() {
            return $(this).closest(selector).not(this).length === 0;
        });
        return $matches.first();
    }

    function insertAboveSiteFooter($stack) {
        if (!$stack || !$stack.length) {
            return;
        }
        var $footer = findSiteFooterElement();
        if ($footer.length) {
            $footer.before($stack);
            return;
        }
        var $main = $('main, #main, .site-main, #primary').last();
        if ($main.length) {
            $main.after($stack);
            return;
        }
        $('body').append($stack);
    }

    function relocateFooterWidgetStack() {
        var $stack = $('.hyoka-footer-widgets-stack[data-hyoka-auto="1"]').first();
        if (!$stack.length) {
            return;
        }

        var $footer = findSiteFooterElement();
        if (!$footer.length) {
            return;
        }

        if ($stack.closest($footer).length && !$stack.is($footer)) {
            $footer.before($stack);
            return;
        }

        var footerNode = $footer.get(0);
        var stackNode = $stack.get(0);
        if (!footerNode || !stackNode) {
            return;
        }

        if (footerNode.compareDocumentPosition(stackNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
            $footer.before($stack);
            return;
        }

        var $prev = $footer.prev('.hyoka-footer-widgets-stack');
        if (!$prev.length || !$prev.is($stack)) {
            $footer.before($stack);
        }
    }

    function postRest(action, payload) {
        if (!hyokaData || !hyokaData.restUrl || !hyokaData.restNonce || !window.fetch) {
            return Promise.reject(new Error('REST unavailable'));
        }
        var hasReviewInteractions = $('#HYOKA-reviews-list, .HYOKA-like-btn, .HYOKA-modal-overlay').length > 0;
        var threadActions = ['like_review', 'submit_review_reply'];
        var bootstrapActions = ['fetch_product_widgets'];
        var canBootstrapWidgets = shouldRefreshAnyWidgets();
        if (!canBootstrapWidgets
            && bootstrapActions.indexOf(action) === -1
            && !(threadActions.indexOf(action) !== -1 && hasReviewInteractions)) {
            return Promise.reject(new Error('No Hyoka widgets on this page'));
        }
        return fetch(String(hyokaData.restUrl).replace(/\/?$/, '/') + 'frontend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': hyokaData.restNonce
            },
            body: JSON.stringify($.extend({ action: action }, payload || {}))
        }).then(function(r) { return r.json(); });
    }

    function escapeHtml(value) {
        return $('<div/>').text(value == null ? '' : String(value)).html();
    }

    /**
     * Allow only http(s) and relative URLs for href/src attributes.
     */
    function safeUrl(value) {
        var url = String(value || '').trim();
        if (!url || url === '#') {
            return '#';
        }
        if (/^(https?:|\/)/i.test(url) && !/^\s*javascript:/i.test(url)) {
            return escapeHtml(url);
        }
        return '#';
    }

    function toNonNegInt(value, fallback) {
        var n = parseInt(value, 10);
        return isFinite(n) && n >= 0 ? n : (fallback || 0);
    }

    // --- Interaction Helpers ---
    function getLikedReviews() {
        try {
            return JSON.parse(localStorage.getItem('hyoka_liked_reviews') || '[]');
        } catch (e) {
            return [];
        }
    }

    function isReviewLiked(reviewId) {
        var likedReviews = getLikedReviews();
        return likedReviews.indexOf(reviewId) !== -1 || likedReviews.indexOf(parseInt(reviewId, 10)) !== -1;
    }

    function markReviewLiked(reviewId) {
        var likedReviews = getLikedReviews();
        var id = parseInt(reviewId, 10);
        if (likedReviews.indexOf(reviewId) === -1 && likedReviews.indexOf(id) === -1) {
            likedReviews.push(id);
            localStorage.setItem('hyoka_liked_reviews', JSON.stringify(likedReviews));
        }
    }

    function unmarkReviewLiked(reviewId) {
        var id = parseInt(reviewId, 10);
        if (!id) {
            return;
        }
        var likedReviews = getLikedReviews().filter(function(item) {
            return parseInt(item, 10) !== id;
        });
        localStorage.setItem('hyoka_liked_reviews', JSON.stringify(likedReviews));
    }

    var $modalOverlay = $('<div class="HYOKA-modal-overlay">' +
        '<div class="HYOKA-modal-content HYOKA-thread-modal">' +
        '<div class="HYOKA-modal-header">' +
        '<div class="HYOKA-modal-header-text">' +
        '<h3>Discussion</h3>' +
        '<p class="HYOKA-modal-subtitle"></p>' +
        '</div>' +
        '<button type="button" class="HYOKA-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="HYOKA-modal-body">' +
        '<div class="HYOKA-thread-list"></div>' +
        '<form class="HYOKA-reply-form">' +
        '<input type="text" class="HYOKA-reply-author" name="author_name" placeholder="Your name" maxlength="120" />' +
        '<textarea class="HYOKA-reply-content" name="reply_content" placeholder="Write a reply to this review..." maxlength="2000"></textarea>' +
        '<p class="HYOKA-modal-success" role="status"></p>' +
        '<p class="HYOKA-modal-error" role="alert"></p>' +
        '</form>' +
        '</div>' +
        '<div class="HYOKA-modal-footer">' +
        '<button type="button" class="HYOKA-modal-btn is-primary HYOKA-submit-reply">Post reply</button>' +
        '</div></div></div>');

    var activeThreadReviewId = 0;
    var activeThreadRow = null;

    function ensureDiscussionModal() {
        if (!$modalOverlay.length) {
            return false;
        }
        if (!$modalOverlay.parent().length) {
            $('body').append($modalOverlay);
        }
        return true;
    }

    function isValidReply(reply) {
        return reply
            && !Array.isArray(reply)
            && typeof reply === 'object'
            && (String(reply.content || '').trim() !== '' || String(reply.author || '').trim() !== '');
    }

    function normalizeReply(reply, fallbackAuthor, fallbackContent) {
        if (!isValidReply(reply)) {
            return {
                id: '',
                author: fallbackAuthor || 'Customer',
                content: fallbackContent || '',
                date: '',
                pending: false
            };
        }
        return {
            id: reply.id || '',
            author: String(reply.author || fallbackAuthor || 'Customer'),
            content: String(reply.content || fallbackContent || ''),
            date: reply.date || '',
            pending: !!reply.pending,
        };
    }

    function getRowUserReplies($row) {
        var cached = $row.data('hyokaUserReplies');
        if (Array.isArray(cached)) {
            return cached;
        }
        var raw = $row.attr('data-user-replies');
        if (!raw) {
            return [];
        }
        try {
            var parsed = JSON.parse(raw);
            var replies = Array.isArray(parsed) ? parsed.filter(isValidReply) : [];
            $row.data('hyokaUserReplies', replies);
            return replies;
        } catch (e) {
            return [];
        }
    }

    function setRowUserReplies($row, replies) {
        var safe = Array.isArray(replies) ? replies.filter(isValidReply) : [];
        $row.data('hyokaUserReplies', safe);
        $row.attr('data-user-replies', JSON.stringify(safe));
        return safe;
    }

    function renderThreadItems(storeReply, userReplies) {
        var html = '';
        if (storeReply) {
            html += '<div class="HYOKA-thread-item is-store">' +
                '<div class="HYOKA-thread-label">Store reply</div>' +
                '<p>' + escapeHtml(storeReply) + '</p></div>';
        }
        (userReplies || []).forEach(function(reply) {
            if (!isValidReply(reply)) {
                return;
            }
            var pendingBadge = reply.pending
                ? '<span class="HYOKA-thread-pending">Pending approval</span>'
                : '';
            html += '<div class="HYOKA-thread-item' + (reply.pending ? ' is-pending' : '') + '">' +
                '<div class="HYOKA-thread-meta"><strong>' + escapeHtml(reply.author || 'Customer') + '</strong>' +
                (reply.date ? '<span>' + escapeHtml(reply.date) + '</span>' : '') +
                pendingBadge +
                '</div><p>' + escapeHtml(reply.content || '') + '</p></div>';
        });
        if (!storeReply && !(userReplies || []).some(isValidReply)) {
            html += '<p class="HYOKA-thread-empty">No replies yet. Be the first to respond.</p>';
        }
        return html;
    }

    function renderFullThread($row, userReplies, scrollToBottom) {
        scrollToBottom = scrollToBottom !== false;
        var reviewText = $.trim($row.find('> p').first().text()) || '';
        var storeReply = $.trim($row.find('.HYOKA-merchant-reply p').first().text()) || '';

        $modalOverlay.find('.HYOKA-thread-list').html(
            '<div class="HYOKA-thread-item is-review">' +
            '<div class="HYOKA-thread-label">Original review</div>' +
            '<p>' + escapeHtml(reviewText) + '</p></div>' +
            renderThreadItems(storeReply, userReplies)
        );
        var $list = $modalOverlay.find('.HYOKA-thread-list');
        if (scrollToBottom && $list.length && $list[0]) {
            $list[0].scrollTop = $list[0].scrollHeight;
        }
    }

    function openReplyThread($row) {
        if (!$row || !$row.length) {
            return;
        }

        var reviewId = parseInt($row.attr('data-id'), 10);
        if (!reviewId) {
            return;
        }

        if (!ensureDiscussionModal()) {
            return;
        }

        activeThreadReviewId = reviewId;
        activeThreadRow = $row;

        var authorName = $.trim($row.find('.HYOKA-review-author strong').first().text()) || 'Anonymous';
        var reviewText = $.trim($row.find('> p').first().text()) || '';
        var storeReply = $.trim($row.find('.HYOKA-merchant-reply p').first().text()) || '';
        var userReplies = getRowUserReplies($row);

        $modalOverlay.find('.HYOKA-modal-subtitle').text(
            'Anyone can join this discussion — replying to ' + authorName
        );
        renderFullThread($row, userReplies);

        $modalOverlay.find('.HYOKA-reply-author').val('');
        $modalOverlay.find('.HYOKA-reply-content').val('');
        $modalOverlay.find('.HYOKA-modal-error, .HYOKA-modal-success').text('');
        $modalOverlay.addClass('is-active');
        $('body').addClass('HYOKA-modal-open');
    }

    function closeDiscussionModal() {
        $modalOverlay.removeClass('is-active');
        $('body').removeClass('HYOKA-modal-open');
    }

    $(document).on('click', '.HYOKA-modal-overlay', function(e) {
        if ($(e.target).is('.HYOKA-modal-overlay')) {
            closeDiscussionModal();
        }
    });

    $(document).on('click', '.HYOKA-modal-close', function() {
        closeDiscussionModal();
    });

    function uploadMediaFile(file) {
        return new Promise(function(resolve, reject) {
            var formData = new FormData();
            formData.append('_wpnonce',    hyokaData.mediaUploadNonce);
            formData.append('action',      'upload-attachment');
            formData.append('async-upload', file);            
            formData.append('name',         file.name);

            $.ajax({
                url:         hyokaData.ajaxUrl,
                type:        'POST',
                data:        formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    var data = response;
                    
                    // If response is a string, attempt to parse it as JSON
                    if (typeof response === 'string') {
                        try {
                            data = JSON.parse(response);
                        } catch (e) {
                            console.error('Hyoka: Failed to parse upload response', e);
                        }
                    }

                    var success = (data && data.success !== false);
                    var mediaData = (data && data.data) ? data.data : data;

                    if (success && mediaData && mediaData.id) {
                        var type = file.type.indexOf('video') !== -1 ? 'video' : 'image';
                        var uploadedUrl =
                            mediaData.url || mediaData.source_url || mediaData.guid || '';
                        resolve({
                            id:                 mediaData.id,
                            url:                uploadedUrl,
                            type:               type,
                            attachmentId:       mediaData.id,
                            isUserUploaded:     true
                        });
                    } else {
                        var msg = (data && data.data && data.data.message)
                            ? data.data.message
                            : (data && data.message ? data.message : 'Upload failed for ' + file.name);
                        reject(msg);
                    }
                },
                error: function(xhr) {
                    var errorMsg = 'Network error while uploading ' + file.name;
                    if (xhr.status === 413) {
                        errorMsg = 'File too large for server limits.';
                    }
                    reject(errorMsg);
                }
            });
        });
    }

    // initReviewForm
    function initReviewForm($widget) {
        var $form        = $widget.find('.HYOKA-review-form');
        if (!$form.length) return;

        var isStyledForm = $form.hasClass('HYOKA-review-form--styled');
        var $msg         = $widget.find('.HYOKA-form-message');
        var $submitBtn   = $form.find('.HYOKA-submit-btn');
        var $panel       = $widget.find('.HYOKA-inline-review-panel');
        var $openPanel   = $widget.find('.HYOKA-open-review-form');
        var $nextStep    = $form.find('.HYOKA-next-step');
        var $prevStep    = $form.find('.HYOKA-prev-step');
        var $ratingValue = $form.find('.HYOKA-rating-value');
        var $mediaInput  = $form.find('.HYOKA-review-media');
        var uploadedMedia  = [];
        var uploadsPending = 0;
        var maxStep        = 4;
        var restrictTo = 'none';
        var submitBtnLabels = [];

        $submitBtn.each(function() {
            submitBtnLabels.push($(this).text().trim() || 'Submit Review');
        });

        function restoreSubmitButtons() {
            $submitBtn.each(function(i) {
                $(this).prop('disabled', false).text(submitBtnLabels[i] || 'Submit Review');
            });
        }

        function disableSubmitButtons() {
            $submitBtn.prop('disabled', true).text('Submitting…');
        }

        if ($mediaInput.length) {
            var acceptAttr = ($mediaInput.attr('accept') || '').trim();
            if (acceptAttr === 'image/*') {
                restrictTo = 'image';
            } else if (acceptAttr === 'video/*') {
                restrictTo = 'video';
            } else if (acceptAttr && acceptAttr !== 'none') {
                restrictTo = 'all';
            }
        }

        var $skipStep    = $form.find('.HYOKA-skip-step');

        // Step helpers (legacy multi-step wizard only)
        function setStep(step) {
            if (isStyledForm) return;
            $form.find('.HYOKA-review-step').removeClass('is-active');
            $form.find('.HYOKA-review-step[data-step="' + step + '"]').addClass('is-active');
            $prevStep.toggle(step > 1);
            $nextStep.toggle(step < maxStep);
            $submitBtn.toggle(step === maxStep);
            $skipStep.toggle(step === maxStep);
        }

        if (!isStyledForm) {
            $skipStep.on('click', function() {
                $form.find('.HYOKA-store-review').val('');
                $form.trigger('submit');
            });
        }

        function syncSelectedStars() {
            var selected = parseInt($ratingValue.val() || '0', 10);
            $form.find('.HYOKA-star-btn').each(function() {
                var value = parseInt($(this).data('value') || '0', 10);
                $(this).toggleClass('is-active', selected > 0 && value <= selected);
            });
        }

        function getSelectedRating() {
            return parseInt($ratingValue.val() || '0', 10);
        }

        function ratingRequired() {
            return String($ratingValue.attr('data-rating-required') || '1') !== '0';
        }

        function restrictToForInput($input) {
            var acceptAttr = ($input.attr('accept') || '').trim();
            if (acceptAttr === 'image/*') {
                return 'image';
            }
            if (acceptAttr === 'video/*') {
                return 'video';
            }
            if (acceptAttr && acceptAttr !== 'none') {
                return 'all';
            }
            return 'none';
        }

        // Create / find upload status area
        function getUploadStatus() {
            var $status = $form.find('.HYOKA-upload-status').first();
            if (!$status.length) {
                $status = $('<div class="HYOKA-upload-status"></div>');
                $form.find('.HYOKA-form-standard-fields, .HYOKA-styled-form-body').first().append($status);
            }
            return $status;
        }
        $openPanel.on('click', function() {
            uploadedMedia  = [];
            uploadsPending = 0;
            $msg.removeClass('success error is-success is-error').text('');
            $form.find('.HYOKA-upload-status').empty();
            if (isStyledForm) {
                $ratingValue.val(ratingRequired() ? '' : '5');
                syncSelectedStars();
            } else {
                setStep(1);
            }
            $panel.prop('hidden', false);
        });

        $form.on('click', '.HYOKA-star-btn', function() {
            var selectedValue = parseInt($(this).data('value') || '0', 10);
            if (selectedValue < 1) return;
            $ratingValue.val(selectedValue);
            syncSelectedStars();
            $msg.removeClass('error is-error').text('');
        });

        $form.on('change', '.HYOKA-review-media', function() {
            var files = this.files;
            if (!files || !files.length) return;

            var restrictTo = restrictToForInput($(this));
            var $status = getUploadStatus();

            $.each(files, function(i, file) {
                var fileName = file.name.toLowerCase();
                var isVideo = file.type.indexOf('video') !== -1 || fileName.match(/\.(mp4|mov|avi|wmv|flv|webm)$/);
                var isImage = file.type.indexOf('image') !== -1 || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);

                if (restrictTo === 'none') {
                    var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — media uploads are not allowed for this widget.</div>');
                    $status.append($err);
                    return;
                }
                if (restrictTo === 'video' && !isVideo) {
                    var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — only videos are allowed for this widget.</div>');
                    $status.append($err);
                    return;
                }
                if (restrictTo === 'image' && !isImage) {
                    var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — only photos are allowed for this widget.</div>');
                    $status.append($err);
                    return;
                }

                if (isVideo && file.size > 50 * 1024 * 1024) {
                    var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — Video is too large! Maximum allowed size is 50MB.</div>');
                    $status.append($err);
                    return;
                }

                if (isImage) {
                    var imageCount = uploadedMedia.filter(function(m) { return m.type === 'image'; }).length;
                    var pendingImages = $status.find('.HYOKA-upload-pending').length;
                    
                    if (imageCount >= 5) {
                        var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — You can only upload up to 5 photos.</div>');
                        $status.append($err);
                        return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — photo exceeds 5 MB image limit.</div>');
                        $status.append($err);
                        return;
                    }
                }

                if (!isVideo && !isImage) {
                    var $err = $('<div class="HYOKA-upload-item HYOKA-upload-error">' + escapeHtml(file.name) + ' — unsupported file type.</div>');
                    $status.append($err);
                    return;
                }

                if (!hyokaData.mediaUploadNonce) {
                    $status.append(
                        '<div class="HYOKA-upload-item HYOKA-upload-error">Media upload not authorized. Please reload the page.</div>'
                    );
                    return;
                }

                var $item = $(
                    '<div class="HYOKA-upload-item HYOKA-upload-pending">' +
                        ' Uploading ' + escapeHtml(file.name) + '…' +
                    '</div>'
                );
                $status.append($item);
                uploadsPending++;

                uploadMediaFile(file)
                    .then(function(media) {
                        uploadedMedia.push(media);
                        $item
                            .removeClass('HYOKA-upload-pending')
                            .addClass('HYOKA-upload-done')
                            .html(' ' + escapeHtml(file.name));
                    })
                    .catch(function(errMsg) {
                        $item
                            .removeClass('HYOKA-upload-pending')
                            .addClass('HYOKA-upload-error')
                            .html(' ' + escapeHtml(errMsg));
                    })
                    .finally(function() {
                        uploadsPending--;
                    });
            });

            this.value = '';
        });

        if (!isStyledForm) {
            $nextStep.on('click', function() {
                var current = parseInt($form.find('.HYOKA-review-step.is-active').data('step'), 10) || 1;
                if (current === 1 && getSelectedRating() < 1) {
                    $msg.addClass('error is-error').text('Please select your rating.'); return;
                }
                if (current === 2 && !$form.find('.HYOKA-review-content').val()) {
                    $msg.addClass('error is-error').text('Please write your review content.'); return;
                }
                if (current === 3) {
                    if (!$form.find('.HYOKA-author-email').val() || !$form.find('.HYOKA-author-name').val()) {
                        $msg.addClass('error is-error').text('Please fill in your name and email.'); return;
                    }
                }
                $msg.removeClass('error is-error').text('');
                setStep(Math.min(maxStep, current + 1));
            });

            $prevStep.on('click', function() {
                var current = parseInt($form.find('.HYOKA-review-step.is-active').data('step'), 10) || 1;
                setStep(Math.max(1, current - 1));
            });
        }

        $form.on('submit', function(e) {
            e.preventDefault();
            $msg.removeClass('success error is-success is-error').text('');

            if (uploadsPending > 0) {
                $msg.addClass('error is-error').text('Please wait — media is still uploading.');
                return;
            }

            if (isStyledForm) {
                if ($form.find('.HYOKA-star-rating').length && ratingRequired() && getSelectedRating() < 1) {
                    $msg.addClass('error is-error').text('Please select your rating.');
                    return;
                }
                var $contentField = $form.find('.HYOKA-review-content');
                if ($contentField.length && !String($contentField.val() || '').trim()) {
                    $msg.addClass('error is-error').text('Please write your review content.');
                    return;
                }
            }

            disableSubmitButtons();

            var productId = parseInt($form.find('[name="product_id"]').val() || hyokaData.product_id || '0', 10) || 0;

            postRest('submit_review', {
                product_id: productId,
                rating: parseInt($ratingValue.val() || '0', 10) || 0,
                review_title: String($form.find('.HYOKA-review-title').val() || ''),
                review_content: String($form.find('.HYOKA-review-content').val() || ''),
                author_name: String($form.find('.HYOKA-author-name').val() || ''),
                author_email: String($form.find('.HYOKA-author-email').val() || ''),
                review_type: String($form.find('[name=\"review_type\"]').val() || 'review'),
                store_review: String($form.find('.HYOKA-store-review').val() || ''),
                media_json: JSON.stringify(uploadedMedia),
                media_ids: (function() {
                    var ids = [];
                    try {
                        for (var i = 0; i < uploadedMedia.length; i++) {
                            if (uploadedMedia[i] && uploadedMedia[i].attachmentId) {
                                ids.push(parseInt(uploadedMedia[i].attachmentId, 10));
                            }
                        }
                    } catch (e) {}
                    return ids;
                })()
            }).then(function(response) {
                if (response && response.success) {
                    $msg.addClass('success is-success').text((response.data && response.data.message) || 'Thank you for your review!');
                    $form[0].reset();
                    $ratingValue.val('');
                    syncSelectedStars();
                    uploadedMedia  = [];
                    uploadsPending = 0;
                    $form.find('.HYOKA-upload-status').empty();
                    $panel.prop('hidden', true);
                    if (typeof fetchMainReviews === 'function') {
                        fetchMainReviews(1);
                    }
                } else {
                    $msg.addClass('error is-error').text((response && response.data && response.data.message) || 'Something went wrong.');
                }
            }).catch(function() {
                $msg.addClass('error is-error').text('Network error. Please check your connection.');
            }).finally(function() {
                restoreSubmitButtons();
            });
        });

        if (!isStyledForm) {
            setStep(1);
        }
        syncSelectedStars();
    }

    var currentPage = 1;
    var currentRatingFilter = 0;
    var reviewsFetchInFlight = false;

    function normalizeHistogram(histogram) {
        var out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (!histogram) {
            return out;
        }
        if (Array.isArray(histogram)) {
            for (var i = 0; i < histogram.length && i < 5; i++) {
                out[i + 1] = parseInt(histogram[i], 10) || 0;
            }
            return out;
        }
        Object.keys(histogram).forEach(function(key) {
            var star = parseInt(key, 10);
            if (star >= 1 && star <= 5) {
                out[star] = parseInt(histogram[key], 10) || 0;
            }
        });
        return out;
    }

    function syncHistogramFilterUI($widget) {
        if (!$widget || !$widget.length) {
            return;
        }
        $widget.find('.HYOKA-histogram-row').each(function() {
            var star = parseInt($(this).attr('data-star'), 10) || 0;
            $(this).toggleClass('is-active', currentRatingFilter > 0 && star === currentRatingFilter);
        });
    }

    function getReviewsPerPage() {
        return parseInt(hyokaData.reviewsPerPage || '10', 10) || 10;
    }

    function getReviewsProductId() {
        return parseInt(hyokaData.reviewsProductId || '0', 10) || 0;
    }

    function getStatsProductId() {
        if (hyokaData.statsProductId !== undefined && hyokaData.statsProductId !== null) {
            return parseInt(hyokaData.statsProductId, 10) || 0;
        }
        return parseInt(hyokaData.product_id || '0', 10) || 0;
    }

    function hasServerRenderedReviews() {
        var $reviewsList = $('#HYOKA-reviews-list');
        if (!$reviewsList.length) {
            return false;
        }
        return $reviewsList.find('.HYOKA-review-row').length > 0
            || $reviewsList.find('.HYOKA-empty-reviews').length > 0;
    }

    function updateReviewSummaryStats(stats, $widget) {
        if (!stats || !$widget || !$widget.length) {
            return;
        }

        var $summary = $widget.find('.HYOKA-summary-section');
        if (!$summary.length) {
            return;
        }

        var average = Number(stats.average);
        $summary.find('.HYOKA-average-score').text(
            Number.isFinite(average) ? average.toFixed(1) : '0.0'
        );
        $summary.find('.HYOKA-total-count').text('Based on ' + (parseInt(stats.count, 10) || 0) + ' reviews');

        var histogram = normalizeHistogram(stats.histogram);
        var histTotal = 0;
        [1, 2, 3, 4, 5].forEach(function(starNum) {
            histTotal += histogram[starNum] || 0;
        });
        var totalForBars = histTotal > 0 ? histTotal : (parseInt(stats.count, 10) || 0);

        [1, 2, 3, 4, 5].forEach(function(starNum) {
            var count = histogram[starNum] || 0;
            var perc = totalForBars > 0 ? Math.round((count / totalForBars) * 100) : 0;
            var $row = $summary.find('.HYOKA-histogram-row[data-star="' + starNum + '"]');
            $row.find('.HYOKA-bar-fill').css('width', perc + '%');
            $row.find('.HYOKA-count-label').text(count);
        });

        syncHistogramFilterUI($widget);
    }

    function syncReviewsPaginationUI(page, total) {
        var $reviewsList = $('#HYOKA-reviews-list');
        var $widget = $reviewsList.closest('.HYOKA-review-widget');
        var perPage = getReviewsPerPage();

        if (!$widget.length) {
            return;
        }

        $widget.find('.HYOKA-page-info').text('Page ' + page);
        $widget.find('.HYOKA-prev-page').prop('disabled', page <= 1);
        $widget.find('.HYOKA-next-page').prop('disabled', (page * perPage) >= total);
    }

    function histogramHasCounts(histogram) {
        if (!histogram) {
            return false;
        }
        for (var star = 1; star <= 5; star++) {
            if ((histogram[star] || 0) > 0) {
                return true;
            }
        }
        return false;
    }

    function readSummaryStatsFromDom($widget) {
        if (!$widget || !$widget.length) {
            return null;
        }
        var $summary = $widget.find('.HYOKA-summary-section');
        if (!$summary.length) {
            return null;
        }

        var average = parseFloat($summary.find('.HYOKA-average-score').text());
        if (!Number.isFinite(average)) {
            average = 0;
        }

        var countText = $summary.find('.HYOKA-total-count').text() || '';
        var countMatch = countText.match(/(\d[\d,]*)/);
        var count = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;

        var histogram = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        $summary.find('.HYOKA-histogram-row').each(function() {
            var star = parseInt($(this).attr('data-star'), 10) || 0;
            var rowCount = parseInt($(this).find('.HYOKA-count-label').text(), 10) || 0;
            if (star >= 1 && star <= 5) {
                histogram[star] = rowCount;
            }
        });

        return { average: average, count: count, histogram: histogram };
    }

    function refreshSummaryStats($widget) {
        if (!$widget || !$widget.length) {
            return Promise.resolve();
        }

        return postRest('fetch_product_reviews', {
            product_id: getReviewsProductId(),
            stats_product_id: getStatsProductId(),
            page: 1,
            per_page: 1,
            rating: 0
        }).then(function(response) {
            if (response && response.success && response.data && response.data.stats) {
                updateReviewSummaryStats(response.data.stats, $widget);
            }
        }).catch(function() {});
    }

    function initEmbeddedReviews() {
        if (!$('#HYOKA-reviews-list').length) {
            return false;
        }

        var embedded = hyokaData && hyokaData.initialReviews ? hyokaData.initialReviews : null;
        var $widget = $('#HYOKA-reviews-list').closest('.HYOKA-review-widget');
        var domStats = readSummaryStatsFromDom($widget);
        var domHasHistogram = histogramHasCounts(domStats && domStats.histogram);

        if (embedded) {
            currentPage = parseInt(embedded.page || '1', 10) || 1;
            var total = parseInt(embedded.count || '0', 10) || 0;
            var $otherTitle = $('#HYOKA-other-products-title');

            if ($otherTitle.length) {
                $otherTitle.text('Recent Reviews (' + total + ')');
            }

            syncReviewsPaginationUI(currentPage, total);
        }

        if (domHasHistogram) {
            updateReviewSummaryStats(domStats, $widget);
        } else if (embedded && hyokaData.hasEmbeddedReviews && histogramHasCounts(embedded.stats && embedded.stats.histogram)) {
            updateReviewSummaryStats(embedded.stats, $widget);
        } else {
            refreshSummaryStats($widget);
        }

        return hasServerRenderedReviews();
    }

    function fetchMainReviews(page, ratingFilter) {
        page = page || 1;
        if (ratingFilter !== undefined) {
            currentRatingFilter = parseInt(ratingFilter, 10) || 0;
        }
        var $reviewsList = $('#HYOKA-reviews-list');
        var $widget = $reviewsList.closest('.HYOKA-review-widget');
        var $otherTitle  = $('#HYOKA-other-products-title');
        
        if (!$reviewsList.length) return;

        if (reviewsFetchInFlight) {
            return;
        }
        reviewsFetchInFlight = true;
        currentPage = page;

        function handleProductReviewsResponse(response) {
            if (!response || !response.success || !response.data) return;

            var data    = response.data;
            var reviews = data.reviews || [];
            var total   = parseInt(data.count || 0, 10);
            var stats   = data.stats || null;
            var productId = hyokaData.product_id;
            if (typeof data.rating !== 'undefined') {
                currentRatingFilter = parseInt(data.rating, 10) || 0;
            }

                if ($otherTitle.length) {
                    var titleSuffix = currentRatingFilter > 0
                        ? ' (' + total + ' with ' + currentRatingFilter + ' stars)'
                        : ' (' + total + ')';
                    $otherTitle.text('Recent Reviews' + titleSuffix);
                }

                updateReviewSummaryStats(stats, $widget);

                if (!reviews.length) {
                    $reviewsList.html('<p class="HYOKA-empty-reviews">No reviews available yet.</p>');
                    $widget.find('.HYOKA-next-page').prop('disabled', true);
                    return;
                }

                var rows = '';
                reviews.forEach(function(review) {
                    var rating     = Math.max(1, Math.min(5, parseInt(review.rating || 0, 10) || 1));
                    var stars      = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                    var author     = escapeHtml(review.author || 'Anonymous');
                    var reviewDate = escapeHtml(
                        review.date || (review.created_at ? String(review.created_at).split(' ')[0] : '')
                    );
                    var reviewId   = toNonNegInt(review.id, 0);
                    
                    var replyHtml = '';
                    if (review.reply) {
                        replyHtml = '<div class="HYOKA-merchant-reply" style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-left: 3px solid #F59E0B; border-radius: 4px;">' +
                            '<strong style="display: block; font-size: 0.8em; text-transform: uppercase; color: #F59E0B; margin-bottom: 5px;">Store Reply</strong>' +
                            '<p style="margin: 0; font-style: italic; color: #555;">' + escapeHtml(review.reply) + '</p></div>';
                    }

                    var productLinkHtml = '';
                    if (review.product_id && review.product_id != productId && review.product_title) {
                        productLinkHtml = '<div class="HYOKA-review-product-link">' +
                            (review.product_image ? '<img src="' + safeUrl(review.product_image) + '" alt="product" />' : '') +
                            '<div><a href="' + safeUrl(review.product_link || '#') + '">' + escapeHtml(review.product_title) + '</a></div></div>';
                    }

                    var isLiked = isReviewLiked(reviewId);
                    var likedClass = isLiked ? ' is-liked' : '';
                    var likesCount = toNonNegInt(review.likes, 0);
                    var repliesCount = toNonNegInt(review.replies_count, 0);

                    var socialHtml = '<div class="HYOKA-review-actions">' +
                            '<button type="button" class="HYOKA-action-btn HYOKA-like-btn' + likedClass + '" title="Helpful">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                    '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2.83a2 2 0 0 0 1.74-1l.59-1.03a4.01 4.01 0 0 1 7.18 1.91V11.23Z"/>' +
                                '</svg>' +
                                '<span>' + likesCount + '</span>' +
                            '</button>' +
                            '<button type="button" class="HYOKA-action-btn HYOKA-comment-btn" aria-label="Open discussion">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
                                '</svg>' +
                                '<span>' + repliesCount + '</span>' +
                            '</button>' +
                        '</div>';

                    var userRepliesJson = escapeHtml(JSON.stringify(review.user_replies || []));

                    rows += '<article class="HYOKA-review-row" data-id="' + reviewId + '" data-user-replies="' + userRepliesJson + '">' +
                        '<div class="HYOKA-review-stars">' + stars + '</div>' +
                        '<div class="HYOKA-review-author"><span class="HYOKA-avatar">' + author.charAt(0).toUpperCase() + '</span>' +
                        '<div><strong>' + author + '</strong><small>' + reviewDate + '</small></div></div>' +
                        '<p>' + escapeHtml(review.content) + '</p>' +
                        replyHtml +
                        productLinkHtml + 
                        socialHtml + '</article>';
                });

                $reviewsList.html(rows);
                applyPersistentLikes();

                syncReviewsPaginationUI(page, total);
        }

        postRest('fetch_product_reviews', {
            product_id: getReviewsProductId(),
            stats_product_id: getStatsProductId(),
            page: page,
            per_page: getReviewsPerPage(),
            rating: currentRatingFilter > 0 ? currentRatingFilter : 0
        }).then(handleProductReviewsResponse).catch(function() {}).finally(function() {
            reviewsFetchInFlight = false;
        });
    }

    $(document).on('click', '.HYOKA-histogram-row', function() {
        var $row = $(this);
        var star = parseInt($row.attr('data-star'), 10) || 0;
        if (star < 1 || star > 5) {
            return;
        }
        var nextFilter = currentRatingFilter === star ? 0 : star;
        fetchMainReviews(1, nextFilter);
    });

    function scrollToReviewSummary() {
        var $summary = $('.HYOKA-summary-section');
        if (!$summary.length) {
            return;
        }
        $('html, body').animate({
            scrollTop: $summary.offset().top - 100
        }, 500);
    }

    $(document).on('click', '.HYOKA-prev-page', function() {
        if (currentPage > 1) {
            fetchMainReviews(currentPage - 1);
            scrollToReviewSummary();
        }
    });

    $(document).on('click', '.HYOKA-next-page', function() {
        fetchMainReviews(currentPage + 1);
        scrollToReviewSummary();
    });

    function rollbackLike($btn, $count, prevCount, reviewId) {
        $btn.removeClass('is-liked');
        $count.text(prevCount);
        unmarkReviewLiked(reviewId);
    }

    $(document).on('click', '.HYOKA-like-btn', function() {
        var $btn = $(this);
        var reviewId = parseInt($btn.closest('.HYOKA-review-row').attr('data-id'), 10);
        if (!reviewId) return;

        if (isReviewLiked(reviewId)) {
            return;
        }

        var $count = $btn.find('span');
        var prevCount = parseInt($count.text(), 10) || 0;

        $btn.prop('disabled', true);
        $btn.addClass('is-liked');
        $count.text(prevCount + 1);
        markReviewLiked(reviewId);

        postRest('like_review', { review_id: reviewId }).then(function(response) {
            if (response && response.success && response.data && typeof response.data.likes !== 'undefined') {
                $count.text(response.data.likes);
                return;
            }
            rollbackLike($btn, $count, prevCount, reviewId);
        }).catch(function() {
            rollbackLike($btn, $count, prevCount, reviewId);
        }).finally(function() {
            $btn.prop('disabled', false);
        });
    });

    $(document).on('click', '.HYOKA-comment-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openReplyThread($(this).closest('.HYOKA-review-row'));
    });

    $(document).on('click', '.HYOKA-submit-reply', function() {
        if (!activeThreadReviewId || !activeThreadRow) return;

        var $btn = $(this);
        var author = $.trim($modalOverlay.find('.HYOKA-reply-author').val());
        var content = $.trim($modalOverlay.find('.HYOKA-reply-content').val());
        var $error = $modalOverlay.find('.HYOKA-modal-error');

        var $success = $modalOverlay.find('.HYOKA-modal-success');
        $error.text('');
        $success.text('');
        if (!author) {
            $error.text('Please enter your name.');
            return;
        }
        if (!content) {
            $error.text('Please write a reply.');
            return;
        }

        $btn.prop('disabled', true).text('Posting...');

        postRest('submit_review_reply', {
            review_id: activeThreadReviewId,
            author_name: author,
            author_email: (hyokaData && hyokaData.currentUserEmail) ? hyokaData.currentUserEmail : '',
            reply_content: content
        }).then(function(response) {
            var errMsg = (response && response.data && response.data.message) || 'Could not post reply.';
            if (!response || !response.success || !response.data || response.data.ok === false) {
                if (/not found/i.test(errMsg)) {
                    fetchMainReviews(currentPage);
                }
                throw new Error(errMsg);
            }

            var data = response.data;
            var normalizedReply = normalizeReply(data.reply, author, content);

            if (!isValidReply(normalizedReply)) {
                $error.text('Reply saved but could not be displayed. Please refresh the page.');
                $modalOverlay.find('.HYOKA-reply-content').val('');
                return;
            }

            var replies = getRowUserReplies(activeThreadRow).slice();
            replies.push(normalizedReply);
            replies = setRowUserReplies(activeThreadRow, replies);

            if (!normalizedReply.pending) {
                activeThreadRow.find('.HYOKA-comment-btn span').text(
                    typeof data.replies_count === 'number' ? data.replies_count : replies.filter(function(r) { return !r.pending; }).length
                );
            }

            renderFullThread(activeThreadRow, replies);
            $modalOverlay.find('.HYOKA-reply-content').val('');
            $success.text(data.message || (normalizedReply.pending
                ? 'Thanks! Your reply will appear after moderation.'
                : 'Reply posted.'));
        }).catch(function(err) {
            $error.text(err && err.message ? err.message : 'Could not post reply. Please try again.');
        }).finally(function() {
            $btn.prop('disabled', false).text('Post reply');
        });
    });

    function initCarousel(id, isVideo) {
        isVideo = isVideo || false;
        var $carousel = $('#' + id);
        if (!$carousel.length) {
            console.warn('Hyoka: ' + id + ' not found');
            return;
        }

        if (id === 'HYOKA-testimonials-carousel') {
            var layout = ($carousel.data('layout') || '').toString().toLowerCase();
            if (layout === 'grid') {
                return;
            }
        }

        var trackId = isVideo ? 'HYOKA-video-track' : 'HYOKA-card-track';
        var $track  = $carousel.find('#' + trackId + ', .HYOKA-carousel-track').first();
        var $items  = $track.find('.HYOKA-carousel-item');
        var $prev   = $carousel.find('.HYOKA-nav-prev');
        var $next   = $carousel.find('.HYOKA-nav-next');

        if (!$items.length) return;

        var currentIndex = isVideo ? 2 : 0;
        if (currentIndex >= $items.length) currentIndex = 0;

        var autoSlideInterval;

        var isTestimonials = id === 'HYOKA-testimonials-carousel';

        function updateCarousel(instant) {
            var containerWidth = $carousel.find('.HYOKA-carousel-container').width();
            var itemWidth      = isTestimonials
                ? containerWidth
                : ($items.first().outerWidth(true) || 260);
            var offset = isTestimonials
                ? -(currentIndex * itemWidth)
                : (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth);

            $track.css({
                'transform':  'translate3d(' + offset + 'px, 0, 0)',
                'transition': instant ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            });

            if (isVideo) {
                $items.removeClass('is-focused');
                var $activeItem = $items.eq(currentIndex);
                $activeItem.addClass('is-focused');

                $items.find('video').each(function() {
                    var videoEl = this;
                    var $overlay = $(videoEl).siblings('.HYOKA-play-overlay');
                    var playPromise = videoEl.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(function() {
                            $overlay.css('opacity', '0');
                        }).catch(function() {
                            $overlay.css('opacity', '1');
                        });
                    } else {
                        $overlay.css('opacity', videoEl.paused ? '1' : '0');
                    }
                });
            }
        }

        if (isVideo) {
            $carousel.off('click.hyoka').on('click.hyoka', '.HYOKA-video-container', function() {
                var video = $(this).find('video')[0];
                var $overlay = $(this).find('.HYOKA-play-overlay');
                if (video) {
                    if (video.paused) {
                        video.play();
                        $overlay.css('opacity', '0');
                    } else {
                        video.pause();
                        $overlay.css('opacity', '1');
                    }
                }
            });
        }

        function next() { currentIndex = (currentIndex + 1) % $items.length; updateCarousel(); }
        function prev() { currentIndex = (currentIndex - 1 + $items.length) % $items.length; updateCarousel(); }

        function startAutoSlide() { stopAutoSlide(); autoSlideInterval = setInterval(next, 4000); }
        function stopAutoSlide()  { if (autoSlideInterval) clearInterval(autoSlideInterval); }

        $next.off('click').on('click', function() { next(); stopAutoSlide(); });
        $prev.off('click').on('click', function() { prev(); stopAutoSlide(); });
        $carousel.off('mouseenter mouseleave')
            .on('mouseenter', stopAutoSlide)
            .on('mouseleave', startAutoSlide);

        $(window).off('resize.' + id).on('resize.' + id, function() { updateCarousel(true); });

        setTimeout(function() { updateCarousel(true); }, 250);
        startAutoSlide();
    }

    function applyPersistentLikes() {
        $('.HYOKA-review-row').each(function() {
            var id = $(this).data('id');
            if (id && isReviewLiked(id)) {
                $(this).find('.HYOKA-like-btn').addClass('is-liked');
            }
        });
    }

    function hyokaWidgetId($el) {
        return String($el.attr('data-hyoka-widget') || $el.data('hyokaWidget') || '').trim();
    }

    function reconcileWidgetStack($stack, activeIds, widgetsById) {
        if (!$stack || !$stack.length) {
            return false;
        }

        var changed = false;
        var domIds = [];

        $stack.find('.hyoka-root[data-hyoka-widget]').each(function() {
            var $el = $(this);
            var id = hyokaWidgetId($el);
            if (!id) {
                return;
            }
            if (activeIds.indexOf(id) === -1) {
                $el.remove();
                changed = true;
                return;
            }
            domIds.push(id);
        });

        $stack.find('.hyoka-root[data-hyoka-mount="1"]').each(function() {
            var $el = $(this);
            var id = hyokaWidgetId($el);
            if (!id || activeIds.indexOf(id) === -1) {
                $el.remove();
                changed = true;
                return;
            }
            if (widgetsById[id]) {
                $el.replaceWith(widgetsById[id]);
                changed = true;
                if (domIds.indexOf(id) === -1) {
                    domIds.push(id);
                }
            } else {
                $el.remove();
                changed = true;
            }
        });

        activeIds.forEach(function(id) {
            if (domIds.indexOf(id) !== -1 || !widgetsById[id]) {
                return;
            }
            $stack.append(widgetsById[id]);
            changed = true;
        });

        if ($stack.children().length === 0) {
            $stack.remove();
            changed = true;
        }

        return changed;
    }

    /**
     * Load the testimonials carousel via REST and inject it above site footer content.
     */
    function loadFooterTestimonialsWidget() {
        if (!shouldRefreshFooterWidgets()) {
            $('.hyoka-footer-widgets-stack').remove();
            return Promise.resolve(false);
        }

        var footerCatalog = Array.isArray(hyokaData.footer_widgets) && hyokaData.footer_widgets.length
            ? hyokaData.footer_widgets
            : ['testimonials-carousel'];

        return postRest('fetch_product_widgets', {
            product_id: 0,
            widget_ids: footerCatalog
        }).then(function(res) {
            if (!res || !res.success || !res.data) {
                return false;
            }

            var footerActive = res.data.footer_active || [];
            var footerWidgets = res.data.footer_widgets || {};

            $('.hyoka-footer-widgets-stack').remove();

            if (!footerActive.length) {
                hyokaData.active_footer_widgets = [];
                return false;
            }

            var $stack = $('<div class="hyoka-widgets-stack hyoka-footer-widgets-stack" data-hyoka-auto="1" data-hyoka-placement="footer"></div>');
            footerActive.forEach(function(id) {
                if (footerWidgets[id]) {
                    $stack.append(footerWidgets[id]);
                }
            });

            if (!$stack.children().length) {
                return false;
            }

            insertAboveSiteFooter($stack);
            relocateFooterWidgetStack();
            hyokaData.active_footer_widgets = footerActive;
            return true;
        }).catch(function(err) {
            if (window.console && console.warn) {
                console.warn('Hyoka: footer widget load failed', err);
            }
            return false;
        });
    }

    /**
     * Reconcile product-page widget DOM with live activation state (bypasses page cache via REST).
     */
    function refreshProductWidgets() {
        if (!shouldRefreshProductWidgets() && !pageHasHyokaMounts()) {
            return Promise.resolve(false);
        }

        var catalog = Array.isArray(hyokaData.catalog_widgets) && hyokaData.catalog_widgets.length
            ? hyokaData.catalog_widgets
            : [];

        return postRest('fetch_product_widgets', {
            product_id: hyokaData.product_id || 0,
            widget_ids: catalog
        }).then(function(res) {
            if (!res || !res.success || !res.data) {
                return false;
            }

            var active = res.data.active || [];
            var widgets = res.data.widgets || {};
            var changed = false;

            $('.hyoka-widgets-stack[data-hyoka-placement!="footer"] .hyoka-root[data-hyoka-widget]').each(function() {
                var $el = $(this);
                var id = hyokaWidgetId($el);
                if (!id || active.indexOf(id) !== -1) {
                    return;
                }
                $el.remove();
                changed = true;
            });

            var $productStack = $('.hyoka-widgets-stack[data-hyoka-auto="1"]').not('[data-hyoka-placement="footer"]').first();
            if ($productStack.length) {
                if (reconcileWidgetStack($productStack, active, widgets)) {
                    changed = true;
                }
            } else if (shouldRefreshProductWidgets()) {
                active.forEach(function(id) {
                    if (!widgets[id]) {
                        return;
                    }
                    $('body').append(
                        $('<div class="hyoka-widgets-stack" data-hyoka-auto="1"></div>').append(widgets[id])
                    );
                    changed = true;
                });
            }

            $('.hyoka-widgets-stack[data-hyoka-auto="1"]:not([data-hyoka-placement="footer"]):empty').remove();

            hyokaData.active_widgets = active;
            return changed;
        }).catch(function(err) {
            if (window.console && console.warn) {
                console.warn('Hyoka: widget refresh failed', err);
            }
            return false;
        });
    }

    function initializeHyokaSystem() {
        $('.HYOKA-review-widget').each(function() {
            initReviewForm($(this));
        });

        if ($('#HYOKA-reviews-list').length) {
            ensureDiscussionModal();
            initEmbeddedReviews();
            applyPersistentLikes();
        }
        setTimeout(function() {
            [
                ['HYOKA-video-carousel', true],
                ['HYOKA-card-carousel', false],
                ['HYOKA-testimonials-carousel', false]
            ].forEach(function(config) {
                if ($('#' + config[0]).length) {
                    initCarousel(config[0], config[1]);
                }
            });
        }, 500);

        // Notify that we are initialized
        window.hyokaInitialized = true;
    }

    /**
     * Conditional Execution and Initialization
     */
    function setup() {
        if (typeof hyokaData === 'undefined') {
            return;
        }

        var runInit = function() {
            loadFooterTestimonialsWidget()
                .then(function() {
                    return refreshProductWidgets();
                })
                .finally(function() {
                    relocateFooterWidgetStack();
                    if (!pageHasHyokaWidgets()) {
                        return;
                    }
                    initializeHyokaSystem();
                });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runInit);
        } else {
            runInit();
        }

        $(window).on('load', function() {
            relocateFooterWidgetStack();
        });
    }

    setup();

})(jQuery);
