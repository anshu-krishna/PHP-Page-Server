<?php
namespace KPS;

use Krishna\Utilities\ErrorReporting;
use Krishna\Utilities\Debugger;
use Krishna\Utilities\JSON;

use KPS\Config\Msg as MsgCfg;
use KPS\Config\Server as ServerCfg;

use KPS\Msg\Error as ErrMsg;
use KPS\Msg\Debug as DebugMsg;

final class Server {
	use \Krishna\Utilities\StaticOnlyTrait;

	private static bool $init_flag = false;
	public static ServerCfg $CFG;
	public static array $_VALS = [
		'_URL' => null,
		'_QUERY' => null,
		'_VAL' => []
	];

	public static function echo_debug(mixed $value, ?MsgCfg $cfg = null) {
		if(Server::$CFG->dev_mode) {
			echo DebugMsg::create($value, $cfg ?? Server::$CFG->msg);
		}
	}
	public static function echo_error(
		mixed $msg,
		?string $from = null,
		?MsgCfg $cfg = null
	) {
		$trace = Debugger::trace_call_point($from);
		$trace['msg'] = $msg;
		echo ErrMsg::create($trace, $cfg);
	}

	public static function init(
		?string $views_dir = null,
		?string $routes_dir = null,
		?MsgCfg $msg_config = null,
		bool $dev_mode = false,
		// bool $minify_html = false
	) {
		/* Stop second run */
		if(static::$init_flag) { return; }
		static::$init_flag = true;

		/* Setup Config */
		{
			static::$CFG = new ServerCfg(
				dev_mode: $dev_mode,
				views_dir: $views_dir ?? '',
				routes_dir: $routes_dir ?? '',
				msg: $msg_config ?? new MsgCfg(),
				// minify_html: $minify_html
			);
			$views_path = realpath($views_dir ?? '../src/views');
			if($views_path === false) {
				http_response_code(500);
				echo ErrMsg::create(["Invalid Views Directory" => $views_dir]);
				exit;
			} else {
				static::$CFG->views_dir = $views_path;
			}
			$routes_path = realpath($routes_dir ?? '../src/routes');
			if($routes_path === false) {
				http_response_code(500);
				echo ErrMsg::create(["Invalid Route Directory" => $routes_dir]);
				exit;
			} else {
				static::$CFG->routes_dir = $routes_path;
			}
		}

		/* Setup Error Handling */
		ErrorReporting::init(function($data) { echo ErrMsg::create($data); });

		/* Setup Debugger */
		Debugger::$dumpper_callback = [static::class, 'echo_debug'];


		/* Setup Peg Parsers */
		View::$template_parser = new \KPS\Peg\TemplateParser;
		Route::$route_parser = new \KPS\Peg\RouteParser;

		/* Setup REQ */
		{
			/* Extract request path */
			$_URL = &static::$_VALS['_URL'];
			$_URL = rtrim(urldecode($_GET['@_url_@'] ?? ''), '/');
			unset($_GET['@_url_@']);
			if(strcasecmp($_URL, 'index.php') === 0) {
				$_URL = [];
			}
			$_URL = explode('/', $_URL);

			if('' === ($_URL[0] ?? false)) {
				array_shift($_URL);
			}

			/* Extract request query */
			$_QUERY = &static::$_VALS['_QUERY'];
			$_QUERY = [];
			$ct = $_SERVER['CONTENT_TYPE'] ?? false;
			if($ct !== false && in_array('application/json', explode(';', $ct))) {
				$_QUERY = JSON::decode(file_get_contents('php://input')) ?? [];
			}
			$_QUERY = array_merge($_POST, $_QUERY, $_GET);
			$_GET = $_POST = [];
		}
	}
	public static function route(string $pattern, string $view) {
		/*
			Adds new route
		*/
	}

	private static function echo_view(
		string $file,
		?string $base = null,
		bool $esc = false
	) {
		$view = new View($file, $base);
		$content = $view->content();
		if($content === null) { return; }
		/* Format:
			Text: [ty = 0, value];
			Val: [ty = 1, mode = ( 0 = Normal / 1 = Esc / 2 = Debug ), value];
			File: [ty = 2, mode = ( 0 = Normal / 1 = Esc / 2 = No Parse ) , value];
		*/
		foreach($content as $c) {
			switch($c[0]) {
				case 0: // Text
					if($esc) {
						$c[1] = Lib::html_esc($c[1]);
					}
					// if(Server::$CFG->minify_html) {
					// 	$c[1] = preg_replace('/\s+/', ' ', $c[1]);
					// }
					echo $c[1];
					break;
				case 1: // Val
					[, $mode, $value] = $c;
					[$valid, $rval] = Lib::resolve_val_chain(static::$_VALS, $value);
					if(!$valid) {
						echo ErrMsg::create(
							'Unable to resolve: ' . Lib::stringify_index_chain($value)
						);
						break;
					}
					switch($mode) {
						case 0:
							$rval = Lib::stringify($rval);
							echo $esc ? Lib::html_esc($rval) : $rval;
							break;
						case 1:
							$rval = Lib::stringify($rval);
							echo Lib::html_esc($rval);
							break;
						case 2:
							if(Server::$CFG->dev_mode) {
								echo DebugMsg::create([
									'index' => Lib::stringify_index_chain($value),
									'value' => $rval
								]);
							}
							break;
					}
					break;
				case 2: // File
					[, $mode, $value] = $c;
					$dir = dirname($view->path);
					switch($mode) {
						case 0:
							static::echo_view($value, $dir, false);
							break;
						case 1:
							static::echo_view($value, $dir, true);
							break;
						case 2:
							$path = Lib::resolve_path(static::$CFG->views_dir, $value, $dir);
							if($path === null) {
								echo ErrMsg::create([
									'View not found' => Server::$CFG->views_dir . "/{$value}"
								]);
								return;
							} else {
								echo Lib::html_esc(file_get_contents($path));
							}
							break;
					}
					break;
			}
		}
	}
	public static function execute() {
		static::init();

		$root = new Route(['import' => '_root_.route']);
		$final_view = false;
		try {
			$final_view = $root->find_view(static::$_VALS['_URL']);
		} catch (\Throwable $th) {
			http_response_code(500);
			static::echo_view('500.php');
			echo ErrMsg::create($th->getMessage());
			exit;
		}
		if($final_view === false) {
			http_response_code(404);
			static::echo_view('404.php');
			exit;
		}
		static::echo_view($final_view);
		
		if(static::$CFG->dev_mode && array_key_exists('REQUEST_TIME_FLOAT', $_SERVER)) {
			static::echo_debug([
				'Runtime (ms)' => round(
					(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000,
					3
				),
				'Peak Memory (MB)' => round(memory_get_peak_usage(true) / (1024 * 1024), 5)
			]);
		}
	}
}