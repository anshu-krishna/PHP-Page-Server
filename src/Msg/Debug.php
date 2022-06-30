<?php
namespace KPS\Msg;

use KPS\Config\Msg as MsgCfg;
use KPS\Server;

class Debug extends AbstractMsg {
	public static function create(mixed $msg, ?MsgCfg $cfg = null) : string {
		$cfg ??= Server::$CFG->msg;
		
		$msg = static::create_msg($msg, $cfg);
		if($cfg->as_comment) {
			return '<!-- Debug: ' . $msg . ' -->';
		}
		return  '<pre style="white-space: pre-wrap;" class="debug_msg"><strong style="color:blue;font-size:1.2em;">Debug:</strong> ' . $msg . '</pre>';
	}
}