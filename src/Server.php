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
	public static array $REQ = [ "path" => null, "query" => null ];

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
		if(static::$init_flag) { return; }
		static::$init_flag = true;

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
			/* Extract request path */
			static::$REQ['path'] = rtrim(urldecode($_GET['@_url_@'] ?? ''), '/');
			unset($_GET['@_url_@']);
			if(strcasecmp(static::$REQ['path'], 'index.php') === 0) {
				static::$REQ['path'] = [];
			}
			static::$REQ['path'] = explode('/', static::$REQ['path']);

			if('' === (static::$REQ['path'][0] ?? false)) {
				array_shift((static::$REQ['path']));
			}

			/* Extract request query */
			static::$REQ['query'] = [];
			$ct = $_SERVER['CONTENT_TYPE'] ?? false;
			if($ct !== false && in_array('application/json', explode(';', $ct))) {
				static::$REQ['query'] = JSON::decode(file_get_contents('php://input')) ?? [];
			}
			static::$REQ['query'] = array_merge($_POST, static::$REQ['query'], $_GET);
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
		foreach($content as $item) {
			switch($item['ty']) {
				case 'txt':
					echo $esc ? htmlspecialchars(
						string: $item['val'], encoding: 'UTF-8',
						flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
					) : $item['val'];
					break;
				case 'val':
					echo $esc ? htmlspecialchars(
						string: $item['val'], encoding: 'UTF-8',
						flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
					) : $item['val'];
					break;
				case 'file':
					// Debugger::dump($item);
					static::echo_view($item['val'], dirname($path), $item['esc']);
					break;
			}
		}
	}
	private static function get_root_view() : ?string {
		/*
			Matches the REQ to list of routes;
			Returns the root template file or null;
		*/
		return 'abc.php';
	}
	public static function execute() {
		static::init();
		$root = static::get_root_view();

		static::echo_view($root);
	}
}