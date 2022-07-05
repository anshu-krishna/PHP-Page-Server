<?php
namespace KPS;

use KPS\Msg\Error as ErrMsg;
use KPS\Peg\Template;

class View {
	public static Template $template_parser;

	public readonly ?string $path;
	public function __construct(private string $file_name, ?string $base_dir = null) {
		$this->path = Lib::resolve_path(Server::$CFG->views_dir, $this->file_name, $base_dir);
	}
	public function content() : ?array {
		// Check if valid file;
		if($this->path === null) {
			echo ErrMsg::create([
				'View not found' => Server::$CFG->views_dir . "/{$this->file_name}"
			]);
			return null;
		}
		// Init Variables
		$_PATH = &\KPS\Server::$_VALS['_REQ_']['path'];
		$_QUERY = &\KPS\Server::$_VALS['_REQ_']['query'];

		// Include content
		ob_start();
		include $this->path;
		$content = ob_get_clean();
		
		try {
			$content = static::$template_parser->parse($content);
		} catch (\KPS\Peg\SyntaxError $er) {
			echo ErrMsg::create([
				'type' => 'Parse Error',
				'file' => $path,
				// 'line' => $er->grammarLine,
				'msg' => $er->getMessage(),
				// 'content' => $content,
			]);
			// echo $content;
			return null;
		}
		return $content;
	}
}