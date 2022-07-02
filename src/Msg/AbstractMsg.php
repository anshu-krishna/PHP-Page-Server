<?php
namespace KPS\Msg;

use Krishna\Utilities\JSON;
use Krishna\Utilities\StaticOnlyTrait;

use KPS\Config\Msg as MsgCfg;
use KPS\Lib;
use KPS\Server;

abstract class AbstractMsg {
	use StaticOnlyTrait;
	protected static function create_msg(mixed $msg, MsgCfg $cfg) : string {
		$cfg ??= Server::$CFG->msg;
		if(!is_string($msg)) {
			$msg = $cfg->use_print_r ? print_r($msg, true) : JSON::encode($msg, $cfg->prettify);
		}
		if($cfg->as_comment) {
			return str_replace(['<!--', '-->'], ['❮!--', '--❯'], $msg);
		}
		return Lib::html_esc($msg);
	}
}