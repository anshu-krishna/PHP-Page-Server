<?php
namespace KPS\Msg;

use Krishna\Utilities\ErrorReporting;

use KPS\Server;
use KPS\Config\Msg as MsgCfg;

class Error extends AbstractMsg {
	public static function create(mixed $msg, ?MsgCfg $cfg = null) : string {
		$cfg ??= Server::$CFG->msg;

		if(Server::$CFG->dev_mode) {
			$msg = static::create_msg($msg, $cfg);
		} else { $msg = 'Message redacted'; }
		if($cfg->as_comment) {
			return '<!-- Error: ' . $msg . ' -->';
		}
		return  '<pre style="white-space: pre-wrap;" class="err_msg"><strong style="color:red;font-size:1.2em;">Error:</strong> ' . $msg . '</pre>';
	}
	public static function create_from_trace(string $file, int $line, mixed $msg = null, ?array $other = null, ?MsgCfg $cfg = null) : string {
		$error = [];
		if(ErrorReporting::$compact) {
			$error['at'] = "File: {$file}; Line: {$line}";
		} else {
			$error['file'] = $file;
			$error['line'] = $line;
		}
		if($other !== null) {
			$error = [...$error, ...$other];
		}
		if($msg !== null) {
			$error['msg'] = $msg;
		}
		return static::create($error, $cfg);
	}
}