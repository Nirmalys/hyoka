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

use Hyoka\Woocommerce\Email\EmailSender;

defined('ABSPATH') || exit;
class Deactivation
{
    public static function init()
    {
        register_deactivation_hook(HYOKA_PLUGIN_FILE, [self::class, 'deactivate']);
    }

    /**
     * Run plugin deactivation scripts.
     */
    public static function deactivate()
    {
        EmailSender::clearCronSchedule();
    }
}
