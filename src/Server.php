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

	private static float $start_time = 0.0;
	// private static bool $init_flag = false;
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
	public static function echo_error(mixed $msg, ?string $from = null, ?MsgCfg $cfg = null) {
		$trace = Debugger::trace_call_point($from);
		$trace['msg'] = $msg;
		echo ErrMsg::create($trace, $cfg);
	}

	public static function init(?string $views_dir = null, ?MsgCfg $msg_config = null, bool $dev_mode = false) {
		/* Stop second run */
		// if(static::$init_flag) { return; }
		// static::$init_flag = true;
		if(static::$start_time !== 0.0) { return; }
		static::$start_time = microtime(true);

		/* Setup Config */
		{
			static::$CFG = new ServerCfg(
				dev_mode: $dev_mode,
				views_dir: $views_dir ?? '',
				msg: $msg_config ?? new MsgCfg(),
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
		}
	}
	public static function route(string $pattern, string $view) {
		/*
			Adds new route
		*/
	}

	private static function resolve_view_path(string $find, ?string $base = null) : ?string {
		if(str_starts_with($find, '.')) {
			$base ??= Server::$CFG->views_dir;
			$path = "{$base}/{$find}";
			if(is_readable($path)) { return $path; }
			return null;
		}
		$path = Server::$CFG->views_dir . "/{$find}";
		if(is_readable($path)) { return $path; }
		if(is_readable($find)) { return $find; }
		return null;
	}
	private static function html_esc(string $value) {
		return htmlspecialchars(
			string: $value, encoding: 'UTF-8',
			flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
		);
	}
	private static function index_chain_to_string(array $chain) {
		$r = "{$chain[0]}";
		$max = count($chain);
		$i = 1;
		while($i < $max) {
			$r .= "[{$chain[$i]}]";
			$i++;
		}
		return $r;
	}
	private static function resolve_vals(array $keys) : ?string {
		$ret = &static::$_VALS;
		foreach($keys as $k) {
			if(is_array($ret) && array_key_exists($k, $ret)) {
				$ret = &$ret[$k];
			} else {
				return null;
			}
		}
		///Stringify
		// return $ret;
		return strval($ret);
	}
	private static function echo_view(string $file, ?string $base = null, bool $esc = false) {
		$path = static::resolve_view_path($file, $base);
		if($path === null) {
			echo ErrMsg::create(['View not found' => Server::$CFG->views_dir . "/{$file}"]);
			return;
		}
		ob_start();
		include $path;
		$content = ob_get_clean();
		try {
			$content = static::$peg_template->parse($content);
		} catch (\KPS\Peg\SyntaxError $er) {
			echo ErrMsg::create_from_trace(
				file: $path,
				line: $er->grammarLine,
				msg: $er->getMessage()
			);
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
					echo $esc ? static::html_esc($c[1]) : $c[1];
					break;
				case 1: // Val
					$rval = static::resolve_vals($c[2]);
					if($rval === null) {
						echo ErrMsg::create('Unable to resolve: ' . static::index_chain_to_string($c[2]));
						break;
					}
					$rval ??= 'Not found';
					switch($c[1]) {
						case 0:
							echo $esc ? static::html_esc($rval) : $rval;
							break;
						case 1:
							echo static::html_esc($rval);
							break;
						case 2:
							echo DebugMsg::create(['index' => static::index_chain_to_string($c[2]), 'value' => $rval]);
							break;
					}
					break;
				case 2: // File
					$dir = dirname($path);
					switch($c[1]) {
						case 0:
							static::echo_view($c[2], $dir, false);
							break;
						case 1:
							static::echo_view($c[2], $dir, true);
							break;
						case 2:
							$path2 = static::resolve_view_path($c[2], $dir);
							if($path2 === null) {
								echo ErrMsg::create(['View not found' => Server::$CFG->views_dir . "/{$c[2]}"]);
								return;
							} else {
								echo static::html_esc(file_get_contents($path2));
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
		static::echo_debug('Runtime (ms): ' . round((microtime(true) - static::$start_time) * 1000, 3));
	}
}