<?php
namespace KPS;

use Krishna\Utilities\Debugger;
use Krishna\Utilities\ErrorReporting;
use Krishna\Utilities\JSON;

final class Server {
	use \Krishna\Utilities\StaticOnlyTrait;

	private static array $request = [ "path" => null, "query" => null ];

	private static function __echo_error__(mixed $value) {
		echo '<!-- Error: ', (
			ServerConfig::$dev_mode
			? JSON::encode($value, ServerConfig::$pretty_debug, true)
			: 'Message redacted'
		) , ' -->';
	}

	public static function echo_debug(mixed $value, bool $use_print_r = false) {
		if(ServerConfig::$dev_mode) {
			echo '<!-- Debug: ', (
				$use_print_r
				? print_r($value, true)
				: JSON::encode($value, ServerConfig::$pretty_debug, true)
			), ' -->';
		}
	}
	public static function echo_error(string $msg, ?string $from = null) {
		$trace = Debugger::trace_call_point($from);
		$trace['msg'] = $msg;
		static::__echo_error__($trace);
	}

	public static function init() {
		/* Stop second run */
		if(static::$request['path'] !== null) { return; }

		/* Setup Debugger */
		Debugger::$dumpper_callback = [static::class, 'echo_debug'];
		/* Setup Error Handling */
		ErrorReporting::init(function($data) { static::__echo_error__($data); });

		/* Extract request path */
		static::$request['path'] = rtrim(urldecode($_GET['@_url_@'] ?? ''), '/');
		unset($_GET['@_url_@']);
		if(strcasecmp(static::$request['path'], 'index.php') === 0) {
			static::$request['path'] = [];
		}
		static::$request['path'] = explode('/', static::$request['path']);

		if('' === (static::$request['path'][0] ?? false)) {
			array_shift((static::$request['path']));
		}

		/* Extract request query */
		static::$request['query'] = [];
		$ct = $_SERVER['CONTENT_TYPE'] ?? false;
		if($ct !== false && in_array('application/json', explode(';', $ct))) {
			static::$request['query'] = JSON::decode(file_get_contents('php://input')) ?? [];
		}
		static::$request['query'] = array_merge($_POST, static::$request['query'], $_GET);

		Debugger::dump(static::$request);
		echo $abc;
	}

	public static function execute() {
		static::init();
		echo 1;
	}
}