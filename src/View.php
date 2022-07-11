<?php
namespace KPS;

use KPS\Msg\Error as ErrMsg;
use KPS\Peg\TemplateParser;

class View {
	public static TemplateParser $template_parser;

	public readonly ?string $path;
	private $error = null;
	public function __construct(string $file_name, ?string $base_dir = null) {
		$this->path = Lib::resolve_path(Server::$CFG->views_dir, $file_name, $base_dir);
		if($this->path === null) {
			$this->error = [
				'View not found' => Server::$CFG->views_dir . "/{$file_name}"
			];
		}
	}
	public function content() : ?array {
		// Check if valid file;
		if($this->error !== null) {
			echo ErrMsg::create($this->error);
			return null;
		}
		// Init Variables
		$_PATH = &\KPS\Server::$_VALS['_REQ_']['path'];
		$_QUERY = &\KPS\Server::$_VALS['_REQ_']['query'];
		$_SERVER_CFG = &\KPS\Server::$CFG;
		$_PATH_VARS = &\KPS\Server::$_VALS['_REQ_']['pathvars'];

		// $_1 = microtime(true);
		// Include content
		ob_start();
		include $this->path;
		$content = ob_get_clean();
		
		// $_2 = microtime(true);
		
		try {
			$content = static::$template_parser->parse($content);
		} catch (\KPS\Peg\SyntaxError $er) {
			echo ErrMsg::create([
				'type' => 'View Parse Error',
				'file' => $this->path,
				// 'line' => $er->grammarLine,
				'msg' => $er->getMessage(),
				// 'content' => $content,
				// 'content' => explode("\n", $content),
			]);
			// echo $content;
			return null;
		}
		
		// $_3 = microtime(true);
		// $_32 = round(($_3 - $_2) * 1000, 3);
		// $_21 = round(($_2 - $_1) * 1000, 3);
		// $content[] = [0, "<pre>Include: {$this->path}\nImport = {$_21}\nParser = {$_32}</pre>"];

		return $content;
	}
}