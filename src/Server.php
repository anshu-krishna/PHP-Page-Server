<?php
namespace KPS;

use Krishna\Utilities\JSON;

final class Server {
	use \Krishna\Utilities\StaticOnlyTrait;

	private static array $request = [ "path" => null, "query" => null ];
	private static ?object $flags = null;

	private static function json_encode_for_html(mixed $object, bool $pretty = false) {
		return htmlspecialchars(
			string: JSON::encode($object, $pretty),
			encoding: 'UTF-8',
			flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
		);
	}

	private static function __echo_error__(mixed $value) {
		echo '<!-- Error: ', (
			ServerConfig::$dev_mode
			? static::json_encode_for_html($value, ServerConfig::$pretty_debug)
			: 'Message redacted'
		) , ' -->';
	}

	public static function echo_debug(mixed $value, bool $use_print_r = false) {
		if(ServerConfig::$dev_mode) {
			echo '<!-- Debug: ', (
				$use_print_r
				? print_r($value, true)
				: static::json_encode_for_html($value, ServerConfig::$pretty_debug)
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
		if(static::$flags !== null) { return; }
		
		/* Init flags */
		static::$flags = new \stdClass();
		// static::$flags->error = false;

		/* Setup Error Handling */
		\error_reporting(0);
		\set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline) {
			$dump = ['at' => "File: {$errfile}; Line: {$errline}", 'msg' => $errstr];
			if(ServerConfig::$dump_trace_on_error) {
				$dump['trace'] = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
			}
			static::__echo_error__($dump);
			error_clear_last();
		}, E_ALL | E_STRICT);
		\register_shutdown_function(function () {
			$error = error_get_last();
			if($error !== null) {
				$dump = ['at' => "File: {$error['file']}; Line: {$error['line']}", 'msg' => $error['message']];
				if(ServerConfig::$dump_trace_on_error) {
					$dump['trace'] = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
				}
				static::__echo_error__($dump);
			}
		});
		\set_exception_handler(function(\Throwable $exception) {
			$class = get_class($exception);
			$dump = ['at' => "File: {$exception->getFile()}; Line: {$exception->getLine()}", 'msg' => "Uncatched [{$class}]: {$exception->getMessage()}"];
			if(ServerConfig::$dump_trace_on_error) {
				$dump['trace'] = $exception->getTrace();
			}
			static::__echo_error__($dump);
		});

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
	}

	public static function execute() {
		if(static::$flags === null) {
			static::echo_error('Server not initalised');
			return;
		}
	}
}