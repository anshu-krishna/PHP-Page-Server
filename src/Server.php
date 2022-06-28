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
			? (is_string($value) ? $value : JSON::encode($value, ServerConfig::$pretty_debug, true))
			: 'Message redacted'
		) , ' -->';
	}
	private static function check_dir_path(string &$path) : bool {
		$real = realpath($path);
		if($real === false) {
			return false;
		}
		$path = "{$real}/";
		return true;
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
	public static function echo_error(mixed $msg, ?string $from = null) {
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

		/* Setup ServerConfigs */
		$app_src_path = dirname(getcwd()) . '/src';
		ServerConfig::$views_dir ??= "{$app_src_path}/views";
		if(!static::check_dir_path(ServerConfig::$views_dir)) {
			http_response_code(500);
			static::__echo_error__(["Invalid Views Dir" => ServerConfig::$views_dir]);
			exit;
		}

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
	}
	public static function route(string $pattern, string $view) {}

	public static function render(string $path, array $data = []) {
		$fullpath = ServerConfig::$views_dir . $path;
		ob_start();
		if(is_readable($fullpath)) {
			include $fullpath;
		} elseif(is_readable($path)) {
			include $path;
		} else {
			static::echo_error(['View not found' => $fullpath]);
		}
		return ob_get_clean();
	}

	public static function execute() {
		static::init();

		Debugger::dump(static::$request, 'Request');
		Debugger::dump(ServerConfig::__getStaticProperties__(), 'Config');

		echo static::render('abc.php');
		// echo static::render('xyz.html');
	}
}