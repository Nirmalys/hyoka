<?php

/**
 * Hyoka
 *
 * @package   Hyoka
 * @author    Hyoka
 * @license   GPL-2.0-or-later
 * @link      https://hyoka.com
 */

namespace Hyoka\App;

use Hyoka\App\View\Page;
use Hyoka\App\Controller\Ajax;
use Hyoka\App\Controller\Rest\Endpoint;
use Hyoka\Woocommerce\Email\EmailSender;
use Hyoka\Woocommerce\Email\MediaUpload;
use Hyoka\Woocommerce\Email\ReviewInvite;
use Hyoka\Woocommerce\Wooservicer\Wooinit;
use Hyoka\Woocommerce\Product\ProductReview;

defined('ABSPATH') || exit;

class Boot
{
    public static function init()
    {
        Setup::init();
        add_action('plugins_loaded', [self::class, 'onPluginsLoaded']);
    }

    public static function onPluginsLoaded()
    {
        load_plugin_textdomain(
            HYOKA_TEXT_DOMAIN,
            false,
            dirname(plugin_basename(HYOKA_PLUGIN_FILE)) . '/languages'
        );

        if (!Wooinit::isActive()) {
            return;
        }

        if (is_admin()) {
            Page::init();
        }

        Wooinit::init();
        EmailSender::initCron();

        ReviewInvite::init();
        MediaUpload::init();

        Ajax::init();

        add_action('rest_api_init', [Endpoint::class, 'registerRoutes']);

        ProductReview::init();
    }
}
