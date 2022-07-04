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

	// private static float $start_time = 0.0;
	private static bool $init_flag = false;
	public static ServerCfg $CFG;
	public static array $_VALS = [
		"_REQ_" => [ "path" => null, "query" => null ]
	];

	private static \KPS\Peg\Template $peg_template;


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
		?MsgCfg $msg_config = null,
		bool $dev_mode = false,
		// bool $minify_html = false
	) {
		/* Stop second run */
		if(static::$init_flag) { return; }
		static::$init_flag = true;
		// if(static::$start_time !== 0.0) { return; }
		// static::$start_time = microtime(true);

		/* Setup Config */
		{
			static::$CFG = new ServerCfg(
				dev_mode: $dev_mode,
				views_dir: $views_dir ?? '',
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
		}

		/* Setup Error Handling */
		ErrorReporting::init(function($data) { echo ErrMsg::create($data); });

		/* Setup Debugger */
		Debugger::$dumpper_callback = [static::class, 'echo_debug'];


		/* Setup Peg Parsers */
		static::$peg_template = new \KPS\Peg\Template;

		/* Setup REQ */
		{
			$REQ = &static::$_VALS['_REQ_'];
			/* Extract request path */
			$REQ['path'] = rtrim(urldecode($_GET['@_url_@'] ?? ''), '/');
			unset($_GET['@_url_@']);
			if(strcasecmp($REQ['path'], 'index.php') === 0) {
				$REQ['path'] = [];
			}
			$REQ['path'] = explode('/', $REQ['path']);

			if('' === ($REQ['path'][0] ?? false)) {
				array_shift(($REQ['path']));
			}

			/* Extract request query */
			$REQ['query'] = [];
			$ct = $_SERVER['CONTENT_TYPE'] ?? false;
			if($ct !== false && in_array('application/json', explode(';', $ct))) {
				$REQ['query'] = JSON::decode(file_get_contents('php://input')) ?? [];
			}
			$REQ['query'] = array_merge($_POST, $REQ['query'], $_GET);
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
		$path = Lib::resolve_path(static::$CFG->views_dir, $file, $base);
		if($path === null) {
			echo ErrMsg::create([
				'View not found' => Server::$CFG->views_dir . "/{$file}"
			]);
			return;
		}
		ob_start();
		include $path;
		$content = ob_get_clean();
		try {
			$content = static::$peg_template->parse($content);
		} catch (\KPS\Peg\SyntaxError $er) {
			echo ErrMsg::create([
				'type' => 'Parse Error',
				'file' => $path,
				// 'line' => $er->grammarLine,
				'msg' => $er->getMessage(),
				// 'content' => $content,
			]);
			// echo $content;
			return;
		}
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
					$rval = Lib::resolve_val_chain(static::$_VALS, $value);
					if($rval === null) {
						echo ErrMsg::create(
							'Unable to resolve: ' . Lib::stringify_index_chain($value)
						);
						break;
					}
					$rval ??= 'Not found';
					switch($mode) {
						case 0:
							echo $esc ? Lib::html_esc($rval) : $rval;
							break;
						case 1:
							echo Lib::html_esc($rval);
							break;
						case 2:
							echo DebugMsg::create([
								'index' => Lib::stringify_index_chain($value),
								'value' => $rval
							]);
							break;
					}
					break;
				case 2: // File
					[, $mode, $value] = $c;
					$dir = dirname($path);
					switch($mode) {
						case 0:
							static::echo_view($value, $dir, false);
							break;
						case 1:
							static::echo_view($value, $dir, true);
							break;
						case 2:
							$path2 = Lib::resolve_path(static::$CFG->views_dir, $value, $dir);
							if($path2 === null) {
								echo ErrMsg::create([
									'View not found' => Server::$CFG->views_dir . "/{$value}"
								]);
								return;
							} else {
								echo Lib::html_esc(file_get_contents($path2));
							}
							break;
					}
					break;
			}
		}
	}
	private static function get_root_view() : ?string {
		/*
			Matches the REQ to list of routes;
			Returns the root template file or null;
		*/
		return 'app.php';
	}
	public static function execute() {
		static::init();
		$root = static::get_root_view();

		static::echo_view($root);
		// static::echo_debug('Runtime (ms): ' . round(
		// 	(microtime(true) - static::$start_time) * 1000,
		// 	3
		// ));
		if(static::$CFG->dev_mode && array_key_exists('REQUEST_TIME_FLOAT', $_SERVER)) {
			static::echo_debug('Runtime (ms): ' . round(
				(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000,
				3
			));
		}
	}
}